'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useClientSubscription } from '@/hooks/use-client-subscription';
import { ClientSubscriptionPaymentButton } from '@/components/client-subscription-payment-button';
import { ClientSubscriptionBadge, VerifiedPremiumClientBadge } from '@/components/client-feature-guard';
import { 
  Crown, 
  CheckCircle, 
  Star, 
  Zap, 
  MessageSquare, 
  Shield, 
  Gift,
  Calendar,
  CreditCard,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ClientSubscriptionPlan } from '@/lib/client-subscription-types';
import { format } from 'date-fns';

export default function ClientSubscriptionPage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { subscription, plans, loading, refreshSubscription } = useClientSubscription();
  const [selectedPlan, setSelectedPlan] = useState<ClientSubscriptionPlan | null>(null);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      // Default to Premium plan for upgrade
      const premiumPlan = plans.find(plan => plan.tier === 'premium');
      if (premiumPlan) {
        setSelectedPlan(premiumPlan);
      }
    }
  }, [plans, selectedPlan]);

  const handlePaymentSuccess = (subscriptionId: string) => {
    toast({
      title: "Welcome to Premium! 🎉",
      description: "Your premium features are now active. Enjoy enhanced service discovery!",
    });
    refreshSubscription();
  };

  const handlePaymentError = (error: string) => {
    toast({
      variant: 'destructive',
      title: 'Payment Failed',
      description: error,
    });
  };

  const getFeatureIcon = (category: string) => {
    switch (category) {
      case 'search': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'booking': return <Star className="h-4 w-4 text-green-500" />;
      case 'support': return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'analytics': return <Shield className="h-4 w-4 text-orange-500" />;
      case 'priority': return <Gift className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  if (userRole !== 'client') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is only available for clients.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Client Subscription
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Unlock premium features to enhance your service discovery and booking experience
        </p>
        
        {/* Current Status */}
        {subscription && (
          <div className="flex items-center justify-center gap-2">
            {subscription.tier === 'premium' ? (
              <VerifiedPremiumClientBadge variant="large" />
            ) : (
              <ClientSubscriptionBadge tier={subscription.tier} variant="large" />
            )}
          </div>
        )}
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Current Plan: {subscription.tier === 'premium' ? 'Premium Client' : 'Free (Basic)'}
                </CardTitle>
                <CardDescription>
                  {subscription.tier === 'premium' 
                    ? 'Enjoying premium features and enhanced service discovery'
                    : 'Basic features with limited access to advanced tools'
                  }
                </CardDescription>
              </div>
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Next Billing</div>
                <div className="font-medium">
                  {format(subscription.nextBillingDate.toDate(), 'MMM dd, yyyy')}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Amount</div>
                <div className="font-medium">₱{subscription.amount.toLocaleString()}/month</div>
              </div>
              <div>
                <div className="text-muted-foreground">Payment Method</div>
                <div className="font-medium capitalize">{subscription.paymentMethod}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Auto Renew</div>
                <div className="font-medium">{subscription.autoRenew ? 'Yes' : 'No'}</div>
              </div>
            </div>
            
            {subscription.tier === 'free' && (
              <div className="pt-4">
                <Button asChild className="w-full">
                  <a href="#plans">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plans Comparison */}
      <div id="plans" className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
          <p className="text-muted-foreground">
            Select the plan that best fits your service discovery needs
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.tier === 'premium' 
                  ? 'border-2 border-primary shadow-lg' 
                  : 'border'
              }`}
            >
              {plan.tier === 'premium' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1">
                    <Crown className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {plan.tier === 'premium' ? (
                    <Crown className="h-6 w-6 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-gray-500" />
                  )}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold text-primary mt-4">
                  ₱{plan.price.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature.id} className="flex items-start gap-3">
                      <div className="text-green-500 mt-0.5">
                        {getFeatureIcon(feature.category)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{feature.name}</div>
                        <div className="text-xs text-muted-foreground">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Limits */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Job Posts</span>
                    <span className="font-medium">{plan.limits.maxJobPosts === -1 ? 'Unlimited' : plan.limits.maxJobPosts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bookings/Month</span>
                    <span className="font-medium">{plan.limits.maxBookingsPerMonth === -1 ? 'Unlimited' : plan.limits.maxBookingsPerMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Favorites</span>
                    <span className="font-medium">{plan.limits.maxFavorites === -1 ? 'Unlimited' : plan.limits.maxFavorites}</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {subscription?.tier === plan.tier ? (
                    <Button disabled className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : plan.tier === 'premium' ? (
                    <Button 
                      onClick={() => setSelectedPlan(plan)}
                      className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Section */}
      {selectedPlan && subscription?.tier !== selectedPlan.tier && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Complete Your Upgrade</h3>
            <p className="text-muted-foreground">
              Secure payment processing with industry-standard encryption
            </p>
          </div>
          
          <ClientSubscriptionPaymentButton
            plan={selectedPlan}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>
      )}

      {/* Benefits Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Why Choose Premium?</h3>
          <p className="text-muted-foreground">
            Join thousands of satisfied clients who have upgraded to Premium
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">3x More Visibility</h4>
              <p className="text-sm text-muted-foreground">
                Premium clients get priority access to top-rated providers and exclusive booking slots.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Verified Providers Only</h4>
              <p className="text-sm text-muted-foreground">
                Access to verified, background-checked providers with proven track records.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">24/7 Priority Support</h4>
              <p className="text-sm text-muted-foreground">
                Get instant help with dedicated support agents available around the clock.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Frequently Asked Questions</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! You can cancel your subscription at any time. You'll keep premium features until the end of your billing period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-muted-foreground">
                We accept PayPal, GCash, Maya, and Bank Transfer. All payments are processed securely.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Is there a money-back guarantee?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! We offer a 7-day money-back guarantee for new Premium subscribers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">How quickly do features activate?</h4>
              <p className="text-sm text-muted-foreground">
                Premium features activate immediately after successful payment. You'll see the changes within minutes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
