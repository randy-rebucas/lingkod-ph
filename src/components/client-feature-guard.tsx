'use client';

import React from 'react';
import { useClientFeatureAccess } from '@/hooks/use-client-subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Lock, TrendingUp, Search, Calendar, Heart, BarChart3, ShoppingBag, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { StandardCard } from '@/components/app/standard-card';
import { designTokens } from '@/lib/design-tokens';

interface ClientFeatureGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

const CLIENT_FEATURE_CONFIG = {
  advanced_search: {
    title: 'Advanced Search',
    description: 'Find exactly what you need with advanced filters and verified provider access',
    icon: Search,
    benefits: ['Advanced filters', 'Verified provider access', 'Smart recommendations', 'Location-based search'],
    upgradeMessage: 'Unlock advanced search to find the perfect provider faster'
  },
  priority_booking: {
    title: 'Priority Booking',
    description: 'Get priority access to top-rated providers and secure bookings faster',
    icon: Zap,
    benefits: ['Priority notifications', 'Top-rated provider access', 'Faster booking confirmation', 'Exclusive opportunities'],
    upgradeMessage: 'Get priority access to the best providers in your area'
  },
  analytics: {
    title: 'Booking Analytics',
    description: 'Track your booking history and spending patterns with detailed insights',
    icon: BarChart3,
    benefits: ['Spending tracking', 'Booking history', 'Provider ratings', 'Cost analysis'],
    upgradeMessage: 'Understand your service usage with detailed analytics'
  },
  priority_support: {
    title: 'Priority Support',
    description: 'Get 24/7 priority customer support for all your booking needs',
    icon: Star,
    benefits: ['24/7 support', 'Priority response', 'Dedicated support team', 'Faster issue resolution'],
    upgradeMessage: 'Get priority support when you need help'
  },
  exclusive_deals: {
    title: 'Exclusive Deals',
    description: 'Access exclusive partner discounts and special offers',
    icon: ShoppingBag,
    benefits: ['Partner discounts', 'Special offers', 'Exclusive promotions', 'Cost savings'],
    upgradeMessage: 'Save money with exclusive partner deals and discounts'
  },
  custom_requests: {
    title: 'Custom Requests',
    description: 'Post custom requests for specialized needs and unique services',
    icon: TrendingUp,
    benefits: ['Custom service requests', 'Specialized needs', 'Unique opportunities', 'Tailored solutions'],
    upgradeMessage: 'Post custom requests for specialized services'
  },
  job_posts: {
    title: 'Extended Job Posts',
    description: 'Post more job requests with increased monthly limits',
    icon: Calendar,
    benefits: ['More job posts', 'Better opportunities', 'Increased visibility', 'Higher success rate'],
    upgradeMessage: 'Post more job requests to find the right provider'
  },
  bookings: {
    title: 'Extended Bookings',
    description: 'Book more services with increased monthly limits',
    icon: Calendar,
    benefits: ['More bookings', 'Flexible scheduling', 'Better service access', 'Convenience'],
    upgradeMessage: 'Book more services and get things done faster'
  },
  favorites: {
    title: 'Extended Favorites',
    description: 'Save more favorite providers for easy access',
    icon: Heart,
    benefits: ['More favorites', 'Quick access', 'Provider comparison', 'Personalized experience'],
    upgradeMessage: 'Save more favorite providers for easy access'
  }
};

export function ClientFeatureGuard({ 
  feature, 
  children, 
  fallback, 
  showUpgradePrompt = true,
  className 
}: ClientFeatureGuardProps) {
  const { hasAccess, remainingUsage, limit, isUnlimited, message, loading } = useClientFeatureAccess(feature);
  const router = useRouter();
  const t = useTranslations('Subscription');

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const config = CLIENT_FEATURE_CONFIG[feature as keyof typeof CLIENT_FEATURE_CONFIG];
  const Icon = config?.icon || Lock;

  return (
    <StandardCard 
      variant="elevated"
      title={config?.title || 'Premium Feature'}
      description={config?.description || 'This feature is available with a Premium subscription'}
      className={`border-dashed border-2 border-gray-200 ${className}`}
    >
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-purple-500">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
        {/* Usage Info */}
        {!isUnlimited && limit > 0 && (
          <div className="text-center">
            <Badge variant="outline" className="mb-2">
              {remainingUsage} of {limit} remaining this month
            </Badge>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        )}

        {/* Benefits */}
        {config?.benefits && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">What you'll get:</h4>
            <ul className="space-y-1">
              {config.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center text-sm">
                  <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upgrade Message */}
        {config?.upgradeMessage && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800">
              {config.upgradeMessage}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => router.push('/client-subscription')}
            className="flex-1 bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white"
          >
            <Star className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/client-subscription')}
            className="flex-1"
          >
            View Plans
          </Button>
        </div>

        {/* Trial Offer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Start with a <span className="font-semibold text-green-600">7-day free trial</span> - no credit card required
          </p>
        </div>
    </StandardCard>
  );
}

// Specialized client feature guards
export function AdvancedSearchGuard({ children, ...props }: Omit<ClientFeatureGuardProps, 'feature'>) {
  return <ClientFeatureGuard feature="advanced_search" {...props}>{children}</ClientFeatureGuard>;
}

export function PriorityBookingGuard({ children, ...props }: Omit<ClientFeatureGuardProps, 'feature'>) {
  return <ClientFeatureGuard feature="priority_booking" {...props}>{children}</ClientFeatureGuard>;
}

export function BookingAnalyticsGuard({ children, ...props }: Omit<ClientFeatureGuardProps, 'feature'>) {
  return <ClientFeatureGuard feature="analytics" {...props}>{children}</ClientFeatureGuard>;
}

export function PrioritySupportGuard({ children, ...props }: Omit<ClientFeatureGuardProps, 'feature'>) {
  return <ClientFeatureGuard feature="priority_support" {...props}>{children}</ClientFeatureGuard>;
}

export function ExclusiveDealsGuard({ children, ...props }: Omit<ClientFeatureGuardProps, 'feature'>) {
  return <ClientFeatureGuard feature="exclusive_deals" {...props}>{children}</ClientFeatureGuard>;
}

export function CustomRequestsGuard({ children, ...props }: Omit<ClientFeatureGuardProps, 'feature'>) {
  return <ClientFeatureGuard feature="custom_requests" {...props}>{children}</ClientFeatureGuard>;
}

export function ExtendedJobPostsGuard({ children, ...props }: Omit<ClientFeatureGuardProps, 'feature'>) {
  return <ClientFeatureGuard feature="job_posts" {...props}>{children}</ClientFeatureGuard>;
}

export function ExtendedBookingsGuard({ children, ...props }: Omit<ClientFeatureGuardProps, 'feature'>) {
  return <ClientFeatureGuard feature="bookings" {...props}>{children}</ClientFeatureGuard>;
}

export function ExtendedFavoritesGuard({ children, ...props }: Omit<ClientFeatureGuardProps, 'feature'>) {
  return <ClientFeatureGuard feature="favorites" {...props}>{children}</ClientFeatureGuard>;
}
