"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
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
        const _resultCode = searchParams.get('resultCode');
        
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
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl"></div>
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary relative z-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Processing Payment...</h2>
              <p className="text-lg text-muted-foreground">
                Please wait while we verify your payment.
              </p>
            </div>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-xl"></div>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 relative z-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold font-headline bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Payment Successful!</h2>
              <p className="text-lg text-muted-foreground">
                Your payment has been confirmed and your booking is now active.
              </p>
            </div>
            <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-soft">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">
                You will be redirected to your bookings page shortly.
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/bookings')} className="w-full shadow-glow hover:shadow-glow/50 transition-all duration-300">
              Go to My Bookings
            </Button>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-full blur-xl"></div>
              <XCircle className="h-16 w-16 mx-auto text-red-500 relative z-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold font-headline bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Payment Failed</h2>
              <p className="text-lg text-muted-foreground">
                {message}
              </p>
            </div>
            <Alert variant="destructive" className="shadow-soft">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                Please try again or contact support if the problem persists.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/bookings/${bookingId}/payment`)}
                className="flex-1 shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground"
              >
                Try Again
              </Button>
              <Button onClick={() => router.push('/bookings')} className="flex-1 shadow-glow hover:shadow-glow/50 transition-all duration-300">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
          
          <div className="relative z-10 flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push('/bookings')} className="hover:bg-primary/10 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Payment Result
              </h1>
              <p className="text-sm text-muted-foreground">
                Booking ID: {bookingId}
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {renderContent()}
          </CardContent>
        </Card>
    </div>
  );
}