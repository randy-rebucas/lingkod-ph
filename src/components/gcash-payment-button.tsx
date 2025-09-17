"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  const handleGCashPayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus('processing');
      onPaymentStart?.();

      const returnUrl = `${window.location.origin}/bookings/${bookingId}/payment/result`;
      
      const response = await fetch('/api/payments/gcash/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          returnUrl,
        }),
      });

      const result = await response.json();

      if (result.success) {
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
      setErrorMessage('An unexpected error occurred');
      onPaymentError?.('An unexpected error occurred');
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: 'An unexpected error occurred while processing your payment.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentResult = async (pspReference: string) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/payments/gcash/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      setErrorMessage('Failed to verify payment');
      onPaymentError?.('Failed to verify payment');
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
      </CardContent>
    </Card>
  );
}
