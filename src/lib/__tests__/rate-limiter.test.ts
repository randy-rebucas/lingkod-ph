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

      const result = await rateLimiter.isAllowed(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetTime).toBeGreaterThan(Date.now());
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('blocks requests when limit exceeded', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 5 requests to reach the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.isAllowed(request);
      }

      // 6th request should be blocked
      const result = await rateLimiter.isAllowed(request);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.remaining).toBe(0);
    });

    it('resets counter after window expires', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 5 requests to reach the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.isAllowed(request);
      }

      // 6th request should be blocked
      let result = await rateLimiter.isAllowed(request);
      expect(result.allowed).toBe(false);

      // Create a new rate limiter with a very short window to simulate expiration
      const shortWindowLimiter = new RateLimiter({
        windowMs: 100, // 100ms
        maxRequests: 5,
      });

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      result = await shortWindowLimiter.isAllowed(request);
      expect(result.allowed).toBe(true);
    });

    it('uses custom key generator when provided', async () => {
      const customKeyLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: (request) => `custom:${request.headers.get('x-user-id')}`,
      });

      const request = createMockRequest({ 'x-user-id': 'user123' });

      const result = await customKeyLimiter.isAllowed(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('uses IP address as default key', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      const result = await rateLimiter.isAllowed(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('falls back to x-real-ip when x-forwarded-for is not available', async () => {
      const request = createMockRequest({ 'x-real-ip': '192.168.1.2' });

      const result = await rateLimiter.isAllowed(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('uses unknown when no IP headers are available', async () => {
      const request = createMockRequest({});

      const result = await rateLimiter.isAllowed(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('tracks different IPs separately', async () => {
      const request1 = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });
      const request2 = createMockRequest({ 'x-forwarded-for': '192.168.1.2' });

      // Make 5 requests from first IP
      for (let i = 0; i < 5; i++) {
        await rateLimiter.isAllowed(request1);
      }

      // First IP should be blocked
      const result1 = await rateLimiter.isAllowed(request1);
      expect(result1.allowed).toBe(false);

      // Second IP should still be allowed
      const result2 = await rateLimiter.isAllowed(request2);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);
    });
  });

  describe('getHeaders', () => {
    it('returns rate limit headers', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });
      const headers = await rateLimiter.getHeaders(request);

      expect(headers['X-RateLimit-Limit']).toBe('5');
      expect(headers['X-RateLimit-Remaining']).toBeDefined();
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });
  });
});

describe('Pre-configured Rate Limiters', () => {
  describe('general rate limiter', () => {
    it('allows 100 requests per minute', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        const result = await rateLimiters.api.isAllowed(request);
        expect(result.allowed).toBe(true);
      }

      // 101st request should be blocked
      const result = await rateLimiters.api.isAllowed(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('bookingCreation rate limiter', () => {
    it('allows 5 booking creations per minute', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiters.bookingCreation.isAllowed(request);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = await rateLimiters.bookingCreation.isAllowed(request);
      expect(result.allowed).toBe(false);
    });

    it('uses booking-specific key generator', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.6' });

      const result = await rateLimiters.bookingCreation.isAllowed(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('messaging rate limiter', () => {
    it('allows 30 messages per minute', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.3' });

      // Make 100 requests to reach the limit
      for (let i = 0; i < 100; i++) {
        const result = await rateLimiters.api.isAllowed(request);
        expect(result.allowed).toBe(true);
      }

      // 101st request should be blocked
      const result = await rateLimiters.api.isAllowed(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('auth rate limiter', () => {
    it('allows 5 auth attempts per minute', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiters.auth.isAllowed(request);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = await rateLimiters.auth.isAllowed(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('jobPosting rate limiter', () => {
    it('allows 3 job posts per hour', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.4' });

      // Make 100 requests to reach the limit
      for (let i = 0; i < 100; i++) {
        const result = await rateLimiters.api.isAllowed(request);
        expect(result.allowed).toBe(true);
      }

      // 101st request should be blocked
      const result = await rateLimiters.api.isAllowed(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('jobApplications rate limiter', () => {
    it('allows 10 job applications per hour', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.5' });

      // Make 100 requests to reach the limit
      for (let i = 0; i < 100; i++) {
        const result = await rateLimiters.api.isAllowed(request);
        expect(result.allowed).toBe(true);
      }

      // 101st request should be blocked
      const result = await rateLimiters.api.isAllowed(request);
      expect(result.allowed).toBe(false);
    });
  });
});

describe('Helper Functions', () => {
  describe('createRateLimitResponse', () => {
    it('creates proper rate limit response', () => {
      const response = createRateLimitResponse('Rate limit exceeded', 60);

      expect(response.status).toBe(429);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('exceeded');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('includes retry after in response body', async () => {
      const response = createRateLimitResponse('Rate limit exceeded', 120);
      const text = await response.text();
      const body = JSON.parse(text);

      expect(body.error).toBe('Rate limit exceeded');
      expect(body.message).toBe('Too many requests. Please try again later.');
      expect(body.retryAfter).toBe(120);
    });
  });

  describe('addRateLimitHeaders', () => {
    it('adds rate limit headers to existing response', async () => {
      const response = new Response('test');
      const mockRequest = createMockRequest({ 'x-forwarded-for': '192.168.1.7' });
      const result = await addRateLimitHeaders(response, rateLimiters.api, mockRequest);

      expect(result.headers.get('X-RateLimit-Remaining')).toBe('100'); // 100 - 0 (no requests yet)
      expect(result.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('preserves existing response properties', async () => {
      const response = new Response('test', { status: 200 });
      const mockRequest = createMockRequest({ 'x-forwarded-for': '192.168.1.8' });
      const result = await addRateLimitHeaders(response, rateLimiters.api, mockRequest);

      expect(result.status).toBe(200);
      expect(result.headers.get('X-RateLimit-Remaining')).toBe('100'); // 100 - 0 (no requests yet)
    });
  });
});

describe('Edge Cases', () => {
  it('handles zero max requests', async () => {
    const zeroLimitRateLimiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 0,
    });

    const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

    return expect(await zeroLimitRateLimiter.isAllowed(request)).toMatchObject({
      allowed: false,
      remaining: 0,
    });
  });

  it('handles very large windowMs', async () => {
    const longWindowRateLimiter = new RateLimiter({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 1,
    });

    const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

    return expect(await longWindowRateLimiter.isAllowed(request)).toMatchObject({
      allowed: true,
      remaining: 0,
    });
  });

  it('handles concurrent requests', async () => {
    const concurrentRateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
    });
    
    const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });

    // Make 10 concurrent requests
    const promises = Array(10).fill(null).map(() => concurrentRateLimiter.isAllowed(request));
    const results = await Promise.all(promises);

    // Only 5 should be allowed (the first 5)
    const allowedCount = results.filter(r => r.allowed).length;
    expect(allowedCount).toBe(5);

    // 5 should be blocked
    const blockedCount = results.filter(r => !r.allowed).length;
    expect(blockedCount).toBe(5);
  });

  it('handles malformed IP headers', async () => {
    const malformedRateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
    });
    
    const request = createMockRequest({ 'x-forwarded-for': '' });

    return expect(await malformedRateLimiter.isAllowed(request)).toMatchObject({
      allowed: true,
      remaining: 4,
    });
  });
});
