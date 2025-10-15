"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'cancelled' | 'pending'>('pending');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const bookingId = params.bookingId as string;
  const method = searchParams.get('method');
  const token = searchParams.get('token');
  const PayerID = searchParams.get('PayerID');

  useEffect(() => {
    const processPayment = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setIsLoading(true);

        if (method === 'paypal' && token && PayerID) {
          // Handle PayPal payment result
          const response = await fetch('/api/payments/paypal/order/capture', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}`,
            },
            body: JSON.stringify({
              orderId: token,
              bookingId: bookingId,
            }),
          });

          const result = await response.json();

          if (result.success) {
            setPaymentStatus('success');
            setPaymentData(result.data);
            toast({
              title: "Payment Successful!",
              description: "Your payment has been processed successfully.",
            });
          } else {
            setPaymentStatus('failed');
            setError(result.error || 'Payment processing failed');
            toast({
              title: "Payment Failed",
              description: result.error || 'Payment processing failed',
              variant: "destructive",
            });
          }
        } else if (method === 'maya') {
          // Handle Maya payment result
          const checkoutId = searchParams.get('checkoutId');
          if (checkoutId) {
            // Verify Maya payment status
            const response = await fetch(`/api/payments/maya/status?checkoutId=${checkoutId}`, {
              headers: {
                'Authorization': `Bearer ${await user.getIdToken()}`,
              },
            });

            const result = await response.json();

            if (result.success && result.data?.status === 'PAYMENT_SUCCESS') {
              setPaymentStatus('success');
              setPaymentData(result.data);
              toast({
                title: "Payment Successful!",
                description: "Your payment has been processed successfully.",
              });
            } else {
              setPaymentStatus('failed');
              setError('Payment verification failed');
              toast({
                title: "Payment Failed",
                description: "Payment verification failed",
                variant: "destructive",
              });
            }
          } else {
            setPaymentStatus('cancelled');
          }
        } else {
          setPaymentStatus('cancelled');
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        setPaymentStatus('failed');
        setError('An unexpected error occurred');
        toast({
          title: "Payment Error",
          description: "An unexpected error occurred while processing your payment.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    processPayment();
  }, [user, bookingId, method, token, PayerID, router, toast, searchParams]);

  const handleContinue = () => {
    router.push('/bookings');
  };

  const handleRetry = () => {
    router.push(`/bookings/${bookingId}/payment`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Processing your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500 mx-auto" />;
      case 'cancelled':
        return <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />;
      default:
        return <AlertCircle className="h-16 w-16 text-gray-500 mx-auto" />;
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
      default:
        return 'Payment Status Unknown';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return 'border-green-200';
      case 'failed':
        return 'border-red-200';
      case 'cancelled':
        return 'border-yellow-200';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className={getStatusColor()}>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">{getStatusTitle()}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {paymentStatus === 'success' && (
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">
                Thank you for your payment! Your booking has been confirmed.
              </p>
              {paymentData && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm">Payment Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="ml-2 font-medium">{paymentData.transactionId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="ml-2 font-medium">₱{paymentData.amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Method:</span>
                      <span className="ml-2 font-medium capitalize">{method}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2 font-medium text-green-600">Completed</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">
                {error || 'Your payment could not be processed. Please try again.'}
              </p>
            </div>
          )}

          {paymentStatus === 'cancelled' && (
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">
                Your payment was cancelled. You can try again or choose a different payment method.
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            {paymentStatus === 'success' ? (
              <Button onClick={handleContinue} className="px-8">
                Continue to Bookings
              </Button>
            ) : (
              <>
                <Button onClick={handleRetry} variant="outline">
                  Try Again
                </Button>
                <Button onClick={handleContinue}>
                  Back to Bookings
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}