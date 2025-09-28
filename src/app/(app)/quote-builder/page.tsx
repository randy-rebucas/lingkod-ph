
"use client";

import QuoteBuilderClient from "@/components/quote-builder-client";
import { StoredQuotesList } from "@/components/stored-quotes-list";
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, FileText } from "lucide-react";

export default function QuoteBuilderPage() {
  const t = useTranslations('QuoteBuilder');

  return (
    <div className="container space-y-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('quoteBuilderTitle')}</h1>
        <p className="text-muted-foreground">
          {t('quoteBuilderDescription')}
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              {t('createQuote')}
            </TabsTrigger>
            <TabsTrigger value="stored" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('storedQuotes')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <QuoteBuilderClient />
          </TabsContent>

          <TabsContent value="stored" className="mt-6">
            <StoredQuotesList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

