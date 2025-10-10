"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useAuth } from '@/context/auth-context';
import { PaymentRetryService } from '@/lib/payment-retry-service';
// PayPal service is only used on server-side, not in client components

interface PayPalCheckoutButtonProps {
  bookingId: string;
  amount: number;
  serviceName: string;
  onPaymentStart?: () => void;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

export function PayPalCheckoutButton({
  bookingId,
  amount,
  serviceName,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
}: PayPalCheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
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

  // Memoize the payment handler to prevent unnecessary re-renders
  const handlePayPalPayment = useCallback(async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus('processing');
      onPaymentStart?.();

      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const returnUrl = `${window.location.origin}/bookings/${bookingId}/payment/result?method=paypal`;
      const cancelUrl = `${window.location.origin}/bookings/${bookingId}/payment`;
      
      // Use retry service for payment creation
      const paymentResult = await PaymentRetryService.retryPaymentCreation(async () => {
        const response = await fetch('/api/payments/paypal/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId,
            returnUrl,
            cancelUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment creation failed');
      }

      const result = paymentResult.data;

      if (result.success) {
        // Payment event tracking will be handled server-side

        if (result.approvalUrl) {
          // Redirect to PayPal payment page
          setApprovalUrl(result.approvalUrl);
          setPaymentStatus('processing');
          
          // Open in new tab or redirect
          window.location.href = result.approvalUrl;
        } else {
          // Payment was immediately successful
          setPaymentStatus('success');
          onPaymentSuccess?.();
          toast({
            title: 'Payment Successful!',
            description: 'Your PayPal payment has been processed successfully.',
          });
          
          // Redirect to bookings page after a short delay
          setTimeout(() => {
            router.push('/bookings');
          }, 2000);
        }
      } else {
        setPaymentStatus('error');
        setErrorMessage(result.error || 'Payment failed');
        onPaymentError?.(result.error || 'Payment failed');
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: result.error || 'Your PayPal payment could not be processed.',
        });
      }
    } catch (error) {
      setPaymentStatus('error');
      const errorMessage = handleError(error, 'PayPal payment');
      setErrorMessage(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [bookingId, getIdToken, onPaymentStart, onPaymentSuccess, onPaymentError, toast, router, handleError]);

  const handlePaymentResult = useCallback(async (orderId: string) => {
    try {
      setIsProcessing(true);
      
      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/payments/paypal/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          orderId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentStatus('success');
        onPaymentSuccess?.();
        toast({
          title: 'Payment Successful!',
          description: 'Your PayPal payment has been confirmed.',
        });
        
        // Redirect to bookings page
        setTimeout(() => {
          router.push('/bookings');
        }, 2000);
      } else {
        setPaymentStatus('error');
        setErrorMessage(result.error || 'Payment verification failed');
        onPaymentError?.(result.error || 'Payment verification failed');
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: result.error || 'Your payment could not be verified.',
        });
      }
    } catch (error) {
      setPaymentStatus('error');
      const errorMessage = handleError(error, 'payment verification');
      setErrorMessage(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [bookingId, getIdToken, onPaymentSuccess, onPaymentError, toast, router, handleError]);

  // Check for payment result in URL parameters (for redirect handling)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const method = urlParams.get('method');
    
    if (orderId && method === 'paypal') {
      handlePaymentResult(orderId);
    }
  }, [handlePaymentResult]);

  // Memoize the payment button render to prevent unnecessary re-renders
  const renderPaymentButton = useMemo(() => {
    if (!isConfigured) {
      return (
        <Button disabled className="w-full" aria-label="PayPal not configured">
          <CreditCard className="mr-2 h-4 w-4" />
          PayPal Not Available
        </Button>
      );
    }

    switch (paymentStatus) {
      case 'processing':
        return (
          <Button disabled className="w-full" aria-label="Processing payment">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </Button>
        );
      
      case 'success':
        return (
          <Button disabled className="w-full bg-green-600 hover:bg-green-700" aria-label="Payment successful">
            <CheckCircle className="mr-2 h-4 w-4" />
            Payment Successful!
          </Button>
        );
      
      case 'error':
        return (
          <div className="space-y-2">
            <Button 
              onClick={handlePayPalPayment}
              className="w-full"
              disabled={isProcessing}
              aria-label="Retry payment"
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
            onClick={handlePayPalPayment}
            className="w-full"
            disabled={isProcessing}
            aria-label="Pay with PayPal"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Pay with PayPal
          </Button>
        );
    }
  }, [paymentStatus, isProcessing, errorMessage, handlePayPalPayment, isConfigured]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          PayPal Payment
        </CardTitle>
        <CardDescription>
          Pay securely with PayPal - instant confirmation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">₱{amount.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">{serviceName}</div>
        </div>
        
        {renderPaymentButton}
        
        {approvalUrl && (
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              You will be redirected to PayPal to complete your payment. 
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
          <p>• Secure payment processing by PayPal</p>
          <p>• Instant payment confirmation</p>
          <p>• No manual verification required</p>
        </div>
      </CardContent>
    </Card>
  );
}
