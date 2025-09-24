'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle, 
  Crown,
  Star,
  Zap,
  Shield,
  Gift,
  MessageSquare
} from 'lucide-react';
import { ClientSubscriptionPlan } from '@/lib/client-subscription-types';
import { PayPalCheckoutButton } from '@/components/paypal-checkout-button';
import { GCashPaymentButton } from '@/components/gcash-payment-button';

interface ClientSubscriptionPaymentButtonProps {
  plan: ClientSubscriptionPlan;
  onPaymentSuccess: (subscriptionId: string) => void;
  onPaymentError: (error: string) => void;
}

export function ClientSubscriptionPaymentButton({ 
  plan, 
  onPaymentSuccess, 
  onPaymentError 
}: ClientSubscriptionPaymentButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | 'gcash' | 'maya' | 'bank_transfer' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = async (paymentData: any) => {
    if (!user) {
      onPaymentError('User not authenticated');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/client-subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod: selectedPaymentMethod,
          paymentReference: paymentData.paymentId || paymentData.transactionId,
          amount: plan.price
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Subscription Activated! 🎉",
          description: `Welcome to ${plan.name}! Your premium features are now active.`,
        });
        onPaymentSuccess(result.subscriptionId);
      } else {
        throw new Error(result.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      onPaymentError(error instanceof Error ? error.message : 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    onPaymentError(error);
    setIsProcessing(false);
  };

  const handleManualPayment = async () => {
    if (!user) {
      onPaymentError('User not authenticated');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/client-subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod: selectedPaymentMethod,
          paymentReference: `manual_${Date.now()}`,
          amount: plan.price
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Subscription Created! 📋",
          description: "Your subscription is pending payment verification. You'll receive confirmation once payment is verified.",
        });
        onPaymentSuccess(result.subscriptionId);
      } else {
        throw new Error(result.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Manual payment error:', error);
      onPaymentError(error instanceof Error ? error.message : 'Failed to create subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFeatureIcon = (category: string) => {
    switch (category) {
      case 'search': return <Zap className="h-4 w-4" />;
      case 'booking': return <Star className="h-4 w-4" />;
      case 'support': return <MessageSquare className="h-4 w-4" />;
      case 'analytics': return <Shield className="h-4 w-4" />;
      case 'priority': return <Gift className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'paypal': return <CreditCard className="h-5 w-5" />;
      case 'gcash': return <Smartphone className="h-5 w-5" />;
      case 'maya': return <Smartphone className="h-5 w-5" />;
      case 'bank_transfer': return <Building2 className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'paypal': return 'PayPal';
      case 'gcash': return 'GCash';
      case 'maya': return 'Maya';
      case 'bank_transfer': return 'Bank Transfer';
      default: return method;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="h-6 w-6 text-yellow-500" />
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            {plan.name}
          </CardTitle>
        </div>
        <CardDescription className="text-lg">
          Unlock premium features for your service needs
        </CardDescription>
        <div className="text-3xl font-bold text-primary mt-4">
          ₱{plan.price.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">/month</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Features List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Premium Features
          </h4>
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

        {/* Payment Methods */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Choose Payment Method
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'paypal', name: 'PayPal', description: 'Instant processing' },
              { id: 'gcash', name: 'GCash', description: 'Quick & easy' },
              { id: 'maya', name: 'Maya', description: 'Digital wallet' },
              { id: 'bank_transfer', name: 'Bank Transfer', description: 'Traditional banking' }
            ].map((method) => (
              <Button
                key={method.id}
                variant={selectedPaymentMethod === method.id ? 'default' : 'outline'}
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setSelectedPaymentMethod(method.id as any)}
                disabled={isProcessing}
              >
                {getPaymentMethodIcon(method.id)}
                <div className="text-center">
                  <div className="font-medium text-sm">{method.name}</div>
                  <div className="text-xs text-muted-foreground">{method.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Payment Buttons */}
        {selectedPaymentMethod && (
          <div className="space-y-3">
            {selectedPaymentMethod === 'paypal' && (
              <PayPalCheckoutButton
                amount={plan.price}
                currency="PHP"
                description={`${plan.name} - Monthly Subscription`}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                disabled={isProcessing}
              />
            )}

            {selectedPaymentMethod === 'gcash' && (
              <GCashPaymentButton
                amount={plan.price}
                description={`${plan.name} - Monthly Subscription`}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                disabled={isProcessing}
              />
            )}

            {(selectedPaymentMethod === 'maya' || selectedPaymentMethod === 'bank_transfer') && (
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">
                    Manual Payment Required
                  </h5>
                  <p className="text-sm text-blue-800 mb-3">
                    For {getPaymentMethodName(selectedPaymentMethod)} payments, we'll create your subscription 
                    and send you payment instructions via email.
                  </p>
                  <div className="text-sm text-blue-700">
                    <strong>Amount:</strong> ₱{plan.price.toLocaleString()}<br />
                    <strong>Method:</strong> {getPaymentMethodName(selectedPaymentMethod)}
                  </div>
                </div>
                
                <Button
                  onClick={handleManualPayment}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : `Create ${getPaymentMethodName(selectedPaymentMethod)} Subscription`}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Security Notice */}
        <div className="text-center text-xs text-muted-foreground">
          <Shield className="h-4 w-4 inline mr-1" />
          Secure payment processing with industry-standard encryption
        </div>
      </CardContent>
    </Card>
  );
}
