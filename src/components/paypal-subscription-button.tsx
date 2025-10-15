"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, XCircle, ExternalLink, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useAuth } from '@/context/auth-context';

interface PayPalSubscriptionButtonProps {
  planId: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  onSubscriptionStart?: () => void;
  onSubscriptionSuccess?: (subscriptionId?: string) => void;
  onSubscriptionError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function PayPalSubscriptionButton({
  planId,
  planName,
  amount,
  billingCycle,
  onSubscriptionStart,
  onSubscriptionSuccess,
  onSubscriptionError,
  className = "",
  disabled = false,
}: PayPalSubscriptionButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [approvalUrl, setApprovalUrl] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { getIdToken } = useAuth();

  // Check PayPal configuration on mount
  useEffect(() => {
    setIsConfigured(!!(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET));
  }, []);

  // Handle PayPal subscription creation
  const handlePayPalSubscription = useCallback(async () => {
    try {
      setIsProcessing(true);
      setSubscriptionStatus('processing');
      onSubscriptionStart?.();

      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const returnUrl = `${window.location.origin}/subscription/success?plan=${planId}`;
      const cancelUrl = `${window.location.origin}/subscription/cancel`;
      
      // Create subscription request
      const subscriptionRequest = {
        planId,
        planName,
        amount,
        billingCycle,
        returnUrl,
        cancelUrl,
      };

      const response = await fetch('/api/payments/paypal/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subscriptionRequest),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Subscription creation failed');
      }

      if (result.success && result.data?.approvalUrl) {
        setApprovalUrl(result.data.approvalUrl);
        
        // Redirect to PayPal for approval
        window.location.href = result.data.approvalUrl;
      } else {
        throw new Error('Failed to create PayPal subscription');
      }
    } catch (error) {
      console.error('PayPal subscription error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Subscription creation failed';
      setErrorMessage(errorMsg);
      setSubscriptionStatus('error');
      onSubscriptionError?.(errorMsg);
      handleError(error);
    } finally {
      setIsProcessing(false);
    }
  }, [planId, planName, amount, billingCycle, getIdToken, onSubscriptionStart, onSubscriptionError, handleError]);

  // Handle subscription result from URL parameters
  const handleSubscriptionResult = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionId = urlParams.get('subscription_id');
    const token = urlParams.get('token');
    const baToken = urlParams.get('ba_token');

    if (subscriptionId && token) {
      try {
        setIsProcessing(true);
        
        const response = await fetch('/api/payments/paypal/subscription/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionId,
            token,
            baToken,
            planId,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setSubscriptionStatus('success');
          onSubscriptionSuccess?.(subscriptionId);
          toast({
            title: 'Subscription Activated!',
            description: 'Your PayPal subscription has been successfully activated.',
          });
        } else {
          throw new Error(result.error || 'Subscription activation failed');
        }
      } catch (error) {
        console.error('Subscription activation error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Subscription activation failed';
        setErrorMessage(errorMsg);
        setSubscriptionStatus('error');
        onSubscriptionError?.(errorMsg);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [planId, onSubscriptionSuccess, onSubscriptionError, toast]);

  // Check for subscription result on mount
  useEffect(() => {
    handleSubscriptionResult();
  }, [handleSubscriptionResult]);

  // Memoize the subscription button render
  const renderSubscriptionButton = useMemo(() => {
    if (!isConfigured) {
      return (
        <Button disabled className={`w-full ${className}`} aria-label="PayPal not configured">
          <CreditCard className="mr-2 h-4 w-4" />
          PayPal Not Available
        </Button>
      );
    }

    switch (subscriptionStatus) {
      case 'processing':
        return (
          <Button disabled className={`w-full ${className}`} aria-label="Processing subscription">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Subscription...
          </Button>
        );
      
      case 'success':
        return (
          <Button disabled className={`w-full bg-green-600 hover:bg-green-700 ${className}`} aria-label="Subscription successful">
            <CheckCircle className="mr-2 h-4 w-4" />
            Subscription Active!
          </Button>
        );
      
      case 'error':
        return (
          <div className="space-y-2">
            <Button 
              onClick={handlePayPalSubscription}
              className={`w-full ${className}`}
              disabled={isProcessing || disabled}
              aria-label="Retry subscription"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Alert variant="destructive" role="alert">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          </div>
        );
      
      default:
        return (
          <Button 
            onClick={handlePayPalSubscription}
            className={`w-full ${className}`}
            disabled={isProcessing || disabled}
            aria-label="Subscribe with PayPal"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Subscribe with PayPal
          </Button>
        );
    }
  }, [subscriptionStatus, isProcessing, errorMessage, handlePayPalSubscription, isConfigured, className, disabled]);

  const getBillingCycleText = () => {
    return billingCycle === 'monthly' ? 'Monthly' : 'Yearly';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          PayPal Subscription
        </CardTitle>
        <CardDescription>
          Subscribe securely with PayPal - automatic billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">₱{amount.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">{planName} - {getBillingCycleText()}</div>
        </div>
        
        {renderSubscriptionButton}
        
        {approvalUrl && (
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              You will be redirected to PayPal to approve your subscription. 
              <a 
                href={approvalUrl} 
                className="ml-1 text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Click here if you&apos;re not redirected automatically.
              </a>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-xs text-muted-foreground text-center">
          <p>• Secure subscription processing by PayPal</p>
          <p>• Automatic billing every {billingCycle === 'monthly' ? 'month' : 'year'}</p>
          <p>• Cancel anytime from your PayPal account</p>
        </div>
      </CardContent>
    </Card>
  );
}
