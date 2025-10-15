"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useAuth } from '@/context/auth-context';

interface PayPalButtonProps {
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  onPaymentStart?: () => void;
  onPaymentSuccess?: (transactionId?: string) => void;
  onPaymentError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function PayPalButton({
  amount,
  description,
  returnUrl,
  cancelUrl,
  onPaymentStart,
  onPaymentSuccess: _onPaymentSuccess,
  onPaymentError,
  className = "",
  disabled = false,
  children
}: PayPalButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { getIdToken } = useAuth();

  const handlePayPalPayment = useCallback(async () => {
    try {
      setIsProcessing(true);
      onPaymentStart?.();

      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Create PayPal order
      const response = await fetch('/api/payments/paypal/order/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          description,
          returnUrl,
          cancelUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment creation failed');
      }

      if (result.success && result.data?.approvalUrl) {
        // Redirect to PayPal for approval
        window.location.href = result.data.approvalUrl;
      } else {
        throw new Error('Failed to create PayPal payment');
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Payment creation failed';
      onPaymentError?.(errorMsg);
      handleError(error);
      
      toast({
        title: "Payment Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [amount, description, returnUrl, cancelUrl, getIdToken, onPaymentStart, onPaymentError, handleError, toast]);

  return (
    <Button 
      onClick={handlePayPalPayment}
      className={`w-full ${className}`}
      disabled={isProcessing || disabled}
      aria-label="Pay with PayPal"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {children || 'Pay with PayPal'}
        </>
      )}
    </Button>
  );
}
