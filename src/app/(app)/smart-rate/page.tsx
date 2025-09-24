
"use client";

import SmartRateClient from "@/components/smart-rate-client";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { designTokens } from "@/lib/design-tokens";

export default function SmartRatePage() {
    const t = useTranslations('SmartRate');

  return (
    <PageLayout 
      title={t('smartRateTitle')} 
      description={t('smartRateDescription')}
    >
      <SmartRateClient />
    </PageLayout>
  );
}
