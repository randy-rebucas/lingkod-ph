'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  ClientSubscriptionPlan,
  ClientSubscription,
  ClientFeatureAccessResult,
  CreateClientSubscriptionInput,
  UpdateClientSubscriptionInput,
  TrackClientUsageInput,
  ClientSubscriptionStats
} from '@/lib/client-subscription-types';

interface UseClientSubscriptionReturn {
  // Data
  subscription: ClientSubscription | null;
  plans: ClientSubscriptionPlan[];
  stats: ClientSubscriptionStats | null;
  
  // Loading states
  loading: boolean;
  plansLoading: boolean;
  statsLoading: boolean;
  
  // Actions
  checkFeatureAccess: (feature: string) => Promise<ClientFeatureAccessResult>;
  createSubscription: (input: CreateClientSubscriptionInput) => Promise<ClientSubscription>;
  updateSubscription: (input: UpdateClientSubscriptionInput) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  convertTrialToPaid: (paymentMethod: string, paymentReference: string) => Promise<ClientSubscription>;
  trackUsage: (input: TrackClientUsageInput) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // Computed values
  isPremium: boolean;
  isTrial: boolean;
  isActive: boolean;
  hasFeature: (feature: string) => boolean;
  getRemainingUsage: (feature: string) => number;
  getFeatureLimit: (feature: string) => number;
  isTrialExpired: boolean;
  daysUntilTrialExpiry: number;
}

export function useClientSubscription(): UseClientSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<ClientSubscription | null>(null);
  const [plans, setPlans] = useState<ClientSubscriptionPlan[]>([]);
  const [stats, setStats] = useState<ClientSubscriptionStats | null>(null);
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
      const response = await fetch('/api/client-subscriptions/current', {
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
      console.error('Error fetching client subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch available plans
  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      const response = await fetch('/api/client-subscriptions/plans');
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching client plans:', error);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Fetch subscription stats
  const fetchStats = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setStatsLoading(true);
      const response = await fetch('/api/client-subscriptions/stats', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching client stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  // Check feature access
  const checkFeatureAccess = useCallback(async (feature: string): Promise<ClientFeatureAccessResult> => {
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
      const response = await fetch('/api/client-subscriptions/check-access', {
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
      console.error('Error checking client feature access:', error);
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
  const createSubscription = useCallback(async (input: CreateClientSubscriptionInput): Promise<ClientSubscription> => {
    if (!user?.uid) throw new Error('Not authenticated');

    try {
      const response = await fetch('/api/client-subscriptions/create', {
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
      console.error('Error creating client subscription:', error);
      throw error;
    }
  }, [user]);

  // Update subscription
  const updateSubscription = useCallback(async (input: UpdateClientSubscriptionInput): Promise<void> => {
    if (!user?.uid || !subscription) throw new Error('Not authenticated or no subscription');

    try {
      const response = await fetch('/api/client-subscriptions/update', {
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
      console.error('Error updating client subscription:', error);
      throw error;
    }
  }, [user, subscription, fetchSubscription]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (): Promise<void> => {
    if (!user?.uid) throw new Error('Not authenticated');

    try {
      const response = await fetch('/api/client-subscriptions/cancel', {
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
      console.error('Error cancelling client subscription:', error);
      throw error;
    }
  }, [user, fetchSubscription]);

  // Convert trial to paid
  const convertTrialToPaid = useCallback(async (paymentMethod: string, paymentReference: string): Promise<ClientSubscription> => {
    if (!user?.uid) throw new Error('Not authenticated');

    try {
      const response = await fetch('/api/client-subscriptions/convert-trial', {
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
      console.error('Error converting client trial:', error);
      throw error;
    }
  }, [user]);

  // Track usage
  const trackUsage = useCallback(async (input: TrackClientUsageInput): Promise<void> => {
    if (!user?.uid) throw new Error('Not authenticated');

    try {
      const response = await fetch('/api/client-subscriptions/track-usage', {
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
      console.error('Error tracking client usage:', error);
      throw error;
    }
  }, [user]);

  // Refresh functions
  const refreshSubscription = useCallback(() => fetchSubscription(), [fetchSubscription]);
  const refreshPlans = useCallback(() => fetchPlans(), [fetchPlans]);
  const refreshStats = useCallback(() => fetchStats(), [fetchStats]);

  // Computed values
  const isPremium = subscription?.tier === 'premium' && subscription?.status === 'active';
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
    isPremium,
    isTrial,
    isActive,
    hasFeature,
    getRemainingUsage,
    getFeatureLimit,
    isTrialExpired: isTrialExpired(),
    daysUntilTrialExpiry: daysUntilTrialExpiry()
  };
}

// Hook for checking specific client feature access
export function useClientFeatureAccess(feature: string) {
  const { checkFeatureAccess, loading } = useClientSubscription();
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

// Hook for Premium subscription status
export function usePremiumClientSubscription() {
  const { subscription, isPremium, isActive, loading } = useClientSubscription();
  
  return {
    isPremium,
    isActive,
    subscription,
    loading
  };
}
