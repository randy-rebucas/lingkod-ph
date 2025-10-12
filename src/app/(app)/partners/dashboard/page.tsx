
"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, DollarSign, TrendingUp, Target, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPartnerDashboardData } from './actions';
import PartnerOnboardingBanner from "@/components/partner-onboarding-banner";

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
    const t = useTranslations('PartnersDashboard');
    const [dashboardData, setDashboardData] = useState<PartnerDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    // Debug: Log user role to console
    console.log('Partner Dashboard - User Role:', userRole);
    console.log('Partner Dashboard - User:', user);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (user && userRole === 'partner') {
                try {
                    const result = await getPartnerDashboardData(user.uid);
                    if (result.success && result.data) {
                        setDashboardData(result.data);
                    } else {
                        console.error('Error loading dashboard data:', result.error);
                    }
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
        return (
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('accessDenied')}</CardTitle>
                            <CardDescription>{t('partnersOnly')}</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96 mt-2" />
                </div>
                <div className=" mx-auto">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-3 w-20 mt-2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container space-y-8">
            {/* Partner Onboarding Banner */}
            <PartnerOnboardingBanner />
            
            <div className=" mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('dashboardTitle', { name: user?.displayName || 'User' })}</h1>
                <p className="text-muted-foreground">{t('dashboardSubtitle')}</p>
            </div>
            
            <div className=" mx-auto">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('totalReferrals')}</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{dashboardData?.totalReferrals || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData?.activeReferrals || 0} {t('activeReferrals')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('completedJobs')}</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{dashboardData?.completedJobs || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                ₱{dashboardData?.averageJobValue?.toLocaleString() || '0'} {t('averageJobValue')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('totalRevenue')}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">₱{dashboardData?.totalRevenue?.toLocaleString() || '0'}</div>
                            <p className="text-xs text-muted-foreground">
                                {(dashboardData?.monthlyGrowth || 0) > 0 ? '+' : ''}{(dashboardData?.monthlyGrowth || 0).toFixed(1)}% {t('monthlyGrowth')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('totalCommission')}</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">₱{dashboardData?.totalCommission?.toLocaleString() || '0'}</div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData?.conversionRate?.toFixed(1) || '0'}% {t('conversionRate')}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className=" mx-auto">
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
            </div>
        </div>
    );
}
