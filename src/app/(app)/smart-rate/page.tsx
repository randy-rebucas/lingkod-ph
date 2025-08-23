
"use client";

import SmartRateClient from "@/components/smart-rate-client";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SmartRatePage() {
    const { subscription } = useAuth();
    const isPaidSubscriber = subscription?.status === 'active' && subscription.planId !== 'free';
    const t = useTranslations('SmartRate');

    if (!isPaidSubscriber) {
        return (
            <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">{t('smartRateTitle')}</h1>
                    <p className="text-muted-foreground">
                    {t('smartRateDescription')}
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('upgradeToAccessSmartRateTitle')}</CardTitle>
                        <CardDescription>{t('upgradeToAccessSmartRateDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <Sparkles className="h-16 w-16 mb-4" />
                        <p className="mb-4">{t('getCompetitiveAndProfitable')}</p>
                         <Button asChild>
                            <Link href="/subscription">{t('viewSubscriptionPlans')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t('smartRateTitle')}</h1>
        <p className="text-muted-foreground">
          {t('smartRateDescription')}
        </p>
      </div>
      <SmartRateClient />
    </div>
  );
}
