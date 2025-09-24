'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format } from 'date-fns';

interface ClientSubscriptionData {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  tier: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  amount: number;
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  paymentMethod: string;
  autoRenew: boolean;
}

interface ClientSubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  premiumSubscriptions: number;
  freeSubscriptions: number;
  monthlyRevenue: number;
  conversionRate: number;
  churnRate: number;
  averageRevenuePerUser: number;
}

export default function AdminClientSubscriptionsPage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<ClientSubscriptionData[]>([]);
  const [stats, setStats] = useState<ClientSubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setSubscriptions([
          {
            id: '1',
            clientId: 'client1',
            clientName: 'Maria Santos',
            clientEmail: 'maria@example.com',
            tier: 'premium',
            status: 'active',
            amount: 199,
            startDate: '2024-01-15',
            endDate: '2024-02-15',
            nextBillingDate: '2024-02-15',
            paymentMethod: 'paypal',
            autoRenew: true
          },
          {
            id: '2',
            clientId: 'client2',
            clientName: 'John Dela Cruz',
            clientEmail: 'john@example.com',
            tier: 'premium',
            status: 'active',
            amount: 199,
            startDate: '2024-01-20',
            endDate: '2024-02-20',
            nextBillingDate: '2024-02-20',
            paymentMethod: 'gcash',
            autoRenew: true
          },
          {
            id: '3',
            clientId: 'client3',
            clientName: 'Ana Rodriguez',
            clientEmail: 'ana@example.com',
            tier: 'free',
            status: 'active',
            amount: 0,
            startDate: '2024-01-10',
            endDate: '2024-02-10',
            nextBillingDate: '2024-02-10',
            paymentMethod: 'none',
            autoRenew: false
          }
        ]);

        setStats({
          totalSubscriptions: 1250,
          activeSubscriptions: 1180,
          premiumSubscriptions: 340,
          freeSubscriptions: 840,
          monthlyRevenue: 67660,
          conversionRate: 28.5,
          churnRate: 5.2,
          averageRevenuePerUser: 57.3
        });

        setLoading(false);
      }, 1000);
    };

    fetchData();
  }, []);

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
    const matchesTier = tierFilter === 'all' || subscription.tier === tierFilter;
    
    return matchesSearch && matchesStatus && matchesTier;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    if (tier === 'premium') {
      return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white"><Crown className="h-3 w-3 mr-1" />Premium</Badge>;
    }
    return <Badge variant="outline">Free</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (userRole !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is only available for administrators.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Client Subscriptions</h1>
          </div>
          <p className="text-muted-foreground">
            Manage and monitor client subscription plans and revenue
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          {stats && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Subscriptions</p>
                      <p className="text-2xl font-bold">{stats.totalSubscriptions.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">+12.5%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                      <p className="text-2xl font-bold">{stats.activeSubscriptions.toLocaleString()}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-muted-foreground">
                      {Math.round((stats.activeSubscriptions / stats.totalSubscriptions) * 100)}% active
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Premium Clients</p>
                      <p className="text-2xl font-bold">{stats.premiumSubscriptions.toLocaleString()}</p>
                    </div>
                    <Crown className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-muted-foreground">
                      {Math.round((stats.premiumSubscriptions / stats.totalSubscriptions) * 100)}% conversion
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">+8.3%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Analytics */}
          <Tabs defaultValue="subscriptions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search clients..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                        <option value="pending">Pending</option>
                      </select>
                      <select
                        value={tierFilter}
                        onChange={(e) => setTierFilter(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="all">All Tiers</option>
                        <option value="premium">Premium</option>
                        <option value="free">Free</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscriptions Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Subscriptions ({filteredSubscriptions.length})</CardTitle>
                  <CardDescription>
                    Manage and monitor all client subscription plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredSubscriptions.map((subscription) => (
                      <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{subscription.clientName}</div>
                            <div className="text-sm text-muted-foreground">{subscription.clientEmail}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {getTierBadge(subscription.tier)}
                          {getStatusBadge(subscription.status)}
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(subscription.amount)}/month</div>
                            <div className="text-sm text-muted-foreground">
                              Next: {format(new Date(subscription.nextBillingDate), 'MMM dd')}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Subscription Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Conversion Rate</span>
                        <span className="font-medium">{stats?.conversionRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Churn Rate</span>
                        <span className="font-medium">{stats?.churnRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>ARPU</span>
                        <span className="font-medium">{formatCurrency(stats?.averageRevenuePerUser || 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Tier Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span>Premium</span>
                        </div>
                        <span className="font-medium">{stats?.premiumSubscriptions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span>Free</span>
                        </div>
                        <span className="font-medium">{stats?.freeSubscriptions}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Monthly revenue breakdown and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(stats?.monthlyRevenue || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">This Month</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency((stats?.monthlyRevenue || 0) * 12)}
                        </div>
                        <div className="text-sm text-muted-foreground">Annual Run Rate</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency((stats?.monthlyRevenue || 0) / (stats?.premiumSubscriptions || 1))}
                        </div>
                        <div className="text-sm text-muted-foreground">Revenue per Premium Client</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">Premium conversion rate is above industry average at 28.5%</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">Monthly recurring revenue is growing at 8.3% month-over-month</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">Churn rate is low at 5.2%, indicating high client satisfaction</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">Consider introducing annual subscription discounts to improve retention</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">Implement referral program to increase premium conversions</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">Add more premium features to justify higher pricing tiers</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
