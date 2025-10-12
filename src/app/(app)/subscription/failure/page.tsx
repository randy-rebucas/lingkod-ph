"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function SubscriptionFailurePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const method = searchParams.get('method');
  const plan = searchParams.get('plan');

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-red-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <CardTitle className="text-2xl text-red-700">Payment Failed</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">
              We're sorry, but your payment could not be processed.
            </p>
            <p className="text-sm text-muted-foreground">
              This could be due to insufficient funds, card issues, or network problems.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm">Payment Details</h3>
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
            <h3 className="font-semibold text-sm">What you can do:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Check your payment method and try again</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Contact your bank if the issue persists</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Try a different payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Contact our support team for assistance</span>
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
              Need help? Contact our support team at{' '}
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
