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
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import {
  SubscriptionPlan,
  ProviderSubscription,
  SubscriptionUsage,
  SubscriptionPayment,
  FeatureAccess,
  SubscriptionAnalytics,
  SuppliesDiscount,
  SuppliesDiscountUsage,
  SubscriptionChange,
  SubscriptionTier,
  SubscriptionFeatureKey,
  DEFAULT_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_FEATURES
} from './subscription-types';

export class SubscriptionService {
  private static readonly PLANS_COLLECTION = 'subscriptionPlans';
  private static readonly SUBSCRIPTIONS_COLLECTION = 'providerSubscriptions';
  private static readonly USAGE_COLLECTION = 'subscriptionUsage';
  private static readonly PAYMENTS_COLLECTION = 'subscriptionPayments';
  private static readonly ANALYTICS_COLLECTION = 'subscriptionAnalytics';
  private static readonly DISCOUNTS_COLLECTION = 'suppliesDiscounts';
  private static readonly DISCOUNT_USAGE_COLLECTION = 'suppliesDiscountUsage';
  private static readonly CHANGES_COLLECTION = 'subscriptionChanges';

  /**
   * Initialize default subscription plans
   */
  static async initializeDefaultPlans(): Promise<void> {
    if (!db) {
      throw new Error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
    }
    
    try {
      const plansSnapshot = await getDocs(collection(db, this.PLANS_COLLECTION));
      
      if (plansSnapshot.empty) {
        const batch = writeBatch(db);
        
        for (const plan of DEFAULT_SUBSCRIPTION_PLANS) {
          const planRef = doc(collection(db, this.PLANS_COLLECTION));
          batch.set(planRef, {
            ...plan,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
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
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    if (!db) {
      console.error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
      return [];
    }
    
    try {
      const plansQuery = query(
        collection(db, this.PLANS_COLLECTION),
        where('isActive', '==', true),
        orderBy('price', 'asc')
      );
      
      const snapshot = await getDocs(plansQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
        updatedAt: doc.data().updatedAt as Timestamp
      })) as SubscriptionPlan[];
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      return [];
    }
  }

  /**
   * Get provider's current subscription
   */
  static async getProviderSubscription(providerId: string): Promise<ProviderSubscription | null> {
    if (!db) {
      console.error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
      return null;
    }
    
    try {
      const subscriptionQuery = query(
        collection(db, this.SUBSCRIPTIONS_COLLECTION),
        where('providerId', '==', providerId),
        where('status', '==', 'active'),
        orderBy('startDate', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(subscriptionQuery);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate as Timestamp,
        endDate: doc.data().endDate as Timestamp,
        nextBillingDate: doc.data().nextBillingDate as Timestamp,
        createdAt: doc.data().createdAt as Timestamp,
        updatedAt: doc.data().updatedAt as Timestamp
      } as ProviderSubscription;
    } catch (error) {
      console.error('Error getting provider subscription:', error);
      return null;
    }
  }

  /**
   * Create new subscription for provider
   */
  static async createSubscription(
    providerId: string,
    planId: string,
    paymentData: {
      paymentMethod: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
      paymentReference: string;
      amount: number;
    }
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firebase Firestore is not initialized. Please check your Firebase configuration.' };
    }
    
    try {
      // Get plan details
      const planDoc = await getDoc(doc(db, this.PLANS_COLLECTION, planId));
      if (!planDoc.exists()) {
        return { success: false, error: 'Subscription plan not found' };
      }
      
      const plan = planDoc.data() as SubscriptionPlan;
      
      // Calculate subscription dates
      const now = new Date();
      const startDate = new Date(now);
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
      
      const nextBillingDate = new Date(endDate);
      
      // Create subscription
      const subscriptionData: Omit<ProviderSubscription, 'id'> = {
        providerId,
        planId,
        tier: plan.tier,
        status: 'active',
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        nextBillingDate: Timestamp.fromDate(nextBillingDate),
        autoRenew: true,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        amount: paymentData.amount,
        currency: 'PHP',
        features: plan.features,
        limits: plan.limits,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      const subscriptionRef = await addDoc(collection(db, this.SUBSCRIPTIONS_COLLECTION), subscriptionData);
      
      // Create payment record
      await this.recordSubscriptionPayment({
        subscriptionId: subscriptionRef.id,
        providerId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        status: 'completed',
        description: `Subscription payment for ${plan.name}`
      });
      
      // Initialize usage tracking
      await this.initializeUsageTracking(providerId, subscriptionRef.id);
      
      return { success: true, subscriptionId: subscriptionRef.id };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: 'Failed to create subscription' };
    }
  }

  /**
   * Check if provider has access to a specific feature
   */
  static async checkFeatureAccess(
    providerId: string, 
    feature: SubscriptionFeatureKey
  ): Promise<{ hasAccess: boolean; remainingUsage?: number; limit?: number }> {
    try {
      const subscription = await this.getProviderSubscription(providerId);
      
      if (!subscription) {
        // Free tier access
        return this.checkFreeTierAccess(feature);
      }
      
      // Check if feature is enabled in subscription
      const featureEnabled = subscription.features.some(f => f.id === feature && f.isEnabled);
      
      if (!featureEnabled) {
        return { hasAccess: false };
      }
      
      // Check usage limits
      const usage = await this.getCurrentUsage(providerId);
      const limit = this.getFeatureLimit(subscription.limits, feature);
      
      if (limit === -1) { // Unlimited
        return { hasAccess: true, remainingUsage: -1, limit: -1 };
      }
      
      const currentUsage = this.getFeatureUsage(usage, feature);
      const remainingUsage = Math.max(0, limit - currentUsage);
      
      return {
        hasAccess: remainingUsage > 0,
        remainingUsage,
        limit
      };
    } catch (error) {
      console.error('Error checking feature access:', error);
      return { hasAccess: false };
    }
  }

  /**
   * Get current usage for provider
   */
  static async getCurrentUsage(providerId: string): Promise<SubscriptionUsage | null> {
    if (!db) {
      console.error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
      return null;
    }
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const usageQuery = query(
        collection(db, this.USAGE_COLLECTION),
        where('providerId', '==', providerId),
        where('period', '==', currentMonth),
        limit(1)
      );
      
      const snapshot = await getDocs(usageQuery);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
        updatedAt: doc.data().updatedAt as Timestamp
      } as SubscriptionUsage;
    } catch (error) {
      console.error('Error getting current usage:', error);
      return null;
    }
  }

  /**
   * Record feature usage
   */
  static async recordFeatureUsage(
    providerId: string,
    feature: SubscriptionFeatureKey,
    amount: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firebase Firestore is not initialized. Please check your Firebase configuration.' };
    }
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Get or create usage record
      let usage = await this.getCurrentUsage(providerId);
      
      if (!usage) {
        // Create new usage record
        const subscription = await this.getProviderSubscription(providerId);
        const limits = subscription?.limits || this.getFreeTierLimits();
        
        const usageData: Omit<SubscriptionUsage, 'id'> = {
          providerId,
          subscriptionId: subscription?.id || 'free',
          period: currentMonth,
          usage: {
            jobApplications: 0,
            services: 0,
            bookings: 0,
            featuredPlacementViews: 0,
            priorityJobAccess: 0,
            analyticsViews: 0
          },
          limits,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp
        };
        
        const usageRef = await addDoc(collection(db, this.USAGE_COLLECTION), usageData);
        usage = { id: usageRef.id, ...usageData };
      }
      
      // Update usage
      const updatedUsage = { ...usage.usage };
      switch (feature) {
        case SUBSCRIPTION_FEATURES.EXTENDED_JOB_APPLICATIONS:
          updatedUsage.jobApplications += amount;
          break;
        case SUBSCRIPTION_FEATURES.EXTENDED_SERVICES:
          updatedUsage.services += amount;
          break;
        case SUBSCRIPTION_FEATURES.EXTENDED_BOOKINGS:
          updatedUsage.bookings += amount;
          break;
        case SUBSCRIPTION_FEATURES.FEATURED_PLACEMENT:
          updatedUsage.featuredPlacementViews += amount;
          break;
        case SUBSCRIPTION_FEATURES.PRIORITY_JOB_ACCESS:
          updatedUsage.priorityJobAccess += amount;
          break;
        case SUBSCRIPTION_FEATURES.PERFORMANCE_ANALYTICS:
          updatedUsage.analyticsViews += amount;
          break;
      }
      
      await updateDoc(doc(db, this.USAGE_COLLECTION, usage.id), {
        usage: updatedUsage,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error recording feature usage:', error);
      return { success: false, error: 'Failed to record usage' };
    }
  }

  /**
   * Get subscription analytics for provider
   */
  static async getSubscriptionAnalytics(providerId: string): Promise<SubscriptionAnalytics | null> {
    if (!db) {
      console.error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
      return null;
    }
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const analyticsQuery = query(
        collection(db, this.ANALYTICS_COLLECTION),
        where('providerId', '==', providerId),
        where('period', '==', currentMonth),
        limit(1)
      );
      
      const snapshot = await getDocs(analyticsQuery);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp
      } as SubscriptionAnalytics;
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      return null;
    }
  }

  /**
   * Get available supplies discounts for provider
   */
  static async getAvailableDiscounts(providerId: string): Promise<SuppliesDiscount[]> {
    if (!db) {
      console.error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
      return [];
    }
    
    try {
      const subscription = await this.getProviderSubscription(providerId);
      
      if (!subscription || !subscription.limits.suppliesDiscount) {
        return [];
      }
      
      const now = new Date();
      const discountsQuery = query(
        collection(db, this.DISCOUNTS_COLLECTION),
        where('isActive', '==', true),
        where('validFrom', '<=', Timestamp.fromDate(now)),
        where('validTo', '>=', Timestamp.fromDate(now))
      );
      
      const snapshot = await getDocs(discountsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validFrom: doc.data().validFrom as Timestamp,
        validTo: doc.data().validTo as Timestamp,
        createdAt: doc.data().createdAt as Timestamp
      })) as SuppliesDiscount[];
    } catch (error) {
      console.error('Error getting available discounts:', error);
      return [];
    }
  }

  // Helper methods
  private static checkFreeTierAccess(feature: SubscriptionFeatureKey): { hasAccess: boolean; remainingUsage?: number; limit?: number } {
    const freeLimits = this.getFreeTierLimits();
    const limit = this.getFeatureLimit(freeLimits, feature);
    
    if (limit === -1) {
      return { hasAccess: true, remainingUsage: -1, limit: -1 };
    }
    
    return { hasAccess: true, remainingUsage: limit, limit };
  }

  private static getFreeTierLimits() {
    return DEFAULT_SUBSCRIPTION_PLANS[0].limits;
  }

  private static getFeatureLimit(limits: any, feature: SubscriptionFeatureKey): number {
    switch (feature) {
      case SUBSCRIPTION_FEATURES.EXTENDED_JOB_APPLICATIONS:
        return limits.maxJobApplications;
      case SUBSCRIPTION_FEATURES.EXTENDED_SERVICES:
        return limits.maxServices;
      case SUBSCRIPTION_FEATURES.EXTENDED_BOOKINGS:
        return limits.maxBookingsPerMonth;
      case SUBSCRIPTION_FEATURES.FEATURED_PLACEMENT:
        return limits.featuredPlacement ? -1 : 0;
      case SUBSCRIPTION_FEATURES.PRIORITY_JOB_ACCESS:
        return limits.priorityJobAccess ? -1 : 0;
      case SUBSCRIPTION_FEATURES.PERFORMANCE_ANALYTICS:
        return limits.analyticsAccess ? -1 : 0;
      case SUBSCRIPTION_FEATURES.PRO_BADGE:
        return limits.proBadge ? -1 : 0;
      case SUBSCRIPTION_FEATURES.SUPPLIES_DISCOUNT:
        return limits.suppliesDiscount ? -1 : 0;
      default:
        return 0;
    }
  }

  private static getFeatureUsage(usage: SubscriptionUsage | null, feature: SubscriptionFeatureKey): number {
    if (!usage) return 0;
    
    switch (feature) {
      case SUBSCRIPTION_FEATURES.EXTENDED_JOB_APPLICATIONS:
        return usage.usage.jobApplications;
      case SUBSCRIPTION_FEATURES.EXTENDED_SERVICES:
        return usage.usage.services;
      case SUBSCRIPTION_FEATURES.EXTENDED_BOOKINGS:
        return usage.usage.bookings;
      case SUBSCRIPTION_FEATURES.FEATURED_PLACEMENT:
        return usage.usage.featuredPlacementViews;
      case SUBSCRIPTION_FEATURES.PRIORITY_JOB_ACCESS:
        return usage.usage.priorityJobAccess;
      case SUBSCRIPTION_FEATURES.PERFORMANCE_ANALYTICS:
        return usage.usage.analyticsViews;
      default:
        return 0;
    }
  }

  private static async recordSubscriptionPayment(paymentData: {
    subscriptionId: string;
    providerId: string;
    amount: number;
    paymentMethod: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
    paymentReference: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    description: string;
  }): Promise<void> {
    if (!db) {
      throw new Error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
    }
    
    const paymentRecord: Omit<SubscriptionPayment, 'id'> = {
      ...paymentData,
      currency: 'PHP',
      paymentDate: serverTimestamp() as Timestamp,
      dueDate: serverTimestamp() as Timestamp,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };
    
    await addDoc(collection(db, this.PAYMENTS_COLLECTION), paymentRecord);
  }

  private static async initializeUsageTracking(providerId: string, subscriptionId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const usageData: Omit<SubscriptionUsage, 'id'> = {
      providerId,
      subscriptionId,
      period: currentMonth,
      usage: {
        jobApplications: 0,
        services: 0,
        bookings: 0,
        featuredPlacementViews: 0,
        priorityJobAccess: 0,
        analyticsViews: 0
      },
      limits: DEFAULT_SUBSCRIPTION_PLANS[1].limits, // Pro limits
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };
    
    await addDoc(collection(db, this.USAGE_COLLECTION), usageData);
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
