'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Star, 
  Clock, 
  Users, 
  Award,
  BarChart3,
  PieChart,
  CheckCircle,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { PageLayout } from '@/components/app/page-layout';
import { StandardCard } from '@/components/app/standard-card';
import { LoadingState } from '@/components/app/loading-state';
import { AccessDenied } from '@/components/app/access-denied';
import { designTokens } from '@/lib/design-tokens';

interface ClientAnalyticsData {
  metrics: {
    totalBookings: number;
    totalSpent: number;
    averageBookingValue: number;
    favoriteProviders: number;
    completedJobs: number;
    cancelledJobs: number;
    averageRating: number;
    responseTime: number;
  };
  trends: {
    bookingGrowth: number;
    spendingGrowth: number;
    satisfactionTrend: number;
    providerDiversity: number;
  };
  insights: string[];
  recommendations: string[];
  monthlyData: {
    month: string;
    bookings: number;
    spending: number;
    satisfaction: number;
  }[];
  topProviders: {
    id: string;
    name: string;
    bookings: number;
    totalSpent: number;
    rating: number;
  }[];
  categoryBreakdown: {
    category: string;
    bookings: number;
    spending: number;
    percentage: number;
  }[];
}

export default function ClientAnalyticsPage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<ClientAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '1y'>('3m');

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setAnalyticsData({
          metrics: {
            totalBookings: 24,
            totalSpent: 45600,
            averageBookingValue: 1900,
            favoriteProviders: 8,
            completedJobs: 22,
            cancelledJobs: 2,
            averageRating: 4.7,
            responseTime: 2.3
          },
          trends: {
            bookingGrowth: 15.2,
            spendingGrowth: 8.7,
            satisfactionTrend: 5.1,
            providerDiversity: -2.3
          },
          insights: [
            "You've increased your bookings by 15% this month",
            "Your average spending per booking has grown by 8.7%",
            "You're working with 8 different providers regularly",
            "Your satisfaction rating is above average at 4.7/5"
          ],
          recommendations: [
            "Consider booking recurring services to save money",
            "Try our new premium providers for specialized services",
            "Set up favorite providers for faster booking",
            "Use priority booking for urgent service needs"
          ],
          monthlyData: [
            { month: 'Jan', bookings: 6, spending: 11200, satisfaction: 4.5 },
            { month: 'Feb', bookings: 8, spending: 15200, satisfaction: 4.6 },
            { month: 'Mar', bookings: 10, spending: 19200, satisfaction: 4.7 }
          ],
          topProviders: [
            { id: '1', name: 'Maria Santos', bookings: 5, totalSpent: 9500, rating: 4.9 },
            { id: '2', name: 'John Dela Cruz', bookings: 4, totalSpent: 7200, rating: 4.8 },
            { id: '3', name: 'Ana Rodriguez', bookings: 3, totalSpent: 5400, rating: 4.7 }
          ],
          categoryBreakdown: [
            { category: 'House Cleaning', bookings: 12, spending: 21600, percentage: 47.4 },
            { category: 'Plumbing', bookings: 6, spending: 14400, percentage: 31.6 },
            { category: 'Electrical', bookings: 4, spending: 7200, percentage: 15.8 },
            { category: 'Gardening', bookings: 2, spending: 2400, percentage: 5.3 }
          ]
        });
        setLoading(false);
      }, 1000);
    };

    fetchAnalytics();
  }, [selectedPeriod]);

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (userRole !== 'client') {
    return <AccessDenied 
      title="Access Denied" 
      description="This page is only available for clients." 
    />;
  }

    return (
        <PageLayout 
            title="Booking Analytics" 
            description="Track your booking patterns, spending, and service preferences"
        >
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

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : analyticsData ? (
          <>
            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                      <p className="text-2xl font-bold">{analyticsData.metrics.totalBookings}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(analyticsData.trends.bookingGrowth)}
                    <span className={`text-sm ${getTrendColor(analyticsData.trends.bookingGrowth)}`}>
                      {Math.abs(analyticsData.trends.bookingGrowth)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold">{formatCurrency(analyticsData.metrics.totalSpent)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(analyticsData.trends.spendingGrowth)}
                    <span className={`text-sm ${getTrendColor(analyticsData.trends.spendingGrowth)}`}>
                      {Math.abs(analyticsData.trends.spendingGrowth)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg. Booking Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(analyticsData.metrics.averageBookingValue)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-muted-foreground">per booking</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Satisfaction Rating</p>
                      <p className="text-2xl font-bold">{analyticsData.metrics.averageRating}/5</p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(analyticsData.trends.satisfactionTrend)}
                    <span className={`text-sm ${getTrendColor(analyticsData.trends.satisfactionTrend)}`}>
                      {Math.abs(analyticsData.trends.satisfactionTrend)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="providers">Providers</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Key Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analyticsData.insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analyticsData.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm">{recommendation}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Metrics */}
                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Favorite Providers</p>
                          <p className="text-2xl font-bold">{analyticsData.metrics.favoriteProviders}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                          <p className="text-2xl font-bold">
                            {Math.round((analyticsData.metrics.completedJobs / analyticsData.metrics.totalBookings) * 100)}%
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg. Response Time</p>
                          <p className="text-2xl font-bold">{analyticsData.metrics.responseTime}h</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                    <CardDescription>Your booking and spending patterns over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.monthlyData.map((month, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="font-medium">{month.month}</div>
                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <span className="text-muted-foreground">Bookings: </span>
                              <span className="font-medium">{month.bookings}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Spending: </span>
                              <span className="font-medium">{formatCurrency(month.spending)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rating: </span>
                              <span className="font-medium">{month.satisfaction}/5</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="providers" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Providers</CardTitle>
                    <CardDescription>Your most frequently booked service providers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.topProviders.map((provider, index) => (
                        <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <div>
                              <div className="font-medium">{provider.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {provider.bookings} bookings • {formatCurrency(provider.totalSpent)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{provider.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Categories</CardTitle>
                    <CardDescription>Breakdown of your bookings by service type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.categoryBreakdown.map((category, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{category.category}</span>
                            <span className="text-sm text-muted-foreground">{category.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{category.bookings} bookings</span>
                            <span>{formatCurrency(category.spending)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
              <p className="text-muted-foreground">
                Start booking services to see your analytics and insights.
              </p>
            </CardContent>
          </Card>
        )}
    </PageLayout>
  );
}
