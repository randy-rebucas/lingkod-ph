/**
 * PayMaya Setup Validation Script
 * Validates that PayMaya integration is properly configured and working
 */

import { PaymentConfig } from '@/lib/payment-config';
import { paymayaPaymentService } from '@/lib/paymaya-payment-service';

interface ValidationResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

async function validatePayMayaSetup(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  console.log('🔍 Validating PayMaya Setup...\n');

  // Check 1: Environment Variables
  console.log('1️⃣ Checking Environment Variables...');
  const hasPublicKey = !!process.env.NEXT_PUBLIC_PAYMAYA_PUBLIC_KEY;
  const hasSecretKey = !!process.env.PAYMAYA_SECRET_KEY;
  const hasWebhookSecret = !!process.env.PAYMAYA_WEBHOOK_SECRET;
  const hasAppUrl = !!process.env.NEXT_PUBLIC_APP_URL;

  results.push({
    check: 'Environment Variables',
    status: hasPublicKey && hasSecretKey ? 'pass' : 'fail',
    message: hasPublicKey && hasSecretKey 
      ? 'All required environment variables are set'
      : 'Missing required environment variables',
    details: {
      hasPublicKey,
      hasSecretKey,
      hasWebhookSecret,
      hasAppUrl,
      publicKeyLength: process.env.NEXT_PUBLIC_PAYMAYA_PUBLIC_KEY?.length || 0,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    }
  });

  // Check 2: PayMaya Configuration
  console.log('2️⃣ Checking PayMaya Configuration...');
  const isConfigured = PaymentConfig.validatePayMayaConfig();
  results.push({
    check: 'PayMaya Configuration',
    status: isConfigured ? 'pass' : 'fail',
    message: isConfigured 
      ? 'PayMaya configuration is valid'
      : 'PayMaya configuration is invalid',
    details: {
      publicKey: PaymentConfig.PAYMAYA.publicKey ? 'Set' : 'Not set',
      secretKey: PaymentConfig.PAYMAYA.secretKey ? 'Set' : 'Not set',
      webhookSecret: PaymentConfig.PAYMAYA.webhookSecret ? 'Set' : 'Not set'
    }
  });

  // Check 3: PayMaya API Connection
  console.log('3️⃣ Testing PayMaya API Connection...');
  try {
    const service = new paymayaPaymentService();
    const token = await (service as any).getAccessToken();
    
    results.push({
      check: 'PayMaya API Connection',
      status: !!token ? 'pass' : 'fail',
      message: token 
        ? 'Successfully connected to PayMaya API'
        : 'Failed to connect to PayMaya API',
      details: {
        tokenLength: token?.length || 0,
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    results.push({
      check: 'PayMaya API Connection',
      status: 'fail',
      message: 'Failed to connect to PayMaya API',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }

  // Check 4: Payment Creation
  console.log('4️⃣ Testing Payment Creation...');
  try {
    const testPayment = {
      amount: 1,
      currency: 'PHP',
      userId: 'validation_test_user',
      userEmail: 'test@example.com',
      planId: 'validation_test_plan',
      planName: 'Validation Test Plan',
      returnUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      description: 'Test payment for validation'
    };

    const result = await paymayaPaymentService.createPayment(testPayment);
    
    results.push({
      check: 'Payment Creation',
      status: result.success ? 'pass' : 'warning',
      message: result.success 
        ? 'Payment creation is working'
        : 'Payment creation failed (this may be expected if credentials are invalid)',
      details: {
        success: result.success,
        error: result.error,
        paymentId: result.paymentId,
        hasCheckoutUrl: !!result.checkoutUrl,
        hasQrCode: !!result.qrCode
      }
    });
  } catch (error) {
    results.push({
      check: 'Payment Creation',
      status: 'warning',
      message: 'Could not test payment creation',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }

  // Check 5: API Endpoints
  console.log('5️⃣ Checking API Endpoints...');
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Test if the API endpoints are accessible
    const endpoints = [
      '/api/payments/paymaya/create',
      '/api/payments/paymaya/webhook'
    ];

    const endpointResults = await Promise.allSettled(
      endpoints.map(endpoint => 
        fetch(`${baseUrl}${endpoint}`, { method: 'OPTIONS' })
      )
    );

    const accessibleEndpoints = endpointResults.filter(
      result => result.status === 'fulfilled'
    ).length;

    results.push({
      check: 'API Endpoints',
      status: accessibleEndpoints === endpoints.length ? 'pass' : 'warning',
      message: `${accessibleEndpoints}/${endpoints.length} API endpoints are accessible`,
      details: {
        totalEndpoints: endpoints.length,
        accessibleEndpoints,
        baseUrl
      }
    });
  } catch (error) {
    results.push({
      check: 'API Endpoints',
      status: 'warning',
      message: 'Could not test API endpoints',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }

  // Check 6: Webhook Configuration
  console.log('6️⃣ Checking Webhook Configuration...');
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paymaya/webhook`
    : 'Not configured';

  results.push({
    check: 'Webhook Configuration',
    status: process.env.NEXT_PUBLIC_APP_URL ? 'pass' : 'warning',
    message: process.env.NEXT_PUBLIC_APP_URL 
      ? 'Webhook URL is configured'
      : 'Webhook URL is not configured',
    details: {
      webhookUrl,
      configured: !!process.env.NEXT_PUBLIC_APP_URL
    }
  });

  return results;
}

async function runValidation() {
  console.log('🚀 Starting PayMaya Setup Validation...\n');
  
  const results = await validatePayMayaSetup();
  
  console.log('\n📊 Validation Results:');
  console.log('=====================');
  
  let passedChecks = 0;
  let failedChecks = 0;
  let warningChecks = 0;
  
  results.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${index + 1}. ${icon} ${result.check}: ${result.message}`);
    
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
    
    if (result.status === 'pass') passedChecks++;
    else if (result.status === 'fail') failedChecks++;
    else warningChecks++;
  });
  
  console.log('\n📈 Summary:');
  console.log(`✅ Passed: ${passedChecks}`);
  console.log(`❌ Failed: ${failedChecks}`);
  console.log(`⚠️  Warnings: ${warningChecks}`);
  
  if (failedChecks === 0) {
    console.log('\n🎉 PayMaya setup validation completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Configure webhooks in PayMaya Developer Dashboard');
    console.log('2. Test the payment flow');
    console.log('3. Set up production credentials when ready');
  } else {
    console.log('\n⚠️  Some validation checks failed. Please fix the issues above.');
    console.log('\n💡 Common fixes:');
    console.log('1. Add missing environment variables to .env.local');
    console.log('2. Verify PayMaya credentials are correct');
    console.log('3. Check PayMaya Developer Dashboard configuration');
    console.log('4. Ensure your PayMaya app has payment features enabled');
  }
  
  return results;
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation()
    .then((results) => {
      const hasFailures = results.some(r => r.status === 'fail');
      process.exit(hasFailures ? 1 : 0);
    })
    .catch((error) => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

export { validatePayMayaSetup, runValidation };
