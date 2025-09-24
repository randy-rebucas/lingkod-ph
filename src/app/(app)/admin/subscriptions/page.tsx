"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Crown, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  proSubscriptions: number;
  freeSubscriptions: number;
  monthlyRevenue: number;
  totalRevenue: number;
}

interface SubscriptionData {
  id: string;
  providerId: string;
  providerName: string;
  providerEmail: string;
  tier: 'free' | 'pro';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  nextBillingDate: Date;
  amount: number;
  paymentMethod: string;
  autoRenew: boolean;
}

export default function AdminSubscriptionsPage() {
  const { user, userRole } = useAuth();
  const t = useTranslations('AdminSubscriptions');
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }

    // Mock data - in real implementation, this would fetch from the database
    const mockStats: SubscriptionStats = {
      totalSubscriptions: 1247,
      activeSubscriptions: 892,
      proSubscriptions: 156,
      freeSubscriptions: 1091,
      monthlyRevenue: 62400,
      totalRevenue: 748800
    };

    const mockSubscriptions: SubscriptionData[] = [
      {
        id: '1',
        providerId: 'provider1',
        providerName: 'John Doe',
        providerEmail: 'john@example.com',
        tier: 'pro',
        status: 'active',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        nextBillingDate: new Date('2024-02-15'),
        amount: 399,
        paymentMethod: 'paypal',
        autoRenew: true
      },
      {
        id: '2',
        providerId: 'provider2',
        providerName: 'Jane Smith',
        providerEmail: 'jane@example.com',
        tier: 'pro',
        status: 'active',
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-02-20'),
        nextBillingDate: new Date('2024-02-20'),
        amount: 399,
        paymentMethod: 'gcash',
        autoRenew: true
      },
      {
        id: '3',
        providerId: 'provider3',
        providerName: 'Mike Johnson',
        providerEmail: 'mike@example.com',
        tier: 'free',
        status: 'active',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-02-10'),
        nextBillingDate: new Date('2024-02-10'),
        amount: 0,
        paymentMethod: 'none',
        autoRenew: false
      }
    ];

    setTimeout(() => {
      setStats(mockStats);
      setSubscriptions(mockSubscriptions);
      setLoading(false);
    }, 1000);
  }, [userRole]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (userRole !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Admin access required</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Button>
          <TrendingUp className="h-4 w-4 mr-2" />
          {t('exportReport')}
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-soft bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                {t('totalSubscriptions')}
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {stats.totalSubscriptions.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600">
                {stats.activeSubscriptions} {t('active')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                {t('proSubscriptions')}
              </CardTitle>
              <Crown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">
                {stats.proSubscriptions.toLocaleString()}
              </div>
              <p className="text-xs text-green-600">
                {((stats.proSubscriptions / stats.totalSubscriptions) * 100).toFixed(1)}% {t('ofTotal')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">
                {t('monthlyRevenue')}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800">
                ₱{stats.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-yellow-600">
                {t('thisMonth')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                {t('totalRevenue')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">
                ₱{stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-purple-600">
                {t('allTime')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscriptions Table */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            {t('subscriptions')}
          </CardTitle>
          <CardDescription>
            {t('subscriptionsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('provider')}</TableHead>
                <TableHead>{t('tier')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{t('paymentMethod')}</TableHead>
                <TableHead>{t('nextBilling')}</TableHead>
                <TableHead>{t('autoRenew')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.providerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.providerEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={subscription.tier === 'pro' ? 'default' : 'secondary'}>
                      {subscription.tier === 'pro' ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Pro
                        </>
                      ) : (
                        'Free'
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(subscription.status)}
                      <Badge className={getStatusColor(subscription.status)}>
                        {subscription.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₱{subscription.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="capitalize">
                    {subscription.paymentMethod}
                  </TableCell>
                  <TableCell>
                    {format(subscription.nextBillingDate, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={subscription.autoRenew ? 'default' : 'secondary'}>
                      {subscription.autoRenew ? t('enabled') : t('disabled')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      {t('viewDetails')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
