import { Timestamp, FieldValue } from 'firebase/firestore';

export interface ClientSubscriptionFeature {
  id: string;
  name: string;
  description: string;
  isUnlimited: boolean;
  limit?: number;
}

export interface ClientSubscriptionLimits {
  jobPosts: number;
  bookings: number;
  favorites: number;
  advancedSearch: number;
  priorityBooking: number;
  analyticsViews: number;
  customRequests: number;
}

export interface ClientSubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'premium' | 'trial';
  price: number;
  currency: 'PHP';
  billingCycle: 'monthly' | 'annual';
  features: ClientSubscriptionFeature[];
  limits: ClientSubscriptionLimits;
  isActive: boolean;
  isTrial: boolean;
  trialDays?: number;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface ClientSubscription {
  id: string;
  clientId: string;
  planId: string;
  tier: 'free' | 'premium' | 'trial';
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
  features: ClientSubscriptionFeature[];
  limits: ClientSubscriptionLimits;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface ClientSubscriptionUsage {
  id: string;
  clientId: string;
  subscriptionId: string;
  period: string; // YYYY-MM format
  usage: {
    jobPosts: number;
    bookings: number;
    favorites: number;
    advancedSearch: number;
    priorityBooking: number;
    analyticsViews: number;
    customRequests: number;
  };
  limits: ClientSubscriptionLimits;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface ClientSubscriptionPayment {
  id: string;
  subscriptionId: string;
  clientId: string;
  amount: number;
  currency: 'PHP';
  paymentMethod: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
  paymentReference: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface ClientSubscriptionAnalytics {
  id: string;
  clientId: string;
  period: string; // YYYY-MM format
  metrics: {
    totalBookings: number;
    totalSpent: number;
    averageBookingValue: number;
    favoriteProviders: number;
    completedJobs: number;
    cancelledJobs: number;
  };
  trends: {
    bookingGrowth: number;
    spendingGrowth: number;
    satisfactionTrend: number;
  };
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// Feature access result
export interface ClientFeatureAccessResult {
  hasAccess: boolean;
  remainingUsage: number;
  limit: number;
  isUnlimited: boolean;
  message?: string;
}

// Subscription creation input
export interface CreateClientSubscriptionInput {
  planId: string;
  paymentMethod: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
  paymentReference?: string;
  amount: number;
  startTrial?: boolean;
}

// Subscription update input
export interface UpdateClientSubscriptionInput {
  autoRenew?: boolean;
  paymentMethod?: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
  paymentReference?: string;
}

// Usage tracking input
export interface TrackClientUsageInput {
  feature: string;
  amount?: number;
  metadata?: Record<string, any>;
}

// Subscription statistics
export interface ClientSubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  premiumSubscriptions: number;
  freeSubscriptions: number;
  monthlyRevenue: number;
  conversionRate: number;
  churnRate: number;
}
