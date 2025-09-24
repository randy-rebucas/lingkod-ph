'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Check, 
  TrendingUp, 
  Star, 
  BarChart3, 
  ShoppingBag, 
  Zap,
  X,
  Gift,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { SubscriptionPaymentButton } from './subscription-payment-button';
import { SubscriptionPlan } from '@/lib/subscription-types';

interface UpsellScreenProps {
  trigger: 'booking' | 'job_posting' | 'analytics' | 'featured_placement';
  onClose?: () => void;
  className?: string;
}

const UPSELL_CONFIG = {
  booking: {
    title: 'Unlock More Bookings!',
    subtitle: 'You just completed a booking - imagine doing this 5x more often!',
    description: 'Pro providers get 5x more bookings with featured placement and priority access.',
    benefits: [
      'Featured placement in search results',
      'Priority access to high-value jobs',
      '5x more booking opportunities',
      'Advanced analytics to track growth'
    ],
    cta: 'Start Free Trial',
    urgency: 'Join 500+ Pro providers earning more'
  },
  job_posting: {
    title: 'Get More Applications!',
    subtitle: 'Your job posting is live - now get the best providers to apply!',
    description: 'Pro providers get early notifications and priority access to new job postings.',
    benefits: [
      'Early notifications for new jobs',
      'Priority access to high-value postings',
      'Featured placement in provider search',
      'Advanced job matching algorithms'
    ],
    cta: 'Start Free Trial',
    urgency: 'Don\'t miss out on the best opportunities'
  },
  analytics: {
    title: 'Track Your Success!',
    subtitle: 'See how Pro providers are growing their business with detailed insights.',
    description: 'Unlock powerful analytics to understand your performance and grow your business.',
    benefits: [
      'Detailed revenue tracking',
      'Performance metrics and trends',
      'Customer satisfaction insights',
      'Growth recommendations'
    ],
    cta: 'View Analytics',
    urgency: 'Join successful Pro providers'
  },
  featured_placement: {
    title: 'Get Featured!',
    subtitle: 'Stand out from the competition with featured placement.',
    description: 'Pro providers appear at the top of search results and get 3x more visibility.',
    benefits: [
      'Top placement in search results',
      '3x more profile views',
      'Verified Pro badge',
      'Priority customer support'
    ],
    cta: 'Get Featured',
    urgency: 'Be the first choice for customers'
  }
};

export function UpsellScreen({ trigger, onClose, className }: UpsellScreenProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { userRole } = useAuth();

  const config = UPSELL_CONFIG[trigger];

  const handleStartTrial = () => {
    if (userRole !== 'provider') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'This feature is only available for service providers.'
      });
      return;
    }

    // Create a mock trial plan for the upsell
    const trialPlan: SubscriptionPlan = {
      id: 'trial',
      name: '7-Day Free Trial',
      tier: 'trial',
      price: 0,
      currency: 'PHP',
      billingCycle: 'monthly',
      features: [
        {
          id: 'featured_placement',
          name: 'Featured Placement',
          description: 'Show up at the top of search results',
          isUnlimited: true
        },
        {
          id: 'priority_job_access',
          name: 'Priority Job Access',
          description: 'Early access to high-value jobs',
          isUnlimited: true
        },
        {
          id: 'analytics',
          name: 'Performance Analytics',
          description: 'Detailed performance insights',
          isUnlimited: true
        },
        {
          id: 'pro_badge',
          name: 'Pro Badge',
          description: 'Verified Pro badge',
          isUnlimited: true
        }
      ],
      limits: {
        jobApplications: 50,
        services: 20,
        bookings: 100,
        featuredPlacementViews: -1,
        priorityJobAccess: -1,
        analyticsViews: -1
      },
      isActive: true,
      isTrial: true,
      trialDays: 7,
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    };

    setSelectedPlan(trialPlan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (subscriptionId: string) => {
    setShowPayment(false);
    toast({
      title: 'Trial Started!',
      description: 'Your 7-day free trial is now active. Enjoy Pro features!'
    });
    onClose?.();
  };

  const handlePaymentError = (error: string) => {
    toast({
      variant: 'destructive',
      title: 'Trial Start Failed',
      description: error
    });
  };

  const handleViewPlans = () => {
    router.push('/subscription');
    onClose?.();
  };

  if (showPayment && selectedPlan) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Start Your Free Trial</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowPayment(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SubscriptionPaymentButton
            plan={selectedPlan}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            startTrial={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${className}`}>
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
          <CardDescription className="text-lg">{config.subtitle}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Description */}
          <p className="text-center text-muted-foreground">{config.description}</p>

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-semibold text-center">What you'll get with Pro:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Proof */}
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>{config.urgency}</strong>
            </AlertDescription>
          </Alert>

          {/* Trial Offer */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">7-Day Free Trial</span>
            </div>
            <p className="text-sm text-green-700">
              Try all Pro features for free. No credit card required. Cancel anytime.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleStartTrial}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
              size="lg"
            >
              <Crown className="mr-2 h-5 w-5" />
              {config.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleViewPlans}
              className="flex-1"
              size="lg"
            >
              View All Plans
            </Button>
          </div>

          {/* Close Button */}
          <div className="text-center">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
              Maybe Later
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="text-center space-y-2 pt-4 border-t">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized upsell components for different triggers
export function BookingUpsellScreen({ onClose, className }: Omit<UpsellScreenProps, 'trigger'>) {
  return <UpsellScreen trigger="booking" onClose={onClose} className={className} />;
}

export function JobPostingUpsellScreen({ onClose, className }: Omit<UpsellScreenProps, 'trigger'>) {
  return <UpsellScreen trigger="job_posting" onClose={onClose} className={className} />;
}

export function AnalyticsUpsellScreen({ onClose, className }: Omit<UpsellScreenProps, 'trigger'>) {
  return <UpsellScreen trigger="analytics" onClose={onClose} className={className} />;
}

export function FeaturedPlacementUpsellScreen({ onClose, className }: Omit<UpsellScreenProps, 'trigger'>) {
  return <UpsellScreen trigger="featured_placement" onClose={onClose} className={className} />;
}
