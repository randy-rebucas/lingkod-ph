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
    message: 'Too many user creation attempts. Please wait before creating more users.'
  }),

  userDeletion: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 user deletions per minute
    message: 'Too many user deletion attempts. Please wait before deleting more users.'
  }),

  userStatusUpdate: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 10, // 10 status updates per 30 seconds
    message: 'Too many user status updates. Please wait before making more changes.'
  }),

  // Financial operations
  payoutProcessing: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 payout approvals per minute
    message: 'Too many payout processing attempts. Please wait before processing more payouts.'
  }),

  paymentVerification: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 15, // 15 payment verifications per 30 seconds
    message: 'Too many payment verification attempts. Please wait before verifying more payments.'
  }),

  // System configuration
  settingsUpdate: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 settings updates per minute
    message: 'Too many settings update attempts. Please wait before making more changes.'
  }),

  // Content management
  categoryManagement: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 10, // 10 category operations per 30 seconds
    message: 'Too many category management attempts. Please wait before making more changes.'
  }),

  subscriptionManagement: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 subscription plan changes per minute
    message: 'Too many subscription management attempts. Please wait before making more changes.'
  }),

  // Communication operations
  broadcastSending: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 broadcasts per 5 minutes
    message: 'Too many broadcast attempts. Please wait before sending more broadcasts.'
  }),

  emailCampaign: new RateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 2, // 2 email campaigns per 10 minutes
    message: 'Too many email campaign attempts. Please wait before sending more campaigns.'
  }),

  // System operations
  backupCreation: new RateLimiter({
    windowMs: 30 * 60 * 1000, // 30 minutes
    maxRequests: 2, // 2 backups per 30 minutes
    message: 'Too many backup creation attempts. Please wait before creating more backups.'
  }),

  // Moderation operations
  reportProcessing: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 20, // 20 report actions per 30 seconds
    message: 'Too many report processing attempts. Please wait before processing more reports.'
  }),

  // Job management
  jobManagement: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 15, // 15 job operations per 30 seconds
    message: 'Too many job management attempts. Please wait before making more changes.'
  }),

  // Booking management
  bookingManagement: new RateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 20, // 20 booking operations per 30 seconds
    message: 'Too many booking management attempts. Please wait before making more changes.'
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
    return await rateLimiter.checkLimit(adminId, request as NextRequest);
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
    subscriptionManagement: adminRateLimiters.subscriptionManagement,
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
