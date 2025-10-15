"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const method = searchParams.get('method');
  const plan = searchParams.get('plan');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Here you would verify the payment with your backend
        // For now, we'll simulate a successful verification
        setSubscriptionData({
          plan,
          method,
          amount: plan === 'premium' ? 499 : plan === 'elite' ? 999 : 0,
          transactionId: `txn_${Date.now()}`,
          subscriptionId: `sub_${Date.now()}`
        });
      } catch (error) {
        console.error('Error verifying payment:', error);
        router.push('/subscription/failure');
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [user, router, method, plan]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-green-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">
              Thank you for subscribing to our {plan} plan!
            </p>
            <p className="text-sm text-muted-foreground">
              Your subscription is now active and you can enjoy all the premium features.
            </p>
          </div>

          {subscriptionData && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">Subscription Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="ml-2 font-medium capitalize">{subscriptionData.plan}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="ml-2 font-medium">₱{subscriptionData.amount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Method:</span>
                  <span className="ml-2 font-medium capitalize">{subscriptionData.method}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="ml-2 font-medium text-xs">{subscriptionData.transactionId}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/subscription')}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              A confirmation email has been sent to {user?.email}. 
              You can manage your subscription from your dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
