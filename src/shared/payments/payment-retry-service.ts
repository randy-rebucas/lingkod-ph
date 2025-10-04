/**
 * Payment Retry Service
 * Handles retry logic for failed payment operations
 */

import { PaymentConfig } from './payment-config';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
  totalTime: number;
}

export class PaymentRetryService {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: PaymentConfig.SETTINGS.MAX_RETRY_ATTEMPTS,
    baseDelay: PaymentConfig.SETTINGS.RETRY_DELAY_BASE,
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2
  };

  /**
   * Execute an operation with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on certain types of errors
        if (this.isNonRetryableError(lastError)) {
          return {
            success: false,
            error: lastError.message,
            attempts: attempt,
            totalTime: Date.now() - startTime
          };
        }

        // If this is the last attempt, return the error
        if (attempt === config.maxRetries) {
          return {
            success: false,
            error: lastError.message,
            attempts: attempt,
            totalTime: Date.now() - startTime
          };
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, config);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      attempts: config.maxRetries,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Check if an error should not be retried
   */
  private static isNonRetryableError(error: Error): boolean {
    const nonRetryablePatterns = [
      'authentication',
      'authorization',
      'unauthorized',
      'forbidden',
      'not found',
      'invalid',
      'malformed',
      'bad request',
      'payment method not supported',
      'insufficient funds',
      'card declined',
      'expired card'
    ];

    const errorMessage = error.message.toLowerCase();
    return nonRetryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Calculate delay for next retry attempt
   */
  private static calculateDelay(attempt: number, config: Required<RetryOptions>): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
    return Math.min(exponentialDelay + jitter, config.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry payment creation
   */
  static async retryPaymentCreation(
    paymentFunction: () => Promise<any>,
    options: RetryOptions = {}
  ): Promise<RetryResult<any>> {
    return this.executeWithRetry(paymentFunction, {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      ...options
    });
  }

  /**
   * Retry payment verification
   */
  static async retryPaymentVerification(
    verificationFunction: () => Promise<any>,
    options: RetryOptions = {}
  ): Promise<RetryResult<any>> {
    return this.executeWithRetry(verificationFunction, {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 15000,
      ...options
    });
  }

  /**
   * Retry file upload
   */
  static async retryFileUpload(
    uploadFunction: () => Promise<any>,
    options: RetryOptions = {}
  ): Promise<RetryResult<any>> {
    return this.executeWithRetry(uploadFunction, {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      ...options
    });
  }

  /**
   * Retry database operations
   */
  static async retryDatabaseOperation(
    dbFunction: () => Promise<any>,
    options: RetryOptions = {}
  ): Promise<RetryResult<any>> {
    return this.executeWithRetry(dbFunction, {
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 3000,
      ...options
    });
  }
}
