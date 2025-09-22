/**
 * Subscription System Test Suite
 * This file contains comprehensive tests for the subscription system
 */

import { 
  hasActiveSubscription, 
  hasPaidSubscription, 
  hasProSubscription, 
  hasEliteSubscription,
  canAccessFeature,
  canManageProviders,
  getMaxProviders,
  canAccessAgencyFeature,
  getSubscriptionTier,
  getUpgradeMessage
} from './subscription-utils';

// Mock subscription data for testing
const mockSubscriptions = {
  free: { 
    id: 'free-1', 
    userId: 'user-1', 
    planId: 'free' as const, 
    status: 'active' as const, 
    startDate: new Date(), 
    renewsOn: undefined,
    features: [],
    limits: { maxProviders: 1 }
  },
  starter: { 
    id: 'starter-1', 
    userId: 'user-1', 
    planId: 'starter' as const, 
    status: 'active' as const, 
    startDate: new Date(), 
    renewsOn: undefined,
    features: ['smart-rate'],
    limits: { maxProviders: 0 }
  },
  pro: { 
    id: 'pro-1', 
    userId: 'user-1', 
    planId: 'pro' as const, 
    status: 'active' as const, 
    startDate: new Date(), 
    renewsOn: undefined,
    features: ['smart-rate', 'invoices', 'quote-builder'],
    limits: { maxProviders: 0 }
  },
  elite: { 
    id: 'elite-1', 
    userId: 'user-1', 
    planId: 'elite' as const, 
    status: 'active' as const, 
    startDate: new Date(), 
    renewsOn: undefined,
    features: ['smart-rate', 'invoices', 'quote-builder', 'analytics'],
    limits: { maxProviders: 0 }
  },
  lite: { 
    id: 'lite-1', 
    userId: 'user-1', 
    planId: 'lite' as const, 
    status: 'active' as const, 
    startDate: new Date(), 
    renewsOn: undefined,
    features: ['basic-reports'],
    limits: { maxProviders: 3 }
  },
  custom: { 
    id: 'custom-1', 
    userId: 'user-1', 
    planId: 'custom' as const, 
    status: 'active' as const, 
    startDate: new Date(), 
    renewsOn: undefined,
    features: ['api-access'],
    limits: { maxProviders: Infinity }
  },
  cancelled: { 
    id: 'pro-1', 
    userId: 'user-1', 
    planId: 'pro' as const, 
    status: 'cancelled' as const, 
    startDate: new Date(), 
    renewsOn: undefined,
    features: ['smart-rate', 'invoices', 'quote-builder'],
    limits: { maxProviders: 10 }
  },
  pending: { 
    id: 'pro-1', 
    userId: 'user-1', 
    planId: 'pro' as const, 
    status: 'pending' as const, 
    startDate: new Date(), 
    renewsOn: undefined,
    features: ['smart-rate', 'invoices', 'quote-builder'],
    limits: { maxProviders: 10 }
  },
  none: null
};

