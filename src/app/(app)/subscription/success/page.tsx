"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('Subscription');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const planId = searchParams.get('plan');
  const subscriptionId = searchParams.get('subscription_id');
  const token = searchParams.get('token');
  const payerId = searchParams.get('PayerID');

  useEffect(() => {
    const handleSubscriptionSuccess = async () => {
      if (!user || !planId) {
        router.push('/subscription');
        return;
      }

      try {
        // Here you would typically verify the subscription with PayPal
        // and update the user's subscription status
        // For now, we'll simulate success
        
        const planNames: { [key: string]: string } = {
          'premium': 'Premium',
          'elite': 'Elite',
          'free': 'Free',
        };

        const planPrices: { [key: string]: number } = {
          'premium': 499,
          'elite': 999,
          'free': 0,
        };

        setSubscriptionData({
          planId,
          planName: planNames[planId] || 'Unknown',
          price: planPrices[planId] || 0,
        });

        toast({
          title: "Subscription Successful!",
          description: `Welcome to the ${planNames[planId]} plan!`,
        });

      } catch (error) {
        console.error('Error processing subscription success:', error);
        toast({
          title: "Error",
          description: "There was an issue processing your subscription. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleSubscriptionSuccess();
  }, [user, planId, subscriptionId, token, payerId, router, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Processing your subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Subscription Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {subscriptionData && (
            <div className="text-center space-y-2">
              <p className="text-lg text-foreground">
                Welcome to the <span className="font-semibold text-primary">{subscriptionData.planName}</span> plan!
              </p>
              <p className="text-muted-foreground">
                You will be billed ₱{subscriptionData.price} monthly
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg p-4 border">
            <h3 className="font-semibold mb-2">What's Next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                Your subscription is now active
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                You can access all premium features immediately
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                You'll receive a confirmation email shortly
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                Manage your subscription in your account settings
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/subscription/manage')}
              className="flex-1"
            >
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
