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
  Users, 
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Filter,
  Eye
} from "lucide-react";
import { useEffect, useState } from "react";
import { PartnerAnalyticsService, PartnerAnalytics, ReferralData } from "@/lib/partner-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from '@/lib/firebase';

interface ConversionMetrics {
  overallConversionRate: number;
  referralToActive: number;
  activeToCompleted: number;
  completedToRevenue: number;
  funnelMetrics: {
    totalReferrals: number;
    activeReferrals: number;
    completedReferrals: number;
    revenueGenerated: number;
  };
  conversionTrends: Array<{
    period: string;
    referrals: number;
    active: number;
    completed: number;
    conversionRate: number;
  }>;
  categoryConversions: Array<{
    category: string;
    referrals: number;
    conversions: number;
    rate: number;
    revenue: number;
  }>;
  timeToConversion: {
    average: number;
    median: number;
    fastest: number;
    slowest: number;
  };
}

export default function ConversionAnalyticsPage() {
  const { user, userRole } = useAuth();
  const t = useTranslations('Partners');
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [analytics, setAnalytics] = useState<PartnerAnalytics | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversionData = async () => {
      if (user && userRole === 'partner' && getDb()) {
        try {
          setLoading(true);

          // Load analytics and referrals data
          const [analyticsData, referralsData] = await Promise.all([
            PartnerAnalyticsService.getPartnerAnalytics(user.uid),
            PartnerAnalyticsService.getPartnerReferrals(user.uid, 100)
          ]);

          setAnalytics(analyticsData);
          setReferrals(referralsData || []);

          // Always create metrics, even with no data
          const referrals = referralsData || [];
          
          // Calculate conversion metrics (default to 0 if no data)
          const totalReferrals = referrals.length;
          const activeReferrals = referrals.filter(r => r.status === 'active').length;
          const completedReferrals = referrals.filter(r => r.status === 'completed').length;
          const revenueGenerated = referrals.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);

          const overallConversionRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;
          const referralToActive = overallConversionRate;
          const activeToCompleted = activeReferrals > 0 ? (completedReferrals / activeReferrals) * 100 : 0;
          const completedToRevenue = completedReferrals > 0 ? (revenueGenerated / completedReferrals) : 0;

            // Generate conversion trends (mock data for now)
            const conversionTrends = [
              { period: 'Week 1', referrals: 5, active: 3, completed: 2, conversionRate: 60 },
              { period: 'Week 2', referrals: 8, active: 5, completed: 3, conversionRate: 62.5 },
              { period: 'Week 3', referrals: 12, active: 8, completed: 5, conversionRate: 66.7 },
              { period: 'Week 4', referrals: 15, active: 10, completed: 7, conversionRate: 66.7 },
              { period: 'Week 5', referrals: 18, active: 12, completed: 9, conversionRate: 66.7 },
              { period: 'Week 6', referrals: 22, active: 15, completed: 11, conversionRate: 68.2 }
            ];

            // Generate category conversions (mock data for now)
            const categoryConversions = [
              { category: 'Home Services', referrals: 8, conversions: 6, rate: 75, revenue: 18000 },
              { category: 'Professional Services', referrals: 6, conversions: 4, rate: 66.7, revenue: 15000 },
              { category: 'Technology', referrals: 4, conversions: 3, rate: 75, revenue: 12000 },
              { category: 'Healthcare', referrals: 3, conversions: 2, rate: 66.7, revenue: 8000 },
              { category: 'Education', referrals: 1, conversions: 0, rate: 0, revenue: 0 }
            ];

            // Calculate time to conversion (mock data for now)
            const timeToConversion = {
              average: 7.5,
              median: 6,
              fastest: 2,
              slowest: 21
            };

          setMetrics({
            overallConversionRate,
            referralToActive,
            activeToCompleted,
            completedToRevenue,
            funnelMetrics: {
              totalReferrals,
              activeReferrals,
              completedReferrals,
              revenueGenerated
            },
            conversionTrends,
            categoryConversions,
            timeToConversion
          });

        } catch (error) {
          console.error('Error loading conversion data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadConversionData();
  }, [user, userRole]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (current < previous) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
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
          <h1 className="text-2xl font-bold mb-4">Conversion Analytics</h1>
          <p className="text-muted-foreground">No conversion data available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <PartnerAccessGuard>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Conversion Analytics</h1>
        <p className="text-muted-foreground">
          Analyze your referral conversion funnel and optimization opportunities
        </p>
      </div>

      {/* Key Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Conversion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getConversionColor(metrics.overallConversionRate)}`}>
              {metrics.overallConversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.funnelMetrics.activeReferrals} of {metrics.funnelMetrics.totalReferrals} referrals
            </p>
            <Progress value={metrics.overallConversionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active to Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getConversionColor(metrics.activeToCompleted)}`}>
              {metrics.activeToCompleted.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.funnelMetrics.completedReferrals} completed referrals
            </p>
            <Progress value={metrics.activeToCompleted} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue per Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.completedToRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average revenue per completed referral
            </p>
            <Progress value={Math.min(100, Math.max(0, (metrics.completedToRevenue / 5000) * 100))} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time to Conversion</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.timeToConversion.average} days
            </div>
            <p className="text-xs text-muted-foreground">
              Average time from referral to active
            </p>
            <Progress value={Math.min(100, Math.max(0, (30 - metrics.timeToConversion.average) / 30 * 100))} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
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
          <div className="space-y-6">
            {/* Funnel Steps */}
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
                  <div className="text-2xl font-bold text-blue-600">{metrics.funnelMetrics.totalReferrals}</div>
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
                  <div className="text-2xl font-bold text-green-600">{metrics.funnelMetrics.activeReferrals}</div>
                  <div className="text-sm text-muted-foreground">{metrics.overallConversionRate.toFixed(1)}%</div>
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
                  <div className="text-2xl font-bold text-purple-600">{metrics.funnelMetrics.completedReferrals}</div>
                  <div className="text-sm text-muted-foreground">{metrics.activeToCompleted.toFixed(1)}%</div>
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
                  <div className="text-2xl font-bold text-yellow-600">{formatCurrency(metrics.funnelMetrics.revenueGenerated)}</div>
                  <div className="text-sm text-muted-foreground">{formatCurrency(metrics.completedToRevenue)} avg</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Conversion Trends
              </CardTitle>
              <CardDescription>
                Weekly conversion rate trends over the last 6 weeks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.funnelMetrics.totalReferrals > 0 ? (
                  metrics.conversionTrends.map((trend, index) => {
                    const previousTrend = index > 0 ? metrics.conversionTrends[index - 1] : null;
                    return (
                      <div key={trend.period} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{trend.period}</div>
                          <div className="text-sm text-muted-foreground">
                            {trend.referrals} referrals → {trend.active} active → {trend.completed} completed
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{trend.conversionRate.toFixed(1)}%</span>
                            {previousTrend && getTrendIcon(trend.conversionRate, previousTrend.conversionRate)}
                          </div>
                          <Progress value={trend.conversionRate} className="h-2 w-20" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No conversion trends data available yet.</p>
                    <p className="text-sm">Start making referrals to see your conversion trends.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Category Conversion Rates
              </CardTitle>
              <CardDescription>
                Conversion performance by service category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.funnelMetrics.totalReferrals > 0 ? (
                  metrics.categoryConversions.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{category.category}</span>
                          <Badge variant="outline">{category.referrals} referrals</Badge>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${getConversionColor(category.rate)}`}>
                            {category.rate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(category.revenue)} revenue
                          </div>
                        </div>
                      </div>
                      <Progress value={category.rate} className="h-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No category conversion data available yet.</p>
                    <p className="text-sm">Start making referrals to see conversion rates by category.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
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
                  {metrics.overallConversionRate >= 70 ? (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">Excellent Conversion Rate</div>
                      <div className="text-sm text-green-600">
                        Your {metrics.overallConversionRate.toFixed(1)}% conversion rate is above industry average
                      </div>
                    </div>
                  ) : metrics.overallConversionRate >= 50 ? (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="font-medium text-yellow-800">Good Conversion Rate</div>
                      <div className="text-sm text-yellow-600">
                        Your {metrics.overallConversionRate.toFixed(1)}% conversion rate is solid
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-red-800">Conversion Rate Needs Improvement</div>
                      <div className="text-sm text-red-600">
                        Your {metrics.overallConversionRate.toFixed(1)}% conversion rate is below average
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Key Metrics:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Average time to conversion: {metrics.timeToConversion.average} days</li>
                      <li>• Fastest conversion: {metrics.timeToConversion.fastest} days</li>
                      <li>• Revenue per completed referral: {formatCurrency(metrics.completedToRevenue)}</li>
                      <li>• Total revenue generated: {formatCurrency(metrics.funnelMetrics.revenueGenerated)}</li>
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
                  {metrics.overallConversionRate < 70 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-800">Improve Follow-up Process</div>
                      <div className="text-sm text-blue-600">
                        Implement automated follow-up sequences to increase conversion rates
                      </div>
                    </div>
                  )}

                  {metrics.timeToConversion.average > 10 && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-medium text-purple-800">Reduce Time to Conversion</div>
                      <div className="text-sm text-purple-600">
                        Focus on faster onboarding and immediate value delivery
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
      </Tabs>
      </div>
    </PartnerAccessGuard>
  );
}
