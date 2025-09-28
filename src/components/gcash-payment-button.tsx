"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useAuth } from '@/context/auth-context';
import { PaymentRetryService } from '@/lib/payment-retry-service';

interface GCashPaymentButtonProps {
  bookingId: string;
  amount: number;
  serviceName: string;
  onPaymentStart?: () => void;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

export function GCashPaymentButton({
  bookingId,
  amount,
  serviceName,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
}: GCashPaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  
  const router = useRouter();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { getIdToken } = useAuth();

  // Memoize the payment handler to prevent unnecessary re-renders
  const handleGCashPayment = useCallback(async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus('processing');
      onPaymentStart?.();

      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const returnUrl = `${window.location.origin}/bookings/${bookingId}/payment/result`;
      
      // Use retry service for payment creation
      const paymentResult = await PaymentRetryService.retryPaymentCreation(async () => {
        const response = await fetch('/api/payments/gcash/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId,
            returnUrl,
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

        if (result.redirectUrl) {
          // Redirect to GCash payment page
          setRedirectUrl(result.redirectUrl);
          setPaymentStatus('processing');
          
          // Open in new tab or redirect
          window.location.href = result.redirectUrl;
        } else {
          // Payment was immediately successful
          setPaymentStatus('success');
          onPaymentSuccess?.();
          toast({
            title: 'Payment Successful!',
            description: 'Your GCash payment has been processed successfully.',
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
          description: result.error || 'Your GCash payment could not be processed.',
        });
      }
    } catch (error) {
      setPaymentStatus('error');
      const errorMessage = handleError(error, 'GCash payment');
      setErrorMessage(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [bookingId, getIdToken, onPaymentStart, onPaymentSuccess, onPaymentError, toast, router, handleError]);

  const handlePaymentResult = async (pspReference: string) => {
    try {
      setIsProcessing(true);
      
      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/payments/gcash/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          pspReference,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentStatus('success');
        onPaymentSuccess?.();
        toast({
          title: 'Payment Successful!',
          description: 'Your GCash payment has been confirmed.',
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
  };

  // Check for payment result in URL parameters (for redirect handling)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pspReference = urlParams.get('pspReference');
    const resultCode = urlParams.get('resultCode');
    
    if (pspReference && resultCode) {
      if (resultCode === 'Authorised') {
        handlePaymentResult(pspReference);
      } else {
        setPaymentStatus('error');
        setErrorMessage('Payment was not successful');
        onPaymentError?.('Payment was not successful');
      }
    }
  }, []);

  // Memoize the payment button render to prevent unnecessary re-renders
  const renderPaymentButton = useMemo(() => {
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
              onClick={handleGCashPayment}
              className="w-full"
              disabled={isProcessing}
              aria-label="Retry payment"
            >
              <Smartphone className="mr-2 h-4 w-4" />
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
            onClick={handleGCashPayment}
            className="w-full"
            disabled={isProcessing}
            aria-label="Pay with GCash"
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Pay with GCash
          </Button>
        );
    }
  }, [paymentStatus, isProcessing, errorMessage, handleGCashPayment]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-500" />
          GCash Payment
        </CardTitle>
        <CardDescription>
          Pay securely with GCash - instant confirmation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">₱{amount.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">{serviceName}</div>
        </div>
        
        {renderPaymentButton}
        
        {redirectUrl && (
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              You will be redirected to GCash to complete your payment. 
              <a 
                href={redirectUrl} 
                className="ml-1 text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Click here if you're not redirected automatically.
              </a>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-xs text-muted-foreground text-center">
          <p>• Secure payment processing by Adyen</p>
          <p>• Instant payment confirmation</p>
          <p>• No manual verification required</p>
        </div>
      </CardContent>
    </Card>
  );
}
