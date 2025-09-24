'use server';

import { Timestamp } from 'firebase/firestore';

// Subscription Tier Definitions
export type SubscriptionTier = 'free' | 'pro';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number; // Monthly price in PHP
  currency: 'PHP';
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  category: 'visibility' | 'analytics' | 'priority' | 'discounts' | 'badges';
  isEnabled: boolean;
}

export interface SubscriptionLimits {
  maxJobApplications: number;
  maxServices: number;
  maxBookingsPerMonth: number;
  featuredPlacement: boolean;
  priorityJobAccess: boolean;
  analyticsAccess: boolean;
  proBadge: boolean;
  suppliesDiscount: boolean;
}

// Provider Subscription Data
export interface ProviderSubscription {
  id: string;
  providerId: string;
  planId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Timestamp;
  endDate: Timestamp;
  nextBillingDate: Timestamp;
  autoRenew: boolean;
  paymentMethod: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
  paymentReference?: string;
  amount: number;
  currency: 'PHP';
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subscription Usage Tracking
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subscription Payment History
export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  providerId: string;
  amount: number;
  currency: 'PHP';
  paymentMethod: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
  paymentReference: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate: Timestamp;
  dueDate: Timestamp;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Feature Access Control
export interface FeatureAccess {
  providerId: string;
  subscription: ProviderSubscription | null;
  canAccess: (feature: string) => boolean;
  getRemainingUsage: (feature: string) => number;
  isFeatureEnabled: (feature: string) => boolean;
}

// Subscription Analytics
export interface SubscriptionAnalytics {
  providerId: string;
  period: string;
  metrics: {
    totalRevenue: number;
    bookingsCompleted: number;
    averageRating: number;
    totalReviews: number;
    featuredPlacementViews: number;
    priorityJobApplications: number;
    suppliesDiscountsUsed: number;
    discountAmountSaved: number;
  };
  trends: {
    revenueGrowth: number;
    bookingGrowth: number;
    ratingTrend: number;
    reviewGrowth: number;
  };
  insights: string[];
  recommendations: string[];
  createdAt: Timestamp;
}

// Partner Supplies Discount
export interface SuppliesDiscount {
  id: string;
  partnerId: string;
  partnerName: string;
  category: string;
  discountPercentage: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  validFrom: Timestamp;
  validTo: Timestamp;
  isActive: boolean;
  description: string;
  terms: string[];
  createdAt: Timestamp;
}

export interface SuppliesDiscountUsage {
  id: string;
  providerId: string;
  discountId: string;
  orderAmount: number;
  discountAmount: number;
  usedAt: Timestamp;
  orderReference: string;
  status: 'used' | 'expired' | 'cancelled';
}

// Subscription Upgrade/Downgrade
export interface SubscriptionChange {
  id: string;
  providerId: string;
  fromTier: SubscriptionTier;
  toTier: SubscriptionTier;
  changeType: 'upgrade' | 'downgrade';
  effectiveDate: Timestamp;
  prorationAmount: number;
  reason?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}

// Default subscription plans
export const DEFAULT_SUBSCRIPTION_PLANS: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Free (Basic)',
    tier: 'free',
    price: 0,
    currency: 'PHP',
    features: [
      {
        id: 'basic_profile',
        name: 'Basic Profile',
        description: 'Standard profile visibility in general listings',
        category: 'visibility',
        isEnabled: true
      },
      {
        id: 'standard_jobs',
        name: 'Standard Job Access',
        description: 'Access to standard job postings',
        category: 'priority',
        isEnabled: true
      },
      {
        id: 'payment_processing',
        name: 'Payment Processing',
        description: 'Included payment processing for bookings',
        category: 'discounts',
        isEnabled: true
      }
    ],
    limits: {
      maxJobApplications: 10,
      maxServices: 5,
      maxBookingsPerMonth: 20,
      featuredPlacement: false,
      priorityJobAccess: false,
      analyticsAccess: false,
      proBadge: false,
      suppliesDiscount: false
    },
    isActive: true
  },
  {
    name: 'Pro Provider',
    tier: 'pro',
    price: 399, // ₱299-₱499 range, using ₱399 as middle
    currency: 'PHP',
    features: [
      {
        id: 'featured_placement',
        name: 'Featured Placement',
        description: 'Show up at the top of search results',
        category: 'visibility',
        isEnabled: true
      },
      {
        id: 'priority_job_access',
        name: 'Job Priority Access',
        description: 'Early access to high-value or urgent jobs',
        category: 'priority',
        isEnabled: true
      },
      {
        id: 'performance_analytics',
        name: 'Performance Analytics',
        description: 'Dashboard with jobs completed, ratings, and earnings',
        category: 'analytics',
        isEnabled: true
      },
      {
        id: 'pro_badge',
        name: 'Verified Pro Badge',
        description: 'Professional badge that builds trust with clients',
        category: 'badges',
        isEnabled: true
      },
      {
        id: 'supplies_discount',
        name: 'Discounted Supplies',
        description: 'Access to exclusive partner deals on cleaning kits and tools',
        category: 'discounts',
        isEnabled: true
      }
    ],
    limits: {
      maxJobApplications: 50,
      maxServices: 20,
      maxBookingsPerMonth: 100,
      featuredPlacement: true,
      priorityJobAccess: true,
      analyticsAccess: true,
      proBadge: true,
      suppliesDiscount: true
    },
    isActive: true
  }
];

// Feature access validation
export const SUBSCRIPTION_FEATURES = {
  FEATURED_PLACEMENT: 'featured_placement',
  PRIORITY_JOB_ACCESS: 'priority_job_access',
  PERFORMANCE_ANALYTICS: 'performance_analytics',
  PRO_BADGE: 'pro_badge',
  SUPPLIES_DISCOUNT: 'supplies_discount',
  EXTENDED_JOB_APPLICATIONS: 'extended_job_applications',
  EXTENDED_SERVICES: 'extended_services',
  EXTENDED_BOOKINGS: 'extended_bookings'
} as const;

export type SubscriptionFeatureKey = typeof SUBSCRIPTION_FEATURES[keyof typeof SUBSCRIPTION_FEATURES];
