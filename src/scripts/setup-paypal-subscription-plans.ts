/**
 * Setup PayPal Subscription Plans
 * This script creates the necessary subscription plans in PayPal for the application
 */

import { paypalSubscriptionService } from '@/lib/paypal-subscription-service';

const subscriptionPlans = [
  {
    planId: 'premium_monthly',
    planName: 'Premium Monthly',
    description: 'Premium plan with enhanced features for growing professionals',
    price: 499,
    currency: 'PHP',
  },
  {
    planId: 'elite_monthly',
    planName: 'Elite Monthly',
    description: 'Elite plan with premium features for top-tier providers',
    price: 999,
    currency: 'PHP',
  },
];

async function setupPayPalSubscriptionPlans() {
  console.log('🚀 Setting up PayPal subscription plans...');

  try {
    // Check if PayPal is configured
    if (!paypalSubscriptionService.constructor.isConfigured()) {
      console.error('❌ PayPal is not properly configured. Please check your environment variables.');
      console.log('Required environment variables:');
      console.log('- NEXT_PUBLIC_PAYPAL_CLIENT_ID');
      console.log('- PAYPAL_CLIENT_SECRET');
      console.log('\n💡 Make sure to set these in your .env.local file');
      return;
    }

    console.log('✅ PayPal configuration verified');
    console.log(`🌐 Using ${process.env.NODE_ENV === 'production' ? 'LIVE' : 'SANDBOX'} PayPal environment`);

    const createdPlans: Array<{ name: string; id: string; price: number }> = [];

    for (const plan of subscriptionPlans) {
      console.log(`\n📋 Creating plan: ${plan.planName}...`);
      
      const result = await paypalSubscriptionService.createSubscriptionPlan(plan);
      
      if (result.success) {
        console.log(`✅ Plan created successfully: ${plan.planName}`);
        console.log(`   Plan ID: ${result.planId}`);
        console.log(`   Price: ₱${plan.price}/${plan.currency}`);
        createdPlans.push({
          name: plan.planName,
          id: result.planId!,
          price: plan.price
        });
      } else {
        console.error(`❌ Failed to create plan: ${plan.planName}`);
        console.error(`   Error: ${result.error}`);
      }
    }

    if (createdPlans.length > 0) {
      console.log('\n🎉 PayPal subscription plans setup completed!');
      console.log('\n📋 Created Plans:');
      createdPlans.forEach(plan => {
        console.log(`   • ${plan.name} (ID: ${plan.id}) - ₱${plan.price}/month`);
      });
    }

    console.log('\n📝 Next steps:');
    console.log('1. Update your subscription page to use the actual PayPal plan IDs');
    console.log('2. Configure PayPal webhook URL in your PayPal developer dashboard');
    console.log('3. Set webhook URL to: https://yourdomain.com/api/subscriptions/webhook');
    console.log('4. Enable the following webhook events:');
    console.log('   - BILLING.SUBSCRIPTION.ACTIVATED');
    console.log('   - BILLING.SUBSCRIPTION.CANCELLED');
    console.log('   - BILLING.SUBSCRIPTION.SUSPENDED');
    console.log('   - BILLING.SUBSCRIPTION.PAYMENT.COMPLETED');
    console.log('   - BILLING.SUBSCRIPTION.PAYMENT.FAILED');
    console.log('   - BILLING.SUBSCRIPTION.EXPIRED');
    console.log('\n🔧 Environment Variables to add to .env.local:');
    console.log('NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id');
    console.log('PAYPAL_CLIENT_SECRET=your_paypal_client_secret');

  } catch (error) {
    console.error('❌ Error setting up PayPal subscription plans:', error);
    console.error('Stack trace:', error);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupPayPalSubscriptionPlans()
    .then(() => {
      console.log('Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export { setupPayPalSubscriptionPlans };
