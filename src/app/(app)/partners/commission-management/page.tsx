"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  Wallet
} from "lucide-react";
import { useEffect, useState } from "react";
import { PartnerAnalyticsService, PartnerCommission } from "@/lib/partner-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from '@/lib/firebase';

interface CommissionSummary {
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  averageCommission: number;
  monthlyEarnings: number;
}

export default function CommissionManagementPage() {
  const { user, userRole } = useAuth();
  const t = useTranslations('Partners');
  const [commissions, setCommissions] = useState<PartnerCommission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadCommissionData = async () => {
      if (user && userRole === 'partner' && getDb()) {
        try {
          setLoading(true);

          // Load all commissions
          const allCommissions = await PartnerAnalyticsService.getPartnerCommissions(user.uid, undefined, 100);
          setCommissions(allCommissions);

          // Calculate summary
          const totalEarned = allCommissions
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + c.commissionAmount, 0);
          
          const totalPending = allCommissions
            .filter(c => c.status === 'pending')
            .reduce((sum, c) => sum + c.commissionAmount, 0);
          
          const totalPaid = allCommissions
            .filter(c => c.status === 'paid')
            .length;
          
          const averageCommission = allCommissions.length > 0 
            ? allCommissions.reduce((sum, c) => sum + c.commissionAmount, 0) / allCommissions.length 
            : 0;

          // Calculate monthly earnings (current month)
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const monthlyEarnings = allCommissions
            .filter(c => {
              if (c.status !== 'paid' || !c.paidAt) return false;
              const paidDate = c.paidAt instanceof Date ? c.paidAt : new Date(c.paidAt.seconds * 1000);
              return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
            })
            .reduce((sum, c) => sum + c.commissionAmount, 0);

          setSummary({
            totalEarned,
            totalPending,
            totalPaid,
            averageCommission,
            monthlyEarnings
          });

        } catch (error) {
          console.error('Error loading commission data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadCommissionData();
  }, [user, userRole]);

  if (userRole !== 'partner') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access commission management.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredCommissions = commissions.filter(commission => {
    const matchesFilter = filter === 'all' || commission.status === filter;
    const matchesSearch = searchTerm === '' || 
      commission.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.bookingId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Commission Management</h1>
        <p className="text-muted-foreground">
          Track and manage your commission earnings and payments
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalEarned)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.totalPaid} paid commissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(summary.totalPending)}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.monthlyEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">
                Current month earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.averageCommission)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per commission
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Commission Management Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Commissions</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search commissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* All Commissions Tab */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                All Commissions ({filteredCommissions.length})
              </CardTitle>
              <CardDescription>
                Complete history of your commission earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCommissions.length > 0 ? (
                <div className="space-y-4">
                  {filteredCommissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Job #{commission.jobId}</span>
                          <Badge className={getStatusColor(commission.status)}>
                            {getStatusIcon(commission.status)}
                            <span className="ml-1">{commission.status}</span>
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Booking #{commission.bookingId} • Referral #{commission.referralId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDate(commission.createdAt)}
                          {commission.paidAt && (
                            <span> • Paid: {formatDate(commission.paidAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-bold text-lg">
                          {formatCurrency(commission.commissionAmount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(commission.jobValue)} job value
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(commission.commissionRate * 100).toFixed(1)}% rate
                        </div>
                        {commission.paymentMethod && (
                          <div className="text-xs text-muted-foreground">
                            <CreditCard className="h-3 w-3 inline mr-1" />
                            {commission.paymentMethod}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No commissions found</p>
                  <p className="text-sm text-muted-foreground">
                    Commissions will appear here once you start earning from referrals
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Commissions
              </CardTitle>
              <CardDescription>
                Commissions awaiting payment processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.filter(c => c.status === 'pending').length > 0 ? (
                <div className="space-y-4">
                  {commissions
                    .filter(c => c.status === 'pending')
                    .map((commission) => (
                      <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Job #{commission.jobId}</span>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Booking #{commission.bookingId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {formatDate(commission.createdAt)}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-bold text-lg text-yellow-700">
                            {formatCurrency(commission.commissionAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(commission.jobValue)} job value
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(commission.commissionRate * 100).toFixed(1)}% rate
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending commissions</p>
                  <p className="text-sm text-muted-foreground">
                    All your commissions have been processed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paid Tab */}
        <TabsContent value="paid" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Paid Commissions
              </CardTitle>
              <CardDescription>
                Successfully processed commission payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.filter(c => c.status === 'paid').length > 0 ? (
                <div className="space-y-4">
                  {commissions
                    .filter(c => c.status === 'paid')
                    .map((commission) => (
                      <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Job #{commission.jobId}</span>
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Booking #{commission.bookingId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Paid: {formatDate(commission.paidAt)}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-bold text-lg text-green-700">
                            {formatCurrency(commission.commissionAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(commission.jobValue)} job value
                          </div>
                          {commission.paymentMethod && (
                            <div className="text-xs text-muted-foreground">
                              <CreditCard className="h-3 w-3 inline mr-1" />
                              {commission.paymentMethod}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No paid commissions yet</p>
                  <p className="text-sm text-muted-foreground">
                    Paid commissions will appear here once processed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cancelled Tab */}
        <TabsContent value="cancelled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Cancelled Commissions
              </CardTitle>
              <CardDescription>
                Commissions that were cancelled or voided
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.filter(c => c.status === 'cancelled').length > 0 ? (
                <div className="space-y-4">
                  {commissions
                    .filter(c => c.status === 'cancelled')
                    .map((commission) => (
                      <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Job #{commission.jobId}</span>
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancelled
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Booking #{commission.bookingId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {formatDate(commission.createdAt)}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-bold text-lg text-red-700">
                            {formatCurrency(commission.commissionAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(commission.jobValue)} job value
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(commission.commissionRate * 100).toFixed(1)}% rate
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No cancelled commissions</p>
                  <p className="text-sm text-muted-foreground">
                    Great! All your commissions are in good standing
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
