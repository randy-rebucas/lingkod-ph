import { NextRequest } from 'next/server';
import { redisRateLimiters } from './redis-rate-limiter';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore = {};

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
    return ip;
  }

  private getWindowStart(): number {
    const now = Date.now();
    return Math.floor(now / this.config.windowMs) * this.config.windowMs;
  }

  async isAllowed(req: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.getKey(req);
    const windowStart = this.getWindowStart();
    const resetTime = windowStart + this.config.windowMs;

    // Get or create entry
    if (!this.store[key] || this.store[key].resetTime < windowStart) {
      this.store[key] = {
        count: 0,
        resetTime,
      };
    }

    // Check if limit exceeded
    const allowed = this.store[key].count < this.config.maxRequests;
    
    if (allowed) {
      this.store[key].count++;
    }

    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - this.store[key].count),
      resetTime,
    };
  }

  async getHeaders(req: NextRequest): Promise<Record<string, string>> {
    const key = this.getKey(req);
    const windowStart = this.getWindowStart();
    const resetTime = windowStart + this.config.windowMs;

    // Get current count without incrementing
    const currentCount = this.store[key] && this.store[key].resetTime >= windowStart 
      ? this.store[key].count 
      : 0;
    
    return {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - currentCount).toString(),
      'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
    };
  }
}

// Choose between Redis and in-memory rate limiters based on environment
const useRedis = process.env.REDIS_URL && process.env.NODE_ENV === 'production';

// Predefined rate limiters
export const rateLimiters = useRedis ? redisRateLimiters : {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  }),

  // Authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
  }),

  // Payment endpoints
  payment: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 payment attempts per minute
  }),

  // File upload
  upload: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 uploads per minute
  }),

  // Contact form
  contact: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 contact form submissions per hour
  }),

  // Password reset
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 password reset attempts per hour
  }),

  // Booking creation
  bookingCreation: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 booking creations per minute
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      return `booking:${ip}`;
    },
  }),
};

// Middleware function for rate limiting
export function withRateLimit(limiter: RateLimiter | any) {
  return async (req: NextRequest) => {
    const result = await limiter.isAllowed(req);
    const headers = limiter.getHeaders(req);

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

export async function addRateLimitHeaders(response: Response, limiter: RateLimiter | any, req: NextRequest) {
  const headers = await limiter.getHeaders(req);
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });
  
  Object.entries(headers).forEach(([key, value]) => {
    newResponse.headers.set(key, value as string);
  });
  return newResponse;
}

// Utility function to get the appropriate rate limiter type
export function getRateLimiterType(): 'redis' | 'memory' {
  return useRedis ? 'redis' : 'memory';
}

// Export both rate limiter types for flexibility
export { RedisRateLimiter, redisRateLimiters } from './redis-rate-limiter';