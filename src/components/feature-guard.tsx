'use client';

import React from 'react';
import { useFeatureAccess } from '@/hooks/use-subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, TrendingUp, Star, Zap, BarChart3, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface FeatureGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

const FEATURE_CONFIG = {
  featured_placement: {
    title: 'Featured Placement',
    description: 'Show up at the top of search results and get more visibility',
    icon: Star,
    benefits: ['Top search placement', 'Increased visibility', 'More booking requests'],
    upgradeMessage: 'Get featured placement to stand out from the competition'
  },
  priority_job_access: {
    title: 'Priority Job Access',
    description: 'Get early access to high-value and urgent job postings',
    icon: Zap,
    benefits: ['Early job notifications', 'High-value opportunities', 'Competitive advantage'],
    upgradeMessage: 'Access premium job opportunities before others'
  },
  analytics: {
    title: 'Performance Analytics',
    description: 'Track your performance with detailed insights and metrics',
    icon: BarChart3,
    benefits: ['Revenue tracking', 'Performance metrics', 'Growth insights'],
    upgradeMessage: 'Unlock detailed analytics to grow your business'
  },
  pro_badge: {
    title: 'Pro Badge',
    description: 'Display a verified Pro badge to build trust with clients',
    icon: Crown,
    benefits: ['Verified status', 'Trust building', 'Professional credibility'],
    upgradeMessage: 'Show your Pro status to attract more clients'
  },
  supplies_discount: {
    title: 'Supplies Discount',
    description: 'Access exclusive partner deals and discounts on supplies',
    icon: ShoppingBag,
    benefits: ['Partner discounts', 'Cost savings', 'Exclusive deals'],
    upgradeMessage: 'Save money with exclusive partner discounts'
  },
  job_applications: {
    title: 'Extended Job Applications',
    description: 'Apply to more jobs with increased monthly limits',
    icon: TrendingUp,
    benefits: ['More applications', 'Better opportunities', 'Increased bookings'],
    upgradeMessage: 'Apply to more jobs and grow your business'
  },
  services: {
    title: 'Extended Services',
    description: 'List more services to showcase your full capabilities',
    icon: Star,
    benefits: ['More service listings', 'Diverse offerings', 'Higher revenue potential'],
    upgradeMessage: 'List more services to attract diverse clients'
  },
  bookings: {
    title: 'Extended Bookings',
    description: 'Accept more bookings with increased monthly limits',
    icon: TrendingUp,
    benefits: ['More bookings', 'Higher revenue', 'Business growth'],
    upgradeMessage: 'Accept more bookings and increase your earnings'
  }
};

export function FeatureGuard({ 
  feature, 
  children, 
  fallback, 
  showUpgradePrompt = true,
  className 
}: FeatureGuardProps) {
  const { hasAccess, remainingUsage, limit, isUnlimited, message, loading } = useFeatureAccess(feature);
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

  const config = FEATURE_CONFIG[feature as keyof typeof FEATURE_CONFIG];
  const Icon = config?.icon || Lock;

  return (
    <Card className={`border-dashed border-2 border-gray-200 ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl font-semibold">
          {config?.title || 'Premium Feature'}
        </CardTitle>
        <CardDescription className="text-base">
          {config?.description || 'This feature is available with a Pro subscription'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
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
                  <div className="mr-2 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upgrade Message */}
        {config?.upgradeMessage && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-800">
              {config.upgradeMessage}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => router.push('/subscription')}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/subscription')}
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
      </CardContent>
    </Card>
  );
}

// Specialized feature guards
export function AnalyticsGuard({ children, ...props }: Omit<FeatureGuardProps, 'feature'>) {
  return <FeatureGuard feature="analytics" {...props}>{children}</FeatureGuard>;
}

export function FeaturedPlacementGuard({ children, ...props }: Omit<FeatureGuardProps, 'feature'>) {
  return <FeatureGuard feature="featured_placement" {...props}>{children}</FeatureGuard>;
}

export function PriorityJobGuard({ children, ...props }: Omit<FeatureGuardProps, 'feature'>) {
  return <FeatureGuard feature="priority_job_access" {...props}>{children}</FeatureGuard>;
}

export function ProBadgeGuard({ children, ...props }: Omit<FeatureGuardProps, 'feature'>) {
  return <FeatureGuard feature="pro_badge" {...props}>{children}</FeatureGuard>;
}

export function SuppliesDiscountGuard({ children, ...props }: Omit<FeatureGuardProps, 'feature'>) {
  return <FeatureGuard feature="supplies_discount" {...props}>{children}</FeatureGuard>;
}

export function ExtendedJobApplicationsGuard({ children, ...props }: Omit<FeatureGuardProps, 'feature'>) {
  return <FeatureGuard feature="job_applications" {...props}>{children}</FeatureGuard>;
}

export function ExtendedServicesGuard({ children, ...props }: Omit<FeatureGuardProps, 'feature'>) {
  return <FeatureGuard feature="services" {...props}>{children}</FeatureGuard>;
}

export function ExtendedBookingsGuard({ children, ...props }: Omit<FeatureGuardProps, 'feature'>) {
  return <FeatureGuard feature="bookings" {...props}>{children}</FeatureGuard>;
}
