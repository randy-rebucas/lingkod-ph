'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClientFeatureAccess } from '@/hooks/use-client-subscription';
import { ClientSubscriptionFeatureKey } from '@/lib/client-subscription-types';
import { 
  Crown, 
  Zap, 
  Star, 
  MessageSquare, 
  Shield, 
  Gift,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface ClientFeatureGuardProps {
  feature: ClientSubscriptionFeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function ClientFeatureGuard({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: ClientFeatureGuardProps) {
  const { hasAccess, loading } = useClientFeatureAccess(feature);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return <ClientUpgradePrompt feature={feature} />;
}

// Specialized guards for specific features
export function AdvancedSearchGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ClientFeatureGuard feature="advanced_search" fallback={fallback}>
      {children}
    </ClientFeatureGuard>
  );
}

export function PriorityBookingGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ClientFeatureGuard feature="priority_booking" fallback={fallback}>
      {children}
    </ClientFeatureGuard>
  );
}

export function BookingAnalyticsGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ClientFeatureGuard feature="booking_analytics" fallback={fallback}>
      {children}
    </ClientFeatureGuard>
  );
}

export function PrioritySupportGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ClientFeatureGuard feature="priority_support" fallback={fallback}>
      {children}
    </ClientFeatureGuard>
  );
}

export function ExclusiveDealsGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ClientFeatureGuard feature="exclusive_deals" fallback={fallback}>
      {children}
    </ClientFeatureGuard>
  );
}

export function CustomRequestsGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ClientFeatureGuard feature="custom_requests" fallback={fallback}>
      {children}
    </ClientFeatureGuard>
  );
}

// Upgrade prompt component
function ClientUpgradePrompt({ feature }: { feature: ClientSubscriptionFeatureKey }) {
  const getFeatureInfo = (feature: ClientSubscriptionFeatureKey) => {
    switch (feature) {
      case 'advanced_search':
        return {
          icon: <Zap className="h-6 w-6 text-yellow-500" />,
          title: 'Advanced Search',
          description: 'Get access to advanced filters, verified providers, and priority search results.',
          benefits: [
            'Filter by verified providers only',
            'Advanced location and availability filters',
            'Priority search result placement',
            'Save and manage search preferences'
          ]
        };
      case 'priority_booking':
        return {
          icon: <Star className="h-6 w-6 text-blue-500" />,
          title: 'Priority Booking',
          description: 'Get priority access to top-rated providers and faster booking confirmations.',
          benefits: [
            'Priority access to top-rated providers',
            'Faster booking confirmations',
            'Exclusive booking slots',
            'Priority customer support'
          ]
        };
      case 'booking_analytics':
        return {
          icon: <Shield className="h-6 w-6 text-green-500" />,
          title: 'Booking Analytics',
          description: 'Track your booking history, spending patterns, and service preferences.',
          benefits: [
            'Detailed booking history and trends',
            'Spending analysis and insights',
            'Service preference tracking',
            'Performance recommendations'
          ]
        };
      case 'priority_support':
        return {
          icon: <MessageSquare className="h-6 w-6 text-purple-500" />,
          title: 'Priority Support',
          description: 'Get 24/7 priority customer support with faster response times.',
          benefits: [
            '24/7 priority customer support',
            'Faster response times',
            'Dedicated support agent',
            'Phone and chat support'
          ]
        };
      case 'exclusive_deals':
        return {
          icon: <Gift className="h-6 w-6 text-red-500" />,
          title: 'Exclusive Deals',
          description: 'Access to exclusive partner discounts and special offers.',
          benefits: [
            'Exclusive partner discounts',
            'Special seasonal offers',
            'Early access to promotions',
            'VIP customer benefits'
          ]
        };
      case 'custom_requests':
        return {
          icon: <Crown className="h-6 w-6 text-orange-500" />,
          title: 'Custom Service Requests',
          description: 'Post custom service requests for specialized needs and get matched with providers.',
          benefits: [
            'Post custom service requests',
            'Get matched with specialized providers',
            'Detailed requirement specifications',
            'Priority request processing'
          ]
        };
      default:
        return {
          icon: <Crown className="h-6 w-6 text-primary" />,
          title: 'Premium Feature',
          description: 'This feature is available with a Premium subscription.',
          benefits: [
            'Access to premium features',
            'Enhanced service experience',
            'Priority support',
            'Exclusive benefits'
          ]
        };
    }
  };

  const featureInfo = getFeatureInfo(feature);

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-dashed border-primary/20">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {featureInfo.icon}
          <CardTitle className="text-xl font-bold">
            {featureInfo.title}
          </CardTitle>
        </div>
        <CardDescription className="text-base">
          {featureInfo.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Benefits List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            What you'll get:
          </h4>
          {featureInfo.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            ₱199<span className="text-sm font-normal text-muted-foreground">/month</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Premium Client Plan - Cancel anytime
          </div>
        </div>

        {/* Upgrade Button */}
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/client-subscription">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          
          <div className="text-center text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              7-day money-back guarantee
            </Badge>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            Join thousands of satisfied clients who have upgraded to Premium for a better service experience.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Client subscription badge component
interface ClientSubscriptionBadgeProps {
  tier: 'free' | 'premium';
  variant?: 'compact' | 'large';
  className?: string;
}

export function ClientSubscriptionBadge({ tier, variant = 'compact', className }: ClientSubscriptionBadgeProps) {
  if (tier === 'free') {
    return null; // Don't show badge for free tier
  }

  const isLarge = variant === 'large';

  return (
    <Badge 
      className={`bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 ${
        isLarge ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
      } ${className}`}
    >
      <Crown className={`${isLarge ? 'h-4 w-4' : 'h-3 w-3'} mr-1`} />
      Premium Client
    </Badge>
  );
}

// Verified premium client badge
interface VerifiedPremiumClientBadgeProps {
  variant?: 'compact' | 'large';
  className?: string;
}

export function VerifiedPremiumClientBadge({ variant = 'compact', className }: VerifiedPremiumClientBadgeProps) {
  const isLarge = variant === 'large';

  return (
    <Badge 
      className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 ${
        isLarge ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
      } ${className}`}
    >
      <Crown className={`${isLarge ? 'h-4 w-4' : 'h-3 w-3'} mr-1`} />
      Verified Premium
    </Badge>
  );
}
