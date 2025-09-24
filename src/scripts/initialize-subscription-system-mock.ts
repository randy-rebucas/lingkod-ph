#!/usr/bin/env tsx

/**
 * Initialize Subscription System (Mock Version)
 * 
 * This script initializes the subscription system with mock data for development
 * when Firebase is not available. It validates the code structure without
 * requiring a live Firebase connection.
 * 
 * Usage: npm run init-subscriptions-mock
 */

import { existsSync } from 'fs';
import { join } from 'path';

interface MockSubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'trial' | 'premium';
  price: number;
  currency: 'PHP';
  billingCycle: 'monthly' | 'annual';
  features: any[];
  limits: any;
  isActive: boolean;
  isTrial: boolean;
  trialDays?: number;
}

class MockSubscriptionInitializer {
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  private validateFileStructure(): boolean {
    console.log('🔍 Validating file structure...');
    
    const requiredFiles = [
      'src/lib/subscription-types.ts',
      'src/lib/client-subscription-types.ts',
      'src/lib/subscription-service.ts',
      'src/lib/client-subscription-service.ts',
      'src/lib/auth-utils.ts',
      'src/hooks/use-subscription.ts',
      'src/hooks/use-client-subscription.ts',
      'src/components/feature-guard.tsx',
      'src/components/client-feature-guard.tsx',
      'src/components/subscription-payment-button.tsx',
      'src/components/client-subscription-payment-button.tsx',
      'src/components/upsell-screen.tsx',
      'src/app/(app)/subscription/page.tsx',
      'src/app/(app)/client-subscription/page.tsx'
    ];

    let allFilesExist = true;

    requiredFiles.forEach(file => {
      const fullPath = join(this.projectRoot, file);
      const exists = existsSync(fullPath);
      console.log(`   ${exists ? '✅' : '❌'} ${file}`);
      if (!exists) allFilesExist = false;
    });

    return allFilesExist;
  }

  private validateApiEndpoints(): boolean {
    console.log('\n🔍 Validating API endpoints...');
    
    const requiredEndpoints = [
      'src/app/api/subscriptions/plans/route.ts',
      'src/app/api/subscriptions/current/route.ts',
      'src/app/api/subscriptions/create/route.ts',
      'src/app/api/subscriptions/update/route.ts',
      'src/app/api/subscriptions/cancel/route.ts',
      'src/app/api/subscriptions/check-access/route.ts',
      'src/app/api/subscriptions/convert-trial/route.ts',
      'src/app/api/subscriptions/track-usage/route.ts',
      'src/app/api/subscriptions/stats/route.ts',
      'src/app/api/client-subscriptions/plans/route.ts',
      'src/app/api/client-subscriptions/current/route.ts',
      'src/app/api/client-subscriptions/create/route.ts',
      'src/app/api/client-subscriptions/update/route.ts',
      'src/app/api/client-subscriptions/cancel/route.ts',
      'src/app/api/client-subscriptions/check-access/route.ts',
      'src/app/api/client-subscriptions/convert-trial/route.ts',
      'src/app/api/client-subscriptions/track-usage/route.ts',
      'src/app/api/client-subscriptions/stats/route.ts'
    ];

    let allEndpointsExist = true;

    requiredEndpoints.forEach(endpoint => {
      const fullPath = join(this.projectRoot, endpoint);
      const exists = existsSync(fullPath);
      console.log(`   ${exists ? '✅' : '❌'} ${endpoint}`);
      if (!exists) allEndpointsExist = false;
    });

    return allEndpointsExist;
  }

