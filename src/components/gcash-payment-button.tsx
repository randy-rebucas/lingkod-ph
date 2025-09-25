"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { PaymentRetryService } from '@/lib/payment-retry-service';
import { StandardCard } from '@/components/app/standard-card';
import { designTokens } from '@/lib/design-tokens';

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
  const { getIdToken } = useAuth();

  const handleGCashPayment = async () => {
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
      console.error('GCash payment error:', error);
      setPaymentStatus('error');
      
      let errorMessage = 'An unexpected error occurred';
      let toastMessage = 'An unexpected error occurred while processing your payment.';
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorMessage = 'Please log in to continue';
          toastMessage = 'You need to be logged in to make a payment.';
        } else if (error.message.includes('fetch') || error.message.includes('HTTP')) {
          errorMessage = 'Network error. Please check your connection.';
          toastMessage = 'Unable to connect to payment service. Please check your internet connection.';
        } else if (error.message.includes('Adyen')) {
          errorMessage = 'Payment service temporarily unavailable';
          toastMessage = 'The payment service is temporarily unavailable. Please try again later.';
        } else {
          errorMessage = error.message;
          toastMessage = error.message;
        }
      }
      
      setErrorMessage(errorMessage);
      onPaymentError?.(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: toastMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
      console.error('Payment result handling error:', error);
      setPaymentStatus('error');
      
      let errorMessage = 'Failed to verify payment';
      let toastMessage = 'Unable to verify your payment. Please contact support.';
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorMessage = 'Please log in to continue';
          toastMessage = 'You need to be logged in to verify your payment.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection.';
          toastMessage = 'Unable to connect to payment service. Please check your internet connection.';
        } else {
          errorMessage = error.message;
          toastMessage = error.message;
        }
      }
      
      setErrorMessage(errorMessage);
      onPaymentError?.(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: toastMessage,
      });
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

  const renderPaymentButton = () => {
    switch (paymentStatus) {
      case 'processing':
        return (
          <Button disabled className="w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </Button>
        );
      
      case 'success':
        return (
          <Button disabled className="w-full bg-green-600 hover:bg-green-700">
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
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Alert variant="destructive">
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
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Pay with GCash
          </Button>
        );
    }
  };

  return (
    <StandardCard 
      variant="elevated"
      title="GCash Payment"
      description="Pay securely with GCash - instant confirmation"
    >
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="h-5 w-5 text-blue-500" />
        <span className="font-semibold">GCash Payment</span>
      </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">₱{amount.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">{serviceName}</div>
        </div>
        
        {renderPaymentButton()}
        
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
    </StandardCard>
  );
}
