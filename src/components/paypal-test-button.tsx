"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PayPalTestButtonProps {
  bookingId: string;
  amount: number;
  serviceName: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function PayPalTestButton({
  bookingId,
  amount,
  serviceName,
  onPaymentSuccess: _onPaymentSuccess,
  onPaymentError,
  className = "",
  disabled = false,
}: PayPalTestButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const { toast } = useToast();

  const handleTestPayment = async () => {
    try {
      setIsProcessing(true);
      setStatus('processing');
      
      console.log('Testing PayPal payment for booking:', bookingId);
      
      // Simulate API call
      const response = await fetch('/api/payments/paypal/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          returnUrl: `${window.location.origin}/bookings/${bookingId}/payment/result?method=paypal`,
          cancelUrl: `${window.location.origin}/bookings/${bookingId}/payment`,
        }),
      });

      const result = await response.json();
      console.log('PayPal API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Payment creation failed');
      }

      if (result.success && result.data?.approvalUrl) {
        // Redirect to PayPal
        window.location.href = result.data.approvalUrl;
      } else {
        throw new Error('No approval URL received');
      }
    } catch (error) {
      console.error('PayPal test error:', error);
      setStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Payment failed';
      setErrorMessage(errorMsg);
      onPaymentError?.(errorMsg);
      
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: errorMsg,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderButton = () => {
    switch (status) {
      case 'processing':
        return (
          <Button disabled className={`w-full ${className}`}>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </Button>
        );
      
      case 'success':
        return (
          <Button disabled className={`w-full bg-green-600 hover:bg-green-700 ${className}`}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Payment Successful!
          </Button>
        );
      
      case 'error':
        return (
          <div className="space-y-2">
            <Button 
              onClick={handleTestPayment}
              className={`w-full ${className}`}
              disabled={isProcessing || disabled}
            >
              <CreditCard className="mr-2 h-4 w-4" />
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
            onClick={handleTestPayment}
            className={`w-full ${className}`}
            disabled={isProcessing || disabled}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Test PayPal Payment
          </Button>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          PayPal Test Button
        </CardTitle>
        <CardDescription>
          Test PayPal payment integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">₱{amount.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">{serviceName}</div>
        </div>
        
        {renderButton()}
        
        <div className="text-xs text-muted-foreground text-center">
          <p>• This is a test button for debugging</p>
          <p>• Check browser console for detailed logs</p>
          <p>• Requires PayPal credentials to be configured</p>
        </div>
      </CardContent>
    </Card>
  );
}
