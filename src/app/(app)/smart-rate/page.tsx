
"use client";

import SmartRateClient from "@/components/smart-rate-client";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SmartRatePage() {
    const t = useTranslations('SmartRate');

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
