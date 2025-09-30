import { RateLimiter, rateLimiters, createRateLimitResponse, addRateLimitHeaders } from '../rate-limiter';
import type { NextRequest } from 'next/server';

// Mock NextRequest
const createMockRequest = (headers: Record<string, string> = {}): NextRequest => {
  const mockHeaders = new Map(Object.entries(headers));
  return {
    headers: {
      get: (name: string) => mockHeaders.get(name) || null,
    },
  } as NextRequest;
};

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Create a fresh rate limiter for each test
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
    });
  });

  describe('checkLimit', () => {
    it('allows requests within limit', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      const result = await rateLimiter.checkLimit(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetTime).toBeGreaterThan(Date.now());
      expect(result.retryAfter).toBeUndefined();
    });

    it('blocks requests when limit exceeded', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 5 requests to reach the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit(request);
      }

      // 6th request should be blocked
      const result = await rateLimiter.checkLimit(request);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('resets counter after window expires', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 5 requests to reach the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit(request);
      }

      // 6th request should be blocked
      let result = await rateLimiter.checkLimit(request);
      expect(result.allowed).toBe(false);

      // Create a new rate limiter with a very short window to simulate expiration
      const shortWindowLimiter = new RateLimiter({
        windowMs: 100, // 100ms
        maxRequests: 5,
      });

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      result = await shortWindowLimiter.checkLimit(request);
      expect(result.allowed).toBe(true);
    });

    it('uses custom key generator when provided', async () => {
      const customKeyLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: (request) => `custom:${request.headers.get('x-user-id')}`,
      });

      const request = createMockRequest({ 'x-user-id': 'user123' });

      const result = await customKeyLimiter.checkLimit(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('uses IP address as default key', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      const result = await rateLimiter.checkLimit(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('falls back to x-real-ip when x-forwarded-for is not available', async () => {
      const request = createMockRequest({ 'x-real-ip': '192.168.1.2' });

      const result = await rateLimiter.checkLimit(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('uses unknown when no IP headers are available', async () => {
      const request = createMockRequest({});

      const result = await rateLimiter.checkLimit(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('tracks different IPs separately', async () => {
      const request1 = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });
      const request2 = createMockRequest({ 'x-forwarded-for': '192.168.1.2' });

      // Make 5 requests from first IP
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit(request1);
      }

      // First IP should be blocked
      let result1 = await rateLimiter.checkLimit(request1);
      expect(result1.allowed).toBe(false);

      // Second IP should still be allowed
      let result2 = await rateLimiter.checkLimit(request2);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);
    });
  });

  describe('checkLimitByKey', () => {
    it('checks limit by specific key', async () => {
      const result = await rateLimiter.checkLimitByKey('test-key');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });

    it('tracks requests by key', async () => {
      // Make 5 requests with the same key
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimitByKey('test-key');
      }

      const result = await rateLimiter.checkLimitByKey('test-key');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('addRateLimitHeaders', () => {
    it('adds rate limit headers to response', () => {
      const response = new Response('test');
      const result = rateLimiter.addRateLimitHeaders(response, 'test-key');

      expect(result.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(result.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(result.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('getStatus', () => {
    it('returns current status for a key', () => {
      const status = rateLimiter.getStatus('test-key');

      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(5);
      expect(status.resetTime).toBeGreaterThan(Date.now());
    });
  });
});

describe('Pre-configured Rate Limiters', () => {
  describe('general rate limiter', () => {
    it('allows 100 requests per minute', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        const result = await rateLimiters.general.checkLimit(request);
        expect(result.allowed).toBe(true);
      }

      // 101st request should be blocked
      const result = await rateLimiters.general.checkLimit(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('bookingCreation rate limiter', () => {
    it('allows 5 booking creations per minute', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiters.bookingCreation.checkLimit(request);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = await rateLimiters.bookingCreation.checkLimit(request);
      expect(result.allowed).toBe(false);
    });

    it('uses booking-specific key generator', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      const result = await rateLimiters.bookingCreation.checkLimit(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('messaging rate limiter', () => {
    it('allows 30 messages per minute', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 30 requests
      for (let i = 0; i < 30; i++) {
        const result = await rateLimiters.messaging.checkLimit(request);
        expect(result.allowed).toBe(true);
      }

      // 31st request should be blocked
      const result = await rateLimiters.messaging.checkLimit(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('auth rate limiter', () => {
    it('allows 5 auth attempts per minute', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiters.auth.checkLimit(request);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = await rateLimiters.auth.checkLimit(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('jobPosting rate limiter', () => {
    it('allows 3 job posts per hour', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        const result = await rateLimiters.jobPosting.checkLimit(request);
        expect(result.allowed).toBe(true);
      }

      // 4th request should be blocked
      const result = await rateLimiters.jobPosting.checkLimit(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('jobApplications rate limiter', () => {
    it('allows 10 job applications per hour', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiters.jobApplications.checkLimit(request);
        expect(result.allowed).toBe(true);
      }

      // 11th request should be blocked
      const result = await rateLimiters.jobApplications.checkLimit(request);
      expect(result.allowed).toBe(false);
    });
  });
});

describe('Helper Functions', () => {
  describe('createRateLimitResponse', () => {
    it('creates proper rate limit response', () => {
      const response = createRateLimitResponse(60);

      expect(response.status).toBe(429);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('exceeded');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('includes retry after in response body', async () => {
      const response = createRateLimitResponse(120);
      const body = await response.json();

      expect(body.error).toBe('Rate limit exceeded');
      expect(body.message).toBe('Too many requests. Please try again later.');
      expect(body.retryAfter).toBe(120);
    });
  });

  describe('addRateLimitHeaders', () => {
    it('adds rate limit headers to existing response', () => {
      const response = new Response('test');
      const result = addRateLimitHeaders(response, 5, 1234567890);

      expect(result.headers.get('X-RateLimit-Remaining')).toBe('5');
      expect(result.headers.get('X-RateLimit-Reset')).toBe('1234567890');
    });

    it('preserves existing response properties', () => {
      const response = new Response('test', { status: 200 });
      const result = addRateLimitHeaders(response, 3, 1234567890);

      expect(result.status).toBe(200);
      expect(result.headers.get('X-RateLimit-Remaining')).toBe('3');
    });
  });
});

describe('Edge Cases', () => {
  it('handles zero max requests', () => {
    const zeroLimitRateLimiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 0,
    });

    const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

    return expect(zeroLimitRateLimiter.checkLimit(request)).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
    });
  });

  it('handles very large windowMs', () => {
    const longWindowRateLimiter = new RateLimiter({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 1,
    });

    const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

    return expect(longWindowRateLimiter.checkLimit(request)).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    });
  });

  it('handles concurrent requests', async () => {
    const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

    // Make 10 concurrent requests
    const promises = Array(10).fill(null).map(() => rateLimiter.checkLimit(request));
    const results = await Promise.all(promises);

    // Only 5 should be allowed
    const allowedCount = results.filter(r => r.allowed).length;
    expect(allowedCount).toBe(5);

    // 5 should be blocked
    const blockedCount = results.filter(r => !r.allowed).length;
    expect(blockedCount).toBe(5);
  });

  it('handles malformed IP headers', () => {
    const request = createMockRequest({ 'x-forwarded-for': '' });

    return expect(rateLimiter.checkLimit(request)).resolves.toMatchObject({
      allowed: true,
      remaining: 4,
    });
  });
});
