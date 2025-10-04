"use client";

import { useAuth } from "@/shared/auth";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Users,
  DollarSign,
  Target,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  Rocket,
  Star,
  Calendar,
  Filter
} from "lucide-react";
import { useEffect, useState } from "react";
import { PartnerAnalyticsService, PartnerAnalytics, MonthlyStats } from "@/lib/partner-analytics";
import { Skeleton } from "@/shared/ui/skeleton";
import { getDb } from '@/shared/db';

interface GrowthMetrics {
  overallGrowth: {
    referrals: number;
    revenue: number;
    commission: number;
    jobs: number;
  };
  growthRates: {
    monthly: number;
    quarterly: number;
    yearly: number;
    average: number;
  };
  growthTrends: Array<{
    period: string;
    referrals: number;
    revenue: number;
    commission: number;
    growthRate: number;
  }>;
  growthProjections: {
    nextMonth: {
      referrals: number;
      revenue: number;
      commission: number;
    };
    nextQuarter: {
      referrals: number;
      revenue: number;
      commission: number;
    };
    nextYear: {
      referrals: number;
      revenue: number;
      commission: number;
    };
  };
  growthFactors: Array<{
    factor: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
  }>;
  milestones: Array<{
    milestone: string;
    target: number;
    current: number;
    progress: number;
    timeframe: string;
  }>;
}

