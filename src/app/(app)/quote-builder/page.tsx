
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
  const t = useTranslations('QuoteBuilder');


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
