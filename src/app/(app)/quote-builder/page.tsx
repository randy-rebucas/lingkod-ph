
"use client";

import QuoteBuilderClient from "@/components/quote-builder-client";
import { StoredQuotesList } from "@/components/stored-quotes-list";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { Calculator } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default function QuoteBuilderPage() {
  const { subscription } = useAuth();
  const canAccess = subscription?.status === 'active' && (subscription.planId === 'pro' || subscription.planId === 'elite');
  const t = useTranslations('QuoteBuilder');

  if (!canAccess) {
    return (
        <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold font-headline">{t('quoteBuilderTitle')}</h1>
              <p className="text-muted-foreground">
                {t('quoteBuilderDescription')}
              </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('upgradeToProOrEliteTitle')}</CardTitle>
                    <CardDescription>{t('upgradeToProOrEliteDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                    <Calculator className="h-16 w-16 mb-4" />
                    <p className="mb-4">{t('winMoreJobs')}</p>
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
        <h1 className="text-3xl font-bold font-headline">{t('quoteBuilderTitle')}</h1>
        <p className="text-muted-foreground">
          {t('quoteBuilderDescription')}
        </p>
      </div>

       <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">{t('createQuote')}</TabsTrigger>
            <TabsTrigger value="stored">{t('storedQuotes')}</TabsTrigger>
        </TabsList>
        <TabsContent value="create" className="mt-4">
            <QuoteBuilderClient />
        </TabsContent>
        <TabsContent value="stored" className="mt-4">
            <StoredQuotesList />
        </TabsContent>
       </Tabs>
    </div>
  );
}
