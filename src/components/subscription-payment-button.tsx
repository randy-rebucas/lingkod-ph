"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Smartphone, Building2, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayPalCheckoutButton } from './paypal-checkout-button';
import { GCashPaymentButton } from './gcash-payment-button';
import { SubscriptionPlan, SubscriptionTier } from '@/lib/subscription-types';

interface SubscriptionPaymentButtonProps {
  plan: SubscriptionPlan;
  onPaymentSuccess?: (subscriptionId: string) => void;
  onPaymentError?: (error: string) => void;
}

export function SubscriptionPaymentButton({ 
  plan, 
  onPaymentSuccess, 
  onPaymentError 
}: SubscriptionPaymentButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('Subscription');
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = async (paymentData: {
    paymentMethod: string;
    paymentReference: string;
    amount: number;
  }) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod: paymentData.paymentMethod,
          paymentReference: paymentData.paymentReference,
          amount: paymentData.amount
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('paymentSuccess'),
          description: t('subscriptionActivated', { planName: plan.name })
        });
        
        setIsOpen(false);
        onPaymentSuccess?.(result.subscriptionId);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Subscription payment error:', error);
      toast({
        variant: 'destructive',
        title: t('paymentError'),
        description: error instanceof Error ? error.message : t('paymentFailed')
      });
      onPaymentError?.(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      variant: 'destructive',
      title: t('paymentError'),
      description: error
    });
    onPaymentError?.(error);
  };

  const getPlanIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'pro':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      default:
        return <Check className="h-5 w-5" />;
    }
  };

  const getPlanColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return 'border-green-200 bg-green-50';
      case 'pro':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPlanBadgeVariant = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return 'secondary' as const;
      case 'pro':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full" 
          variant={plan.tier === 'pro' ? 'default' : 'outline'}
          disabled={isProcessing}
        >
          {plan.tier === 'free' ? t('currentPlan') : t('upgradeTo', { planName: plan.name })}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getPlanIcon(plan.tier)}
            {t('subscribeTo', { planName: plan.name })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <Card className={getPlanColor(plan.tier)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <Badge variant={getPlanBadgeVariant(plan.tier)}>
                  {plan.tier === 'pro' ? t('pro') : t('free')}
                </Badge>
              </div>
              <CardDescription>
                {plan.tier === 'pro' 
                  ? t('proDescription')
                  : t('freeDescription')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">
                  ₱{plan.price.toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  {plan.tier === 'pro' ? t('perMonth') : t('forever')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Features List */}
          <div className="space-y-3">
            <h4 className="font-semibold">{t('planFeatures')}</h4>
            <div className="grid gap-2">
              {plan.features.map((feature) => (
                <div key={feature.id} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          {plan.tier === 'pro' && (
            <Tabs defaultValue="paypal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="paypal" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  PayPal
                </TabsTrigger>
                <TabsTrigger value="gcash" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  GCash
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {t('manualPayment')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paypal" className="space-y-4">
                <PayPalCheckoutButton
                  amount={plan.price}
                  currency="PHP"
                  description={`${plan.name} Subscription - Monthly`}
                  onSuccess={(paymentData) => handlePaymentSuccess({
                    paymentMethod: 'paypal',
                    paymentReference: paymentData.paymentId,
                    amount: plan.price
                  })}
                  onError={handlePaymentError}
                  disabled={isProcessing}
                />
              </TabsContent>

              <TabsContent value="gcash" className="space-y-4">
                <GCashPaymentButton
                  amount={plan.price}
                  description={`${plan.name} Subscription`}
                  onSuccess={(paymentData) => handlePaymentSuccess({
                    paymentMethod: 'gcash',
                    paymentReference: paymentData.paymentId,
                    amount: plan.price
                  })}
                  onError={handlePaymentError}
                  disabled={isProcessing}
                />
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">{t('manualPaymentInstructions')}</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{t('manualPaymentStep1')}</p>
                    <p>{t('manualPaymentStep2')}</p>
                    <p>{t('manualPaymentStep3')}</p>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => handlePaymentSuccess({
                      paymentMethod: 'bank_transfer',
                      paymentReference: `MANUAL_${Date.now()}`,
                      amount: plan.price
                    })}
                    disabled={isProcessing}
                  >
                    {t('markAsPaid')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {plan.tier === 'free' && (
            <div className="text-center p-4 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">
                {t('freePlanActive')}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
