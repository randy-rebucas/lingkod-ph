import { Timestamp, FieldValue } from 'firebase/firestore';

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  isUnlimited: boolean;
  limit?: number;
}

export interface SubscriptionLimits {
  jobApplications: number;
  services: number;
  bookings: number;
  featuredPlacementViews: number;
  priorityJobAccess: number;
  analyticsViews: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'trial' | 'premium';
  price: number;
  currency: 'PHP';
  billingCycle: 'monthly' | 'annual';
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
  isActive: boolean;
  isTrial: boolean;
  trialDays?: number;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface ProviderSubscription {
  id: string;
  providerId: string;
  planId: string;
  tier: 'free' | 'pro' | 'trial' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'trial';
  startDate: Timestamp;
  endDate: Timestamp;
  nextBillingDate: Timestamp;
  trialEndDate?: Timestamp;
  autoRenew: boolean;
  paymentMethod: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
  paymentReference?: string;
  amount: number;
  currency: 'PHP';
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface SubscriptionUsage {
  id: string;
  providerId: string;
  subscriptionId: string;
  period: string; // YYYY-MM format
  usage: {
    jobApplications: number;
    services: number;
    bookings: number;
    featuredPlacementViews: number;
    priorityJobAccess: number;
    analyticsViews: number;
  };
  limits: SubscriptionLimits;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  providerId: string;
  amount: number;
  currency: 'PHP';
  paymentMethod: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
  paymentReference: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface SubscriptionAnalytics {
  id: string;
  providerId: string;
  period: string; // YYYY-MM format
  metrics: {
    totalRevenue: number;
    totalBookings: number;
    averageRating: number;
    completionRate: number;
    onTimeRate: number;
    customerSatisfaction: number;
    repeatClientRate: number;
  };
  trends: {
    revenueGrowth: number;
    bookingGrowth: number;
    ratingTrend: number;
  };
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// Feature access result
export interface FeatureAccessResult {
  hasAccess: boolean;
  remainingUsage: number;
  limit: number;
  isUnlimited: boolean;
  message?: string;
}

// Subscription creation input
export interface CreateSubscriptionInput {
  planId: string;
  paymentMethod: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
  paymentReference?: string;
  amount: number;
  startTrial?: boolean;
}

// Subscription update input
export interface UpdateSubscriptionInput {
  autoRenew?: boolean;
  paymentMethod?: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
  paymentReference?: string;
}

// Usage tracking input
export interface TrackUsageInput {
  feature: string;
  amount?: number;
  metadata?: Record<string, any>;
}

// Subscription statistics
export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  proSubscriptions: number;
  freeSubscriptions: number;
  monthlyRevenue: number;
  conversionRate: number;
  churnRate: number;
}
