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
  ClientSubscriptionPlan,
  ClientSubscription,
  ClientSubscriptionUsage,
  ClientSubscriptionPayment,
  ClientAnalytics,
  ClientExclusiveDeal,
  CustomServiceRequest,
  PriorityBooking,
  ClientSubscriptionTier,
  ClientSubscriptionFeatureKey,
  DEFAULT_CLIENT_SUBSCRIPTION_PLANS,
  CLIENT_SUBSCRIPTION_FEATURES
} from './client-subscription-types';

export class ClientSubscriptionService {
  private static readonly PLANS_COLLECTION = 'clientSubscriptionPlans';
  private static readonly SUBSCRIPTIONS_COLLECTION = 'clientSubscriptions';
  private static readonly USAGE_COLLECTION = 'clientSubscriptionUsage';
  private static readonly PAYMENTS_COLLECTION = 'clientSubscriptionPayments';
  private static readonly ANALYTICS_COLLECTION = 'clientAnalytics';
  private static readonly DEALS_COLLECTION = 'clientExclusiveDeals';
  private static readonly CUSTOM_REQUESTS_COLLECTION = 'customServiceRequests';
  private static readonly PRIORITY_BOOKINGS_COLLECTION = 'priorityBookings';

  /**
   * Initialize default client subscription plans
   */
  static async initializeDefaultPlans(): Promise<void> {
    if (!db) {
      throw new Error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
    }
    
    try {
      const plansSnapshot = await getDocs(collection(db, this.PLANS_COLLECTION));
      
      if (plansSnapshot.empty) {
        const batch = writeBatch(db);
        
        for (const plan of DEFAULT_CLIENT_SUBSCRIPTION_PLANS) {
          const planRef = doc(collection(db, this.PLANS_COLLECTION));
          batch.set(planRef, {
            ...plan,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        await batch.commit();
        console.log('Default client subscription plans initialized');
      }
    } catch (error) {
      console.error('Error initializing default client plans:', error);
      throw error;
    }
  }

  /**
   * Get all available client subscription plans
   */
  static async getClientSubscriptionPlans(): Promise<ClientSubscriptionPlan[]> {
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
      })) as ClientSubscriptionPlan[];
    } catch (error) {
      console.error('Error getting client subscription plans:', error);
      return [];
    }
  }

  /**
   * Get client's current subscription
   */
  static async getClientSubscription(clientId: string): Promise<ClientSubscription | null> {
    if (!db) {
      console.error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
      return null;
    }
    
    try {
      const subscriptionQuery = query(
        collection(db, this.SUBSCRIPTIONS_COLLECTION),
        where('clientId', '==', clientId),
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
      } as ClientSubscription;
    } catch (error) {
      console.error('Error getting client subscription:', error);
      return null;
    }
  }

  /**
   * Create new client subscription
   */
  static async createClientSubscription(
    clientId: string,
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
        return { success: false, error: 'Client subscription plan not found' };
      }
      
      const plan = planDoc.data() as ClientSubscriptionPlan;
      
      // Calculate subscription dates
      const now = new Date();
      const startDate = new Date(now);
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
      
      const nextBillingDate = new Date(endDate);
      
      // Create subscription
      const subscriptionData: Omit<ClientSubscription, 'id'> = {
        clientId,
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
      await this.recordClientSubscriptionPayment({
        subscriptionId: subscriptionRef.id,
        clientId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        status: 'completed',
        description: `Client subscription payment for ${plan.name}`
      });
      
      // Initialize usage tracking
      await this.initializeClientUsageTracking(clientId, subscriptionRef.id);
      
      return { success: true, subscriptionId: subscriptionRef.id };
    } catch (error) {
      console.error('Error creating client subscription:', error);
      return { success: false, error: 'Failed to create client subscription' };
    }
  }

  /**
   * Check if client has access to a specific feature
   */
  static async checkClientFeatureAccess(
    clientId: string, 
    feature: ClientSubscriptionFeatureKey
  ): Promise<{ hasAccess: boolean; remainingUsage?: number; limit?: number }> {
    try {
      const subscription = await this.getClientSubscription(clientId);
      
      if (!subscription) {
        // Free tier access
        return this.checkClientFreeTierAccess(feature);
      }
      
      // Check if feature is enabled in subscription
      const featureEnabled = subscription.features.some(f => f.id === feature && f.isEnabled);
      
      if (!featureEnabled) {
        return { hasAccess: false };
      }
      
      // Check usage limits
      const usage = await this.getClientCurrentUsage(clientId);
      const limit = this.getClientFeatureLimit(subscription.limits, feature);
      
      if (limit === -1) { // Unlimited
        return { hasAccess: true, remainingUsage: -1, limit: -1 };
      }
      
      const currentUsage = this.getClientFeatureUsage(usage, feature);
      const remainingUsage = Math.max(0, limit - currentUsage);
      
      return {
        hasAccess: remainingUsage > 0,
        remainingUsage,
        limit
      };
    } catch (error) {
      console.error('Error checking client feature access:', error);
      return { hasAccess: false };
    }
  }

  /**
   * Get current usage for client
   */
  static async getClientCurrentUsage(clientId: string): Promise<ClientSubscriptionUsage | null> {
    if (!db) {
      console.error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
      return null;
    }
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const usageQuery = query(
        collection(db, this.USAGE_COLLECTION),
        where('clientId', '==', clientId),
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
      } as ClientSubscriptionUsage;
    } catch (error) {
      console.error('Error getting client current usage:', error);
      return null;
    }
  }

  /**
   * Record client feature usage
   */
  static async recordClientFeatureUsage(
    clientId: string,
    feature: ClientSubscriptionFeatureKey,
    amount: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firebase Firestore is not initialized. Please check your Firebase configuration.' };
    }
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Get or create usage record
      let usage = await this.getClientCurrentUsage(clientId);
      
      if (!usage) {
        // Create new usage record
        const subscription = await this.getClientSubscription(clientId);
        const limits = subscription?.limits || this.getClientFreeTierLimits();
        
        const usageData: Omit<ClientSubscriptionUsage, 'id'> = {
          clientId,
          subscriptionId: subscription?.id || 'free',
          period: currentMonth,
          usage: {
            jobPosts: 0,
            bookings: 0,
            favorites: 0,
            advancedSearches: 0,
            priorityBookings: 0,
            customRequests: 0,
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
        case CLIENT_SUBSCRIPTION_FEATURES.EXTENDED_JOB_POSTS:
          updatedUsage.jobPosts += amount;
          break;
        case CLIENT_SUBSCRIPTION_FEATURES.EXTENDED_BOOKINGS:
          updatedUsage.bookings += amount;
          break;
        case CLIENT_SUBSCRIPTION_FEATURES.EXTENDED_FAVORITES:
          updatedUsage.favorites += amount;
          break;
        case CLIENT_SUBSCRIPTION_FEATURES.ADVANCED_SEARCH:
          updatedUsage.advancedSearches += amount;
          break;
        case CLIENT_SUBSCRIPTION_FEATURES.PRIORITY_BOOKING:
          updatedUsage.priorityBookings += amount;
          break;
        case CLIENT_SUBSCRIPTION_FEATURES.CUSTOM_REQUESTS:
          updatedUsage.customRequests += amount;
          break;
        case CLIENT_SUBSCRIPTION_FEATURES.BOOKING_ANALYTICS:
          updatedUsage.analyticsViews += amount;
          break;
      }
      
      await updateDoc(doc(db, this.USAGE_COLLECTION, usage.id), {
        usage: updatedUsage,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error recording client feature usage:', error);
      return { success: false, error: 'Failed to record client usage' };
    }
  }

  /**
   * Get client analytics
   */
  static async getClientAnalytics(clientId: string): Promise<ClientAnalytics | null> {
    if (!db) {
      console.error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
      return null;
    }
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const analyticsQuery = query(
        collection(db, this.ANALYTICS_COLLECTION),
        where('clientId', '==', clientId),
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
      } as ClientAnalytics;
    } catch (error) {
      console.error('Error getting client analytics:', error);
      return null;
    }
  }

  /**
   * Get available exclusive deals for premium clients
   */
  static async getAvailableExclusiveDeals(clientId: string): Promise<ClientExclusiveDeal[]> {
    if (!db) {
      console.error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
      return [];
    }
    
    try {
      const subscription = await this.getClientSubscription(clientId);
      
      if (!subscription || !subscription.limits.exclusiveDeals) {
        return [];
      }
      
      const now = new Date();
      const dealsQuery = query(
        collection(db, this.DEALS_COLLECTION),
        where('isActive', '==', true),
        where('validFrom', '<=', Timestamp.fromDate(now)),
        where('validTo', '>=', Timestamp.fromDate(now))
      );
      
      const snapshot = await getDocs(dealsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validFrom: doc.data().validFrom as Timestamp,
        validTo: doc.data().validTo as Timestamp,
        createdAt: doc.data().createdAt as Timestamp
      })) as ClientExclusiveDeal[];
    } catch (error) {
      console.error('Error getting available exclusive deals:', error);
      return [];
    }
  }

  /**
   * Create custom service request
   */
  static async createCustomServiceRequest(
    clientId: string,
    requestData: Omit<CustomServiceRequest, 'id' | 'clientId' | 'status' | 'matchedProviders' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firebase Firestore is not initialized. Please check your Firebase configuration.' };
    }
    
    try {
      // Check if client has access to custom requests
      const access = await this.checkClientFeatureAccess(clientId, CLIENT_SUBSCRIPTION_FEATURES.CUSTOM_REQUESTS);
      if (!access.hasAccess) {
        return { success: false, error: 'Custom service requests require Premium subscription' };
      }
      
      const request: Omit<CustomServiceRequest, 'id'> = {
        ...requestData,
        clientId,
        status: 'published',
        matchedProviders: [],
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      const requestRef = await addDoc(collection(db, this.CUSTOM_REQUESTS_COLLECTION), request);
      
      // Record usage
      await this.recordClientFeatureUsage(clientId, CLIENT_SUBSCRIPTION_FEATURES.CUSTOM_REQUESTS);
      
      return { success: true, requestId: requestRef.id };
    } catch (error) {
      console.error('Error creating custom service request:', error);
      return { success: false, error: 'Failed to create custom service request' };
    }
  }

  /**
   * Create priority booking request
   */
  static async createPriorityBooking(
    clientId: string,
    bookingData: Omit<PriorityBooking, 'id' | 'clientId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firebase Firestore is not initialized. Please check your Firebase configuration.' };
    }
    
    try {
      // Check if client has access to priority booking
      const access = await this.checkClientFeatureAccess(clientId, CLIENT_SUBSCRIPTION_FEATURES.PRIORITY_BOOKING);
      if (!access.hasAccess) {
        return { success: false, error: 'Priority booking requires Premium subscription' };
      }
      
      const booking: Omit<PriorityBooking, 'id'> = {
        ...bookingData,
        clientId,
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      const bookingRef = await addDoc(collection(db, this.PRIORITY_BOOKINGS_COLLECTION), booking);
      
      // Record usage
      await this.recordClientFeatureUsage(clientId, CLIENT_SUBSCRIPTION_FEATURES.PRIORITY_BOOKING);
      
      return { success: true, bookingId: bookingRef.id };
    } catch (error) {
      console.error('Error creating priority booking:', error);
      return { success: false, error: 'Failed to create priority booking' };
    }
  }

  // Helper methods
  private static checkClientFreeTierAccess(feature: ClientSubscriptionFeatureKey): { hasAccess: boolean; remainingUsage?: number; limit?: number } {
    const freeLimits = this.getClientFreeTierLimits();
    const limit = this.getClientFeatureLimit(freeLimits, feature);
    
    if (limit === -1) {
      return { hasAccess: true, remainingUsage: -1, limit: -1 };
    }
    
    return { hasAccess: true, remainingUsage: limit, limit };
  }

  private static getClientFreeTierLimits() {
    return DEFAULT_CLIENT_SUBSCRIPTION_PLANS[0].limits;
  }

  private static getClientFeatureLimit(limits: any, feature: ClientSubscriptionFeatureKey): number {
    switch (feature) {
      case CLIENT_SUBSCRIPTION_FEATURES.EXTENDED_JOB_POSTS:
        return limits.maxJobPosts;
      case CLIENT_SUBSCRIPTION_FEATURES.EXTENDED_BOOKINGS:
        return limits.maxBookingsPerMonth;
      case CLIENT_SUBSCRIPTION_FEATURES.EXTENDED_FAVORITES:
        return limits.maxFavorites;
      case CLIENT_SUBSCRIPTION_FEATURES.ADVANCED_SEARCH:
        return limits.advancedSearch ? -1 : 0;
      case CLIENT_SUBSCRIPTION_FEATURES.PRIORITY_BOOKING:
        return limits.priorityBooking ? -1 : 0;
      case CLIENT_SUBSCRIPTION_FEATURES.BOOKING_ANALYTICS:
        return limits.bookingAnalytics ? -1 : 0;
      case CLIENT_SUBSCRIPTION_FEATURES.PRIORITY_SUPPORT:
        return limits.prioritySupport ? -1 : 0;
      case CLIENT_SUBSCRIPTION_FEATURES.EXCLUSIVE_DEALS:
        return limits.exclusiveDeals ? -1 : 0;
      case CLIENT_SUBSCRIPTION_FEATURES.CUSTOM_REQUESTS:
        return limits.customRequests ? -1 : 0;
      case CLIENT_SUBSCRIPTION_FEATURES.VERIFIED_PROVIDER_ACCESS:
        return limits.verifiedProviderAccess ? -1 : 0;
      default:
        return 0;
    }
  }

  private static getClientFeatureUsage(usage: ClientSubscriptionUsage | null, feature: ClientSubscriptionFeatureKey): number {
    if (!usage) return 0;
    
    switch (feature) {
      case CLIENT_SUBSCRIPTION_FEATURES.EXTENDED_JOB_POSTS:
        return usage.usage.jobPosts;
      case CLIENT_SUBSCRIPTION_FEATURES.EXTENDED_BOOKINGS:
        return usage.usage.bookings;
      case CLIENT_SUBSCRIPTION_FEATURES.EXTENDED_FAVORITES:
        return usage.usage.favorites;
      case CLIENT_SUBSCRIPTION_FEATURES.ADVANCED_SEARCH:
        return usage.usage.advancedSearches;
      case CLIENT_SUBSCRIPTION_FEATURES.PRIORITY_BOOKING:
        return usage.usage.priorityBookings;
      case CLIENT_SUBSCRIPTION_FEATURES.CUSTOM_REQUESTS:
        return usage.usage.customRequests;
      case CLIENT_SUBSCRIPTION_FEATURES.BOOKING_ANALYTICS:
        return usage.usage.analyticsViews;
      default:
        return 0;
    }
  }

  private static async recordClientSubscriptionPayment(paymentData: {
    subscriptionId: string;
    clientId: string;
    amount: number;
    paymentMethod: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
    paymentReference: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    description: string;
  }): Promise<void> {
    if (!db) {
      throw new Error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
    }
    
    const paymentRecord: Omit<ClientSubscriptionPayment, 'id'> = {
      ...paymentData,
      currency: 'PHP',
      paymentDate: serverTimestamp() as Timestamp,
      dueDate: serverTimestamp() as Timestamp,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };
    
    await addDoc(collection(db, this.PAYMENTS_COLLECTION), paymentRecord);
  }

  private static async initializeClientUsageTracking(clientId: string, subscriptionId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase Firestore is not initialized. Please check your Firebase configuration.');
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const usageData: Omit<ClientSubscriptionUsage, 'id'> = {
      clientId,
      subscriptionId,
      period: currentMonth,
      usage: {
        jobPosts: 0,
        bookings: 0,
        favorites: 0,
        advancedSearches: 0,
        priorityBookings: 0,
        customRequests: 0,
        analyticsViews: 0
      },
      limits: DEFAULT_CLIENT_SUBSCRIPTION_PLANS[1].limits, // Premium limits
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };
    
    await addDoc(collection(db, this.USAGE_COLLECTION), usageData);
  }
}

// Export singleton instance
export const clientSubscriptionService = new ClientSubscriptionService();
