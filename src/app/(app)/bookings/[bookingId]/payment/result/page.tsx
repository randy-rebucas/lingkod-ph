"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentResultPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getIdToken } = useAuth();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handlePaymentResult = async () => {
      try {
        const pspReference = searchParams.get('pspReference');
        const resultCode = searchParams.get('resultCode');
        
        if (!pspReference) {
          setStatus('error');
          setMessage('Invalid payment result');
          return;
        }

        const token = await getIdToken();
        if (!token) {
          setStatus('error');
          setMessage('Authentication required');
          return;
        }

        // Call the payment result API
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
          setStatus('success');
          setMessage('Payment confirmed successfully!');
          toast({
            title: 'Payment Successful!',
            description: 'Your booking has been confirmed.',
          });
          
          // Redirect to bookings page after a short delay
          setTimeout(() => {
            router.push('/bookings');
          }, 3000);
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
        setMessage('An unexpected error occurred');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An unexpected error occurred while processing your payment.',
        });
      }
    };

    if (bookingId) {
      handlePaymentResult();
    }
  }, [bookingId, searchParams, getIdToken, router, toast]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
            <h2 className="text-xl font-semibold">Processing Payment...</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your payment.
            </p>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h2 className="text-xl font-semibold text-green-700">Payment Successful!</h2>
            <p className="text-muted-foreground">
              Your payment has been confirmed and your booking is now active.
            </p>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You will be redirected to your bookings page shortly.
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/bookings')} className="w-full">
              Go to My Bookings
            </Button>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-red-500" />
            <h2 className="text-xl font-semibold text-red-700">Payment Failed</h2>
            <p className="text-muted-foreground">
              {message}
            </p>
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Please try again or contact support if the problem persists.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/bookings/${bookingId}/payment`)}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button onClick={() => router.push('/bookings')} className="flex-1">
                Go to Bookings
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeft 
              className="h-5 w-5 cursor-pointer" 
              onClick={() => router.push('/bookings')}
            />
            Payment Result
          </CardTitle>
          <CardDescription>
            Booking ID: {bookingId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}