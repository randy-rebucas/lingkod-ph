'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  ClientSubscriptionPlan, 
  ClientSubscription, 
  ClientSubscriptionFeatureKey,
  CLIENT_SUBSCRIPTION_FEATURES
} from '@/lib/client-subscription-types';

interface UseClientSubscriptionReturn {
  subscription: ClientSubscription | null;
  plans: ClientSubscriptionPlan[];
  loading: boolean;
  error: string | null;
  checkFeatureAccess: (feature: ClientSubscriptionFeatureKey) => Promise<{ hasAccess: boolean; remainingUsage?: number; limit?: number }>;
  refreshSubscription: () => Promise<void>;
  upgradeToPremium: (planId: string) => Promise<void>;
}

export function useClientSubscription(): UseClientSubscriptionReturn {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<ClientSubscription | null>(null);
  const [plans, setPlans] = useState<ClientSubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user || userRole !== 'client') {
      setLoading(false);
      return;
    }

    try {
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
      setError('Failed to fetch subscription');
    }
  }, [user, userRole]);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/client-subscriptions/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching client subscription plans:', error);
      setError('Failed to fetch subscription plans');
    }
  }, []);

  const checkFeatureAccess = useCallback(async (feature: ClientSubscriptionFeatureKey) => {
    if (!user || userRole !== 'client') {
      return { hasAccess: false };
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
        return data;
      } else {
        return { hasAccess: false };
      }
    } catch (error) {
      console.error('Error checking client feature access:', error);
      return { hasAccess: false };
    }
  }, [user, userRole]);

  const refreshSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchSubscription();
    setLoading(false);
  }, [fetchSubscription]);

  const upgradeToPremium = useCallback(async (planId: string) => {
    if (!user || userRole !== 'client') {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to upgrade your subscription.'
      });
      return;
    }

    try {
      // This will be handled by the payment component
      toast({
        title: 'Upgrade Initiated',
        description: 'Please complete the payment process to upgrade your subscription.'
      });
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        variant: 'destructive',
        title: 'Upgrade Failed',
        description: 'Failed to initiate subscription upgrade. Please try again.'
      });
    }
  }, [user, userRole, toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchSubscription(),
        fetchPlans()
      ]);
      
      setLoading(false);
    };

    loadData();
  }, [fetchSubscription, fetchPlans]);

  return {
    subscription,
    plans,
    loading,
    error,
    checkFeatureAccess,
    refreshSubscription,
    upgradeToPremium
  };
}

interface UseClientFeatureAccessReturn {
  hasAccess: boolean;
  loading: boolean;
  remainingUsage?: number;
  limit?: number;
  checkAccess: () => Promise<void>;
}

export function useClientFeatureAccess(feature: ClientSubscriptionFeatureKey): UseClientFeatureAccessReturn {
  const { user, userRole } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [remainingUsage, setRemainingUsage] = useState<number | undefined>();
  const [limit, setLimit] = useState<number | undefined>();

  const checkAccess = useCallback(async () => {
    if (!user || userRole !== 'client') {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    
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
        setHasAccess(data.hasAccess);
        setRemainingUsage(data.remainingUsage);
        setLimit(data.limit);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error checking client feature access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [user, userRole, feature]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    hasAccess,
    loading,
    remainingUsage,
    limit,
    checkAccess
  };
}

interface UsePremiumClientSubscriptionReturn {
  isPremium: boolean;
  isActive: boolean;
  subscription: ClientSubscription | null;
  loading: boolean;
}

export function usePremiumClientSubscription(): UsePremiumClientSubscriptionReturn {
  const { subscription, loading } = useClientSubscription();
  
  const isPremium = subscription?.tier === 'premium';
  const isActive = subscription?.status === 'active';

  return {
    isPremium,
    isActive,
    subscription,
    loading
  };
}

// Client subscription feature constants for easy access
export const CLIENT_FEATURES = CLIENT_SUBSCRIPTION_FEATURES;