export default function GrowthMetricsPage() {
  const { user, userRole } = useAuth();
  const t = useTranslations('Partners');
  const [metrics, setMetrics] = useState<GrowthMetrics | null>(null);
  const [analytics, setAnalytics] = useState<PartnerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGrowthData = async () => {
      if (user && userRole === 'partner' && getDb()) {
        try {
          setLoading(true);

          // Load analytics data
          const analyticsData = await PartnerAnalyticsService.getPartnerAnalytics(user.uid);
          setAnalytics(analyticsData);

          // Always create metrics, even with no data
          const monthlyStats = analyticsData?.monthlyStats || [];
          
          // Calculate overall growth (default to 0 if no data)
          const overallGrowth = monthlyStats.length > 0 ? {
            referrals: monthlyStats[0].referrals - (monthlyStats[monthlyStats.length - 1]?.referrals || 0),
            revenue: monthlyStats[0].revenue - (monthlyStats[monthlyStats.length - 1]?.revenue || 0),
            commission: monthlyStats[0].commission - (monthlyStats[monthlyStats.length - 1]?.commission || 0),
            jobs: monthlyStats[0].completedJobs - (monthlyStats[monthlyStats.length - 1]?.completedJobs || 0)
          } : {
            referrals: 0,
            revenue: 0,
            commission: 0,
            jobs: 0
          };

          // Calculate growth rates (default to 0 if no data)
          const monthlyGrowth = calculateGrowthRate(monthlyStats, 1);
          const quarterlyGrowth = calculateGrowthRate(monthlyStats, 3);
          const yearlyGrowth = calculateGrowthRate(monthlyStats, 12);
          const averageGrowth = monthlyStats.length > 0 ? (monthlyGrowth + quarterlyGrowth + yearlyGrowth) / 3 : 0;

          // Generate growth trends (default to empty array if no data)
          const growthTrends = monthlyStats.length > 0 ? monthlyStats.slice(0, 6).map((stat, index) => {
            const previousStat = index < monthlyStats.length - 1 ? monthlyStats[index + 1] : null;
            const growthRate = previousStat && previousStat.revenue > 0 
              ? ((stat.revenue - previousStat.revenue) / previousStat.revenue) * 100 
              : 0;
            
            return {
              period: `${stat.month} ${stat.year}`,
              referrals: stat.referrals || 0,
              revenue: stat.revenue || 0,
              commission: stat.commission || 0,
              growthRate
            };
          }) : [];

          // Generate growth projections (default to 0 if no data)
          const lastMonth = monthlyStats[0] || { referrals: 0, revenue: 0, commission: 0 };
          const growthProjections = {
            nextMonth: {
              referrals: monthlyStats.length > 0 ? Math.round(lastMonth.referrals * (1 + monthlyGrowth / 100)) : 0,
              revenue: monthlyStats.length > 0 ? Math.round(lastMonth.revenue * (1 + monthlyGrowth / 100)) : 0,
              commission: monthlyStats.length > 0 ? Math.round(lastMonth.commission * (1 + monthlyGrowth / 100)) : 0
            },
            nextQuarter: {
              referrals: monthlyStats.length > 0 ? Math.round(lastMonth.referrals * Math.pow(1 + monthlyGrowth / 100, 3)) : 0,
              revenue: monthlyStats.length > 0 ? Math.round(lastMonth.revenue * Math.pow(1 + monthlyGrowth / 100, 3)) : 0,
              commission: monthlyStats.length > 0 ? Math.round(lastMonth.commission * Math.pow(1 + monthlyGrowth / 100, 3)) : 0
            },
            nextYear: {
              referrals: monthlyStats.length > 0 ? Math.round(lastMonth.referrals * Math.pow(1 + monthlyGrowth / 100, 12)) : 0,
              revenue: monthlyStats.length > 0 ? Math.round(lastMonth.revenue * Math.pow(1 + monthlyGrowth / 100, 12)) : 0,
              commission: monthlyStats.length > 0 ? Math.round(lastMonth.commission * Math.pow(1 + monthlyGrowth / 100, 12)) : 0
            }
          };

            // Generate growth factors
            const growthFactors = [
              {
                factor: 'Referral Quality',
                impact: 'high' as const,
                description: 'High-quality referrals lead to better conversion rates',
                recommendation: 'Focus on targeting the right audience for referrals'
              },
              {
                factor: 'Follow-up Process',
                impact: 'high' as const,
                description: 'Consistent follow-up improves conversion rates',
                recommendation: 'Implement automated follow-up sequences'
              },
              {
                factor: 'Network Expansion',
                impact: 'medium' as const,
                description: 'Expanding your referral network increases opportunities',
                recommendation: 'Attend networking events and build relationships'
              },
              {
                factor: 'Market Conditions',
                impact: 'low' as const,
                description: 'External market factors affect growth',
                recommendation: 'Monitor market trends and adapt strategies'
              }
            ];

          // Generate milestones (default to 0 if no data)
          const milestones = [
            {
              milestone: '100 Total Referrals',
              target: 100,
              current: analyticsData?.totalReferrals || 0,
              progress: Math.min(100, ((analyticsData?.totalReferrals || 0) / 100) * 100),
              timeframe: '6 months'
            },
            {
              milestone: '₱500K Total Revenue',
              target: 500000,
              current: analyticsData?.totalRevenue || 0,
              progress: Math.min(100, ((analyticsData?.totalRevenue || 0) / 500000) * 100),
              timeframe: '12 months'
            },
            {
              milestone: '50 Active Referrals',
              target: 50,
              current: analyticsData?.activeReferrals || 0,
              progress: Math.min(100, ((analyticsData?.activeReferrals || 0) / 50) * 100),
              timeframe: '9 months'
            },
            {
              milestone: '₱100K Commission',
              target: 100000,
              current: analyticsData?.partnerCommission || 0,
              progress: Math.min(100, ((analyticsData?.partnerCommission || 0) / 100000) * 100),
              timeframe: '18 months'
            }
          ];

          setMetrics({
            overallGrowth,
            growthRates: {
              monthly: monthlyGrowth,
              quarterly: quarterlyGrowth,
              yearly: yearlyGrowth,
              average: averageGrowth
            },
            growthTrends,
            growthProjections,
            growthFactors,
            milestones
          });

        } catch (error) {
          console.error('Error loading growth data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadGrowthData();
  }, [user, userRole]);

  const calculateGrowthRate = (monthlyStats: MonthlyStats[], periods: number): number => {
    if (monthlyStats.length < periods + 1) return 0;
    
    const current = monthlyStats[0];
    const previous = monthlyStats[periods];
    
    if (previous.revenue === 0) return 0;
    
    return ((current.revenue - previous.revenue) / previous.revenue) * 100;
  };

  if (userRole !== 'partner') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access growth metrics.</p>
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

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
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

  if (!metrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Growth Metrics</h1>
          <p className="text-muted-foreground">No growth data available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Growth Metrics</h1>
        <p className="text-muted-foreground">
          Track your growth trajectory and future projections
        </p>
      </div>

      {/* Growth Rate Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGrowthColor(metrics.growthRates.monthly)}`}>
              {metrics.growthRates.monthly > 0 ? '+' : ''}{metrics.growthRates.monthly.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs">
              {getGrowthIcon(metrics.growthRates.monthly)}
              <span>vs previous month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quarterly Growth</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGrowthColor(metrics.growthRates.quarterly)}`}>
              {metrics.growthRates.quarterly > 0 ? '+' : ''}{metrics.growthRates.quarterly.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs">
              {getGrowthIcon(metrics.growthRates.quarterly)}
              <span>vs previous quarter</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yearly Growth</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGrowthColor(metrics.growthRates.yearly)}`}>
              {metrics.growthRates.yearly > 0 ? '+' : ''}{metrics.growthRates.yearly.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs">
              {getGrowthIcon(metrics.growthRates.yearly)}
              <span>vs previous year</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Growth</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGrowthColor(metrics.growthRates.average)}`}>
              {metrics.growthRates.average > 0 ? '+' : ''}{metrics.growthRates.average.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs">
              {getGrowthIcon(metrics.growthRates.average)}
              <span>overall average</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Growth Projections
          </CardTitle>
          <CardDescription>
            Projected growth based on current trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">Next Month</div>
                <div className="text-2xl font-bold">{metrics.growthProjections.nextMonth.referrals}</div>
                <div className="text-sm text-muted-foreground">referrals</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{formatCurrency(metrics.growthProjections.nextMonth.revenue)}</div>
                <div className="text-sm text-muted-foreground">projected revenue</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">Next Quarter</div>
                <div className="text-2xl font-bold">{metrics.growthProjections.nextQuarter.referrals}</div>
                <div className="text-sm text-muted-foreground">referrals</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{formatCurrency(metrics.growthProjections.nextQuarter.revenue)}</div>
                <div className="text-sm text-muted-foreground">projected revenue</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">Next Year</div>
                <div className="text-2xl font-bold">{metrics.growthProjections.nextYear.referrals}</div>
                <div className="text-sm text-muted-foreground">referrals</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{formatCurrency(metrics.growthProjections.nextYear.revenue)}</div>
                <div className="text-sm text-muted-foreground">projected revenue</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Metrics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="factors">Growth Factors</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Growth Trends
              </CardTitle>
              <CardDescription>
                Month-over-month growth trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.growthTrends.length > 0 ? (
                  metrics.growthTrends.map((trend, index) => (
                    <div key={trend.period} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{trend.period}</div>
                        <div className="text-sm text-muted-foreground">
                          {trend.referrals} referrals • {formatCurrency(trend.revenue)} revenue
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{formatCurrency(trend.commission)}</span>
                          {getGrowthIcon(trend.growthRate)}
                        </div>
                        <div className={`text-sm ${getGrowthColor(trend.growthRate)}`}>
                          {trend.growthRate > 0 ? '+' : ''}{trend.growthRate.toFixed(1)}% growth
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No growth trends data available yet.</p>
                    <p className="text-sm">Start making referrals to see your growth trends.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Growth Milestones
              </CardTitle>
              <CardDescription>
                Track your progress towards key milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {metrics.milestones.map((milestone) => (
                  <div key={milestone.milestone} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{milestone.milestone}</div>
                        <div className="text-sm text-muted-foreground">
                          Target: {typeof milestone.target === 'number' && milestone.target > 1000 
                            ? formatCurrency(milestone.target) 
                            : milestone.target} • {milestone.timeframe}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {typeof milestone.current === 'number' && milestone.current > 1000 
                            ? formatCurrency(milestone.current) 
                            : milestone.current}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {milestone.progress.toFixed(1)}% complete
                        </div>
                      </div>
                    </div>
                    <Progress value={milestone.progress} className="h-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Factors Tab */}
        <TabsContent value="factors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Growth Factors
              </CardTitle>
              <CardDescription>
                Key factors that influence your growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.growthFactors.map((factor) => (
                  <div key={factor.factor} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{factor.factor}</div>
                      <Badge className={getImpactColor(factor.impact)}>
                        {factor.impact} impact
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {factor.description}
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      💡 {factor.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Growth Insights
                </CardTitle>
                <CardDescription>
                  Key insights about your growth performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.growthRates.average > 10 ? (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">Strong Growth Trajectory</div>
                      <div className="text-sm text-green-600">
                        Your {metrics.growthRates.average.toFixed(1)}% average growth rate is excellent
                      </div>
                    </div>
                  ) : metrics.growthRates.average > 0 ? (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="font-medium text-yellow-800">Steady Growth</div>
                      <div className="text-sm text-yellow-600">
                        Your {metrics.growthRates.average.toFixed(1)}% average growth rate is positive
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-red-800">Growth Needs Attention</div>
                      <div className="text-sm text-red-600">
                        Your growth rate is negative. Focus on improvement strategies
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Growth Highlights:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Monthly growth: {metrics.growthRates.monthly > 0 ? '+' : ''}{metrics.growthRates.monthly.toFixed(1)}%</li>
                      <li>• Quarterly growth: {metrics.growthRates.quarterly > 0 ? '+' : ''}{metrics.growthRates.quarterly.toFixed(1)}%</li>
                      <li>• Yearly growth: {metrics.growthRates.yearly > 0 ? '+' : ''}{metrics.growthRates.yearly.toFixed(1)}%</li>
                      <li>• Total referrals: {analytics?.totalReferrals || 0}</li>
                      <li>• Total revenue: {formatCurrency(analytics?.totalRevenue || 0)}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Growth Recommendations
                </CardTitle>
                <CardDescription>
                  Actionable strategies to accelerate growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.growthRates.monthly < 5 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-800">Accelerate Monthly Growth</div>
                      <div className="text-sm text-blue-600">
                        Focus on increasing referral volume and quality
                      </div>
                    </div>
                  )}

                  {metrics.growthRates.quarterly < 15 && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-medium text-purple-800">Improve Quarterly Performance</div>
                      <div className="text-sm text-purple-600">
                        Implement long-term growth strategies
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Growth Strategies:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Optimize referral conversion rates</li>
                      <li>• Expand your referral network</li>
                      <li>• Improve follow-up processes</li>
                      <li>• Focus on high-value referrals</li>
                      <li>• Track and analyze growth metrics</li>
                      <li>• Set and monitor growth milestones</li>
                    </ul>
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
