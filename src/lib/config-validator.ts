/**
 * Payment Configuration Validator
 * Provides centralized validation for payment system configuration
 */

import { PaymentConfig } from './payment-config';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePaymentConfiguration(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];


  // Validate PayPal configuration
  if (!PaymentConfig.validatePayPalConfig()) {
    errors.push('PayPal configuration is incomplete');
  }

  // Check for default values (warnings)
  if (PaymentConfig.BANK.accountNumber === '1234-5678-90') {
    warnings.push('Using default bank account number');
  }

  if (PaymentConfig.BANK.accountNumber === '1234-5678-90') {
    warnings.push('Using default bank account number');
  }

  // Check for missing environment variables
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push('NEXT_PUBLIC_APP_URL not configured');
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    warnings.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID not configured');
  }

  // Check for security configuration
  if (!process.env.JWT_SECRET) {
    warnings.push('JWT_SECRET not configured');
  }

  if (!process.env.ENCRYPTION_KEY) {
    warnings.push('ENCRYPTION_KEY not configured');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate specific payment method configuration
 */
export function validatePaymentMethodConfig(method: 'bank' | 'paypal'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (method) {
    
    case 'bank':
      if (!PaymentConfig.BANK.accountName || !PaymentConfig.BANK.accountNumber || !PaymentConfig.BANK.bankName) {
        errors.push('Bank transfer configuration is incomplete');
      }
      break;
    
    case 'paypal':
      if (!PaymentConfig.validatePayPalConfig()) {
        errors.push('PayPal configuration is incomplete');
      }
      break;
    
    
    default:
      errors.push('Unknown payment method');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get configuration status summary
 */
export function getConfigurationStatus(): {
  overall: 'valid' | 'warning' | 'error';
  summary: string;
  details: ValidationResult;
} {
  const validation = validatePaymentConfiguration();
  
  let overall: 'valid' | 'warning' | 'error';
  let summary: string;

  if (validation.valid && validation.warnings.length === 0) {
    overall = 'valid';
    summary = 'All payment configurations are properly set up';
  } else if (validation.valid && validation.warnings.length > 0) {
    overall = 'warning';
    summary = `Configuration is valid but has ${validation.warnings.length} warning(s)`;
  } else {
    overall = 'error';
    summary = `Configuration has ${validation.errors.length} error(s) that need to be fixed`;
  }

  return {
    overall,
    summary,
    details: validation
  };
}
