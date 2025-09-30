
import type { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  message?: string; // Custom error message
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
// Note: In production, consider using Redis or a more robust storage solution
// for rate limiting to avoid memory issues and support distributed systems
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(request)
      : this.getDefaultKey(request);

    const now = Date.now();
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter
      };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  private getDefaultKey(request: NextRequest): string {
    // Use IP address as default key
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    return `rate_limit:${ip}`;
  }

  private check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs
      };
    }

    return {
      allowed: entry.count < this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  // Add missing methods for admin rate limiter compatibility
  async checkLimitByKey(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    return this.check(key);
  }

  addRateLimitHeaders(response: Response, key: string): Response {
    const result = this.check(key);
    response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    return response;
  }

  getStatus(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    return this.check(key);
  }
}

// Pre-configured rate limiters for different operations
export const rateLimiters = {
  // General API requests: 100 requests per minute
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  }),

  // Booking creation: 5 requests per minute
  bookingCreation: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyGenerator: (request) => {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      return `booking:${ip}`;
    }
  }),

  // Messaging: 30 messages per minute
  messaging: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (request) => {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'; 
      return `messaging:${ip}`;
    }
  }),

  // Authentication attempts: 5 attempts per minute
  auth: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyGenerator: (request) => {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'; 
      return `auth:${ip}`;
    }
  }),

  // Job posting: 3 posts per hour
  jobPosting: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (request) => {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      return `job_posting:${ip}`;
    }
  }),

  // Job applications: 10 applications per hour
  jobApplications: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (request) => {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      return `job_applications:${ip}`;
    }
  })
};

// Helper function to create rate limit response
export function createRateLimitResponse(retryAfter: number) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': 'exceeded',
        'X-RateLimit-Remaining': '0'
      }
    }
  );
}

// Helper function to add rate limit headers to response
export function addRateLimitHeaders(response: Response, remaining: number, resetTime: number) {
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetTime.toString());
  return response;
}
