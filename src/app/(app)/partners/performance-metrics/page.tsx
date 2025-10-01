"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { PartnerAccessGuard } from "@/components/partner-access-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Target, 
  Award, 
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Zap,
  Trophy,
  Star,
  Clock,
  CheckCircle,
  Users,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { useEffect, useState } from "react";
import { PartnerAnalyticsService, PartnerAnalytics, ReferralData, PartnerCommission } from "@/lib/partner-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from '@/lib/firebase';

interface PerformanceMetrics {
  overallScore: number;
  conversionRate: number;
  averageJobValue: number;
  monthlyGrowth: number;
  referralQuality: number;
  commissionEfficiency: number;
  topCategories: Array<{ category: string; count: number; revenue: number }>;
  monthlyTrends: Array<{ month: string; score: number; referrals: number; revenue: number }>;
  benchmarks: {
    industryAverage: number;
    topPerformers: number;
    yourRank: number;
  };
}

export default function PerformanceMetricsPage() {
  const { user, userRole } = useAuth();
  const t = useTranslations('Partners');
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [analytics, setAnalytics] = useState<PartnerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPerformanceData = async () => {
      if (user && userRole === 'partner' && getDb()) {
        try {
          setLoading(true);

          // Load analytics data
          const analyticsData = await PartnerAnalyticsService.getPartnerAnalytics(user.uid);
          setAnalytics(analyticsData);

          // Always create metrics, even with no data
          // Calculate performance metrics (default to 0 if no data)
          const overallScore = analyticsData ? calculateOverallScore(analyticsData) : 0;
          const conversionRate = analyticsData?.conversionRate || 0;
          const averageJobValue = analyticsData?.averageJobValue || 0;
          const monthlyGrowth = analyticsData ? calculateMonthlyGrowth(analyticsData.monthlyStats || []) : 0;
          const referralQuality = analyticsData ? calculateReferralQuality(analyticsData) : 0;
          const commissionEfficiency = analyticsData ? calculateCommissionEfficiency(analyticsData) : 0;

            // Generate top categories (mock data for now)
            const topCategories = [
              { category: 'Home Services', count: 15, revenue: 45000 },
              { category: 'Professional Services', count: 12, revenue: 38000 },
              { category: 'Technology', count: 8, revenue: 25000 },
              { category: 'Healthcare', count: 6, revenue: 18000 },
              { category: 'Education', count: 4, revenue: 12000 }
            ];

            // Generate monthly trends (mock data for now)
            const monthlyTrends = [
              { month: 'Jan', score: 75, referrals: 8, revenue: 12000 },
              { month: 'Feb', score: 82, referrals: 12, revenue: 18000 },
              { month: 'Mar', score: 78, referrals: 10, revenue: 15000 },
              { month: 'Apr', score: 85, referrals: 15, revenue: 22000 },
              { month: 'May', score: 88, referrals: 18, revenue: 28000 },
              { month: 'Jun', score: 92, referrals: 22, revenue: 35000 }
            ];

            // Calculate benchmarks
            const benchmarks = {
              industryAverage: 65,
              topPerformers: 95,
              yourRank: Math.min(95, Math.max(10, overallScore + Math.random() * 20 - 10))
            };

          setMetrics({
            overallScore,
            conversionRate,
            averageJobValue,
            monthlyGrowth,
            referralQuality,
            commissionEfficiency,
            topCategories,
            monthlyTrends,
            benchmarks
          });

        } catch (error) {
          console.error('Error loading performance data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadPerformanceData();
  }, [user, userRole]);

  const calculateOverallScore = (analytics: PartnerAnalytics): number => {
    if (!analytics) return 0;
    
    const conversionWeight = 0.3;
    const revenueWeight = 0.25;
    const growthWeight = 0.2;
    const consistencyWeight = 0.15;
    const efficiencyWeight = 0.1;

    const conversionScore = Math.min(100, (analytics.conversionRate || 0) * 2);
    const revenueScore = Math.min(100, ((analytics.totalRevenue || 0) / 10000) * 20);
    const growthScore = Math.min(100, Math.max(0, 50 + ((analytics.monthlyStats?.length || 0) > 1 ? 20 : 0)));
    const consistencyScore = Math.min(100, ((analytics.totalReferrals || 0) / 20) * 20);
    const efficiencyScore = analytics.totalRevenue && analytics.totalRevenue > 0 
      ? Math.min(100, ((analytics.partnerCommission || 0) / analytics.totalRevenue) * 1000)
      : 0;

    return Math.round(
      conversionScore * conversionWeight +
      revenueScore * revenueWeight +
      growthScore * growthWeight +
      consistencyScore * consistencyWeight +
      efficiencyScore * efficiencyWeight
    );
  };

  const calculateMonthlyGrowth = (monthlyStats: any[]): number => {
    if (!monthlyStats || monthlyStats.length < 2) return 0;
    const current = monthlyStats[0];
    const previous = monthlyStats[1];
    if (!current || !previous || previous.revenue === 0) return 0;
    return ((current.revenue - previous.revenue) / previous.revenue) * 100;
  };

  const calculateReferralQuality = (analytics: PartnerAnalytics): number => {
    if (!analytics || analytics.totalReferrals === 0) return 0;
    const qualityScore = ((analytics.completedJobs || 0) / analytics.totalReferrals) * 100;
    return Math.min(100, qualityScore);
  };

  const calculateCommissionEfficiency = (analytics: PartnerAnalytics): number => {
    if (!analytics || analytics.totalRevenue === 0) return 0;
    const efficiency = ((analytics.partnerCommission || 0) / analytics.totalRevenue) * 100;
    return Math.min(100, efficiency * 10);
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { label: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
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
          <h1 className="text-2xl font-bold mb-4">Performance Metrics</h1>
          <p className="text-muted-foreground">No performance data available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <PartnerAccessGuard>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Performance Metrics</h1>
        <p className="text-muted-foreground">
          Comprehensive performance analysis and benchmarking
        </p>
      </div>

      {/* Overall Performance Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            Overall Performance Score
          </CardTitle>
          <CardDescription>
            Your comprehensive performance rating based on multiple metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-4xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore}
                </span>
                <Badge className={getScoreBadge(metrics.overallScore).color}>
                  {getScoreBadge(metrics.overallScore).label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on conversion rate, revenue, growth, and efficiency
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">Industry Rank</div>
              <div className="text-2xl font-bold">#{metrics.benchmarks.yourRank}</div>
              <div className="text-xs text-muted-foreground">
                Top {Math.round((metrics.benchmarks.yourRank / 100) * 100)}%
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={metrics.overallScore} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(metrics.conversionRate - 50)}
              <span>Industry avg: 50%</span>
            </div>
            <Progress value={metrics.conversionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Quality</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.referralQuality.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(metrics.referralQuality - 60)}
              <span>Quality score</span>
            </div>
            <Progress value={metrics.referralQuality} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.commissionEfficiency.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(metrics.commissionEfficiency - 70)}
              <span>Efficiency rating</span>
            </div>
            <Progress value={metrics.commissionEfficiency} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.monthlyGrowth.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(metrics.monthlyGrowth)}
              <span>vs last month</span>
            </div>
            <Progress value={Math.min(100, Math.max(0, metrics.monthlyGrowth + 50))} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Performance Breakdown
                </CardTitle>
                <CardDescription>
                  How your overall score is calculated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm font-bold">{metrics.conversionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.conversionRate} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Revenue Performance</span>
                    <span className="text-sm font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</span>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, ((analytics?.totalRevenue || 0) / 50000) * 100))} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Growth Rate</span>
                    <span className="text-sm font-bold">{metrics.monthlyGrowth.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, metrics.monthlyGrowth + 50))} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Consistency</span>
                    <span className="text-sm font-bold">{analytics?.totalReferrals || 0} referrals</span>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, ((analytics?.totalReferrals || 0) / 50) * 100))} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Key Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Key Achievements
                </CardTitle>
                <CardDescription>
                  Your performance highlights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-800">High Conversion Rate</div>
                      <div className="text-sm text-green-600">
                        {metrics.conversionRate.toFixed(1)}% above industry average
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-800">Strong Growth</div>
                      <div className="text-sm text-blue-600">
                        {metrics.monthlyGrowth > 0 ? '+' : ''}{metrics.monthlyGrowth.toFixed(1)}% monthly growth
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Star className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-purple-800">Quality Referrals</div>
                      <div className="text-sm text-purple-600">
                        {metrics.referralQuality.toFixed(1)}% quality score
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <div>
                      <div className="font-medium text-yellow-800">Efficient Operations</div>
                      <div className="text-sm text-yellow-600">
                        {metrics.commissionEfficiency.toFixed(1)}% efficiency rating
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Category Performance
              </CardTitle>
              <CardDescription>
                Performance breakdown by service category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.overallScore > 0 ? (
                  metrics.topCategories.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(category.revenue)}</div>
                          <div className="text-sm text-muted-foreground">{category.count} referrals</div>
                        </div>
                      </div>
                      <Progress value={
                        metrics.topCategories.some(c => c.revenue > 0) 
                          ? (category.revenue / Math.max(...metrics.topCategories.map(c => c.revenue))) * 100 
                          : 0
                      } className="h-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No category performance data available yet.</p>
                    <p className="text-sm">Start making referrals to see your category performance.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                Monthly performance trends over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.overallScore > 0 ? (
                  metrics.monthlyTrends.map((trend, index) => (
                    <div key={trend.month} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{trend.month}</div>
                        <div className="text-sm text-muted-foreground">
                          {trend.referrals} referrals • {formatCurrency(trend.revenue)} revenue
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{trend.score}</span>
                          <Badge className={getScoreBadge(trend.score).color}>
                            {getScoreBadge(trend.score).label}
                          </Badge>
                        </div>
                        <Progress value={trend.score} className="h-2 w-20" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No performance trends data available yet.</p>
                    <p className="text-sm">Start making referrals to see your performance trends.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Industry Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Industry Comparison
                </CardTitle>
                <CardDescription>
                  How you compare to industry standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Your Score</span>
                    <span className="text-lg font-bold text-primary">{metrics.overallScore}</span>
                  </div>
                  <Progress value={metrics.overallScore} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Industry Average</span>
                    <span className="text-lg font-bold text-muted-foreground">{metrics.benchmarks.industryAverage}</span>
                  </div>
                  <Progress value={metrics.benchmarks.industryAverage} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Top Performers</span>
                    <span className="text-lg font-bold text-green-600">{metrics.benchmarks.topPerformers}</span>
                  </div>
                  <Progress value={metrics.benchmarks.topPerformers} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance Insights
                </CardTitle>
                <CardDescription>
                  Key insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.overallScore >= 80 ? (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">Excellent Performance</div>
                      <div className="text-sm text-green-600">
                        You're performing above industry standards. Keep up the great work!
                      </div>
                    </div>
                  ) : metrics.overallScore >= 60 ? (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="font-medium text-yellow-800">Good Performance</div>
                      <div className="text-sm text-yellow-600">
                        You're on track. Focus on improving conversion rates to reach the next level.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-red-800">Needs Improvement</div>
                      <div className="text-sm text-red-600">
                        Focus on increasing referral quality and conversion rates.
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Recommendations:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Focus on high-quality referrals</li>
                      <li>• Improve follow-up processes</li>
                      <li>• Expand referral network</li>
                      <li>• Monitor performance trends</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </PartnerAccessGuard>
  );
}
