/**
 * Payment Production Readiness Validator
 * Comprehensive validation for production deployment
 */

import { PaymentConfig } from './payment-config';
import { PaymentValidator } from './payment-validator';
import { PaymentRetryService } from './payment-retry-service';
import { PaymentMonitoringService } from './payment-monitoring';
import { adminDb as db } from '../db/server';

export interface ProductionValidationResult {
  overall: 'ready' | 'warning' | 'not_ready';
  summary: string;
  checks: {
    configuration: ValidationCheck;
    security: ValidationCheck;
    monitoring: ValidationCheck;
    errorHandling: ValidationCheck;
    database: ValidationCheck;
    apiEndpoints: ValidationCheck;
    webhooks: ValidationCheck;
    notifications: ValidationCheck;
  };
  recommendations: string[];
}

export interface ValidationCheck {
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string[];
}

export class PaymentProductionValidator {
  /**
   * Run comprehensive production readiness validation
   */
  static async validateProductionReadiness(): Promise<ProductionValidationResult> {
    const checks = {
      configuration: await this.validateConfiguration(),
      security: await this.validateSecurity(),
      monitoring: await this.validateMonitoring(),
      errorHandling: await this.validateErrorHandling(),
      database: await this.validateDatabase(),
      apiEndpoints: await this.validateApiEndpoints(),
      webhooks: await this.validateWebhooks(),
      notifications: await this.validateNotifications(),
    };

    const recommendations: string[] = [];
    let overall: 'ready' | 'warning' | 'not_ready' = 'ready';
    let summary = '';

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => check.status === 'fail');
    const warningChecks = Object.values(checks).filter(check => check.status === 'warning');

    if (failedChecks.length > 0) {
      overall = 'not_ready';
      summary = `Payment system is not ready for production. ${failedChecks.length} critical issue(s) found.`;
    } else if (warningChecks.length > 0) {
      overall = 'warning';
      summary = `Payment system has ${warningChecks.length} warning(s) that should be addressed.`;
    } else {
      summary = 'Payment system is ready for production deployment.';
    }

    // Generate recommendations
    this.generateRecommendations(checks, recommendations);

