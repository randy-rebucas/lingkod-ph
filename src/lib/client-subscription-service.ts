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
  ClientSubscriptionPlan,
  ClientSubscription,
  ClientSubscriptionUsage,
  ClientSubscriptionPayment,
  ClientSubscriptionAnalytics,
  ClientFeatureAccessResult,
  CreateClientSubscriptionInput,
  UpdateClientSubscriptionInput,
  TrackClientUsageInput,
  ClientSubscriptionStats,
  ClientSubscriptionFeature,
  ClientSubscriptionLimits
} from './client-subscription-types';

export class ClientSubscriptionService {
  private static instance: ClientSubscriptionService;
  private static readonly COLLECTIONS = {
    PLANS: 'clientSubscriptionPlans',
    SUBSCRIPTIONS: 'clientSubscriptions',
    USAGE: 'clientSubscriptionUsage',
    PAYMENTS: 'clientSubscriptionPayments',
    ANALYTICS: 'clientAnalytics'
  };

  public static getInstance(): ClientSubscriptionService {
    if (!ClientSubscriptionService.instance) {
      ClientSubscriptionService.instance = new ClientSubscriptionService();
    }
    return ClientSubscriptionService.instance;
  }

  /**
   * Initialize default client subscription plans
   */
  async initializeDefaultPlans(): Promise<void> {
    try {
      const plansRef = collection(db, ClientSubscriptionService.COLLECTIONS.PLANS);
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

        // Premium Plan
        const premiumPlanRef = doc(plansRef);
        batch.set(premiumPlanRef, {
          name: 'Premium Plan',
          tier: 'premium',
          price: 199,
          currency: 'PHP',
          billingCycle: 'monthly',
          features: this.getPremiumPlanFeatures(),
          limits: this.getPremiumPlanLimits(),
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
          features: this.getPremiumPlanFeatures(),
          limits: this.getPremiumPlanLimits(),
          isActive: true,
          isTrial: true,
          trialDays: 7,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

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
  async getPlans(): Promise<ClientSubscriptionPlan[]> {
    try {
      const plansRef = collection(db, ClientSubscriptionService.COLLECTIONS.PLANS);
      const q = query(plansRef, where('isActive', '==', true), orderBy('price', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClientSubscriptionPlan));
    } catch (error) {
      console.error('Error getting client plans:', error);
      throw error;
    }
  }

  /**
   * Get current subscription for a client
   */
  async getCurrentSubscription(clientId: string): Promise<ClientSubscription | null> {
    try {
      const subscriptionsRef = collection(db, ClientSubscriptionService.COLLECTIONS.SUBSCRIPTIONS);
      const q = query(
        subscriptionsRef,
        where('clientId', '==', clientId),
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
      } as ClientSubscription;
    } catch (error) {
      console.error('Error getting current client subscription:', error);
      throw error;
    }
  }

  /**
   * Create a new client subscription
   */
  async createSubscription(clientId: string, input: CreateClientSubscriptionInput): Promise<ClientSubscription> {
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

      const subscriptionData: Omit<ClientSubscription, 'id'> = {
        clientId,
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

      const subscriptionRef = await addDoc(collection(db, ClientSubscriptionService.COLLECTIONS.SUBSCRIPTIONS), subscriptionData);
      
      // Record payment if provided
      if (input.paymentReference) {
        await this.recordPayment(subscriptionRef.id, clientId, {
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          paymentReference: input.paymentReference,
          status: 'completed'
        });
      }

      return {
        id: subscriptionRef.id,
        ...subscriptionData
      } as ClientSubscription;
    } catch (error) {
      console.error('Error creating client subscription:', error);
      throw error;
    }
  }

  /**
   * Check feature access for a client
   */
  async checkFeatureAccess(clientId: string, feature: string): Promise<ClientFeatureAccessResult> {
    try {
      const subscription = await this.getCurrentSubscription(clientId);
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
      const usage = await this.getUsageForPeriod(clientId, currentPeriod);
      
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
      console.error('Error checking client feature access:', error);
      throw error;
    }
  }

  /**
   * Track feature usage for a client
   */
  async trackUsage(clientId: string, input: TrackClientUsageInput): Promise<void> {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const usageRef = collection(db, ClientSubscriptionService.COLLECTIONS.USAGE);
      const q = query(
        usageRef,
        where('clientId', '==', clientId),
        where('period', '==', currentPeriod)
      );

      const snapshot = await getDocs(q);
      const subscription = await this.getCurrentSubscription(clientId);
      
      if (!subscription) throw new Error('No active subscription');

      if (snapshot.empty) {
        // Create new usage record
        const usageData: Omit<ClientSubscriptionUsage, 'id'> = {
          clientId,
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
      console.error('Error tracking client usage:', error);
      throw error;
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToPaid(clientId: string, paymentMethod: string, paymentReference: string): Promise<ClientSubscription> {
    try {
      const subscription = await this.getCurrentSubscription(clientId);
      if (!subscription || subscription.status !== 'trial') {
        throw new Error('No active trial subscription found');
      }

      const premiumPlan = await this.getPlanByTier('premium');
      if (!premiumPlan) throw new Error('Premium plan not found');

      await runTransaction(db, async (transaction) => {
        const subscriptionRef = doc(db, ClientSubscriptionService.COLLECTIONS.SUBSCRIPTIONS, subscription.id);
        
        // Update subscription to Premium
        transaction.update(subscriptionRef, {
          tier: 'premium',
          status: 'active',
          planId: premiumPlan.id,
          features: premiumPlan.features,
          limits: premiumPlan.limits,
          paymentMethod,
          paymentReference,
          amount: premiumPlan.price,
          autoRenew: true,
          updatedAt: serverTimestamp()
        });

        // Record payment
        const paymentRef = doc(collection(db, ClientSubscriptionService.COLLECTIONS.PAYMENTS));
        transaction.set(paymentRef, {
          subscriptionId: subscription.id,
          clientId,
          amount: premiumPlan.price,
          currency: 'PHP',
          paymentMethod,
          paymentReference,
          status: 'completed',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      return await this.getCurrentSubscription(clientId) as ClientSubscription;
    } catch (error) {
      console.error('Error converting client trial:', error);
      throw error;
    }
  }

  /**
   * Update client subscription
   */
  async updateSubscription(clientId: string, input: UpdateClientSubscriptionInput): Promise<void> {
    try {
      const subscription = await this.getCurrentSubscription(clientId);
      if (!subscription) throw new Error('No active subscription found');

      const subscriptionRef = doc(db, ClientSubscriptionService.COLLECTIONS.SUBSCRIPTIONS, subscription.id);
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
      console.error('Error updating client subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel client subscription
   */
  async cancelSubscription(clientId: string): Promise<void> {
    try {
      const subscription = await this.getCurrentSubscription(clientId);
      if (!subscription) throw new Error('No active subscription found');

      const subscriptionRef = doc(db, ClientSubscriptionService.COLLECTIONS.SUBSCRIPTIONS, subscription.id);
      await updateDoc(subscriptionRef, {
        status: 'cancelled',
        autoRenew: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error cancelling client subscription:', error);
      throw error;
    }
  }

  /**
   * Get client subscription statistics
   */
  async getSubscriptionStats(): Promise<ClientSubscriptionStats> {
    try {
      const subscriptionsRef = collection(db, ClientSubscriptionService.COLLECTIONS.SUBSCRIPTIONS);
      const snapshot = await getDocs(subscriptionsRef);
      
      const stats: ClientSubscriptionStats = {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        trialSubscriptions: 0,
        premiumSubscriptions: 0,
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
        } else if (data.tier === 'premium') {
          stats.premiumSubscriptions++;
        } else {
          stats.freeSubscriptions++;
        }
        
        if (data.tier === 'premium' && data.status === 'active') {
          stats.monthlyRevenue += data.amount || 0;
        }
      });

      // Calculate conversion rate (trials to paid)
      const totalTrials = stats.trialSubscriptions;
      const convertedTrials = stats.premiumSubscriptions;
      stats.conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Error getting client subscription stats:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getPlanById(planId: string): Promise<ClientSubscriptionPlan | null> {
    const planRef = doc(db, ClientSubscriptionService.COLLECTIONS.PLANS, planId);
    const planDoc = await getDoc(planRef);
    
    if (!planDoc.exists()) return null;
    
    return {
      id: planDoc.id,
      ...planDoc.data()
    } as ClientSubscriptionPlan;
  }

  private async getPlanByTier(tier: string): Promise<ClientSubscriptionPlan | null> {
    const plansRef = collection(db, ClientSubscriptionService.COLLECTIONS.PLANS);
    const q = query(plansRef, where('tier', '==', tier), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as ClientSubscriptionPlan;
  }

  private async getUsageForPeriod(clientId: string, period: string): Promise<ClientSubscriptionUsage | null> {
    const usageRef = collection(db, ClientSubscriptionService.COLLECTIONS.USAGE);
    const q = query(
      usageRef,
      where('clientId', '==', clientId),
      where('period', '==', period)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as ClientSubscriptionUsage;
  }

  private getFeatureUsage(usage: ClientSubscriptionUsage | null, feature: string): number {
    if (!usage) return 0;
    
    switch (feature) {
      case 'job_posts': return usage.usage.jobPosts;
      case 'bookings': return usage.usage.bookings;
      case 'favorites': return usage.usage.favorites;
      case 'advanced_search': return usage.usage.advancedSearch;
      case 'priority_booking': return usage.usage.priorityBooking;
      case 'analytics': return usage.usage.analyticsViews;
      case 'custom_requests': return usage.usage.customRequests;
      default: return 0;
    }
  }

  private updateFeatureUsage(currentUsage: any, feature: string, amount: number): any {
    const updated = { ...currentUsage };
    
    switch (feature) {
      case 'job_posts': updated.jobPosts += amount; break;
      case 'bookings': updated.bookings += amount; break;
      case 'favorites': updated.favorites += amount; break;
      case 'advanced_search': updated.advancedSearch += amount; break;
      case 'priority_booking': updated.priorityBooking += amount; break;
      case 'analytics': updated.analyticsViews += amount; break;
      case 'custom_requests': updated.customRequests += amount; break;
    }
    
    return updated;
  }

  private getInitialUsage() {
    return {
      jobPosts: 0,
      bookings: 0,
      favorites: 0,
      advancedSearch: 0,
      priorityBooking: 0,
      analyticsViews: 0,
      customRequests: 0
    };
  }

  private async recordPayment(subscriptionId: string, clientId: string, paymentData: any): Promise<void> {
    const paymentRef = collection(db, ClientSubscriptionService.COLLECTIONS.PAYMENTS);
    await addDoc(paymentRef, {
      subscriptionId,
      clientId,
      ...paymentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  private getFreePlanFeatures(): ClientSubscriptionFeature[] {
    return [
      {
        id: 'basic_search',
        name: 'Basic Search',
        description: 'Standard provider search and filtering',
        isUnlimited: true
      },
      {
        id: 'job_posts',
        name: 'Job Posts',
        description: 'Post job requests',
        isUnlimited: false,
        limit: 3
      },
      {
        id: 'bookings',
        name: 'Bookings',
        description: 'Book services',
        isUnlimited: false,
        limit: 10
      },
      {
        id: 'favorites',
        name: 'Favorites',
        description: 'Save favorite providers',
        isUnlimited: false,
        limit: 20
      }
    ];
  }

  private getPremiumPlanFeatures(): ClientSubscriptionFeature[] {
    return [
      ...this.getFreePlanFeatures(),
      {
        id: 'advanced_search',
        name: 'Advanced Search',
        description: 'Advanced filters and verified provider access',
        isUnlimited: true
      },
      {
        id: 'priority_booking',
        name: 'Priority Booking',
        description: 'Get priority access to top-rated providers',
        isUnlimited: true
      },
      {
        id: 'analytics',
        name: 'Booking Analytics',
        description: 'Track booking history and spending patterns',
        isUnlimited: true
      },
      {
        id: 'priority_support',
        name: 'Priority Support',
        description: '24/7 priority customer support',
        isUnlimited: true
      },
      {
        id: 'exclusive_deals',
        name: 'Exclusive Deals',
        description: 'Access to exclusive partner discounts',
        isUnlimited: true
      },
      {
        id: 'custom_requests',
        name: 'Custom Requests',
        description: 'Post custom requests for specialized needs',
        isUnlimited: true
      }
    ];
  }

  private getFreePlanLimits(): ClientSubscriptionLimits {
    return {
      jobPosts: 3,
      bookings: 10,
      favorites: 20,
      advancedSearch: 0,
      priorityBooking: 0,
      analyticsViews: 0,
      customRequests: 0
    };
  }

  private getPremiumPlanLimits(): ClientSubscriptionLimits {
    return {
      jobPosts: 10,
      bookings: 50,
      favorites: 100,
      advancedSearch: -1, // unlimited
      priorityBooking: -1, // unlimited
      analyticsViews: -1, // unlimited
      customRequests: -1 // unlimited
    };
  }
}

export const clientSubscriptionService = ClientSubscriptionService.getInstance();
