/**
 * Enhanced Payment Validation Service
 * Provides comprehensive validation for payment operations
 */

import { adminDb as db } from './firebase-admin';
import { PaymentConfig } from './payment-config';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export interface DuplicatePaymentCheck {
  isDuplicate: boolean;
  existingTransaction?: any;
  timeDifference?: number;
}

export class PaymentValidator {
  /**
   * Validate payment amount against expected amount
   */
  static validatePaymentAmount(amount: number, expectedAmount: number): ValidationResult {
    if (amount <= 0) {
      return { valid: false, error: 'Payment amount must be greater than zero' };
    }

    if (expectedAmount <= 0) {
      return { valid: false, error: 'Invalid expected amount' };
    }

    const isValid = PaymentConfig.validatePaymentAmount(amount, expectedAmount);
    
    if (!isValid) {
      const difference = Math.abs(amount - expectedAmount);
      return { 
        valid: false, 
        error: `Payment amount (₱${amount.toFixed(2)}) does not match expected amount (₱${expectedAmount.toFixed(2)}). Difference: ₱${difference.toFixed(2)}` 
      };
    }

    return { valid: true };
  }

  /**
   * Check for duplicate payments
   */
  static async checkDuplicatePayment(
    bookingId: string, 
    amount: number, 
    paymentMethod: string
  ): Promise<DuplicatePaymentCheck> {
    try {
      const transactionsQuery = await db.collection('transactions')
        .where('bookingId', '==', bookingId)
        .where('amount', '==', amount)
        .where('paymentMethod', '==', paymentMethod)
        .where('status', 'in', ['completed', 'pending'])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (transactionsQuery.empty) {
        return { isDuplicate: false };
      }

      const existingTransaction = transactionsQuery.docs[0].data();
      const now = new Date();
      const createdAt = existingTransaction.createdAt.toDate();
      const timeDifference = now.getTime() - createdAt.getTime();

      // Consider it a duplicate if within 5 minutes
      const isDuplicate = timeDifference < 5 * 60 * 1000;

      return {
        isDuplicate,
        existingTransaction,
        timeDifference
      };
    } catch (error) {
      console.error('Error checking duplicate payment:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Validate booking for payment
   */
  static async validateBookingForPayment(bookingId: string, userId: string): Promise<ValidationResult> {
    try {
      const bookingDoc = await db.collection('bookings').doc(bookingId).get();
      
      if (!bookingDoc.exists) {
        return { valid: false, error: 'Booking not found' };
      }

      const bookingData = bookingDoc.data();
      
      if (!bookingData) {
        return { valid: false, error: 'Invalid booking data' };
      }

      // Check if booking belongs to user
      if (bookingData.clientId !== userId) {
        return { valid: false, error: 'Unauthorized access to booking' };
      }

      // Check if booking is in correct state for payment
      if (bookingData.status !== 'Pending Payment') {
        return { 
          valid: false, 
          error: `Booking is not in pending payment state. Current status: ${bookingData.status}` 
        };
      }

      // Check if booking has expired (24 hours)
      const createdAt = bookingData.createdAt.toDate();
      const now = new Date();
      const timeDifference = now.getTime() - createdAt.getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (timeDifference > maxAge) {
        return { 
          valid: false, 
          error: 'Booking has expired. Please create a new booking.' 
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating booking:', error);
      return { valid: false, error: 'Failed to validate booking' };
    }
  }

  /**
   * Validate payment session
   */
  static async validatePaymentSession(bookingId: string): Promise<ValidationResult> {
    try {
      const sessionDoc = await db.collection('paymentSessions').doc(bookingId).get();
      
      if (!sessionDoc.exists) {
        return { valid: false, error: 'Payment session not found' };
      }

      const sessionData = sessionDoc.data();
      
      if (!sessionData) {
        return { valid: false, error: 'Invalid session data' };
      }

      // Check if session is still valid
      const createdAt = sessionData.createdAt.toDate();
      const isValid = PaymentConfig.isPaymentSessionValid(createdAt);
      
      if (!isValid) {
        return { valid: false, error: 'Payment session has expired' };
      }

      // Check if session is not already completed
      if (sessionData.status === 'completed') {
        return { valid: false, error: 'Payment session already completed' };
      }

      if (sessionData.status === 'failed') {
        return { valid: false, error: 'Payment session failed' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating payment session:', error);
      return { valid: false, error: 'Failed to validate payment session' };
    }
  }

  /**
   * Validate file upload for payment proof
   */
  static validatePaymentProofFile(file: File): ValidationResult {
    const validation = PaymentConfig.validateFileUpload(file);
    
    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }

    // Additional validations
    const warnings: string[] = [];

    // Check if file is too small (might be corrupted)
    if (file.size < 1024) { // Less than 1KB
      warnings.push('File size is very small. Please ensure the image is clear and readable.');
    }

    // Check filename for suspicious patterns
    const suspiciousPatterns = ['script', 'javascript', 'vbscript', 'onload', 'onerror'];
    const filename = file.name.toLowerCase();
    
    for (const pattern of suspiciousPatterns) {
      if (filename.includes(pattern)) {
        return { valid: false, error: 'Invalid filename detected' };
      }
    }

    return { 
      valid: true, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };
  }

  /**
   * Validate payment method configuration
   */
  static validatePaymentMethodConfig(method: 'gcash' | 'maya' | 'bank' | 'paypal' | 'adyen'): ValidationResult {
    switch (method) {
      case 'gcash':
        if (!PaymentConfig.GCASH.accountName || !PaymentConfig.GCASH.accountNumber) {
          return { valid: false, error: 'GCash configuration is incomplete' };
        }
        break;
      
      case 'maya':
        if (!PaymentConfig.MAYA.accountName || !PaymentConfig.MAYA.accountNumber) {
          return { valid: false, error: 'Maya configuration is incomplete' };
        }
        break;
      
      case 'bank':
        if (!PaymentConfig.BANK.accountName || !PaymentConfig.BANK.accountNumber || !PaymentConfig.BANK.bankName) {
          return { valid: false, error: 'Bank transfer configuration is incomplete' };
        }
        break;
      
      case 'paypal':
        if (!PaymentConfig.validatePayPalConfig()) {
          return { valid: false, error: 'PayPal configuration is incomplete' };
        }
        break;
      
      case 'adyen':
        if (!PaymentConfig.validateAdyenConfig()) {
          return { valid: false, error: 'Adyen configuration is incomplete' };
        }
        break;
      
      default:
        return { valid: false, error: 'Unknown payment method' };
    }

    return { valid: true };
  }

  /**
   * Comprehensive payment validation
   */
  static async validatePayment(
    bookingId: string,
    userId: string,
    amount: number,
    paymentMethod: string,
    file?: File
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate booking
    const bookingValidation = await this.validateBookingForPayment(bookingId, userId);
    if (!bookingValidation.valid) {
      errors.push(bookingValidation.error!);
    }

    // Get booking data for amount validation
    try {
      const bookingDoc = await db.collection('bookings').doc(bookingId).get();
      if (bookingDoc.exists) {
        const bookingData = bookingDoc.data();
        const amountValidation = this.validatePaymentAmount(amount, bookingData!.price);
        if (!amountValidation.valid) {
          errors.push(amountValidation.error!);
        }
      }
    } catch (error) {
      errors.push('Failed to validate payment amount');
    }

    // Check for duplicate payments
    const duplicateCheck = await this.checkDuplicatePayment(bookingId, amount, paymentMethod);
    if (duplicateCheck.isDuplicate) {
      errors.push('Duplicate payment detected. Please wait before trying again.');
    }

    // Validate payment method configuration
    const methodValidation = this.validatePaymentMethodConfig(paymentMethod as any);
    if (!methodValidation.valid) {
      errors.push(methodValidation.error!);
    }

    // Validate file if provided
    if (file) {
      const fileValidation = this.validatePaymentProofFile(file);
      if (!fileValidation.valid) {
        errors.push(fileValidation.error!);
      }
      if (fileValidation.warnings) {
        warnings.push(...fileValidation.warnings);
      }
    }

    return {
      valid: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
}
