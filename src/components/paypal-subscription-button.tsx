"use client";

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';

interface PayPalSubscriptionButtonProps {
  planId: string;
  planName: string;
  price: number;
  onPaymentStart?: () => void;
  onPaymentSuccess?: (subscriptionId: string) => void;
  onPaymentError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PayPalSubscriptionButton({
  planId,
  planName,
  price,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  className = '',
}: PayPalSubscriptionButtonProps) {
  const { user, getIdToken } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Check if PayPal is configured
  const [isPayPalConfigured, setIsPayPalConfigured] = useState(false);

  useEffect(() => {
    setIsPayPalConfigured(!!(
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && 
      process.env.PAYPAL_CLIENT_SECRET
    ));
  }, []);

  // Memoize the payment handler to prevent unnecessary re-renders
  const handlePayPalSubscription = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    if (!isPayPalConfigured) {
      toast({
        title: "Payment Service Unavailable",
        description: "PayPal is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStatus('processing');
      onPaymentStart?.();

      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Create subscription via API
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          planName,
          price,
          currency: 'PHP',
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create subscription');
      }

      if (result.success && result.approvalUrl) {
        // Redirect to PayPal for approval
        window.location.href = result.approvalUrl;
      } else {
        throw new Error('No approval URL received from PayPal');
      }
    } catch (error) {
      console.error('PayPal subscription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      
      setPaymentStatus('error');
      onPaymentError?.(errorMessage);
      
      toast({
        title: "Subscription Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user, planId, planName, price, getIdToken, onPaymentStart, onPaymentError, toast, isPayPalConfigured]);

  if (!isPayPalConfigured) {
    return (
      <Button
        disabled
        className={`w-full ${className}`}
        variant="outline"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        PayPal Not Configured
      </Button>
    );
  }

  return (
    <Button
      onClick={handlePayPalSubscription}
      disabled={disabled || isProcessing || !user}
      className={`w-full ${className}`}
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Subscribe with PayPal
        </>
      )}
    </Button>
  );
}
