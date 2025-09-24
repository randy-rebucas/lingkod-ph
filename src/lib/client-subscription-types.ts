'use server';

import { Timestamp } from 'firebase/firestore';

// Client Subscription Tier Definitions
export type ClientSubscriptionTier = 'free' | 'premium';

export interface ClientSubscriptionPlan {
  id: string;
  name: string;
  tier: ClientSubscriptionTier;
  price: number; // Monthly price in PHP
  currency: 'PHP';
  features: ClientSubscriptionFeature[];
  limits: ClientSubscriptionLimits;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ClientSubscriptionFeature {
  id: string;
  name: string;
  description: string;
  category: 'search' | 'booking' | 'support' | 'analytics' | 'priority';
  isEnabled: boolean;
}

export interface ClientSubscriptionLimits {
  maxJobPosts: number;
  maxBookingsPerMonth: number;
  maxFavorites: number;
  prioritySupport: boolean;
  advancedSearch: boolean;
  bookingAnalytics: boolean;
  priorityBooking: boolean;
  exclusiveDeals: boolean;
  customRequests: boolean;
  verifiedProviderAccess: boolean;
}

// Client Subscription Data
export interface ClientSubscription {
  id: string;
  clientId: string;
  planId: string;
  tier: ClientSubscriptionTier;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Timestamp;
  endDate: Timestamp;
  nextBillingDate: Timestamp;
  autoRenew: boolean;
  paymentMethod: 'paypal' | 'gcash' | 'maya' | 'bank_transfer';
  paymentReference?: string;
  amount: number;
  currency: 'PHP';
  features: ClientSubscriptionFeature[];
  limits: ClientSubscriptionLimits;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Client Subscription Usage Tracking
export interface ClientSubscriptionUsage {
  id: string;
  clientId: string;
  subscriptionId: string;
  period: string; // YYYY-MM format
  usage: {
    jobPosts: number;
    bookings: number;
    favorites: number;
    advancedSearches: number;
    priorityBookings: number;
    customRequests: number;
    analyticsViews: number;
  };
  limits: ClientSubscriptionLimits;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Client Subscription Payment History
export interface ClientSubscriptionPayment {
  id: string;
  subscriptionId: string;
  clientId: string;
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

// Client Analytics
export interface ClientAnalytics {
  clientId: string;
  period: string;
  metrics: {
    totalBookings: number;
    totalSpent: number;
    averageBookingValue: number;
    favoriteProviders: number;
    completedJobs: number;
    cancelledJobs: number;
    averageRating: number;
    responseTime: number;
  };
  trends: {
    bookingGrowth: number;
    spendingGrowth: number;
    satisfactionTrend: number;
    providerDiversity: number;
  };
  insights: string[];
  recommendations: string[];
  createdAt: Timestamp;
}

// Premium Search Features
export interface PremiumSearchFilters {
  verifiedProvidersOnly: boolean;
  priceRange: {
    min: number;
    max: number;
  };
  availability: {
    immediate: boolean;
    specificDate?: Date;
    timeSlot?: string;
  };
  location: {
    radius: number; // in kilometers
    specificAreas: string[];
  };
  providerRating: {
    minRating: number;
    minReviews: number;
  };
  specializations: string[];
  languages: string[];
  equipment: string[];
  certifications: string[];
}

// Priority Booking Features
export interface PriorityBooking {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  priorityLevel: 'high' | 'urgent' | 'emergency';
  requestedDate: Date;
  requestedTime: string;
  specialRequirements: string;
  estimatedBudget: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Exclusive Deals for Premium Clients
export interface ClientExclusiveDeal {
  id: string;
  partnerId: string;
  partnerName: string;
  category: string;
  discountPercentage: number;
  discountAmount: number;
  minSpend: number;
  maxDiscount: number;
  validFrom: Timestamp;
  validTo: Timestamp;
  isActive: boolean;
  description: string;
  terms: string[];
  applicableServices: string[];
  createdAt: Timestamp;
}

// Custom Service Requests
export interface CustomServiceRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
  };
  timeline: string;
  location: string;
  specialRequirements: string[];
  attachments: string[];
  status: 'draft' | 'published' | 'matched' | 'completed' | 'cancelled';
  matchedProviders: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Default client subscription plans
export const DEFAULT_CLIENT_SUBSCRIPTION_PLANS: Omit<ClientSubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Free (Basic)',
    tier: 'free',
    price: 0,
    currency: 'PHP',
    features: [
      {
        id: 'basic_search',
        name: 'Basic Search',
        description: 'Standard provider search and filtering',
        category: 'search',
        isEnabled: true
      },
      {
        id: 'standard_booking',
        name: 'Standard Booking',
        description: 'Book services with standard providers',
        category: 'booking',
        isEnabled: true
      },
      {
        id: 'basic_support',
        name: 'Basic Support',
        description: 'Email support for booking issues',
        category: 'support',
        isEnabled: true
      }
    ],
    limits: {
      maxJobPosts: 3,
      maxBookingsPerMonth: 10,
      maxFavorites: 20,
      prioritySupport: false,
      advancedSearch: false,
      bookingAnalytics: false,
      priorityBooking: false,
      exclusiveDeals: false,
      customRequests: false,
      verifiedProviderAccess: false
    },
    isActive: true
  },
  {
    name: 'Premium Client',
    tier: 'premium',
    price: 199, // ₱199/month
    currency: 'PHP',
    features: [
      {
        id: 'advanced_search',
        name: 'Advanced Search',
        description: 'Advanced filters and verified provider access',
        category: 'search',
        isEnabled: true
      },
      {
        id: 'priority_booking',
        name: 'Priority Booking',
        description: 'Get priority access to top providers',
        category: 'booking',
        isEnabled: true
      },
      {
        id: 'booking_analytics',
        name: 'Booking Analytics',
        description: 'Track your booking history and spending',
        category: 'analytics',
        isEnabled: true
      },
      {
        id: 'priority_support',
        name: 'Priority Support',
        description: '24/7 priority customer support',
        category: 'support',
        isEnabled: true
      },
      {
        id: 'exclusive_deals',
        name: 'Exclusive Deals',
        description: 'Access to exclusive partner discounts',
        category: 'priority',
        isEnabled: true
      },
      {
        id: 'custom_requests',
        name: 'Custom Service Requests',
        description: 'Post custom service requests for specialized needs',
        category: 'booking',
        isEnabled: true
      }
    ],
    limits: {
      maxJobPosts: 10,
      maxBookingsPerMonth: 50,
      maxFavorites: 100,
      prioritySupport: true,
      advancedSearch: true,
      bookingAnalytics: true,
      priorityBooking: true,
      exclusiveDeals: true,
      customRequests: true,
      verifiedProviderAccess: true
    },
    isActive: true
  }
];

// Feature access validation
export const CLIENT_SUBSCRIPTION_FEATURES = {
  ADVANCED_SEARCH: 'advanced_search',
  PRIORITY_BOOKING: 'priority_booking',
  BOOKING_ANALYTICS: 'booking_analytics',
  PRIORITY_SUPPORT: 'priority_support',
  EXCLUSIVE_DEALS: 'exclusive_deals',
  CUSTOM_REQUESTS: 'custom_requests',
  VERIFIED_PROVIDER_ACCESS: 'verified_provider_access',
  EXTENDED_JOB_POSTS: 'extended_job_posts',
  EXTENDED_BOOKINGS: 'extended_bookings',
  EXTENDED_FAVORITES: 'extended_favorites'
} as const;

export type ClientSubscriptionFeatureKey = typeof CLIENT_SUBSCRIPTION_FEATURES[keyof typeof CLIENT_SUBSCRIPTION_FEATURES];