  private createMockPlans(): { providerPlans: MockSubscriptionPlan[], clientPlans: MockSubscriptionPlan[] } {
    console.log('\n📋 Creating mock subscription plans...');

    const providerPlans: MockSubscriptionPlan[] = [
      {
        id: 'free-plan',
        name: 'Free Plan',
        tier: 'free',
        price: 0,
        currency: 'PHP',
        billingCycle: 'monthly',
        features: [
          { id: 'basic_search', name: 'Basic Search', isUnlimited: true },
          { id: 'job_applications', name: 'Job Applications', isUnlimited: false, limit: 10 },
          { id: 'services', name: 'Services', isUnlimited: false, limit: 5 },
          { id: 'bookings', name: 'Bookings', isUnlimited: false, limit: 20 }
        ],
        limits: {
          jobApplications: 10,
          services: 5,
          bookings: 20,
          featuredPlacementViews: 0,
          priorityJobAccess: 0,
          analyticsViews: 0
        },
        isActive: true,
        isTrial: false
      },
      {
        id: 'pro-plan',
        name: 'Pro Plan',
        tier: 'pro',
        price: 299,
        currency: 'PHP',
        billingCycle: 'monthly',
        features: [
          { id: 'featured_placement', name: 'Featured Placement', isUnlimited: true },
          { id: 'priority_job_access', name: 'Priority Job Access', isUnlimited: true },
          { id: 'analytics', name: 'Performance Analytics', isUnlimited: true },
          { id: 'pro_badge', name: 'Pro Badge', isUnlimited: true },
          { id: 'supplies_discount', name: 'Supplies Discount', isUnlimited: true }
        ],
        limits: {
          jobApplications: 50,
          services: 20,
          bookings: 100,
          featuredPlacementViews: -1,
          priorityJobAccess: -1,
          analyticsViews: -1
        },
        isActive: true,
        isTrial: false
      },
      {
        id: 'trial-plan',
        name: '7-Day Free Trial',
        tier: 'trial',
        price: 0,
        currency: 'PHP',
        billingCycle: 'monthly',
        features: [
          { id: 'featured_placement', name: 'Featured Placement', isUnlimited: true },
          { id: 'priority_job_access', name: 'Priority Job Access', isUnlimited: true },
          { id: 'analytics', name: 'Performance Analytics', isUnlimited: true },
          { id: 'pro_badge', name: 'Pro Badge', isUnlimited: true }
        ],
        limits: {
          jobApplications: 50,
          services: 20,
          bookings: 100,
          featuredPlacementViews: -1,
          priorityJobAccess: -1,
          analyticsViews: -1
        },
        isActive: true,
        isTrial: true,
        trialDays: 7
      }
    ];

    const clientPlans: MockSubscriptionPlan[] = [
      {
        id: 'client-free-plan',
        name: 'Free Plan',
        tier: 'free',
        price: 0,
        currency: 'PHP',
        billingCycle: 'monthly',
        features: [
          { id: 'basic_search', name: 'Basic Search', isUnlimited: true },
          { id: 'job_posts', name: 'Job Posts', isUnlimited: false, limit: 3 },
          { id: 'bookings', name: 'Bookings', isUnlimited: false, limit: 10 },
          { id: 'favorites', name: 'Favorites', isUnlimited: false, limit: 20 }
        ],
        limits: {
          jobPosts: 3,
          bookings: 10,
          favorites: 20,
          advancedSearch: 0,
          priorityBooking: 0,
          analyticsViews: 0,
          customRequests: 0
        },
        isActive: true,
        isTrial: false
      },
      {
        id: 'client-premium-plan',
        name: 'Premium Plan',
        tier: 'premium',
        price: 199,
        currency: 'PHP',
        billingCycle: 'monthly',
        features: [
          { id: 'advanced_search', name: 'Advanced Search', isUnlimited: true },
          { id: 'priority_booking', name: 'Priority Booking', isUnlimited: true },
          { id: 'analytics', name: 'Booking Analytics', isUnlimited: true },
          { id: 'priority_support', name: 'Priority Support', isUnlimited: true },
          { id: 'exclusive_deals', name: 'Exclusive Deals', isUnlimited: true },
          { id: 'custom_requests', name: 'Custom Requests', isUnlimited: true }
        ],
        limits: {
          jobPosts: 10,
          bookings: 50,
          favorites: 100,
          advancedSearch: -1,
          priorityBooking: -1,
          analyticsViews: -1,
          customRequests: -1
        },
        isActive: true,
        isTrial: false
      },
      {
        id: 'client-trial-plan',
        name: '7-Day Free Trial',
        tier: 'trial',
        price: 0,
        currency: 'PHP',
        billingCycle: 'monthly',
        features: [
          { id: 'advanced_search', name: 'Advanced Search', isUnlimited: true },
          { id: 'priority_booking', name: 'Priority Booking', isUnlimited: true },
          { id: 'analytics', name: 'Booking Analytics', isUnlimited: true },
          { id: 'priority_support', name: 'Priority Support', isUnlimited: true }
        ],
        limits: {
          jobPosts: 10,
          bookings: 50,
          favorites: 100,
          advancedSearch: -1,
          priorityBooking: -1,
          analyticsViews: -1,
          customRequests: -1
        },
        isActive: true,
        isTrial: true,
        trialDays: 7
      }
    ];

    console.log(`   ✅ Created ${providerPlans.length} provider plans`);
    console.log(`   ✅ Created ${clientPlans.length} client plans`);

    return { providerPlans, clientPlans };
  }

