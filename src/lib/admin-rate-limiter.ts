import { RateLimiter } from './rate-limiter';
import { NextRequest } from 'next/server';

/**
 * Admin-specific rate limiting configurations
 * More restrictive than regular user rate limits for sensitive operations
 */
export const adminRateLimiters = {
  // User management operations
  userCreation: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 user creations per minute
  }),

  userDeletion: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 user deletions per minute
  }),

  userStatusUpdate: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 10, // 10 status updates per 30 seconds
  }),

  // Financial operations
  payoutProcessing: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 payout approvals per minute
  }),

  paymentVerification: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 15, // 15 payment verifications per 30 seconds
  }),

  // System configuration
  settingsUpdate: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 settings updates per minute
  }),

  // Content management
  categoryManagement: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 10, // 10 category operations per 30 seconds
  }),


  // Communication operations
  broadcastSending: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 broadcasts per 5 minutes
  }),

  emailCampaign: new RateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 2, // 2 email campaigns per 10 minutes
  }),

  // System operations
  backupCreation: new RateLimiter({
    windowMs: 30 * 60 * 1000, // 30 minutes
    maxRequests: 2, // 2 backups per 30 minutes
  }),

  // Moderation operations
  reportProcessing: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 20, // 20 report actions per 30 seconds
  }),

  // Job management
  jobManagement: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 15, // 15 job operations per 30 seconds
  }),

  // Booking management
  bookingManagement: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 20, // 20 booking operations per 30 seconds
  })
};

/**
 * Admin rate limiting utility functions
 */
export class AdminRateLimiter {
  /**
   * Check if an admin operation is within rate limits
   */
  static async checkAdminRateLimit(
    operation: keyof typeof adminRateLimiters,
    adminId: string,
    request: Request
  ): Promise<{ allowed: boolean; message?: string; retryAfter?: number }> {
    const rateLimiter = adminRateLimiters[operation];
    
    // Create a mock NextRequest with the admin ID as the key
    const mockRequest = {
      headers: new Headers({ 'x-admin-id': adminId }),
      ip: adminId,
    } as NextRequest;
    
    const result = rateLimiter.isAllowed(mockRequest);
    
    return {
      allowed: result.allowed,
      retryAfter: result.allowed ? undefined : Math.ceil((result.resetTime - Date.now()) / 1000),
    };
  }

  /**
   * Add rate limit headers to response
   */
  static addRateLimitHeaders(
    response: Response,
    operation: keyof typeof adminRateLimiters,
    adminId: string
  ): Response {
    const rateLimiter = adminRateLimiters[operation];
    return rateLimiter.addRateLimitHeaders(response, adminId);
  }

  /**
   * Get rate limit status for an admin operation
   */
  static getRateLimitStatus(
    operation: keyof typeof adminRateLimiters,
    adminId: string
  ): { remaining: number; resetTime: number } {
    const rateLimiter = adminRateLimiters[operation];
    return rateLimiter.getStatus(adminId);
  }
}

/**
 * Admin operation types for type safety
 */
export type AdminOperation = keyof typeof adminRateLimiters;

/**
 * Rate limit configuration for different admin operations
 */
export const ADMIN_RATE_LIMIT_CONFIG = {
  // Critical operations (very restrictive)
  CRITICAL: {
    userDeletion: adminRateLimiters.userDeletion,
    settingsUpdate: adminRateLimiters.settingsUpdate,
    backupCreation: adminRateLimiters.backupCreation
  },
  
  // Financial operations (moderately restrictive)
  FINANCIAL: {
    payoutProcessing: adminRateLimiters.payoutProcessing,
    paymentVerification: adminRateLimiters.paymentVerification
  },
  
  // Content operations (less restrictive)
  CONTENT: {
    categoryManagement: adminRateLimiters.categoryManagement,
    jobManagement: adminRateLimiters.jobManagement,
    bookingManagement: adminRateLimiters.bookingManagement,
    reportProcessing: adminRateLimiters.reportProcessing
  },
  
  // Communication operations (very restrictive)
  COMMUNICATION: {
    broadcastSending: adminRateLimiters.broadcastSending,
    emailCampaign: adminRateLimiters.emailCampaign
  }
} as const;
