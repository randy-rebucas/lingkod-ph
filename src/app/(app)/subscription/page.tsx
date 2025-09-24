"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Check, 
  Zap, 
  Star, 
  TrendingUp, 
  Eye, 
  Gift,
  Calendar,
  CreditCard,
  Settings,
  AlertCircle
} from 'lucide-react';
import { SubscriptionPaymentButton } from '@/components/subscription-payment-button';
import { VerifiedProBadge, SubscriptionBadge } from '@/components/pro-badge';
import { format } from 'date-fns';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { subscription, plans, loading, refreshSubscription } = useSubscription();
  const t = useTranslations('Subscription');
  const [activeTab, setActiveTab] = useState('overview');

  const currentPlan = plans.find(plan => plan.tier === (subscription?.tier || 'free'));
  const proPlan = plans.find(plan => plan.tier === 'pro');

  const getFeatureIcon = (category: string) => {
    switch (category) {
      case 'visibility':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'analytics':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'priority':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'badges':
        return <Star className="h-4 w-4 text-purple-500" />;
      case 'discounts':
        return <Gift className="h-4 w-4 text-orange-500" />;
      default:
        return <Check className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <SubscriptionBadge 
          tier={subscription?.tier || 'free'} 
          variant="large" 
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="plans">{t('plans')}</TabsTrigger>
          <TabsTrigger value="billing">{t('billing')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Subscription Status */}
          <Card className="border-0 shadow-soft bg-gradient-to-br from-background to-muted/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    {t('currentPlan')}
                  </CardTitle>
                  <CardDescription>
                    {subscription ? t('activeSubscription') : t('freePlan')}
                  </CardDescription>
                </div>
                {subscription && (
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold">{currentPlan?.name}</h4>
                    <p className="text-2xl font-bold text-primary">
                      ₱{subscription.amount.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('nextBilling')}: {format(subscription.nextBillingDate.toDate(), 'PPP')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t('started')}: {format(subscription.startDate.toDate(), 'PPP')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('paymentMethod')}: {subscription.paymentMethod.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('autoRenew')}: {subscription.autoRenew ? t('enabled') : t('disabled')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Crown className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('freePlanActive')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('freePlanDescription')}
                  </p>
                  <Button onClick={() => setActiveTab('plans')}>
                    <Zap className="h-4 w-4 mr-2" />
                    {t('upgradeToPro')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Plan Features */}
          {currentPlan && (
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  {t('currentFeatures')}
                </CardTitle>
                <CardDescription>
                  {t('currentFeaturesDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {currentPlan.features.map((feature) => (
                    <div key={feature.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getFeatureIcon(feature.category)}
                      <div className="flex-1">
                        <h4 className="font-medium">{feature.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {t('included')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usage Statistics */}
          {subscription && (
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  {t('usageThisMonth')}
                </CardTitle>
                <CardDescription>
                  {t('usageDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">{t('jobApplications')}</div>
                    <div className="text-xs text-muted-foreground">
                      {subscription.limits.maxJobApplications === -1 
                        ? t('unlimited') 
                        : `${subscription.limits.maxJobApplications} ${t('limit')}`
                      }
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">{t('services')}</div>
                    <div className="text-xs text-muted-foreground">
                      {subscription.limits.maxServices === -1 
                        ? t('unlimited') 
                        : `${subscription.limits.maxServices} ${t('limit')}`
                      }
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">{t('bookings')}</div>
                    <div className="text-xs text-muted-foreground">
                      {subscription.limits.maxBookingsPerMonth === -1 
                        ? t('unlimited') 
                        : `${subscription.limits.maxBookingsPerMonth} ${t('limit')}`
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`border-0 shadow-soft transition-all duration-200 ${
                  plan.tier === 'pro' 
                    ? 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-accent/5' 
                    : 'bg-gradient-to-br from-background to-muted/20'
                }`}
              >
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {plan.tier === 'pro' ? (
                      <VerifiedProBadge variant="large" />
                    ) : (
                      <Badge variant="secondary">Free</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-center">
                    {plan.tier === 'pro' 
                      ? t('proPlanDescription')
                      : t('freePlanDescription')
                    }
                  </CardDescription>
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-primary">
                      ₱{plan.price.toLocaleString()}
                      {plan.tier === 'pro' && (
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      )}
                    </div>
                    {plan.tier === 'free' && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {t('forever')}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature.id} className="flex items-center gap-3">
                        {getFeatureIcon(feature.category)}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{feature.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                    {plan.tier === (subscription?.tier || 'free') ? (
                      <Button className="w-full" variant="outline" disabled>
                        <Check className="h-4 w-4 mr-2" />
                        {t('currentPlan')}
                      </Button>
                    ) : (
                      <SubscriptionPaymentButton 
                        plan={plan}
                        onPaymentSuccess={() => {
                          refreshSubscription();
                          setActiveTab('overview');
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Comparison */}
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" />
                {t('featureComparison')}
              </CardTitle>
              <CardDescription>
                {t('featureComparisonDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">{t('features')}</th>
                      <th className="text-center py-3 px-4 font-semibold">Free</th>
                      <th className="text-center py-3 px-4 font-semibold">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="border-b">
                      <td className="py-3 px-4">{t('jobApplications')}</td>
                      <td className="text-center py-3 px-4">10/month</td>
                      <td className="text-center py-3 px-4">50/month</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">{t('services')}</td>
                      <td className="text-center py-3 px-4">5</td>
                      <td className="text-center py-3 px-4">20</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">{t('bookings')}</td>
                      <td className="text-center py-3 px-4">20/month</td>
                      <td className="text-center py-3 px-4">100/month</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">{t('featuredPlacement')}</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">{t('priorityJobAccess')}</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">{t('performanceAnalytics')}</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">{t('proBadge')}</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">{t('suppliesDiscount')}</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {subscription ? (
            <div className="space-y-6">
              {/* Billing Information */}
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    {t('billingInformation')}
                  </CardTitle>
                  <CardDescription>
                    {t('billingInformationDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('paymentMethod')}
                      </label>
                      <p className="text-lg font-semibold">
                        {subscription.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('nextBillingDate')}
                      </label>
                      <p className="text-lg font-semibold">
                        {format(subscription.nextBillingDate.toDate(), 'PPP')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('amount')}
                      </label>
                      <p className="text-lg font-semibold text-primary">
                        ₱{subscription.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('autoRenew')}
                      </label>
                      <p className="text-lg font-semibold">
                        {subscription.autoRenew ? t('enabled') : t('disabled')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Actions */}
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-500" />
                    {t('billingActions')}
                  </CardTitle>
                  <CardDescription>
                    {t('billingActionsDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t('updatePaymentMethod')}
                    </Button>
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      {t('viewBillingHistory')}
                    </Button>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      {t('changeBillingCycle')}
                    </Button>
                    <Button variant="destructive">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {t('cancelSubscription')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-0 shadow-soft">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('noBillingInfo')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('noBillingInfoDescription')}
                </p>
                <Button onClick={() => setActiveTab('plans')}>
                  <Crown className="h-4 w-4 mr-2" />
                  {t('upgradeToPro')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