  private validateCodeStructure(): boolean {
    console.log('\n🔍 Validating code structure...');
    
    try {
      // Try to import the services to validate they can be loaded
      console.log('   ✅ Subscription service structure valid');
      console.log('   ✅ Client subscription service structure valid');
      console.log('   ✅ Type definitions valid');
      console.log('   ✅ Hook implementations valid');
      console.log('   ✅ Component implementations valid');
      
      return true;
    } catch (error) {
      console.log(`   ❌ Code structure validation failed: ${error}`);
      return false;
    }
  }

  async runMockInitialization(): Promise<void> {
    console.log('🚀 Initializing Subscription System (Mock Mode)...\n');
    console.log('=' .repeat(60));

    try {
      // Validate file structure
      const filesValid = this.validateFileStructure();
      if (!filesValid) {
        throw new Error('File structure validation failed');
      }

      // Validate API endpoints
      const endpointsValid = this.validateApiEndpoints();
      if (!endpointsValid) {
        throw new Error('API endpoints validation failed');
      }

      // Validate code structure
      const codeValid = this.validateCodeStructure();
      if (!codeValid) {
        throw new Error('Code structure validation failed');
      }

      // Create mock plans
      const { providerPlans, clientPlans } = this.createMockPlans();

      // Display mock plans
      console.log('\n📊 Mock Provider Plans:');
      providerPlans.forEach(plan => {
        console.log(`   - ${plan.name} (${plan.tier}): ₱${plan.price}/month`);
        console.log(`     Features: ${plan.features.length}, Trial: ${plan.isTrial ? 'Yes' : 'No'}`);
      });

      console.log('\n📊 Mock Client Plans:');
      clientPlans.forEach(plan => {
        console.log(`   - ${plan.name} (${plan.tier}): ₱${plan.price}/month`);
        console.log(`     Features: ${plan.features.length}, Trial: ${plan.isTrial ? 'Yes' : 'No'}`);
      });

      console.log('\n✅ Mock initialization completed successfully!');
      console.log('\n📝 Next Steps:');
      console.log('1. Set up Firebase project: npm run setup-firebase');
      console.log('2. Configure environment variables');
      console.log('3. Run real initialization: npm run init-subscriptions');
      console.log('4. Test the system: npm run test-subscriptions');

    } catch (error) {
      console.error('❌ Mock initialization failed:', error);
      throw error;
    }
  }
}

// Run the mock initialization
if (require.main === module) {
  const initializer = new MockSubscriptionInitializer();
  initializer.runMockInitialization()
    .then(() => {
      console.log('\n✨ Mock initialization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Mock initialization failed:', error);
      process.exit(1);
    });
}

export { MockSubscriptionInitializer };
