"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentResultPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!bookingId || !user) return;

    const handlePaymentResult = async () => {
      try {
        setIsProcessing(true);
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const pspReference = urlParams.get('pspReference');
        const resultCode = urlParams.get('resultCode');
        
        if (!pspReference) {
          setStatus('error');
          setMessage('No payment reference found');
          return;
        }

        // Call API to verify payment result
        const response = await fetch('/api/payments/gcash/result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: bookingId as string,
            pspReference,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setStatus('success');
          setMessage('Your payment has been successfully processed!');
          toast({
            title: 'Payment Successful!',
            description: 'Your GCash payment has been confirmed.',
          });
        } else {
          setStatus('error');
          setMessage(result.error || 'Payment verification failed');
          toast({
            variant: 'destructive',
            title: 'Payment Failed',
            description: result.error || 'Your payment could not be verified.',
          });
        }
      } catch (error) {
        console.error('Payment result handling error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred while verifying your payment');
        toast({
          variant: 'destructive',
          title: 'Verification Error',
          description: 'An unexpected error occurred while verifying your payment.',
        });
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentResult();
  }, [bookingId, user, toast]);

  const handleBackToBookings = () => {
    router.push('/bookings');
  };

  const handleRetryPayment = () => {
    router.push(`/bookings/${bookingId}/payment`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
            Payment Result
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your payment...'}
            {status === 'success' && 'Payment completed successfully'}
            {status === 'error' && 'Payment verification failed'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your payment...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button onClick={handleBackToBookings} className="w-full">
                  View My Bookings
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button onClick={handleRetryPayment} className="w-full">
                  Try Payment Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleBackToBookings}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Bookings
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
