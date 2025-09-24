"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  ProviderSubscription, 
  SubscriptionPlan, 
  SubscriptionFeatureKey,
  SUBSCRIPTION_FEATURES 
} from '@/lib/subscription-types';

interface FeatureAccess {
  hasAccess: boolean;
  remainingUsage?: number;
  limit?: number;
}

interface UseSubscriptionReturn {
  subscription: ProviderSubscription | null;
  plans: SubscriptionPlan[];
  loading: boolean;
  checkFeatureAccess: (feature: SubscriptionFeatureKey) => Promise<FeatureAccess>;
  refreshSubscription: () => Promise<void>;
  upgradeToPro: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<ProviderSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/subscriptions/current', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }, [user]);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  }, []);

  const checkFeatureAccess = useCallback(async (feature: SubscriptionFeatureKey): Promise<FeatureAccess> => {
    if (!user) {
      return { hasAccess: false };
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/subscriptions/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ feature })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          hasAccess: data.hasAccess,
          remainingUsage: data.remainingUsage,
          limit: data.limit
        };
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
    }

    return { hasAccess: false };
  }, [user]);

  const refreshSubscription = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSubscription(), fetchPlans()]);
    setLoading(false);
  }, [fetchSubscription, fetchPlans]);

  const upgradeToPro = useCallback(() => {
    // This will be handled by the subscription UI component
    toast({
      title: 'Upgrade to Pro',
      description: 'Opening subscription upgrade options...'
    });
  }, [toast]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  return {
    subscription,
    plans,
    loading,
    checkFeatureAccess,
    refreshSubscription,
    upgradeToPro
  };
}

// Helper hook for specific feature access
export function useFeatureAccess(feature: SubscriptionFeatureKey) {
  const { checkFeatureAccess } = useSubscription();
  const [access, setAccess] = useState<FeatureAccess>({ hasAccess: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      const result = await checkFeatureAccess(feature);
      setAccess(result);
      setLoading(false);
    };

    checkAccess();
  }, [checkFeatureAccess, feature]);

  return { ...access, loading };
}

// Helper hook for Pro subscription status
export function useProSubscription() {
  const { subscription } = useSubscription();
  return {
    isPro: subscription?.tier === 'pro',
    isActive: subscription?.status === 'active',
    subscription
  };
}
