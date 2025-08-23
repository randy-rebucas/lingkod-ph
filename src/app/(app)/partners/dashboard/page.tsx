
"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake, Users, Briefcase, BarChart2 } from "lucide-react";

export default function PartnersDashboardPage() {
    const { user, userRole } = useAuth();
    const t = useTranslations('Partners');

    if (userRole !== 'partner') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('accessDenied')}</CardTitle>
                    <CardDescription>{t('partnersOnly')}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">{t('title', { name: user?.displayName || 'User' })}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('referredProviders')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">{t('providersOnboarded')}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('completedJobs')}</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">{t('jobsCompleted')}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('communityImpact')}</CardTitle>
                        <Handshake className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{t('comingSoon')}</div>
                        <p className="text-xs text-muted-foreground">{t('localEconomicImpact')}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('reports')}</CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{t('comingSoon')}</div>
                        <p className="text-xs text-muted-foreground">{t('partnershipReports')}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
