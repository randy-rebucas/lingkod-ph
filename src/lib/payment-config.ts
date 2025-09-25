/**
 * Centralized Payment Configuration
 * Manages all payment-related settings and environment variables
 */

export interface PaymentMethodConfig {
  accountName: string;
  accountNumber: string;
  bankName?: string;
}

export interface AdyenConfig {
  apiKey: string;
  merchantAccount: string;
  environment: 'test' | 'live';
  clientKey: string;
  hmacKey: string;
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
}

export class PaymentConfig {
  // GCash Configuration
  static readonly GCASH: PaymentMethodConfig = {
    accountName: process.env.GCASH_ACCOUNT_NAME || 'LocalPro Services',
    accountNumber: process.env.GCASH_ACCOUNT_NUMBER || '0917-123-4567',
  };

  // Maya Configuration
  static readonly MAYA: PaymentMethodConfig = {
    accountName: process.env.MAYA_ACCOUNT_NAME || 'LocalPro Services',
    accountNumber: process.env.MAYA_ACCOUNT_NUMBER || '0918-000-5678',
  };

  // Bank Transfer Configuration
  static readonly BANK: PaymentMethodConfig = {
    accountName: process.env.BANK_ACCOUNT_NAME || 'LocalPro Services Inc.',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234-5678-90',
    bankName: process.env.BANK_NAME || 'BPI',
  };

  // Adyen Configuration
  static readonly ADYEN: AdyenConfig = {
    apiKey: process.env.ADYEN_API_KEY || '',
    merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT || '',
    environment: (process.env.ADYEN_ENVIRONMENT as 'test' | 'live') || 'test',
    clientKey: process.env.ADYEN_CLIENT_KEY || '',
    hmacKey: process.env.ADYEN_HMAC_KEY || '',
  };

  // PayPal Configuration
  static readonly PAYPAL: PayPalConfig = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  };

  // Payment Settings
  static readonly SETTINGS = {
    PAYMENT_SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    PAYMENT_TOLERANCE: 0.01, // 1 cent tolerance for amount validation
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_BASE: 1000, // 1 second base delay
  };

  // Validation Methods
  static validateAdyenConfig(): boolean {
    return !!(
      this.ADYEN.apiKey &&
      this.ADYEN.merchantAccount &&
      this.ADYEN.clientKey &&
      this.ADYEN.hmacKey
    );
  }

  static validatePayPalConfig(): boolean {
    return !!(this.PAYPAL.clientId && this.PAYPAL.clientSecret);
  }

  static validatePaymentAmount(amount: number, expectedAmount: number): boolean {
    const tolerance = this.SETTINGS.PAYMENT_TOLERANCE;
    return Math.abs(amount - expectedAmount) <= tolerance;
  }

  static validateFileUpload(file: File): { valid: boolean; error?: string } {
    if (file.size > this.SETTINGS.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 5MB limit' };
    }

    if (!this.SETTINGS.ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' };
    }

    return { valid: true };
  }

  static isPaymentSessionValid(createdAt: Date): boolean {
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    return diff < this.SETTINGS.PAYMENT_SESSION_TIMEOUT;
  }
}
