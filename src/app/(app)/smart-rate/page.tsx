
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('smartRateTitle')}</h1>
        <p className="text-muted-foreground">
          {t('smartRateDescription')}
        </p>
      </div>
      <SmartRateClient />
    </div>
  );
}