export function runSubscriptionTests() {
  console.log('🧪 Running Subscription System Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name: string, condition: boolean) {
    if (condition) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  }
  
  // Test 1: Basic subscription status checks
  console.log('📋 Testing Basic Subscription Status...');
  test('Free subscription is not considered active paid subscription', !hasActiveSubscription(mockSubscriptions.free));
  test('Pro subscription is considered active paid subscription', hasActiveSubscription(mockSubscriptions.pro));
  test('Elite subscription is considered active paid subscription', hasActiveSubscription(mockSubscriptions.elite));
  test('Cancelled subscription is not considered active', !hasActiveSubscription(mockSubscriptions.cancelled));
  test('Pending subscription is not considered active', !hasActiveSubscription(mockSubscriptions.pending));
  test('Null subscription is not considered active', !hasActiveSubscription(mockSubscriptions.none));
  
  // Test 2: Plan-specific checks
  console.log('\n📋 Testing Plan-Specific Checks...');
  test('Pro subscription is correctly identified', hasProSubscription(mockSubscriptions.pro));
  test('Elite subscription is correctly identified', hasEliteSubscription(mockSubscriptions.elite));
  test('Free subscription is not pro', !hasProSubscription(mockSubscriptions.free));
  test('Pro subscription is not elite', !hasEliteSubscription(mockSubscriptions.pro));
  
  // Test 3: Feature access for providers
  console.log('\n📋 Testing Provider Feature Access...');
  test('Free plan cannot access smart-rate', !canAccessFeature(mockSubscriptions.free, 'smart-rate'));
  test('Pro plan can access smart-rate', canAccessFeature(mockSubscriptions.pro, 'smart-rate'));
  test('Elite plan can access smart-rate', canAccessFeature(mockSubscriptions.elite, 'smart-rate'));
  
  test('Free plan cannot access invoices', !canAccessFeature(mockSubscriptions.free, 'invoices'));
  test('Pro plan can access invoices', canAccessFeature(mockSubscriptions.pro, 'invoices'));
  test('Elite plan can access invoices', canAccessFeature(mockSubscriptions.elite, 'invoices'));
  
  test('Free plan cannot access analytics', !canAccessFeature(mockSubscriptions.free, 'analytics'));
  test('Pro plan cannot access analytics', !canAccessFeature(mockSubscriptions.pro, 'analytics'));
  test('Elite plan can access analytics', canAccessFeature(mockSubscriptions.elite, 'analytics'));
  
  test('Free plan cannot access quote-builder', !canAccessFeature(mockSubscriptions.free, 'quote-builder'));
  test('Pro plan can access quote-builder', canAccessFeature(mockSubscriptions.pro, 'quote-builder'));
  test('Elite plan can access quote-builder', canAccessFeature(mockSubscriptions.elite, 'quote-builder'));
  
  // Test 4: Agency provider limits
  console.log('\n📋 Testing Agency Provider Limits...');
  test('Free plan can manage up to 1 provider', canManageProviders(mockSubscriptions.free, 0));
  test('Free plan cannot manage more than 1 provider', !canManageProviders(mockSubscriptions.free, 1));
  test('Lite plan can manage up to 3 providers', canManageProviders(mockSubscriptions.lite, 2));
  test('Lite plan cannot manage more than 3 providers', !canManageProviders(mockSubscriptions.lite, 3));
  test('Custom plan can manage unlimited providers', canManageProviders(mockSubscriptions.custom, 100));
  
  // Test 5: Max provider limits
  console.log('\n📋 Testing Max Provider Limits...');
  test('Free plan max providers is 1', getMaxProviders(mockSubscriptions.free) === 1);
  test('Lite plan max providers is 3', getMaxProviders(mockSubscriptions.lite) === 3);
  test('Custom plan max providers is unlimited', getMaxProviders(mockSubscriptions.custom) === Infinity);
  
  // Test 6: Agency feature access
  console.log('\n📋 Testing Agency Feature Access...');
  test('Free plan cannot access basic reports', !canAccessAgencyFeature(mockSubscriptions.free, 'basic-reports'));
  test('Lite plan can access basic reports', canAccessAgencyFeature(mockSubscriptions.lite, 'basic-reports'));
  test('Lite plan cannot access enhanced reports', !canAccessAgencyFeature(mockSubscriptions.lite, 'enhanced-reports'));
  test('Custom plan can access enhanced reports', canAccessAgencyFeature(mockSubscriptions.custom, 'enhanced-reports'));
  test('Custom plan can access branded communications', canAccessAgencyFeature(mockSubscriptions.custom, 'branded-communications'));
  test('Custom plan can access API', canAccessAgencyFeature(mockSubscriptions.custom, 'api-access'));
  test('Lite plan cannot access API', !canAccessAgencyFeature(mockSubscriptions.lite, 'api-access'));
  
  // Test 7: Subscription tier identification
  console.log('\n📋 Testing Subscription Tier Identification...');
  test('Free subscription tier is correctly identified', getSubscriptionTier(mockSubscriptions.free) === 'free');
  test('Pro subscription tier is correctly identified', getSubscriptionTier(mockSubscriptions.pro) === 'pro');
  test('Elite subscription tier is correctly identified', getSubscriptionTier(mockSubscriptions.elite) === 'elite');
  test('Null subscription defaults to free', getSubscriptionTier(mockSubscriptions.none) === 'free');
  
  // Test 8: Upgrade messages
  console.log('\n📋 Testing Upgrade Messages...');
  test('Upgrade message from free to pro is generated', getUpgradeMessage('free', 'pro').includes('Pro subscription'));
  test('Upgrade message from pro to elite is generated', getUpgradeMessage('pro', 'elite').includes('Elite subscription'));
  test('Upgrade message includes current plan', getUpgradeMessage('free', 'pro').includes('Free'));
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All subscription system tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the subscription system implementation.');
  }
  
  return { passed, failed, successRate: (passed / (passed + failed)) * 100 };
}

// Export for use in development
export { mockSubscriptions };
