"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  TrendingUp, 
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
  Download,
  DollarSign
} from "lucide-react";
import { useEffect, useState } from "react";
import { PartnerAnalyticsService, PartnerAnalytics, MonthlyStats } from "@/lib/partner-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from '@/lib/firebase';

interface MonthlyAnalytics {
  currentMonth: MonthlyStats;
  previousMonth: MonthlyStats;
  yearToDate: {
    totalReferrals: number;
    totalRevenue: number;
    totalCommission: number;
    averageMonthlyGrowth: number;
  };
  monthlyTrends: MonthlyStats[];
  quarterlyBreakdown: Array<{
    quarter: string;
    referrals: number;
    revenue: number;
    commission: number;
    growth: number;
  }>;
  seasonalPatterns: Array<{
    month: string;
    averageReferrals: number;
    averageRevenue: number;
    performance: 'high' | 'medium' | 'low';
  }>;
}

export default function MonthlyStatisticsPage() {
  const { user, userRole } = useAuth();
  const t = useTranslations('Partners');
  const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadMonthlyData = async () => {
      if (user && userRole === 'partner' && getDb()) {
        try {
          setLoading(true);

          // Load analytics data
          const analyticsData = await PartnerAnalyticsService.getPartnerAnalytics(user.uid);
          
          // Always create analytics, even with no data
          const monthlyStats = analyticsData?.monthlyStats || [];
          
          const currentMonth = monthlyStats[0] || {
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear(),
            referrals: 0,
            completedJobs: 0,
            revenue: 0,
            commission: 0
          };
          
          const previousMonth = monthlyStats[1] || {
            month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear(),
            referrals: 0,
            completedJobs: 0,
            revenue: 0,
            commission: 0
          };

          // Calculate year-to-date metrics (default to 0 if no data)
          const yearToDate = {
            totalReferrals: monthlyStats.reduce((sum, stat) => sum + (stat.referrals || 0), 0),
            totalRevenue: monthlyStats.reduce((sum, stat) => sum + (stat.revenue || 0), 0),
            totalCommission: monthlyStats.reduce((sum, stat) => sum + (stat.commission || 0), 0),
            averageMonthlyGrowth: calculateAverageGrowth(monthlyStats)
          };

          // Generate quarterly breakdown (default to empty quarters if no data)
          const quarterlyBreakdown = generateQuarterlyBreakdown(monthlyStats);

          // Generate seasonal patterns (mock data for now)
          const seasonalPatterns = [
            { month: 'January', averageReferrals: 8, averageRevenue: 12000, performance: 'medium' as const },
            { month: 'February', averageReferrals: 6, averageRevenue: 9000, performance: 'low' as const },
            { month: 'March', averageReferrals: 10, averageRevenue: 15000, performance: 'high' as const },
            { month: 'April', averageReferrals: 12, averageRevenue: 18000, performance: 'high' as const },
            { month: 'May', averageReferrals: 9, averageRevenue: 13500, performance: 'medium' as const },
            { month: 'June', averageReferrals: 7, averageRevenue: 10500, performance: 'low' as const },
            { month: 'July', averageReferrals: 8, averageRevenue: 12000, performance: 'medium' as const },
            { month: 'August', averageReferrals: 11, averageRevenue: 16500, performance: 'high' as const },
            { month: 'September', averageReferrals: 13, averageRevenue: 19500, performance: 'high' as const },
            { month: 'October', averageReferrals: 10, averageRevenue: 15000, performance: 'medium' as const },
            { month: 'November', averageReferrals: 9, averageRevenue: 13500, performance: 'medium' as const },
            { month: 'December', averageReferrals: 6, averageRevenue: 9000, performance: 'low' as const }
          ];

          setAnalytics({
            currentMonth,
            previousMonth,
            yearToDate,
            monthlyTrends: monthlyStats,
            quarterlyBreakdown,
            seasonalPatterns
          });

        } catch (error) {
          console.error('Error loading monthly data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadMonthlyData();
  }, [user, userRole, selectedYear]);

  const calculateAverageGrowth = (monthlyStats: MonthlyStats[]): number => {
    if (monthlyStats.length < 2) return 0;
    
    let totalGrowth = 0;
    let growthCount = 0;
    
    for (let i = 1; i < monthlyStats.length; i++) {
      const current = monthlyStats[i - 1];
      const previous = monthlyStats[i];
      
      if (previous.revenue > 0) {
        const growth = ((current.revenue - previous.revenue) / previous.revenue) * 100;
        totalGrowth += growth;
        growthCount++;
      }
    }
    
    return growthCount > 0 ? totalGrowth / growthCount : 0;
  };

  const generateQuarterlyBreakdown = (monthlyStats: MonthlyStats[]) => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const quarterlyData = quarters.map((quarter, index) => {
      const quarterMonths = monthlyStats.filter(stat => {
        try {
          const monthIndex = new Date(`${stat.month} 1, ${stat.year}`).getMonth();
          return Math.floor(monthIndex / 3) === index;
        } catch {
          return false;
        }
      });
      
      const referrals = quarterMonths.reduce((sum, stat) => sum + (stat.referrals || 0), 0);
      const revenue = quarterMonths.reduce((sum, stat) => sum + (stat.revenue || 0), 0);
      const commission = quarterMonths.reduce((sum, stat) => sum + (stat.commission || 0), 0);
      
      return {
        quarter,
        referrals,
        revenue,
        commission,
        growth: 0 // This would need more complex calculation
      };
    });
    
    return quarterlyData;
  };

  if (userRole !== 'partner') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access monthly statistics.</p>
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

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Monthly Statistics</h1>
          <p className="text-muted-foreground">No monthly data available yet.</p>
        </div>
      </div>
    );
  }

  const currentGrowth = analytics.previousMonth.revenue > 0 
    ? ((analytics.currentMonth.revenue - analytics.previousMonth.revenue) / analytics.previousMonth.revenue) * 100 
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Monthly Statistics</h1>
        <p className="text-muted-foreground">
          Comprehensive monthly performance analysis and trends
        </p>
      </div>

      {/* Current Month vs Previous Month */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.currentMonth.month} {analytics.currentMonth.year}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.currentMonth.referrals} referrals • {analytics.currentMonth.completedJobs} jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.currentMonth.revenue)}</div>
            <div className="flex items-center gap-1 text-xs">
              {getGrowthIcon(currentGrowth)}
              <span className={getGrowthColor(currentGrowth)}>
                {currentGrowth > 0 ? '+' : ''}{currentGrowth.toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Commission</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.currentMonth.commission)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.currentMonth.completedJobs} completed jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year to Date</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.yearToDate.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.yearToDate.totalReferrals} total referrals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Year-to-Date Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Year-to-Date Summary
          </CardTitle>
          <CardDescription>
            Performance overview for {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Total Referrals</div>
              <div className="text-3xl font-bold">{analytics.yearToDate.totalReferrals}</div>
              <div className="text-sm text-muted-foreground">
                {analytics.monthlyTrends.length} months of data
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
              <div className="text-3xl font-bold">{formatCurrency(analytics.yearToDate.totalRevenue)}</div>
              <div className="text-sm text-muted-foreground">
                {analytics.monthlyTrends.length > 0 
                  ? `${formatCurrency(analytics.yearToDate.totalRevenue / analytics.monthlyTrends.length)} avg/month`
                  : 'No data available'
                }
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Total Commission</div>
              <div className="text-3xl font-bold">{formatCurrency(analytics.yearToDate.totalCommission)}</div>
              <div className="text-sm text-muted-foreground">
                {analytics.monthlyTrends.length > 0 
                  ? `${formatCurrency(analytics.yearToDate.totalCommission / analytics.monthlyTrends.length)} avg/month`
                  : 'No data available'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Statistics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Monthly Trends
              </CardTitle>
              <CardDescription>
                Month-over-month performance trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyTrends.length > 0 ? (
                  analytics.monthlyTrends.map((month, index) => {
                    const previousMonth = index < analytics.monthlyTrends.length - 1 ? analytics.monthlyTrends[index + 1] : null;
                    const growth = previousMonth && previousMonth.revenue > 0 
                      ? ((month.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 
                      : 0;
                    
                    return (
                      <div key={`${month.month}-${month.year}`} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{month.month} {month.year}</div>
                          <div className="text-sm text-muted-foreground">
                            {month.referrals || 0} referrals • {month.completedJobs || 0} jobs
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-bold">{formatCurrency(month.revenue || 0)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(month.commission || 0)} commission
                          </div>
                          {previousMonth && (
                            <div className="flex items-center gap-1 text-xs">
                              {getGrowthIcon(growth)}
                              <span className={getGrowthColor(growth)}>
                                {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No monthly trends data available yet.</p>
                    <p className="text-sm">Start making referrals to see your monthly performance trends.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quarterly Tab */}
        <TabsContent value="quarterly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Quarterly Breakdown
              </CardTitle>
              <CardDescription>
                Performance breakdown by quarter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.quarterlyBreakdown.map((quarter) => (
                  <div key={quarter.quarter} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{quarter.quarter}</span>
                        <Badge variant="outline">{quarter.referrals} referrals</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(quarter.revenue)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(quarter.commission)} commission
                        </div>
                      </div>
                    </div>
                    <Progress value={
                      analytics.quarterlyBreakdown.some(q => q.revenue > 0) 
                        ? (quarter.revenue / Math.max(...analytics.quarterlyBreakdown.map(q => q.revenue))) * 100 
                        : 0
                    } className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasonal Tab */}
        <TabsContent value="seasonal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Seasonal Patterns
              </CardTitle>
              <CardDescription>
                Historical performance patterns by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.seasonalPatterns.map((pattern) => (
                  <div key={pattern.month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pattern.month}</span>
                        <Badge className={getPerformanceColor(pattern.performance)}>
                          {pattern.performance}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg. {pattern.averageReferrals} referrals
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-bold">{formatCurrency(pattern.averageRevenue)}</div>
                      <div className="text-sm text-muted-foreground">
                        Average revenue
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current vs Previous Month */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Current vs Previous Month
                </CardTitle>
                <CardDescription>
                  Month-over-month comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Referrals</span>
                    <div className="text-right">
                      <div className="font-bold">{analytics.currentMonth.referrals}</div>
                      <div className="text-sm text-muted-foreground">
                        vs {analytics.previousMonth.referrals} last month
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Revenue</span>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(analytics.currentMonth.revenue)}</div>
                      <div className="text-sm text-muted-foreground">
                        vs {formatCurrency(analytics.previousMonth.revenue)} last month
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Commission</span>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(analytics.currentMonth.commission)}</div>
                      <div className="text-sm text-muted-foreground">
                        vs {formatCurrency(analytics.previousMonth.commission)} last month
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed Jobs</span>
                    <div className="text-right">
                      <div className="font-bold">{analytics.currentMonth.completedJobs}</div>
                      <div className="text-sm text-muted-foreground">
                        vs {analytics.previousMonth.completedJobs} last month
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Year-to-Date Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Year-to-Date Insights
                </CardTitle>
                <CardDescription>
                  Key insights and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800">Average Monthly Growth</div>
                    <div className="text-sm text-blue-600">
                      {analytics.yearToDate.averageMonthlyGrowth > 0 ? '+' : ''}{analytics.yearToDate.averageMonthlyGrowth.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">Best Performing Month</div>
                    <div className="text-sm text-green-600">
                      {analytics.monthlyTrends.length > 0 ? 
                        `${analytics.monthlyTrends.reduce((best, current) => 
                          current.revenue > best.revenue ? current : best
                        ).month} - ${formatCurrency(Math.max(...analytics.monthlyTrends.map(m => m.revenue)))}` 
                        : 'No data available'
                      }
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-medium text-purple-800">Commission Rate</div>
                    <div className="text-sm text-purple-600">
                      {analytics.yearToDate.totalRevenue > 0 ? 
                        ((analytics.yearToDate.totalCommission / analytics.yearToDate.totalRevenue) * 100).toFixed(1) 
                        : 0}%
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-800">Average Revenue per Referral</div>
                    <div className="text-sm text-yellow-600">
                      {analytics.yearToDate.totalReferrals > 0 ? 
                        formatCurrency(analytics.yearToDate.totalRevenue / analytics.yearToDate.totalReferrals) 
                        : formatCurrency(0)
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
