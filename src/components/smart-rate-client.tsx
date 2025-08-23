"use client";

import { useActionState, useEffect, useState } from "react";
import { handleSuggestSmartRate, type FormState } from "./smart-rate-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Bot, DollarSign, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from 'next-intl';

const initialState: FormState = {
  data: null,
  error: null,
  message: "",
};

export default function SmartRateClient() {
  const [state, formAction, isPending] = useActionState(handleSuggestSmartRate, initialState);
  const [displayResult, setDisplayResult] = useState<FormState['data']>(null);
  const t = useTranslations('SmartRate');

  useEffect(() => {
    if (state.data) {
        setDisplayResult(state.data);
    }
  }, [state.data]);


  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="shadow-lg">
        <form action={formAction}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-accent" />
              <span>{t('title')}</span>
            </CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="servicesOffered">{t('servicesOffered')}</Label>
              <Textarea
                id="servicesOffered"
                name="servicesOffered"
                placeholder={t('servicesPlaceholder')}
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t('location')}</Label>
              <Input
                id="location"
                name="location"
                placeholder={t('locationPlaceholder')}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('locationHint')}
              </p>
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? t('analyzing') : t('getSuggestion')}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Bot className="text-primary" />
                <span>{t('aiPoweredSuggestion')}</span>
            </CardTitle>
            <CardDescription>
                {t('analysisWillAppear')}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isPending ? (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-12 w-1/3" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            ) : displayResult ? (
                <div className="space-y-6">
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-muted-foreground">
                            <DollarSign className="h-5 w-5"/>
                            {t('suggestedRate')}
                        </h3>
                        <p className="text-4xl font-bold text-primary">
                            ₱{displayResult.suggestedRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                     <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-muted-foreground">
                            <Lightbulb className="h-5 w-5"/>
                            {t('reasoning')}
                        </h3>
                        <p className="text-foreground/90 whitespace-pre-wrap">
                            {displayResult.reasoning}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed">
                    <Sparkles className="h-12 w-12 mb-4" />
                    <p>{t('suggestionWillShow')}</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