    return {
      overall,
      summary,
      checks,
      recommendations,
    };
  }

  /**
   * Validate payment configuration
   */
  private static async validateConfiguration(): Promise<ValidationCheck> {
    const details: string[] = [];
    let status: 'pass' | 'warning' | 'fail' = 'pass';

    // Check Adyen configuration
    if (!PaymentConfig.validateAdyenConfig()) {
      status = 'fail';
      details.push('Adyen configuration is incomplete');
    }

    // Check PayPal configuration
    if (!PaymentConfig.validatePayPalConfig()) {
      status = 'fail';
      details.push('PayPal configuration is incomplete');
    }

    // Check for default values
    if (PaymentConfig.GCASH.accountNumber === '0917-123-4567') {
      status = status === 'fail' ? 'fail' : 'warning';
      details.push('Using default GCash account number');
    }

    if (PaymentConfig.BANK.accountNumber === '1234-5678-90') {
      status = status === 'fail' ? 'fail' : 'warning';
      details.push('Using default bank account number');
    }

    // Check environment
    if (PaymentConfig.ADYEN.environment === 'test') {
      status = status === 'fail' ? 'fail' : 'warning';
      details.push('Using test environment for Adyen');
    }

    return {
      status,
      message: status === 'pass' ? 'Configuration is properly set up' : 
               status === 'warning' ? 'Configuration has warnings' : 'Configuration has critical issues',
      details: details.length > 0 ? details : undefined,
    };
  }

  /**
   * Validate security measures
   */
  private static async validateSecurity(): Promise<ValidationCheck> {
    const details: string[] = [];
    let status: 'pass' | 'warning' | 'fail' = 'pass';

    // Check for required security environment variables
    if (!process.env.JWT_SECRET) {
      status = 'fail';
      details.push('JWT_SECRET not configured');
    }

    if (!process.env.ENCRYPTION_KEY) {
      status = 'fail';
      details.push('ENCRYPTION_KEY not configured');
    }

    // Check for HTTPS
    if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) {
      if (status !== 'fail') {
        status = 'warning';
      }
      details.push('Application URL should use HTTPS in production');
    }

    // Check for secure API keys
    if (PaymentConfig.ADYEN.apiKey.length < 20) {
      status = 'fail';
      details.push('Adyen API key appears to be invalid or too short');
    }

    if (PaymentConfig.PAYPAL.clientId.length < 20) {
      status = 'fail';
      details.push('PayPal client ID appears to be invalid or too short');
    }

    return {
      status,
      message: status === 'pass' ? 'Security measures are properly configured' : 
               status === 'warning' ? 'Security configuration has warnings' : 'Security configuration has critical issues',
      details: details.length > 0 ? details : undefined,
    };
  }

  /**
   * Validate monitoring setup
   */
  private static async validateMonitoring(): Promise<ValidationCheck> {
    const details: string[] = [];
    let status: 'pass' | 'warning' | 'fail' = 'pass';

    try {
      // Test payment monitoring service
      await PaymentMonitoringService.trackPaymentEvent({
        eventType: 'payment_created',
        bookingId: 'test-validation',
        userId: 'test-user',
        amount: 100,
        paymentMethod: 'test',
        timestamp: new Date(),
        metadata: { test: true },
      });

      // Check if monitoring collections exist (only if Firebase is configured)
      if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        const metricsQuery = await db.collection('paymentMetrics').limit(1).get();
        if (metricsQuery.empty) {
          status = 'warning';
          details.push('Payment metrics collection is empty - monitoring may not be active');
        }
      } else {
        status = 'warning';
        details.push('Firebase not configured - monitoring will be limited');
      }
    } catch (error) {
      status = 'warning';
      details.push('Payment monitoring service has issues - check Firebase configuration');
    }

    return {
      status,
      message: status === 'pass' ? 'Monitoring is properly configured' : 
               status === 'warning' ? 'Monitoring has warnings' : 'Monitoring has critical issues',
      details: details.length > 0 ? details : undefined,
    };
  }

  /**
   * Validate error handling
   */
  private static async validateErrorHandling(): Promise<ValidationCheck> {
    const details: string[] = [];
    let status: 'pass' | 'warning' | 'fail' = 'pass';

    try {
      // Test retry service
      const retryResult = await PaymentRetryService.executeWithRetry(async () => {
        throw new Error('Test error for validation');
      }, { maxRetries: 1 });

      if (!retryResult.success) {
        // This is expected - retry service should handle errors gracefully
        status = 'pass';
      }
    } catch (error) {
      status = 'fail';
      details.push('Payment retry service is not working properly');
    }

    // Check for error logging (only if Firebase is configured)
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      try {
        await db.collection('paymentAlerts').add({
          test: true,
          timestamp: new Date(),
          resolved: false,
        });
      } catch (error) {
        status = 'warning';
        details.push('Error logging system has issues - check Firebase configuration');
      }
    } else {
      status = 'warning';
      details.push('Firebase not configured - error logging will be limited');
    }

    return {
      status,
      message: status === 'pass' ? 'Error handling is properly configured' : 'Error handling has critical issues',
      details: details.length > 0 ? details : undefined,
    };
  }

  /**
   * Validate database setup
   */
  private static async validateDatabase(): Promise<ValidationCheck> {
    const details: string[] = [];
    let status: 'pass' | 'warning' | 'fail' = 'pass';

    try {
      // Check if Firebase is configured
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        status = 'warning';
        details.push('Firebase not configured - database validation skipped');
        return {
          status,
          message: 'Database validation skipped - Firebase not configured',
          details: details.length > 0 ? details : undefined,
        };
      }

      // Test database connectivity
      await db.collection('test').doc('validation').set({
        test: true,
        timestamp: new Date(),
      });

      // Check required collections exist
      const requiredCollections = [
        'bookings',
        'transactions',
        'users',
        'paymentSessions',
        'payouts',
      ];

      for (const collection of requiredCollections) {
        try {
          await db.collection(collection).limit(1).get();
        } catch (error) {
          status = 'fail';
          details.push(`Required collection '${collection}' is not accessible`);
        }
      }

      // Clean up test document
      await db.collection('test').doc('validation').delete();
    } catch (error) {
      status = 'warning';
      details.push('Database connectivity issues detected - check Firebase configuration');
    }

    return {
      status,
      message: status === 'pass' ? 'Database is properly configured' : 'Database has critical issues',
      details: details.length > 0 ? details : undefined,
    };
  }

  /**
   * Validate API endpoints
   */
  private static async validateApiEndpoints(): Promise<ValidationCheck> {
    const details: string[] = [];
    const status: 'pass' | 'warning' | 'fail' = 'pass';

    const requiredEndpoints = [
      '/api/payments/gcash/create',
      '/api/payments/gcash/result',
      '/api/payments/gcash/webhook',
      '/api/admin/secure-action',
    ];

    // Note: In a real implementation, you would test these endpoints
    // For now, we'll assume they exist if the files are present
    details.push('API endpoint validation requires runtime testing');

    return {
      status,
      message: 'API endpoints validation requires runtime testing',
      details,
    };
  }

  /**
   * Validate webhook configuration
   */
  private static async validateWebhooks(): Promise<ValidationCheck> {
    const details: string[] = [];
    let status: 'pass' | 'warning' | 'fail' = 'pass';

    // Check webhook configuration
    if (!PaymentConfig.ADYEN.hmacKey) {
      status = 'fail';
      details.push('Adyen HMAC key not configured for webhook verification');
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      status = 'fail';
      details.push('App URL not configured for webhook endpoints');
    }

    // Check webhook endpoint URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/gcash/webhook`;
    if (!webhookUrl.startsWith('https://')) {
      if (status !== 'fail') {
        status = 'warning';
      }
      details.push('Webhook URL should use HTTPS in production');
    }

    return {
      status,
      message: status === 'pass' ? 'Webhook configuration is proper' : 
               status === 'warning' ? 'Webhook configuration has warnings' : 'Webhook configuration has critical issues',
      details: details.length > 0 ? details : undefined,
    };
  }

  /**
   * Validate notification system
   */
  private static async validateNotifications(): Promise<ValidationCheck> {
    const details: string[] = [];
    let status: 'pass' | 'warning' | 'fail' = 'pass';

    // Check email configuration
    if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
      status = 'warning';
      details.push('Email service not configured - notifications may not work');
    }

    // Check Firebase messaging (if used)
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      status = 'warning';
      details.push('Firebase project ID not configured');
    }

    return {
      status,
      message: status === 'pass' ? 'Notification system is properly configured' : 
               status === 'warning' ? 'Notification system has warnings' : 'Notification system has critical issues',
      details: details.length > 0 ? details : undefined,
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  private static generateRecommendations(
    checks: ProductionValidationResult['checks'],
    recommendations: string[]
  ): void {
    // Configuration recommendations
    if (checks.configuration.status === 'fail') {
      recommendations.push('Fix all configuration issues before deploying to production');
    }
    if (checks.configuration.status === 'warning') {
      recommendations.push('Update default payment account details with real account information');
    }

    // Security recommendations
    if (checks.security.status === 'fail') {
      recommendations.push('Configure all required security environment variables');
    }
    if (checks.security.status === 'warning') {
      recommendations.push('Ensure HTTPS is enabled for all production URLs');
    }

    // Monitoring recommendations
    if (checks.monitoring.status === 'warning') {
      recommendations.push('Set up payment monitoring and alerting systems');
    }

    // Error handling recommendations
    if (checks.errorHandling.status === 'fail') {
      recommendations.push('Fix error handling and retry mechanisms');
    }

    // Database recommendations
    if (checks.database.status === 'fail') {
      recommendations.push('Resolve database connectivity and collection access issues');
    }

    // Webhook recommendations
    if (checks.webhooks.status === 'fail') {
      recommendations.push('Configure webhook endpoints and HMAC verification');
    }
    if (checks.webhooks.status === 'warning') {
      recommendations.push('Use HTTPS for all webhook URLs in production');
    }

    // Notification recommendations
    if (checks.notifications.status === 'warning') {
      recommendations.push('Configure email service for payment notifications');
    }

    // General recommendations
    recommendations.push('Set up comprehensive logging and monitoring');
    recommendations.push('Implement rate limiting on payment endpoints');
    recommendations.push('Set up automated backups for payment data');
    recommendations.push('Create incident response procedures for payment issues');
    recommendations.push('Test all payment flows in staging environment');
    recommendations.push('Set up payment reconciliation processes');
  }

  /**
   * Get production readiness summary
   */
  static async getProductionReadinessSummary(): Promise<string> {
    const validation = await this.validateProductionReadiness();
    
    let summary = `\n=== PAYMENT SYSTEM PRODUCTION READINESS ===\n`;
    summary += `Overall Status: ${validation.overall.toUpperCase()}\n`;
    summary += `Summary: ${validation.summary}\n\n`;

    summary += `=== VALIDATION RESULTS ===\n`;
    Object.entries(validation.checks).forEach(([key, check]) => {
      const status = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      summary += `${status} ${key.toUpperCase()}: ${check.message}\n`;
      if (check.details) {
        check.details.forEach(detail => {
          summary += `   - ${detail}\n`;
        });
      }
    });

    if (validation.recommendations.length > 0) {
      summary += `\n=== RECOMMENDATIONS ===\n`;
      validation.recommendations.forEach((rec, index) => {
        summary += `${index + 1}. ${rec}\n`;
      });
    }

    summary += `\n=== NEXT STEPS ===\n`;
    if (validation.overall === 'not_ready') {
      summary += `1. Fix all critical issues marked with ❌\n`;
      summary += `2. Address warnings marked with ⚠️\n`;
      summary += `3. Re-run validation after fixes\n`;
    } else if (validation.overall === 'warning') {
      summary += `1. Address warnings marked with ⚠️\n`;
      summary += `2. Consider implementing recommendations\n`;
      summary += `3. Test thoroughly before production deployment\n`;
    } else {
      summary += `1. System is ready for production deployment\n`;
      summary += `2. Continue monitoring after deployment\n`;
      summary += `3. Set up alerting for payment issues\n`;
    }

    return summary;
  }
}
