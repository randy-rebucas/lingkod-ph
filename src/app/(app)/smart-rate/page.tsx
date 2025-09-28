
"use client";

import SmartRateClient from "@/components/smart-rate-client";
import { useTranslations } from 'next-intl';

export default function SmartRatePage() {
  const t = useTranslations('SmartRate');

  return (

    <div className="container space-y-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('smartRateTitle')}</h1>
        <p className="text-muted-foreground">
          {t('smartRateDescription')}
        </p>
      </div>
      {/* Main Content Section */}
      <div className="max-w-6xl mx-auto">
        <SmartRateClient />
      </div>
    </div>
  );
}

