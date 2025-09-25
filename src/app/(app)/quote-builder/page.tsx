
"use client";

import React from "react";

import QuoteBuilderClient from "@/components/quote-builder-client";
import { StoredQuotesList } from "@/components/stored-quotes-list";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { Calculator } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { designTokens } from "@/lib/design-tokens";


export default function QuoteBuilderPage() {
  const t = useTranslations('QuoteBuilder');


  return (
    <PageLayout 
      title={t('quoteBuilderTitle')} 
      description={t('quoteBuilderDescription')}
    >

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
    </PageLayout>
  );
}
