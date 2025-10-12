"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserSubscription } from './actions';

interface SubscriptionData {
  plan: string;
  planName: string;
  price: number;
  period: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  paypalSubscriptionId?: string;
}

export default function SubscriptionManagePage() {
  const { user } = useAuth();
  const t = useTranslations('Subscription');
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      try {
        const result = await getUserSubscription(user.uid);
        if (result.success && result.data) {
          setSubscription(result.data);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        toast({
          title: "Error",
          description: "Failed to load subscription details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user, toast]);

  const handleCancelSubscription = async () => {
    if (!user || !subscription?.paypalSubscriptionId) return;

    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.paypalSubscriptionId,
          userId: user.uid,
          reason: 'User requested cancellation',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled successfully.",
        });
        
        // Refresh subscription data
        const updatedResult = await getUserSubscription(user.uid);
        if (updatedResult.success && updatedResult.data) {
          setSubscription(updatedResult.data);
        }
      } else {
        throw new Error(result.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading subscription details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
          Manage Subscription
        </h1>
        <p className="text-muted-foreground">
          View and manage your subscription details and billing information.
        </p>
      </div>

      {subscription ? (
        <div className="grid gap-6">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
                <Badge className={getStatusColor(subscription.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(subscription.status)}
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </div>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Plan</p>
                  <p className="text-lg font-semibold">{subscription.planName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Price</p>
                  <p className="text-lg font-semibold">
                    ₱{subscription.price}/{subscription.period}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Started</p>
                  <p className="text-lg font-semibold">
                    {subscription.startDate 
                      ? new Date(subscription.startDate).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              {subscription.status === 'active' && subscription.plan !== 'free' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your subscription is active and will automatically renew each month.
                    You can cancel anytime and retain access until the end of your billing period.
                  </AlertDescription>
                </Alert>
              )}

              {subscription.status === 'cancelled' && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your subscription has been cancelled. You will retain access to premium features until the end of your current billing period.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Billing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="text-lg font-semibold">PayPal</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Billing Cycle</p>
                  <p className="text-lg font-semibold">Monthly</p>
                </div>
              </div>

              {subscription.paypalSubscriptionId && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Subscription ID</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {subscription.paypalSubscriptionId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Subscription Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription.status === 'active' && subscription.plan !== 'free' ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://www.paypal.com/myaccount/autopay', '_blank')}
                  >
                    Manage Payment Method
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Subscription'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => window.location.href = '/subscription'}
                  >
                    Upgrade Plan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://www.paypal.com/myaccount/autopay', '_blank')}
                  >
                    View PayPal Account
                  </Button>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p>
                  Need help? Contact our support team for assistance with your subscription.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Subscription Found</h3>
            <p className="text-muted-foreground mb-4">
              You don't have an active subscription. Choose a plan to get started.
            </p>
            <Button onClick={() => window.location.href = '/subscription'}>
              View Plans
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
