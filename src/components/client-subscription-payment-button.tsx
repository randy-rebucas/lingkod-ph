'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Star, CreditCard, Smartphone, Building, Wallet, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { ClientSubscriptionPlan } from '@/lib/client-subscription-types';
import { GCashPaymentButton } from './gcash-payment-button';

interface ClientSubscriptionPaymentButtonProps {
  plan: ClientSubscriptionPlan;
  onPaymentSuccess?: (subscriptionId: string) => void;
  onPaymentError?: (error: string) => void;
  startTrial?: boolean;
  className?: string;
}

const PAYMENT_METHODS = {
  paypal: {
    name: 'PayPal',
    icon: CreditCard,
    description: 'Pay securely with PayPal',
    color: 'bg-blue-600 hover:bg-blue-700'
  },
  gcash: {
    name: 'GCash',
    icon: Smartphone,
    description: 'Pay with GCash - instant confirmation',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  maya: {
    name: 'Maya',
    icon: Smartphone,
    description: 'Pay with Maya digital wallet',
    color: 'bg-purple-600 hover:bg-purple-700'
  },
  bank_transfer: {
    name: 'Bank Transfer',
    icon: Building,
    description: 'Traditional bank transfer',
    color: 'bg-gray-600 hover:bg-gray-700'
  }
};

export function ClientSubscriptionPaymentButton({
  plan,
  onPaymentSuccess,
  onPaymentError,
  startTrial = false,
  className
}: ClientSubscriptionPaymentButtonProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const { toast } = useToast();
  const { getIdToken } = useAuth();

  const handlePayment = async (paymentMethod: string) => {
    if (!paymentMethod) {
      toast({
        variant: 'destructive',
        title: 'Payment Method Required',
        description: 'Please select a payment method to continue.'
      });
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStatus('processing');
      setSelectedMethod(paymentMethod);

      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/client-subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod,
          amount: plan.price,
          startTrial
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setPaymentStatus('success');
        onPaymentSuccess?.(result.subscription.id);
        
        toast({
          title: startTrial ? 'Trial Started!' : 'Subscription Created!',
          description: startTrial 
            ? 'Your 7-day free trial has started. Enjoy Premium features!'
            : 'Your Premium subscription is now active. Welcome to Premium!'
        });
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Client subscription payment error:', error);
      setPaymentStatus('error');
      
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrorMessage(errorMessage);
      onPaymentError?.(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGCashPayment = async () => {
    await handlePayment('gcash');
  };

  const handlePayPalPayment = async () => {
    await handlePayment('paypal');
  };

  const handleMayaPayment = async () => {
    await handlePayment('maya');
  };

  const handleBankTransferPayment = async () => {
    await handlePayment('bank_transfer');
  };

  const renderPaymentButton = (method: string, handler: () => void) => {
    const config = PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS];
    const Icon = config.icon;
    const isSelected = selectedMethod === method;
    const isDisabled = isProcessing || paymentStatus === 'success';

    return (
      <Button
        key={method}
        onClick={handler}
        disabled={isDisabled}
        className={`w-full ${config.color} text-white ${
          isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''
        }`}
      >
        {isProcessing && isSelected ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icon className="mr-2 h-4 w-4" />
        )}
        {config.name}
      </Button>
    );
  };

  const renderContent = () => {
    switch (paymentStatus) {
      case 'processing':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <div>
              <h3 className="font-semibold">Processing Payment...</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your {startTrial ? 'trial' : 'subscription'}
              </p>
            </div>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
            <div>
              <h3 className="font-semibold text-green-700">
                {startTrial ? 'Trial Started!' : 'Subscription Active!'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {startTrial 
                  ? 'Your 7-day free trial is now active. Enjoy Premium features!'
                  : 'Welcome to Premium! Your subscription is now active.'
                }
              </p>
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-3">
              {renderPaymentButton('gcash', handleGCashPayment)}
              {renderPaymentButton('paypal', handlePayPalPayment)}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {renderPaymentButton('gcash', handleGCashPayment)}
              {renderPaymentButton('paypal', handlePayPalPayment)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderPaymentButton('maya', handleMayaPayment)}
              {renderPaymentButton('bank_transfer', handleBankTransferPayment)}
            </div>
          </div>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-blue-500" />
          {startTrial ? 'Start Free Trial' : 'Upgrade to Premium'}
        </CardTitle>
        <CardDescription>
          {startTrial 
            ? 'Try Premium features for 7 days, then continue with a paid subscription'
            : 'Get instant access to all Premium features'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Plan Info */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-primary">
            {plan.price === 0 ? 'Free' : `₱${plan.price}`}
            {plan.price > 0 && <span className="text-lg text-muted-foreground">/month</span>}
          </div>
          <Badge variant="outline" className="text-sm">
            {plan.name}
          </Badge>
        </div>

        {/* Payment Methods */}
        {renderContent()}

        {/* Security Notice */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>🔒 Secure payment processing</p>
          <p>💳 All major payment methods accepted</p>
          {startTrial && <p>🎁 No credit card required for trial</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized components for different scenarios
export function ClientTrialPaymentButton({ plan, ...props }: Omit<ClientSubscriptionPaymentButtonProps, 'startTrial'>) {
  return <ClientSubscriptionPaymentButton plan={plan} startTrial={true} {...props} />;
}

export function ClientPremiumPaymentButton({ plan, ...props }: Omit<ClientSubscriptionPaymentButtonProps, 'startTrial'>) {
  return <ClientSubscriptionPaymentButton plan={plan} startTrial={false} {...props} />;
}
