'use server';

import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  writeBatch,
  orderBy,
  limit,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import {
  SubscriptionPlan,
  ProviderSubscription,
  SubscriptionUsage,
  SubscriptionPayment,
  SubscriptionAnalytics,
  FeatureAccessResult,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  TrackUsageInput,
  SubscriptionStats,
  SubscriptionFeature,
  SubscriptionLimits
} from './subscription-types';

export class SubscriptionService {
  private static instance: SubscriptionService;
  private static readonly COLLECTIONS = {
    PLANS: 'subscriptionPlans',
    SUBSCRIPTIONS: 'providerSubscriptions',
    USAGE: 'subscriptionUsage',
    PAYMENTS: 'subscriptionPayments',
    ANALYTICS: 'subscriptionAnalytics'
  };

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Initialize default subscription plans
   */
  async initializeDefaultPlans(): Promise<void> {
    try {
      const plansRef = collection(db, SubscriptionService.COLLECTIONS.PLANS);
      const existingPlans = await getDocs(plansRef);
      
      if (existingPlans.empty) {
        const batch = writeBatch(db);
        
        // Free Plan
        const freePlanRef = doc(plansRef);
        batch.set(freePlanRef, {
          name: 'Free Plan',
          tier: 'free',
          price: 0,
          currency: 'PHP',
          billingCycle: 'monthly',
          features: this.getFreePlanFeatures(),
          limits: this.getFreePlanLimits(),
          isActive: true,
          isTrial: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Pro Plan
        const proPlanRef = doc(plansRef);
        batch.set(proPlanRef, {
          name: 'Pro Plan',
          tier: 'pro',
          price: 399,
          currency: 'PHP',
          billingCycle: 'monthly',
          features: this.getProPlanFeatures(),
          limits: this.getProPlanLimits(),
          isActive: true,
          isTrial: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Trial Plan
        const trialPlanRef = doc(plansRef);
        batch.set(trialPlanRef, {
          name: '7-Day Free Trial',
          tier: 'trial',
          price: 0,
          currency: 'PHP',
          billingCycle: 'monthly',
          features: this.getProPlanFeatures(),
          limits: this.getProPlanLimits(),
          isActive: true,
          isTrial: true,
          trialDays: 7,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        await batch.commit();
        console.log('Default subscription plans initialized');
      }
    } catch (error) {
      console.error('Error initializing default plans:', error);
      throw error;
    }
  }

  /**
   * Get all available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plansRef = collection(db, SubscriptionService.COLLECTIONS.PLANS);
      const q = query(plansRef, where('isActive', '==', true), orderBy('price', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SubscriptionPlan));
    } catch (error) {
      console.error('Error getting plans:', error);
      throw error;
    }
  }

  /**
   * Get current subscription for a provider
   */
  async getCurrentSubscription(providerId: string): Promise<ProviderSubscription | null> {
    try {
      const subscriptionsRef = collection(db, SubscriptionService.COLLECTIONS.SUBSCRIPTIONS);
      const q = query(
        subscriptionsRef,
        where('providerId', '==', providerId),
        where('status', 'in', ['active', 'trial']),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as ProviderSubscription;
    } catch (error) {
      console.error('Error getting current subscription:', error);
      throw error;
    }
  }

  /**
   * Create a new subscription
   */
  async createSubscription(providerId: string, input: CreateSubscriptionInput): Promise<ProviderSubscription> {
    try {
      const plan = await this.getPlanById(input.planId);
      if (!plan) throw new Error('Plan not found');

      const now = new Date();
      const startDate = Timestamp.fromDate(now);
      
      let endDate: Timestamp;
      let nextBillingDate: Timestamp;
      let trialEndDate: Timestamp | undefined;
      let status: 'active' | 'trial' = 'active';

      if (input.startTrial && plan.isTrial) {
        // Start trial
        const trialEnd = new Date(now.getTime() + (plan.trialDays || 7) * 24 * 60 * 60 * 1000);
        trialEndDate = Timestamp.fromDate(trialEnd);
        endDate = trialEndDate;
        nextBillingDate = trialEndDate;
        status = 'trial';
      } else {
        // Regular subscription
        const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        endDate = Timestamp.fromDate(end);
        nextBillingDate = endDate;
      }

      const subscriptionData: Omit<ProviderSubscription, 'id'> = {
        providerId,
        planId: input.planId,
        tier: plan.tier,
        status,
        startDate,
        endDate,
        nextBillingDate,
        trialEndDate,
        autoRenew: true,
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
        amount: input.amount,
        currency: 'PHP',
        features: plan.features,
        limits: plan.limits,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const subscriptionRef = await addDoc(collection(db, SubscriptionService.COLLECTIONS.SUBSCRIPTIONS), subscriptionData);
      
      // Record payment if provided
      if (input.paymentReference) {
        await this.recordPayment(subscriptionRef.id, providerId, {
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          paymentReference: input.paymentReference,
          status: 'completed'
        });
      }

      return {
        id: subscriptionRef.id,
        ...subscriptionData
      } as ProviderSubscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Check feature access for a provider
   */
  async checkFeatureAccess(providerId: string, feature: string): Promise<FeatureAccessResult> {
    try {
      const subscription = await this.getCurrentSubscription(providerId);
      if (!subscription) {
        return {
          hasAccess: false,
          remainingUsage: 0,
          limit: 0,
          isUnlimited: false,
          message: 'No active subscription'
        };
      }

      // Check if feature is included in subscription
      const featureData = subscription.features.find(f => f.id === feature);
      if (!featureData) {
        return {
          hasAccess: false,
          remainingUsage: 0,
          limit: 0,
          isUnlimited: false,
          message: 'Feature not included in current plan'
        };
      }

      if (featureData.isUnlimited) {
        return {
          hasAccess: true,
          remainingUsage: -1,
          limit: -1,
          isUnlimited: true
        };
      }

      // Check usage for the current month
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      const usage = await this.getUsageForPeriod(providerId, currentPeriod);
      
      const currentUsage = this.getFeatureUsage(usage, feature);
      const limit = featureData.limit || 0;
      const remainingUsage = Math.max(0, limit - currentUsage);

      return {
        hasAccess: remainingUsage > 0,
        remainingUsage,
        limit,
        isUnlimited: false,
        message: remainingUsage <= 0 ? 'Usage limit exceeded' : undefined
      };
    } catch (error) {
      console.error('Error checking feature access:', error);
      throw error;
    }
  }

  /**
   * Track feature usage
   */
  async trackUsage(providerId: string, input: TrackUsageInput): Promise<void> {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const usageRef = collection(db, SubscriptionService.COLLECTIONS.USAGE);
      const q = query(
        usageRef,
        where('providerId', '==', providerId),
        where('period', '==', currentPeriod)
      );

      const snapshot = await getDocs(q);
      const subscription = await this.getCurrentSubscription(providerId);
      
      if (!subscription) throw new Error('No active subscription');

      if (snapshot.empty) {
        // Create new usage record
        const usageData: Omit<SubscriptionUsage, 'id'> = {
          providerId,
          subscriptionId: subscription.id,
          period: currentPeriod,
          usage: this.getInitialUsage(),
          limits: subscription.limits,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await addDoc(usageRef, usageData);
      } else {
        // Update existing usage
        const usageDoc = snapshot.docs[0];
        const currentUsage = usageDoc.data().usage;
        const updatedUsage = this.updateFeatureUsage(currentUsage, input.feature, input.amount || 1);
        
        await updateDoc(usageDoc.ref, {
          usage: updatedUsage,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
      throw error;
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToPaid(providerId: string, paymentMethod: string, paymentReference: string): Promise<ProviderSubscription> {
    try {
      const subscription = await this.getCurrentSubscription(providerId);
      if (!subscription || subscription.status !== 'trial') {
        throw new Error('No active trial subscription found');
      }

      const proPlan = await this.getPlanByTier('pro');
      if (!proPlan) throw new Error('Pro plan not found');

      await runTransaction(db, async (transaction) => {
        const subscriptionRef = doc(db, SubscriptionService.COLLECTIONS.SUBSCRIPTIONS, subscription.id);
        
        // Update subscription to Pro
        transaction.update(subscriptionRef, {
          tier: 'pro',
          status: 'active',
          planId: proPlan.id,
          features: proPlan.features,
          limits: proPlan.limits,
          paymentMethod,
          paymentReference,
          amount: proPlan.price,
          autoRenew: true,
          updatedAt: serverTimestamp()
        });

        // Record payment
        const paymentRef = doc(collection(db, SubscriptionService.COLLECTIONS.PAYMENTS));
        transaction.set(paymentRef, {
          subscriptionId: subscription.id,
          providerId,
          amount: proPlan.price,
          currency: 'PHP',
          paymentMethod,
          paymentReference,
          status: 'completed',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      return await this.getCurrentSubscription(providerId) as ProviderSubscription;
    } catch (error) {
      console.error('Error converting trial to paid:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(providerId: string, input: UpdateSubscriptionInput): Promise<void> {
    try {
      const subscription = await this.getCurrentSubscription(providerId);
      if (!subscription) throw new Error('No active subscription found');

      const subscriptionRef = doc(db, SubscriptionService.COLLECTIONS.SUBSCRIPTIONS, subscription.id);
      const updateData: any = {
        updatedAt: serverTimestamp()
      };

      if (input.autoRenew !== undefined) {
        updateData.autoRenew = input.autoRenew;
      }

      if (input.paymentMethod) {
        updateData.paymentMethod = input.paymentMethod;
      }

      if (input.paymentReference) {
        updateData.paymentReference = input.paymentReference;
      }

      await updateDoc(subscriptionRef, updateData);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(providerId: string): Promise<void> {
    try {
      const subscription = await this.getCurrentSubscription(providerId);
      if (!subscription) throw new Error('No active subscription found');

      const subscriptionRef = doc(db, SubscriptionService.COLLECTIONS.SUBSCRIPTIONS, subscription.id);
      await updateDoc(subscriptionRef, {
        status: 'cancelled',
        autoRenew: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(): Promise<SubscriptionStats> {
    try {
      const subscriptionsRef = collection(db, SubscriptionService.COLLECTIONS.SUBSCRIPTIONS);
      const snapshot = await getDocs(subscriptionsRef);
      
      const stats: SubscriptionStats = {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        trialSubscriptions: 0,
        proSubscriptions: 0,
        freeSubscriptions: 0,
        monthlyRevenue: 0,
        conversionRate: 0,
        churnRate: 0
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        stats.totalSubscriptions++;
        
        if (data.status === 'active' || data.status === 'trial') {
          stats.activeSubscriptions++;
        }
        
        if (data.tier === 'trial') {
          stats.trialSubscriptions++;
        } else if (data.tier === 'pro') {
          stats.proSubscriptions++;
        } else {
          stats.freeSubscriptions++;
        }
        
        if (data.tier === 'pro' && data.status === 'active') {
          stats.monthlyRevenue += data.amount || 0;
        }
      });

      // Calculate conversion rate (trials to paid)
      const totalTrials = stats.trialSubscriptions;
      const convertedTrials = stats.proSubscriptions;
      stats.conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const planRef = doc(db, SubscriptionService.COLLECTIONS.PLANS, planId);
    const planDoc = await getDoc(planRef);
    
    if (!planDoc.exists()) return null;
    
    return {
      id: planDoc.id,
      ...planDoc.data()
    } as SubscriptionPlan;
  }

  private async getPlanByTier(tier: string): Promise<SubscriptionPlan | null> {
    const plansRef = collection(db, SubscriptionService.COLLECTIONS.PLANS);
    const q = query(plansRef, where('tier', '==', tier), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as SubscriptionPlan;
  }

  private async getUsageForPeriod(providerId: string, period: string): Promise<SubscriptionUsage | null> {
    const usageRef = collection(db, SubscriptionService.COLLECTIONS.USAGE);
    const q = query(
      usageRef,
      where('providerId', '==', providerId),
      where('period', '==', period)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as SubscriptionUsage;
  }

  private getFeatureUsage(usage: SubscriptionUsage | null, feature: string): number {
    if (!usage) return 0;
    
    switch (feature) {
      case 'job_applications': return usage.usage.jobApplications;
      case 'services': return usage.usage.services;
      case 'bookings': return usage.usage.bookings;
      case 'featured_placement': return usage.usage.featuredPlacementViews;
      case 'priority_job_access': return usage.usage.priorityJobAccess;
      case 'analytics': return usage.usage.analyticsViews;
      default: return 0;
    }
  }

  private updateFeatureUsage(currentUsage: any, feature: string, amount: number): any {
    const updated = { ...currentUsage };
    
    switch (feature) {
      case 'job_applications': updated.jobApplications += amount; break;
      case 'services': updated.services += amount; break;
      case 'bookings': updated.bookings += amount; break;
      case 'featured_placement': updated.featuredPlacementViews += amount; break;
      case 'priority_job_access': updated.priorityJobAccess += amount; break;
      case 'analytics': updated.analyticsViews += amount; break;
    }
    
    return updated;
  }

  private getInitialUsage() {
    return {
      jobApplications: 0,
      services: 0,
      bookings: 0,
      featuredPlacementViews: 0,
      priorityJobAccess: 0,
      analyticsViews: 0
    };
  }

  private async recordPayment(subscriptionId: string, providerId: string, paymentData: any): Promise<void> {
    const paymentRef = collection(db, SubscriptionService.COLLECTIONS.PAYMENTS);
    await addDoc(paymentRef, {
      subscriptionId,
      providerId,
      ...paymentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  private getFreePlanFeatures(): SubscriptionFeature[] {
    return [
      {
        id: 'basic_profile',
        name: 'Basic Profile',
        description: 'Standard profile visibility',
        isUnlimited: true
      },
      {
        id: 'job_applications',
        name: 'Job Applications',
        description: 'Apply to job postings',
        isUnlimited: false,
        limit: 10
      },
      {
        id: 'services',
        name: 'Services',
        description: 'List your services',
        isUnlimited: false,
        limit: 5
      },
      {
        id: 'bookings',
        name: 'Bookings',
        description: 'Accept bookings',
        isUnlimited: false,
        limit: 20
      }
    ];
  }

  private getProPlanFeatures(): SubscriptionFeature[] {
    return [
      ...this.getFreePlanFeatures(),
      {
        id: 'featured_placement',
        name: 'Featured Placement',
        description: 'Show up at the top of search results',
        isUnlimited: true
      },
      {
        id: 'priority_job_access',
        name: 'Priority Job Access',
        description: 'Early access to high-value jobs',
        isUnlimited: true
      },
      {
        id: 'analytics',
        name: 'Performance Analytics',
        description: 'Detailed performance insights',
        isUnlimited: true
      },
      {
        id: 'pro_badge',
        name: 'Pro Badge',
        description: 'Verified Pro badge',
        isUnlimited: true
      },
      {
        id: 'supplies_discount',
        name: 'Supplies Discount',
        description: 'Access to exclusive partner deals',
        isUnlimited: true
      }
    ];
  }

  private getFreePlanLimits(): SubscriptionLimits {
    return {
      jobApplications: 10,
      services: 5,
      bookings: 20,
      featuredPlacementViews: 0,
      priorityJobAccess: 0,
      analyticsViews: 0
    };
  }

  private getProPlanLimits(): SubscriptionLimits {
    return {
      jobApplications: 50,
      services: 20,
      bookings: 100,
      featuredPlacementViews: -1, // unlimited
      priorityJobAccess: -1, // unlimited
      analyticsViews: -1 // unlimited
    };
  }
}

export const subscriptionService = SubscriptionService.getInstance();
