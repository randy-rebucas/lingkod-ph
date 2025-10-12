/**
 * PayPal Integration Test Script
 * Tests the complete PayPal subscription flow
 */

import { paypalSubscriptionService } from '@/lib/paypal-subscription-service';
import { PaymentConfig } from '@/lib/payment-config';

interface TestResult {
  test: string;
  success: boolean;
  error?: string;
  details?: any;
}

async function testPayPalIntegration(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('🧪 Testing PayPal Integration...\n');

  // Test 1: Configuration Check
  console.log('1️⃣ Testing PayPal Configuration...');
  try {
    const isConfigured = PaymentConfig.validatePayPalConfig();
    results.push({
      test: 'PayPal Configuration',
      success: isConfigured,
      error: isConfigured ? undefined : 'PayPal credentials not configured',
      details: {
        hasClientId: !!PaymentConfig.PAYPAL.clientId,
        hasClientSecret: !!PaymentConfig.PAYPAL.clientSecret,
        environment: process.env.NODE_ENV
      }
    });
    console.log(isConfigured ? '✅ Configuration OK' : '❌ Configuration Failed');
  } catch (error) {
    results.push({
      test: 'PayPal Configuration',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log('❌ Configuration Error:', error);
  }

  // Test 2: Access Token
  console.log('\n2️⃣ Testing PayPal Access Token...');
  try {
    const service = new paypalSubscriptionService();
    const token = await (service as any).getAccessToken();
    results.push({
      test: 'PayPal Access Token',
      success: !!token,
      error: token ? undefined : 'Failed to get access token',
      details: {
        tokenLength: token?.length || 0,
        tokenPrefix: token?.substring(0, 10) + '...'
      }
    });
    console.log(token ? '✅ Access Token OK' : '❌ Access Token Failed');
  } catch (error) {
    results.push({
      test: 'PayPal Access Token',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log('❌ Access Token Error:', error);
  }

  // Test 3: Create Test Plan
  console.log('\n3️⃣ Testing PayPal Plan Creation...');
  try {
    const testPlan = {
      planId: `test_plan_${Date.now()}`,
      planName: 'Test Plan',
      description: 'Test subscription plan for integration testing',
      price: 100,
      currency: 'PHP'
    };

    const result = await paypalSubscriptionService.createSubscriptionPlan(testPlan);
    results.push({
      test: 'PayPal Plan Creation',
      success: result.success,
      error: result.error,
      details: {
        planId: result.planId,
        requestedPlan: testPlan
      }
    });
    console.log(result.success ? '✅ Plan Creation OK' : '❌ Plan Creation Failed');
    if (result.error) console.log('Error:', result.error);
  } catch (error) {
    results.push({
      test: 'PayPal Plan Creation',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log('❌ Plan Creation Error:', error);
  }

  // Test 4: API Endpoints
  console.log('\n4️⃣ Testing API Endpoints...');
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Test subscription create endpoint
    const createResponse = await fetch(`${baseUrl}/api/subscriptions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'test_plan',
        planName: 'Test Plan',
        price: 100,
        currency: 'PHP',
        userId: 'test_user',
        userEmail: 'test@example.com'
      })
    });

    const createResult = await createResponse.json();
    results.push({
      test: 'API Endpoints',
      success: createResponse.status === 200 || createResponse.status === 400, // 400 is expected for test data
      error: createResponse.status >= 500 ? 'Server error' : undefined,
      details: {
        createEndpoint: {
          status: createResponse.status,
          response: createResult
        }
      }
    });
    console.log(createResponse.status < 500 ? '✅ API Endpoints OK' : '❌ API Endpoints Failed');
  } catch (error) {
    results.push({
      test: 'API Endpoints',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log('❌ API Endpoints Error:', error);
  }

  return results;
}

async function runPayPalTests() {
  console.log('🚀 Starting PayPal Integration Tests...\n');
  
  const results = await testPayPalIntegration();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  let passedTests = 0;
  let totalTests = results.length;
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${result.test}: ${status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.success) passedTests++;
  });
  
  console.log('\n📈 Overall Results:');
  console.log(`Passed: ${passedTests}/${totalTests} tests`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! PayPal integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
    console.log('\n💡 Common issues:');
    console.log('1. Missing or incorrect PayPal credentials in .env.local');
    console.log('2. PayPal app not properly configured in developer dashboard');
    console.log('3. Network connectivity issues');
    console.log('4. PayPal API rate limiting');
  }
  
  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runPayPalTests()
    .then((results) => {
      const allPassed = results.every(r => r.success);
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testPayPalIntegration, runPayPalTests };