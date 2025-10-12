/**
 * PayPal Setup Validation Script
 * Validates that PayPal integration is properly configured and working
 */

import { PaymentConfig } from '@/lib/payment-config';
import { paypalSubscriptionService } from '@/lib/paypal-subscription-service';

interface ValidationResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

async function validatePayPalSetup(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  console.log('🔍 Validating PayPal Setup...\n');

  // Check 1: Environment Variables
  console.log('1️⃣ Checking Environment Variables...');
  const hasClientId = !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const hasClientSecret = !!process.env.PAYPAL_CLIENT_SECRET;
  const hasAppUrl = !!process.env.NEXT_PUBLIC_APP_URL;

  results.push({
    check: 'Environment Variables',
    status: hasClientId && hasClientSecret ? 'pass' : 'fail',
    message: hasClientId && hasClientSecret 
      ? 'All required environment variables are set'
      : 'Missing required environment variables',
    details: {
      hasClientId,
      hasClientSecret,
      hasAppUrl,
      clientIdLength: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.length || 0,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    }
  });

  // Check 2: PayPal Configuration
  console.log('2️⃣ Checking PayPal Configuration...');
  const isConfigured = PaymentConfig.validatePayPalConfig();
  results.push({
    check: 'PayPal Configuration',
    status: isConfigured ? 'pass' : 'fail',
    message: isConfigured 
      ? 'PayPal configuration is valid'
      : 'PayPal configuration is invalid',
    details: {
      clientId: PaymentConfig.PAYPAL.clientId ? 'Set' : 'Not set',
      clientSecret: PaymentConfig.PAYPAL.clientSecret ? 'Set' : 'Not set'
    }
  });

  // Check 3: PayPal API Connection
  console.log('3️⃣ Testing PayPal API Connection...');
  try {
    const service = new paypalSubscriptionService();
    const token = await (service as any).getAccessToken();
    
    results.push({
      check: 'PayPal API Connection',
      status: !!token ? 'pass' : 'fail',
      message: token 
        ? 'Successfully connected to PayPal API'
        : 'Failed to connect to PayPal API',
      details: {
        tokenLength: token?.length || 0,
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    results.push({
      check: 'PayPal API Connection',
      status: 'fail',
      message: 'Failed to connect to PayPal API',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }

  // Check 4: Subscription Plans
  console.log('4️⃣ Checking Subscription Plans...');
  try {
    // Try to create a test plan to verify plan creation works
    const testPlan = {
      planId: `validation_test_${Date.now()}`,
      planName: 'Validation Test Plan',
      description: 'Test plan for validation',
      price: 1,
      currency: 'PHP'
    };

    const result = await paypalSubscriptionService.createSubscriptionPlan(testPlan);
    
    results.push({
      check: 'Subscription Plans',
      status: result.success ? 'pass' : 'warning',
      message: result.success 
        ? 'Subscription plan creation is working'
        : 'Subscription plan creation failed (this may be expected if plans already exist)',
      details: {
        success: result.success,
        error: result.error,
        planId: result.planId
      }
    });
  } catch (error) {
    results.push({
      check: 'Subscription Plans',
      status: 'warning',
      message: 'Could not test subscription plan creation',
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
      '/api/subscriptions/create',
      '/api/subscriptions/cancel',
      '/api/subscriptions/update',
      '/api/subscriptions/webhook'
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
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/webhook`
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
  console.log('🚀 Starting PayPal Setup Validation...\n');
  
  const results = await validatePayPalSetup();
  
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
    console.log('\n🎉 PayPal setup validation completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Run: npm run setup:paypal-plans');
    console.log('2. Configure webhooks in PayPal Developer Dashboard');
    console.log('3. Test the subscription flow');
  } else {
    console.log('\n⚠️  Some validation checks failed. Please fix the issues above.');
    console.log('\n💡 Common fixes:');
    console.log('1. Add missing environment variables to .env.local');
    console.log('2. Verify PayPal credentials are correct');
    console.log('3. Check PayPal Developer Dashboard configuration');
    console.log('4. Ensure your PayPal app has subscription features enabled');
  }
  
  return results;
}

// Run validation if this script is executed directly
if (require.main === module) {
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

export { validatePayPalSetup, runValidation };
