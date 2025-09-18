// Define UserSubscription interface to match auth context
export type UserSubscription = {
  planId: 'starter' | 'pro' | 'elite' | 'free' | 'lite' | 'custom';
  status: 'active' | 'cancelled' | 'none' | 'pending';
  renewsOn: any; // Timestamp from Firebase
} | null;

export function hasActiveSubscription(subscription: UserSubscription): boolean {
  return subscription?.status === 'active' && subscription.planId !== 'free';
}

export function hasPaidSubscription(subscription: UserSubscription): boolean {
  return hasActiveSubscription(subscription); // Same as hasActiveSubscription since it already excludes 'free'
}

export function hasProSubscription(subscription: UserSubscription): boolean {
  return hasActiveSubscription(subscription) && subscription!.planId === 'pro';
}

export function hasEliteSubscription(subscription: UserSubscription): boolean {
  return hasActiveSubscription(subscription) && subscription!.planId === 'elite';
}

export function canAccessFeature(
  subscription: UserSubscription, 
  feature: 'smart-rate' | 'invoices' | 'analytics' | 'quote-builder' | 'enhanced-profile' | 'top-placement'
): boolean {
  if (!hasActiveSubscription(subscription)) return false;

  const plan = subscription!.planId;
  
  switch (feature) {
    case 'smart-rate':
      return plan !== 'free';
    case 'invoices':
      return plan === 'pro' || plan === 'elite';
    case 'analytics':
      return plan === 'elite';
    case 'quote-builder':
      return plan === 'pro' || plan === 'elite'; // Fixed: Pro plan should have access to quote builder
    case 'enhanced-profile':
      return plan === 'pro' || plan === 'elite';
    case 'top-placement':
      return plan === 'elite';
    default:
      return false;
  }
}

export function getSubscriptionTier(subscription: UserSubscription): string {
  if (!subscription || subscription.status !== 'active') return 'free';
  return subscription.planId;
}

export function getUpgradeMessage(currentPlan: string, requiredPlan: string): string {
  const planNames = {
    'free': 'Free',
    'starter': 'Starter',
    'pro': 'Pro',
    'elite': 'Elite',
    'lite': 'Lite',
    'custom': 'Custom'
  };

  return `This feature requires a ${planNames[requiredPlan as keyof typeof planNames]} subscription. Upgrade from ${planNames[currentPlan as keyof typeof planNames]} to access this feature.`;
}

// Agency-specific utility functions
export function canManageProviders(subscription: UserSubscription, currentProviderCount: number): boolean {
  if (!hasActiveSubscription(subscription)) return false;
  
  const plan = subscription!.planId;
  
  switch (plan) {
    case 'lite':
      return currentProviderCount < 3;
    case 'pro':
      return currentProviderCount < 10;
    case 'custom':
      return true; // Unlimited
    default:
      return false;
  }
}

export function getMaxProviders(subscription: UserSubscription): number {
  if (!hasActiveSubscription(subscription)) return 0;
  
  const plan = subscription!.planId;
  
  switch (plan) {
    case 'lite':
      return 3;
    case 'pro':
      return 10;
    case 'custom':
      return Infinity;
    default:
      return 0;
  }
}

export function canAccessAgencyFeature(
  subscription: UserSubscription,
  feature: 'basic-reports' | 'enhanced-reports' | 'branded-communications' | 'api-access'
): boolean {
  if (!hasActiveSubscription(subscription)) return false;
  
  const plan = subscription!.planId;
  
  switch (feature) {
    case 'basic-reports':
      return plan === 'lite' || plan === 'pro' || plan === 'custom';
    case 'enhanced-reports':
      return plan === 'pro' || plan === 'custom';
    case 'branded-communications':
      return plan === 'pro' || plan === 'custom';
    case 'api-access':
      return plan === 'custom';
    default:
      return false;
  }
}
