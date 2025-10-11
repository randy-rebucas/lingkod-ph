/**
 * Redis-based Rate Limiter
 * Production-ready rate limiting with Redis backend
 */

import { createClient, RedisClientType } from 'redis';
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Redis client instance
let redisClient: RedisClientType | null = null;

// Initialize Redis client
const initializeRedis = async (): Promise<RedisClientType> => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });

  redisClient.on('disconnect', () => {
    console.log('Disconnected from Redis');
  });

  await redisClient.connect();
  return redisClient;
};

// Check if Redis is available
const isRedisAvailable = async (): Promise<boolean> => {
  try {
    const client = await initializeRedis();
    await client.ping();
    return true;
  } catch (error) {
    console.warn('Redis not available, falling back to in-memory rate limiting:', error);
    return false;
  }
};

export class RedisRateLimiter {
  private config: RateLimitConfig;
  private fallbackStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getKey(req: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }
    
    // Default: use IP address from headers
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown';
    return `rate_limit:${ip}`;
  }

  private getWindowStart(): number {
    const now = Date.now();
    return Math.floor(now / this.config.windowMs) * this.config.windowMs;
  }

  async isAllowed(req: NextRequest): Promise<RateLimitResult> {
    const key = this.getKey(req);
    const windowStart = this.getWindowStart();
    const resetTime = windowStart + this.config.windowMs;

    try {
      // Try Redis first
      if (await isRedisAvailable()) {
        return await this.checkWithRedis(key, windowStart, resetTime);
      }
    } catch (error) {
      console.warn('Redis rate limiting failed, falling back to in-memory:', error);
    }

    // Fallback to in-memory store
    return this.checkWithMemory(key, windowStart, resetTime);
  }

  private async checkWithRedis(key: string, windowStart: number, resetTime: number): Promise<RateLimitResult> {
    const client = await initializeRedis();
    const redisKey = `${key}:${windowStart}`;

    // Use Redis pipeline for atomic operations
    const pipeline = client.multi();
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, Math.ceil(this.config.windowMs / 1000));
    
    const results = await pipeline.exec();
    const count = results && results[0] ? (results[0] as any)[1] as number : 0;

    const allowed = count <= this.config.maxRequests;
    
    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - count),
      resetTime
    };
  }

  private checkWithMemory(key: string, windowStart: number, resetTime: number): RateLimitResult {
    // Get or create entry
    if (!this.fallbackStore.has(key) || this.fallbackStore.get(key)!.resetTime < windowStart) {
      this.fallbackStore.set(key, {
        count: 0,
        resetTime,
      });
    }

    const entry = this.fallbackStore.get(key)!;
    
    // Check if limit exceeded
    const allowed = entry.count < this.config.maxRequests;
    
    if (allowed) {
      entry.count++;
    }

    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime,
    };
  }

  async getHeaders(req: NextRequest): Promise<Record<string, string>> {
    const result = await this.isAllowed(req);
    
    return {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    };
  }

  // Cleanup method for graceful shutdown
  async cleanup(): Promise<void> {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
    }
  }
}

// Predefined Redis-based rate limiters
export const redisRateLimiters = {
  // General API rate limiting
  api: new RedisRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  }),

  // Authentication endpoints
  auth: new RedisRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
  }),

  // Payment endpoints
  payment: new RedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 payment attempts per minute
  }),

  // File upload
  upload: new RedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 uploads per minute
  }),

  // Contact form
  contact: new RedisRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 contact form submissions per hour
  }),

  // Password reset
  passwordReset: new RedisRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 password reset attempts per hour
  }),

  // Booking creation
  bookingCreation: new RedisRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 booking creations per minute
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      return `booking:${ip}`;
    },
  }),
};

// Utility functions for API routes
export function createRateLimitResponse(message: string, retryAfter: number) {
  return new Response(
    JSON.stringify({
      error: message,
      message: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': 'exceeded',
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}

export function addRateLimitHeaders(response: Response, limiter: RedisRateLimiter, req: NextRequest) {
  // Note: This is async, so it should be awaited in the calling code
  return limiter.getHeaders(req).then(headers => {
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
    
    Object.entries(headers).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    return newResponse;
  });
}

// Middleware function for rate limiting
export function withRedisRateLimit(limiter: RedisRateLimiter) {
  return async (req: NextRequest) => {
    const result = await limiter.isAllowed(req);
    const headers = await limiter.getHeaders(req);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return { headers };
  };
}

// Graceful shutdown handler
export async function cleanupRedisRateLimiters(): Promise<void> {
  const limiters = Object.values(redisRateLimiters);
  await Promise.all(limiters.map(limiter => limiter.cleanup()));
}
