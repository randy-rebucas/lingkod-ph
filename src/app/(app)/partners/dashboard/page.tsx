
"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake, Users, Briefcase, BarChart2, DollarSign, TrendingUp, Target, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { PartnerAnalyticsService } from "@/lib/partner-analytics";
import { PartnerReferralTracker } from "@/lib/partner-referral-tracker";
import { PartnerCommissionManager } from "@/lib/partner-commission-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { AccessDenied } from "@/components/app/access-denied";
import { designTokens } from "@/lib/design-tokens";

interface PartnerDashboardData {
    totalReferrals: number;
    activeReferrals: number;
    completedJobs: number;
    totalRevenue: number;
    totalCommission: number;
    conversionRate: number;
    averageJobValue: number;
    topCategories: string[];
    monthlyGrowth: number;
}

export default function PartnersDashboardPage() {
    const { user, userRole } = useAuth();
    const t = useTranslations('Partners');
    const [dashboardData, setDashboardData] = useState<PartnerDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (user && userRole === 'partner') {
                try {
                    // Get performance metrics
                    const performanceMetrics = await PartnerAnalyticsService.getPartnerPerformanceMetrics(user.uid);
                    
                    // Get referral statistics
                    const referralStats = await PartnerReferralTracker.getReferralStatistics(user.uid);
                    
                    // Get commission summary
                    const commissionSummary = await PartnerCommissionManager.getCommissionSummary(user.uid);

                    setDashboardData({
                        totalReferrals: performanceMetrics.totalReferrals,
                        activeReferrals: performanceMetrics.activeReferrals,
                        completedJobs: performanceMetrics.totalReferrals, // Using total referrals as completed jobs for now
                        totalRevenue: performanceMetrics.totalRevenue,
                        totalCommission: performanceMetrics.totalCommission,
                        conversionRate: performanceMetrics.conversionRate,
                        averageJobValue: performanceMetrics.averageJobValue,
                        topCategories: performanceMetrics.topCategories,
                        monthlyGrowth: performanceMetrics.monthlyGrowth
                    });
                } catch (error) {
                    console.error('Error loading dashboard data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadDashboardData();
    }, [user, userRole]);

    if (userRole !== 'partner') {
        return <AccessDenied 
            title={t('accessDenied')} 
            description={t('partnersOnly')} 
        />;
    }

    if (loading) {
        return <LoadingState 
            title={t('dashboardTitle', { name: user?.displayName || 'User' })} 
            description={t('dashboardSubtitle')} 
        />;
    }

    return (
        <PageLayout 
            title={t('dashboardTitle', { name: user?.displayName || 'User' })} 
            description={t('dashboardSubtitle')}
        >
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalReferrals')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData?.totalReferrals || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {dashboardData?.activeReferrals || 0} {t('activeReferrals')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('completedJobs')}</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData?.completedJobs || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            ₱{dashboardData?.averageJobValue?.toLocaleString() || '0'} {t('averageJobValue')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{dashboardData?.totalRevenue?.toLocaleString() || '0'}</div>
                        <p className="text-xs text-muted-foreground">
                            {(dashboardData?.monthlyGrowth || 0) > 0 ? '+' : ''}{(dashboardData?.monthlyGrowth || 0).toFixed(1)}% {t('monthlyGrowth')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalCommission')}</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{dashboardData?.totalCommission?.toLocaleString() || '0'}</div>
                        <p className="text-xs text-muted-foreground">
                            {dashboardData?.conversionRate?.toFixed(1) || '0'}% {t('conversionRate')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            {t('performanceMetrics')}
                        </CardTitle>
                        <CardDescription>{t('performanceMetricsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{t('conversionRate')}</span>
                            <span className="text-sm text-muted-foreground">
                                {dashboardData?.conversionRate?.toFixed(1) || '0'}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{t('averageJobValue')}</span>
                            <span className="text-sm text-muted-foreground">
                                ₱{dashboardData?.averageJobValue?.toLocaleString() || '0'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{t('monthlyGrowth')}</span>
                            <span className={`text-sm ${dashboardData?.monthlyGrowth && dashboardData.monthlyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {dashboardData?.monthlyGrowth && dashboardData.monthlyGrowth > 0 ? '+' : ''}{dashboardData?.monthlyGrowth?.toFixed(1) || '0'}%
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            {t('topCategories')}
                        </CardTitle>
                        <CardDescription>{t('topCategoriesDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dashboardData?.topCategories && dashboardData.topCategories.length > 0 ? (
                            <div className="space-y-2">
                                {dashboardData.topCategories.slice(0, 5).map((category, index) => (
                                    <div key={category} className="flex justify-between items-center">
                                        <span className="text-sm font-medium">{category}</span>
                                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">{t('noDataAvailable')}</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
