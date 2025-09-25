'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Check, 
  X, 
  TrendingUp, 
  Star, 
  BarChart3, 
  ShoppingBag, 
  Zap,
  Calendar,
  CreditCard,
  Clock,
  Gift
} from 'lucide-react';
import { useSubscription, useProSubscription } from '@/hooks/use-subscription';
import { SubscriptionPaymentButton } from '@/components/subscription-payment-button';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { SubscriptionPlan, ProviderSubscription } from '@/lib/subscription-types';
import { PageLayout } from '@/components/app/page-layout';
import { LoadingState } from '@/components/app/loading-state';
import { AccessDenied } from '@/components/app/access-denied';
import { StandardCard } from '@/components/app/standard-card';
import { EmptyState } from '@/components/app/empty-state';
import { designTokens } from '@/lib/design-tokens';

export default function SubscriptionPage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('Subscription');
  const { 
    subscription, 
    plans, 
    loading, 
    plansLoading, 
    isPro, 
    isTrial, 
    isActive,
    isTrialExpired,
    daysUntilTrialExpiry,
    refreshSubscription 
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Redirect non-providers
  useEffect(() => {
    if (userRole && userRole !== 'provider') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'This page is only available for service providers.'
      });
    }
  }, [userRole, toast]);

  const handlePaymentSuccess = async (subscriptionId: string) => {
    await refreshSubscription();
    toast({
      title: 'Success!',
      description: 'Your subscription has been activated successfully.'
    });
  };

  const handlePaymentError = (error: string) => {
    toast({
      variant: 'destructive',
      title: 'Payment Failed',
      description: error
    });
  };

  const getCurrentPlan = () => {
    if (!subscription) return null;
    return plans.find(plan => plan.id === subscription.planId) || null;
  };

  const getUsagePercentage = (feature: string) => {
    if (!subscription) return 0;
    const featureData = subscription.features.find(f => f.id === feature);
    if (!featureData || featureData.isUnlimited) return 0;
    
    // This would need to be fetched from usage data
    // For now, return a placeholder
    return 0;
  };

  const renderCurrentSubscription = () => {
    if (!subscription) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold">Free Plan</div>
              <p className="text-muted-foreground">
                You're currently on the free plan with basic features
              </p>
              <Button onClick={() => setSelectedPlan(plans.find(p => p.tier === 'trial') || null)}>
                Start Free Trial
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    const currentPlan = getCurrentPlan();
    const isExpired = isTrialExpired;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{currentPlan?.name || 'Unknown Plan'}</div>
              <div className="text-sm text-muted-foreground">
                {subscription.tier === 'trial' ? 'Free Trial' : `₱${subscription.amount}/month`}
              </div>
            </div>
            <Badge variant={isActive ? 'default' : 'destructive'}>
              {isExpired ? 'Expired' : isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {subscription.tier === 'trial' && !isExpired && (
            <Alert>
              <Gift className="h-4 w-4" />
              <AlertDescription>
                <strong>{daysUntilTrialExpiry} days</strong> remaining in your free trial.
                {daysUntilTrialExpiry <= 2 && ' Upgrade now to continue enjoying Pro features!'}
              </AlertDescription>
            </Alert>
          )}

          {isExpired && (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your trial has expired. Upgrade to Pro to continue using premium features.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">Next Billing</h4>
            <div className="text-sm text-muted-foreground">
              {subscription.nextBillingDate ? 
                new Date(subscription.nextBillingDate.toDate()).toLocaleDateString() : 
                'N/A'
              }
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Payment Method</h4>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm capitalize">{subscription.paymentMethod?.replace('_', ' ')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderUsageStats = () => {
    if (!subscription) return null;

    const usageFeatures = [
      { id: 'job_applications', name: 'Job Applications', icon: TrendingUp },
      { id: 'services', name: 'Services', icon: Star },
      { id: 'bookings', name: 'Bookings', icon: Calendar }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
          <CardDescription>Track your feature usage for the current month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageFeatures.map(feature => {
            const featureData = subscription.features.find(f => f.id === feature.id);
            const Icon = feature.icon;
            const isUnlimited = featureData?.isUnlimited;
            const limit = featureData?.limit || 0;
            const usage = getUsagePercentage(feature.id);

            return (
              <div key={feature.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{feature.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {isUnlimited ? 'Unlimited' : `${usage}/${limit}`}
                  </span>
                </div>
                {!isUnlimited && (
                  <Progress value={(usage / limit) * 100} className="h-2" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  const renderPlans = () => {
    if (plansLoading) {
      return <div className="text-center">Loading plans...</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className={`relative ${plan.tier === 'pro' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : ''}`}>
            {plan.tier === 'pro' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-yellow-500 text-white">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-center">{plan.name}</CardTitle>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {plan.price === 0 ? 'Free' : `₱${plan.price}`}
                </div>
                {plan.price > 0 && <div className="text-sm text-muted-foreground">/month</div>}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {plan.features.map(feature => (
                  <div key={feature.id} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature.name}</span>
                    {feature.isUnlimited ? (
                      <Badge variant="outline" className="text-xs">Unlimited</Badge>
                    ) : feature.limit ? (
                      <Badge variant="outline" className="text-xs">{feature.limit}/month</Badge>
                    ) : null}
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                {plan.tier === 'trial' ? (
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedPlan(plan)}
                  >
                    Start Free Trial
                  </Button>
                ) : plan.tier === 'pro' ? (
                  <Button 
                    className="w-full bg-yellow-500 hover:bg-yellow-600" 
                    onClick={() => setSelectedPlan(plan)}
                  >
                    Upgrade to Pro
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderFeatureComparison = () => {
    const features = [
      { id: 'job_applications', name: 'Job Applications', free: '10/month', pro: '50/month' },
      { id: 'services', name: 'Services', free: '5', pro: '20' },
      { id: 'bookings', name: 'Bookings', free: '20/month', pro: '100/month' },
      { id: 'featured_placement', name: 'Featured Placement', free: '❌', pro: '✅' },
      { id: 'priority_job_access', name: 'Priority Job Access', free: '❌', pro: '✅' },
      { id: 'analytics', name: 'Performance Analytics', free: '❌', pro: '✅' },
      { id: 'pro_badge', name: 'Pro Badge', free: '❌', pro: '✅' },
      { id: 'supplies_discount', name: 'Supplies Discount', free: '❌', pro: '✅' }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>Compare features across different plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Features</th>
                  <th className="text-center py-2">Free</th>
                  <th className="text-center py-2">Pro</th>
                </tr>
              </thead>
              <tbody>
                {features.map(feature => (
                  <tr key={feature.id} className="border-b">
                    <td className="py-2">{feature.name}</td>
                    <td className="text-center py-2">{feature.free}</td>
                    <td className="text-center py-2">{feature.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <LoadingState title="Loading subscription information..." />;
  }

  if (userRole !== 'provider') {
    return <AccessDenied 
      title="Access Denied" 
      description="This page is only available for service providers." 
    />;
  }

  return (
    <PageLayout 
      title="Subscription Management" 
      description="Manage your subscription and access premium features"
    >

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderCurrentSubscription()}
            {renderUsageStats()}
          </div>
          {renderFeatureComparison()}
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          {renderPlans()}
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {renderUsageStats()}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {renderCurrentSubscription()}
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <SubscriptionPaymentButton
              plan={selectedPlan}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              startTrial={selectedPlan.tier === 'trial'}
            />
            <div className="p-4 border-t">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setSelectedPlan(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
