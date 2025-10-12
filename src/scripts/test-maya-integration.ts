/**
 * Test script for Maya Checkout integration
 * Run with: npm run test-maya
 */

import { MayaCheckoutService } from '../lib/maya-checkout-service';
import { PaymentConfig } from '../lib/payment-config';

async function testMayaIntegration() {
  console.log('🧪 Testing Maya Checkout Integration...\n');

  // Test 1: Configuration validation
  console.log('1. Testing configuration validation...');
  const isConfigValid = PaymentConfig.validateMayaConfig();
  console.log(`   Configuration valid: ${isConfigValid ? '✅' : '❌'}`);
  
  if (!isConfigValid) {
    console.log('   ⚠️  Please set the following environment variables:');
    console.log('   - NEXT_PUBLIC_MAYA_PUBLIC_KEY');
    console.log('   - MAYA_SECRET_KEY');
    console.log('   - MAYA_ENVIRONMENT (sandbox/production)');
    return;
  }

  console.log(`   Public Key: ${PaymentConfig.MAYA.publicKey.substring(0, 10)}...`);
  console.log(`   Environment: ${PaymentConfig.MAYA.environment}`);
  console.log('');

  // Test 2: Service initialization
  console.log('2. Testing service initialization...');
  try {
    const mayaService = new MayaCheckoutService();
    console.log('   ✅ Maya Checkout Service initialized successfully');
  } catch (error) {
    console.log('   ❌ Failed to initialize Maya Checkout Service:', error);
    return;
  }
  console.log('');

  // Test 3: Create test checkout (booking)
  console.log('3. Testing checkout creation (booking)...');
  try {
    const mayaService = new MayaCheckoutService();
    const result = await mayaService.createBookingCheckout(
      'test-booking-123',
      1000,
      'test@example.com'
    );

    if (result.success) {
      console.log('   ✅ Booking checkout created successfully');
      console.log(`   Checkout ID: ${result.data?.checkoutId}`);
      console.log(`   Redirect URL: ${result.data?.redirectUrl}`);
    } else {
      console.log('   ❌ Failed to create booking checkout:', result.error);
    }
  } catch (error) {
    console.log('   ❌ Error creating booking checkout:', error);
  }
  console.log('');

  // Test 4: Create test checkout (subscription)
  console.log('4. Testing checkout creation (subscription)...');
  try {
    const mayaService = new MayaCheckoutService();
    const result = await mayaService.createSubscriptionCheckout(
      'premium',
      499,
      'test@example.com'
    );

    if (result.success) {
      console.log('   ✅ Subscription checkout created successfully');
      console.log(`   Checkout ID: ${result.data?.checkoutId}`);
      console.log(`   Redirect URL: ${result.data?.redirectUrl}`);
    } else {
      console.log('   ❌ Failed to create subscription checkout:', result.error);
    }
  } catch (error) {
    console.log('   ❌ Error creating subscription checkout:', error);
  }
  console.log('');

  // Test 5: Webhook signature verification
  console.log('5. Testing webhook signature verification...');
  try {
    const mayaService = new MayaCheckoutService();
    const testPayload = JSON.stringify({
      id: 'test-checkout-123',
      status: 'PAID',
      totalAmount: { value: 1000, currency: 'PHP' }
    });
    const testSignature = 'test-signature';

    const isValid = mayaService.verifyWebhookSignature(testPayload, testSignature);
    console.log(`   Webhook verification: ${isValid ? '✅' : '❌'} (expected: false for test signature)`);
  } catch (error) {
    console.log('   ❌ Error testing webhook verification:', error);
  }
  console.log('');

  console.log('🎉 Maya Checkout integration test completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Set up your Maya API keys in .env.local');
  console.log('2. Test with real Maya sandbox credentials');
  console.log('3. Configure webhooks in Maya Business Manager');
  console.log('4. Test the full payment flow in your application');
}

// Run the test
testMayaIntegration().catch(console.error);
