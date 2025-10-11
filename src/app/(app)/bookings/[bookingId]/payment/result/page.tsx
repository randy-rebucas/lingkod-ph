"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { capturePayPalPayment } from '../../../actions';

export default function PaymentResultPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'cancelled'>('loading');
  const [message, setMessage] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');

  const handlePayPalResult = useCallback(async (orderId: string) => {
    try {
      if (!user) {
        throw new Error('Authentication required');
      }

      const token = await user.getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      if (!bookingId || Array.isArray(bookingId)) {
        throw new Error('Booking ID is required');
      }

      const result = await capturePayPalPayment({
        bookingId,
        orderId,
      });

      if (result.success) {
        setStatus('success');
        setMessage('Your PayPal payment has been successfully processed!');
        toast({
          title: 'Payment Successful!',
          description: 'Your booking has been confirmed.',
        });
      } else {
        setStatus('error');
        setMessage(result.error || 'Payment processing failed');
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: result.error || 'Your payment could not be processed.',
        });
      }
    } catch (error) {
      console.error('Error processing PayPal payment result:', error);
      setStatus('error');
      setMessage('An error occurred while processing your payment');
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: 'An error occurred while processing your payment.',
      });
    }
  }, [bookingId, user, toast]);

  const handleOtherPaymentResult = useCallback(() => {
    // Handle other payment method results
    const resultCode = searchParams.get('resultCode');
    
    if (resultCode === 'Authorised') {
      setStatus('success');
      setMessage('Your payment has been successfully processed!');
    } else {
      setStatus('error');
      setMessage('Payment was not successful');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!bookingId || !user) return;

    const method = searchParams.get('method');
    const orderIdParam = searchParams.get('orderId');
    const _token = searchParams.get('token');
    const _payerId = searchParams.get('PayerID');

    if (method === 'paypal') {
      if (orderIdParam) {
        setOrderId(orderIdParam);
        handlePayPalResult(orderIdParam);
      } else {
        setStatus('error');
        setMessage('Invalid PayPal payment response');
      }
    } else {
      // Handle other payment methods
      handleOtherPaymentResult();
    }
  }, [bookingId, user, searchParams, handleOtherPaymentResult, handlePayPalResult]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-12 w-12 text-yellow-500" />;
      default:
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processing Payment...';
      case 'success':
        return 'Payment Successful!';
      case 'error':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
      default:
        return 'Processing Payment...';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'loading':
        return 'Please wait while we process your payment...';
      case 'success':
        return message || 'Your payment has been successfully processed and your booking is now confirmed.';
      case 'error':
        return message || 'There was an error processing your payment. Please try again.';
      case 'cancelled':
        return 'You cancelled the payment process. You can try again anytime.';
      default:
        return 'Please wait while we process your payment...';
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {getStatusTitle()}
          </CardTitle>
          <CardDescription className="text-base">
            {getStatusDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {orderId && (
            <Alert>
              <AlertDescription>
                <strong>Transaction ID:</strong> {orderId}
              </AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your booking has been confirmed! You will receive an email confirmation shortly.
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                If you continue to experience issues, please contact our support team.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push('/bookings')}
              className="flex-1"
              variant={status === 'success' ? 'default' : 'outline'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Button>
            
            {status === 'error' && (
              <Button
                onClick={() => router.push(`/bookings/${bookingId}/payment`)}
                className="flex-1"
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}