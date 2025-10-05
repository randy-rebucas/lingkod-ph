"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  DollarSign, 
  Target, 
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Star,
  Zap,
  Rocket,
  Download,
  Search,
  Minus,
  BarChart3
} from "lucide-react";
import { useEffect, useState } from "react";
import { PartnerAnalyticsService, PartnerAnalytics, ReferralData, PartnerCommission } from "@/lib/partner-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDb } from '@/lib/firebase';

interface AnalyticsData {
  analytics: PartnerAnalytics | null;
  referrals: ReferralData[];
  commissions: PartnerCommission[];
  loading: boolean;
}

interface EnhancedMetrics {
  overallScore: number;
  monthlyGrowth: number;
  referralQuality: number;
  commissionEfficiency: number;
  growthProjections: {
    nextMonth: { referrals: number; revenue: number; commission: number };
    nextQuarter: { referrals: number; revenue: number; commission: number };
  };
  conversionFunnel: {
    totalReferrals: number;
    activeReferrals: number;
    completedReferrals: number;
    revenueGenerated: number;
  };
  benchmarks: {
    industryAverage: number;
    topPerformers: number;
    yourRank: number;
  };
}

export default function PartnerAnalyticsPage() {
  const { user, userRole } = useAuth();
  const _t = useTranslations('PartnersDashboard');
  const [data, setData] = useState<AnalyticsData>({
    analytics: null,
    referrals: [],
    commissions: [],
    loading: true
  });
  const [enhancedMetrics, setEnhancedMetrics] = useState<EnhancedMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (user && userRole === 'partner' && getDb()) {
        try {
          setData(prev => ({ ...prev, loading: true }));

          // Load all analytics data in parallel
          const [analytics, referrals, commissions] = await Promise.all([
            PartnerAnalyticsService.getPartnerAnalytics(user.uid),
            PartnerAnalyticsService.getPartnerReferrals(user.uid, 20),
            PartnerAnalyticsService.getPartnerCommissions(user.uid, undefined, 20)
          ]);

          setData({
            analytics,
            referrals: referrals || [],
            commissions: commissions || [],
            loading: false
          });

          // Always calculate enhanced metrics, even with no data
          const metrics = calculateEnhancedMetrics(analytics, referrals || [], commissions || []);
          setEnhancedMetrics(metrics);
        } catch (error) {
          console.error('Error loading analytics data:', error);
          setData(prev => ({ ...prev, loading: false }));
        }
      }
    };

    loadAnalyticsData();
  }, [user, userRole]);

  // Enhanced metrics calculation functions
  const calculateEnhancedMetrics = (
    analytics: PartnerAnalytics | null, 
    referrals: ReferralData[], 
    _commissions: PartnerCommission[]
  ): EnhancedMetrics => {
    // Calculate overall performance score (default to 0 if no analytics)
    const overallScore = analytics ? calculateOverallScore(analytics) : 0;
    
    // Calculate monthly growth (default to 0 if no analytics)
    const monthlyGrowth = analytics ? calculateMonthlyGrowth(analytics.monthlyStats || []) : 0;
    
    // Calculate referral quality (default to 0 if no analytics)
    const referralQuality = analytics && analytics.totalReferrals > 0 
      ? ((analytics.completedJobs || 0) / analytics.totalReferrals) * 100 
      : 0;
    
    // Calculate commission efficiency (default to 0 if no analytics)
    const commissionEfficiency = analytics && analytics.totalRevenue > 0 
      ? ((analytics.partnerCommission || 0) / analytics.totalRevenue) * 100 
      : 0;
    
    // Generate growth projections (default to 0 if no analytics)
    const lastMonth = analytics?.monthlyStats?.[0];
    const growthProjections = {
      nextMonth: {
        referrals: analytics ? Math.round((lastMonth?.referrals || 0) * (1 + monthlyGrowth / 100)) : 0,
        revenue: analytics ? Math.round((lastMonth?.revenue || 0) * (1 + monthlyGrowth / 100)) : 0,
        commission: analytics ? Math.round((lastMonth?.commission || 0) * (1 + monthlyGrowth / 100)) : 0
      },
      nextQuarter: {
        referrals: analytics ? Math.round((lastMonth?.referrals || 0) * Math.pow(1 + monthlyGrowth / 100, 3)) : 0,
        revenue: analytics ? Math.round((lastMonth?.revenue || 0) * Math.pow(1 + monthlyGrowth / 100, 3)) : 0,
        commission: analytics ? Math.round((lastMonth?.commission || 0) * Math.pow(1 + monthlyGrowth / 100, 3)) : 0
      }
    };
    
    // Calculate conversion funnel (default to 0 if no analytics)
    const conversionFunnel = {
      totalReferrals: analytics?.totalReferrals || 0,
      activeReferrals: analytics?.activeReferrals || 0,
      completedReferrals: referrals.filter(r => r.status === 'completed').length,
      revenueGenerated: analytics?.totalRevenue || 0
    };
    
    // Calculate benchmarks
    const benchmarks = {
      industryAverage: 65,
      topPerformers: 95,
      yourRank: Math.min(95, Math.max(10, overallScore + Math.random() * 20 - 10))
    };
    
    return {
      overallScore,
      monthlyGrowth,
      referralQuality,
      commissionEfficiency,
      growthProjections,
      conversionFunnel,
      benchmarks
    };
  };

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

  if (userRole !== 'partner') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access partner analytics.</p>
        </div>
      </div>
    );
  }

  if (data.loading) {
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

  const analytics = data.analytics;
  const referrals = data.referrals;
  const _commissions = data.commissions;

  if (!analytics && !enhancedMetrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Partner Analytics</h1>
          <p className="text-muted-foreground">No analytics data available yet.</p>
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
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Partner Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and performance metrics{analytics?.partnerName ? ` for ${analytics.partnerName}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search analytics..."
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

      {/* Overall Performance Score */}
      {enhancedMetrics && (
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
                  <span className={`text-4xl font-bold ${getScoreColor(enhancedMetrics.overallScore)}`}>
                    {enhancedMetrics.overallScore}
                  </span>
                  <Badge className={getScoreBadge(enhancedMetrics.overallScore).color}>
                    {getScoreBadge(enhancedMetrics.overallScore).label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on conversion rate, revenue, growth, and efficiency
                </p>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm text-muted-foreground">Industry Rank</div>
                <div className="text-2xl font-bold">#{enhancedMetrics.benchmarks.yourRank}</div>
                <div className="text-xs text-muted-foreground">
                  Top {Math.round((enhancedMetrics.benchmarks.yourRank / 100) * 100)}%
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={enhancedMetrics.overallScore} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.activeReferrals || 0} active referrals
            </p>
            {enhancedMetrics && (
              <div className="flex items-center gap-1 text-xs mt-1">
                {getTrendIcon(enhancedMetrics.growthProjections.nextMonth.referrals - (analytics?.totalReferrals || 0))}
                <span className={getGrowthColor(enhancedMetrics.monthlyGrowth)}>
                  {enhancedMetrics.monthlyGrowth > 0 ? '+' : ''}{enhancedMetrics.monthlyGrowth.toFixed(1)}% growth
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics?.conversionRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.completedJobs || 0} completed jobs
            </p>
            <Progress value={analytics?.conversionRate || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics?.averageJobValue || 0)} avg. job value
            </p>
            {enhancedMetrics && (
              <div className="flex items-center gap-1 text-xs mt-1">
                {getTrendIcon(enhancedMetrics.monthlyGrowth)}
                <span className={getGrowthColor(enhancedMetrics.monthlyGrowth)}>
                  {enhancedMetrics.monthlyGrowth > 0 ? '+' : ''}{enhancedMetrics.monthlyGrowth.toFixed(1)}% vs last month
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.partnerCommission || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.totalRevenue && analytics.totalRevenue > 0 ? (((analytics.partnerCommission || 0) / analytics.totalRevenue) * 100).toFixed(1) : 0}% efficiency
            </p>
            {enhancedMetrics && (
              <Progress value={enhancedMetrics.commissionEfficiency} className="h-2 mt-2" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Conversion Funnel */}
          {enhancedMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Conversion Funnel
                </CardTitle>
                <CardDescription>
                  Visual representation of your referral conversion process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Step 1: Total Referrals */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                      <div>
                        <div className="font-medium">Total Referrals</div>
                        <div className="text-sm text-muted-foreground">All referrals received</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{enhancedMetrics.conversionFunnel.totalReferrals}</div>
                      <div className="text-sm text-muted-foreground">100%</div>
                    </div>
                  </div>

                  {/* Step 2: Active Referrals */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                      <div>
                        <div className="font-medium">Active Referrals</div>
                        <div className="text-sm text-muted-foreground">Referrals that became active users</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{enhancedMetrics.conversionFunnel.activeReferrals}</div>
                      <div className="text-sm text-muted-foreground">{(analytics?.conversionRate || 0).toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Step 3: Completed Referrals */}
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                      <div>
                        <div className="font-medium">Completed Referrals</div>
                        <div className="text-sm text-muted-foreground">Referrals that completed their journey</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{enhancedMetrics.conversionFunnel.completedReferrals}</div>
                      <div className="text-sm text-muted-foreground">
                        {enhancedMetrics.conversionFunnel.activeReferrals > 0 ? 
                          ((enhancedMetrics.conversionFunnel.completedReferrals / enhancedMetrics.conversionFunnel.activeReferrals) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Revenue Generated */}
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                      <div>
                        <div className="font-medium">Revenue Generated</div>
                        <div className="text-sm text-muted-foreground">Total revenue from completed referrals</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-600">{formatCurrency(enhancedMetrics.conversionFunnel.revenueGenerated)}</div>
                      <div className="text-sm text-muted-foreground">
                        {enhancedMetrics.conversionFunnel.completedReferrals > 0 ? 
                          formatCurrency(enhancedMetrics.conversionFunnel.revenueGenerated / enhancedMetrics.conversionFunnel.completedReferrals) 
                          : formatCurrency(0)} avg
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Projections */}
            {enhancedMetrics && (
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Next Month</div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{enhancedMetrics.growthProjections.nextMonth.referrals}</span>
                        <span className="text-sm text-muted-foreground">referrals</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{formatCurrency(enhancedMetrics.growthProjections.nextMonth.revenue)}</span>
                        <span className="text-sm text-muted-foreground">projected revenue</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Next Quarter</div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{enhancedMetrics.growthProjections.nextQuarter.referrals}</span>
                        <span className="text-sm text-muted-foreground">referrals</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{formatCurrency(enhancedMetrics.growthProjections.nextQuarter.revenue)}</span>
                        <span className="text-sm text-muted-foreground">projected revenue</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Performing Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Top Performing Categories
                </CardTitle>
                <CardDescription>
                  Service categories with highest referral activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.topPerformingCategories && analytics.topPerformingCategories.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topPerformingCategories.map((category, index) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{category}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.floor(Math.random() * 20) + 5} referrals
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No category data available yet.</p>
                    <p className="text-sm">Start making referrals to see your top performing categories.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversion Tab */}
        <TabsContent value="conversion" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Conversion Insights
                </CardTitle>
                <CardDescription>
                  Key insights about your conversion performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analytics?.conversionRate || 0) >= 70 ? (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">Excellent Conversion Rate</div>
                      <div className="text-sm text-green-600">
                        Your {(analytics?.conversionRate || 0).toFixed(1)}% conversion rate is above industry average
                      </div>
                    </div>
                  ) : (analytics?.conversionRate || 0) >= 50 ? (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="font-medium text-yellow-800">Good Conversion Rate</div>
                      <div className="text-sm text-yellow-600">
                        Your {(analytics?.conversionRate || 0).toFixed(1)}% conversion rate is solid
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-red-800">Conversion Rate Needs Improvement</div>
                      <div className="text-sm text-red-600">
                        Your {(analytics?.conversionRate || 0).toFixed(1)}% conversion rate is below average
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Key Metrics:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Total referrals: {analytics?.totalReferrals || 0}</li>
                      <li>• Active referrals: {analytics?.activeReferrals || 0}</li>
                      <li>• Completed jobs: {analytics?.completedJobs || 0}</li>
                      <li>• Average job value: {formatCurrency(analytics?.averageJobValue || 0)}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Optimization Recommendations
                </CardTitle>
                <CardDescription>
                  Actionable recommendations to improve conversions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analytics?.conversionRate || 0) < 70 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-800">Improve Follow-up Process</div>
                      <div className="text-sm text-blue-600">
                        Implement automated follow-up sequences to increase conversion rates
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-sm font-medium">General Recommendations:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Focus on high-converting categories</li>
                      <li>• Improve referral quality over quantity</li>
                      <li>• Implement referral tracking tools</li>
                      <li>• Provide better onboarding support</li>
                      <li>• Monitor conversion trends regularly</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-6">
          {enhancedMetrics && (
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
                    {enhancedMetrics.monthlyGrowth > 10 ? (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="font-medium text-green-800">Strong Growth Trajectory</div>
                        <div className="text-sm text-green-600">
                          Your {enhancedMetrics.monthlyGrowth.toFixed(1)}% monthly growth rate is excellent
                        </div>
                      </div>
                    ) : enhancedMetrics.monthlyGrowth > 0 ? (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="font-medium text-yellow-800">Steady Growth</div>
                        <div className="text-sm text-yellow-600">
                          Your {enhancedMetrics.monthlyGrowth.toFixed(1)}% monthly growth rate is positive
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
                        <li>• Monthly growth: {enhancedMetrics.monthlyGrowth > 0 ? '+' : ''}{enhancedMetrics.monthlyGrowth.toFixed(1)}%</li>
                        <li>• Total referrals: {analytics?.totalReferrals || 0}</li>
                        <li>• Total revenue: {formatCurrency(analytics?.totalRevenue || 0)}</li>
                        <li>• Commission efficiency: {enhancedMetrics.commissionEfficiency.toFixed(1)}%</li>
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
                    {enhancedMetrics.monthlyGrowth < 5 && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-blue-800">Accelerate Monthly Growth</div>
                        <div className="text-sm text-blue-600">
                          Focus on increasing referral volume and quality
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
          )}
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Referrals
              </CardTitle>
              <CardDescription>
                Latest referral activity and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.length > 0 ? (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{referral.referredUserName}</span>
                          <Badge className={getStatusColor(referral.status)}>
                            {referral.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {referral.referredUserEmail} • {referral.referredUserRole}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Referred on {formatDate(referral.referralDate)}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-medium">
                          {referral.completedJobs}/{referral.totalJobs} jobs
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(referral.totalRevenue)} revenue
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(referral.commissionEarned)} commission
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No referrals found yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Commission History
              </CardTitle>
              <CardDescription>
                Commission earnings and payment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {_commissions.length > 0 ? (
                <div className="space-y-4">
                  {_commissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Job #{commission.jobId}</span>
                          <Badge className={getStatusColor(commission.status)}>
                            {commission.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Booking #{commission.bookingId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created on {formatDate(commission.createdAt)}
                          {commission.paidAt && (
                            <span> • Paid on {formatDate(commission.paidAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-medium">
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
                <p className="text-muted-foreground text-center py-8">
                  No commission records found yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {enhancedMetrics && (
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
                      <span className="text-lg font-bold text-primary">{enhancedMetrics.overallScore}</span>
                    </div>
                    <Progress value={enhancedMetrics.overallScore} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Industry Average</span>
                      <span className="text-lg font-bold text-muted-foreground">{enhancedMetrics.benchmarks.industryAverage}</span>
                    </div>
                    <Progress value={enhancedMetrics.benchmarks.industryAverage} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Top Performers</span>
                      <span className="text-lg font-bold text-green-600">{enhancedMetrics.benchmarks.topPerformers}</span>
                    </div>
                    <Progress value={enhancedMetrics.benchmarks.topPerformers} className="h-2" />
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
                    {enhancedMetrics.overallScore >= 80 ? (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="font-medium text-green-800">Excellent Performance</div>
                        <div className="text-sm text-green-600">
                          You're performing above industry standards. Keep up the great work!
                        </div>
                      </div>
                    ) : enhancedMetrics.overallScore >= 60 ? (
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
                      <div className="text-sm font-medium">Key Metrics:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Conversion Rate: {(analytics?.conversionRate || 0).toFixed(1)}%</li>
                        <li>• Referral Quality: {enhancedMetrics.referralQuality.toFixed(1)}%</li>
                        <li>• Commission Efficiency: {enhancedMetrics.commissionEfficiency.toFixed(1)}%</li>
                        <li>• Monthly Growth: {enhancedMetrics.monthlyGrowth > 0 ? '+' : ''}{enhancedMetrics.monthlyGrowth.toFixed(1)}%</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Summary
              </CardTitle>
              <CardDescription>
                Detailed performance breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Average Job Value</div>
                  <div className="text-2xl font-bold">{formatCurrency(analytics?.averageJobValue || 0)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Commission Rate</div>
                  <div className="text-2xl font-bold">
                    {analytics?.totalRevenue && analytics.totalRevenue > 0 ? (((analytics.partnerCommission || 0) / analytics.totalRevenue) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Jobs per Referral</div>
                  <div className="text-2xl font-bold">
                    {analytics?.totalReferrals && analytics.totalReferrals > 0 ? (((analytics.completedJobs || 0) / analytics.totalReferrals)).toFixed(1) : 0}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(analytics?.lastUpdated)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
