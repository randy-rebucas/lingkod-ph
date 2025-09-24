'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  SubscriptionPlan,
  ProviderSubscription,
  FeatureAccessResult,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  TrackUsageInput,
  SubscriptionStats
} from '@/lib/subscription-types';

interface UseSubscriptionReturn {
  // Data
  subscription: ProviderSubscription | null;
  plans: SubscriptionPlan[];
  stats: SubscriptionStats | null;
  
  // Loading states
  loading: boolean;
  plansLoading: boolean;
  statsLoading: boolean;
  
  // Actions
  checkFeatureAccess: (feature: string) => Promise<FeatureAccessResult>;
  createSubscription: (input: CreateSubscriptionInput) => Promise<ProviderSubscription>;
  updateSubscription: (input: UpdateSubscriptionInput) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  convertTrialToPaid: (paymentMethod: string, paymentReference: string) => Promise<ProviderSubscription>;
  trackUsage: (input: TrackUsageInput) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // Computed values
  isPro: boolean;
  isTrial: boolean;
  isActive: boolean;
  hasFeature: (feature: string) => boolean;
  getRemainingUsage: (feature: string) => number;
  getFeatureLimit: (feature: string) => number;
  isTrialExpired: boolean;
  daysUntilTrialExpiry: number;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<ProviderSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch current subscription
  const fetchSubscription = useCallback(async () => {
    if (!user?.uid) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions/current', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch available plans
  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      const response = await fetch('/api/subscriptions/plans');
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Fetch subscription stats
  const fetchStats = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setStatsLoading(true);
      const response = await fetch('/api/subscriptions/stats', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  // Check feature access
  const checkFeatureAccess = useCallback(async (feature: string): Promise<FeatureAccessResult> => {
    if (!user?.uid) {
      return {
        hasAccess: false,
        remainingUsage: 0,
        limit: 0,
        isUnlimited: false,
        message: 'Not authenticated'
      };
    }

    try {
      const response = await fetch('/api/subscriptions/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ feature })
      });

      if (response.ok) {
        const data = await response.json();
        return data.result;
      } else {
        throw new Error('Failed to check feature access');
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      return {
        hasAccess: false,
        remainingUsage: 0,
        limit: 0,
        isUnlimited: false,
        message: 'Error checking access'
      };
    }
  }, [user]);

  // Create subscription
  const createSubscription = useCallback(async (input: CreateSubscriptionInput): Promise<ProviderSubscription> => {
    if (!user?.uid) throw new Error('Not authenticated');

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(input)
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        return data.subscription;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }, [user]);

  // Update subscription
  const updateSubscription = useCallback(async (input: UpdateSubscriptionInput): Promise<void> => {
    if (!user?.uid || !subscription) throw new Error('Not authenticated or no subscription');

    try {
      const response = await fetch('/api/subscriptions/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(input)
      });

      if (response.ok) {
        await fetchSubscription();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }, [user, subscription, fetchSubscription]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (): Promise<void> => {
    if (!user?.uid) throw new Error('Not authenticated');

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        await fetchSubscription();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }, [user, fetchSubscription]);

  // Convert trial to paid
  const convertTrialToPaid = useCallback(async (paymentMethod: string, paymentReference: string): Promise<ProviderSubscription> => {
    if (!user?.uid) throw new Error('Not authenticated');

    try {
      const response = await fetch('/api/subscriptions/convert-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ paymentMethod, paymentReference })
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        return data.subscription;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to convert trial');
      }
    } catch (error) {
      console.error('Error converting trial:', error);
      throw error;
    }
  }, [user]);

  // Track usage
  const trackUsage = useCallback(async (input: TrackUsageInput): Promise<void> => {
    if (!user?.uid) throw new Error('Not authenticated');

    try {
      const response = await fetch('/api/subscriptions/track-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to track usage');
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
      throw error;
    }
  }, [user]);

  // Refresh functions
  const refreshSubscription = useCallback(() => fetchSubscription(), [fetchSubscription]);
  const refreshPlans = useCallback(() => fetchPlans(), [fetchPlans]);
  const refreshStats = useCallback(() => fetchStats(), [fetchStats]);

  // Computed values
  const isPro = subscription?.tier === 'pro' && subscription?.status === 'active';
  const isTrial = subscription?.tier === 'trial' && subscription?.status === 'trial';
  const isActive = subscription?.status === 'active' || subscription?.status === 'trial';

  const hasFeature = useCallback((feature: string): boolean => {
    if (!subscription) return false;
    return subscription.features.some(f => f.id === feature);
  }, [subscription]);

  const getRemainingUsage = useCallback((feature: string): number => {
    if (!subscription) return 0;
    const featureData = subscription.features.find(f => f.id === feature);
    if (!featureData || featureData.isUnlimited) return -1;
    return featureData.limit || 0;
  }, [subscription]);

  const getFeatureLimit = useCallback((feature: string): number => {
    if (!subscription) return 0;
    const featureData = subscription.features.find(f => f.id === feature);
    if (!featureData) return 0;
    return featureData.isUnlimited ? -1 : (featureData.limit || 0);
  }, [subscription]);

  const isTrialExpired = useCallback((): boolean => {
    if (!subscription || !subscription.trialEndDate) return false;
    return new Date() > subscription.trialEndDate.toDate();
  }, [subscription]);

  const daysUntilTrialExpiry = useCallback((): number => {
    if (!subscription || !subscription.trialEndDate) return 0;
    const now = new Date();
    const expiry = subscription.trialEndDate.toDate();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [subscription]);

  // Load data on mount
  useEffect(() => {
    fetchSubscription();
    fetchPlans();
  }, [fetchSubscription, fetchPlans]);

  return {
    // Data
    subscription,
    plans,
    stats,
    
    // Loading states
    loading,
    plansLoading,
    statsLoading,
    
    // Actions
    checkFeatureAccess,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    convertTrialToPaid,
    trackUsage,
    refreshSubscription,
    refreshPlans,
    refreshStats,
    
    // Computed values
    isPro,
    isTrial,
    isActive,
    hasFeature,
    getRemainingUsage,
    getFeatureLimit,
    isTrialExpired: isTrialExpired(),
    daysUntilTrialExpiry: daysUntilTrialExpiry()
  };
}

// Hook for checking specific feature access
export function useFeatureAccess(feature: string) {
  const { checkFeatureAccess, loading } = useSubscription();
  const [hasAccess, setHasAccess] = useState(false);
  const [remainingUsage, setRemainingUsage] = useState(0);
  const [limit, setLimit] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    const checkAccess = async () => {
      const result = await checkFeatureAccess(feature);
      setHasAccess(result.hasAccess);
      setRemainingUsage(result.remainingUsage);
      setLimit(result.limit);
      setIsUnlimited(result.isUnlimited);
      setMessage(result.message);
    };

    checkAccess();
  }, [checkFeatureAccess, feature]);

  return {
    hasAccess,
    remainingUsage,
    limit,
    isUnlimited,
    message,
    loading
  };
}

// Hook for Pro subscription status
export function useProSubscription() {
  const { subscription, isPro, isActive, loading } = useSubscription();
  
  return {
    isPro,
    isActive,
    subscription,
    loading
  };
}
