#!/usr/bin/env tsx

/**
 * Initialize Subscription System
 * 
 * This script initializes the subscription system by:
 * 1. Creating default subscription plans for providers
 * 2. Creating default client subscription plans
 * 3. Setting up the necessary database collections
 * 
 * Usage: npm run init-subscriptions
 */

import { subscriptionService } from '../lib/subscription-service';
import { clientSubscriptionService } from '../lib/client-subscription-service';

async function initializeSubscriptionSystem() {
  console.log('🚀 Initializing Subscription System...\n');

  try {
    // Initialize provider subscription plans
    console.log('📋 Initializing Provider Subscription Plans...');
    await subscriptionService.initializeDefaultPlans();
    console.log('✅ Provider subscription plans initialized successfully\n');

    // Initialize client subscription plans
    console.log('📋 Initializing Client Subscription Plans...');
    await clientSubscriptionService.initializeDefaultPlans();
    console.log('✅ Client subscription plans initialized successfully\n');

    // Verify plans were created
    console.log('🔍 Verifying Plans...');
    
    const providerPlans = await subscriptionService.getPlans();
    console.log(`📊 Provider Plans Created: ${providerPlans.length}`);
    providerPlans.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.tier}): ₱${plan.price}/month`);
    });

    const clientPlans = await clientSubscriptionService.getPlans();
    console.log(`📊 Client Plans Created: ${clientPlans.length}`);
    clientPlans.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.tier}): ₱${plan.price}/month`);
    });

    console.log('\n🎉 Subscription System Initialization Complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Test subscription creation via API endpoints');
    console.log('   2. Test feature access controls');
    console.log('   3. Test payment processing integration');
    console.log('   4. Test trial-to-paid conversion flow');
    console.log('   5. Deploy to production environment');

  } catch (error) {
    console.error('❌ Error initializing subscription system:', error);
    process.exit(1);
  }
}

// Run the initialization
if (require.main === module) {
  initializeSubscriptionSystem()
    .then(() => {
      console.log('\n✨ Initialization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Initialization failed:', error);
      process.exit(1);
    });
}

export { initializeSubscriptionSystem };
