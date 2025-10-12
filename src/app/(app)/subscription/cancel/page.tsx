"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function SubscriptionCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const method = searchParams.get('method');
  const plan = searchParams.get('plan');

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-yellow-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
          </div>
          <CardTitle className="text-2xl text-yellow-700">Payment Cancelled</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">
              Your payment was cancelled and no charges were made.
            </p>
            <p className="text-sm text-muted-foreground">
              You can try again anytime or choose a different payment method.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm">Cancelled Payment</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Plan:</span>
                <span className="ml-2 font-medium capitalize">{plan || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Method:</span>
                <span className="ml-2 font-medium capitalize">{method || 'Unknown'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">What's next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Your subscription is not active yet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>You can try again with the same or different payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Explore our free plan if you're not ready to subscribe</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => router.push('/subscription')}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
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
              Questions? Contact our support team at{' '}
              <a href="mailto:support@lingkod.ph" className="text-primary hover:underline">
                support@lingkod.ph
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
