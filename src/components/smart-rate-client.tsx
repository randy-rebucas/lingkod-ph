"use client";

import { useActionState, useEffect, useState } from "react";
import { handleSuggestSmartRate, type FormState } from "./smart-rate-actions";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Sparkles, Bot, DollarSign, Lightbulb, TrendingUp, MapPin, Target, BarChart3, Zap, Award } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

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
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
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
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="serviceCategory">Service Category</Label>
                <Select name="serviceCategory" defaultValue="technology">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <Select name="experienceLevel" defaultValue="intermediate">
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (5-10 years)</SelectItem>
                    <SelectItem value="expert">Expert (10+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectScope">Project Scope</Label>
                <Select name="projectScope" defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select project scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1-2 weeks)</SelectItem>
                    <SelectItem value="medium">Medium (1-2 months)</SelectItem>
                    <SelectItem value="large">Large (3+ months)</SelectItem>
                    <SelectItem value="ongoing">Ongoing/Retainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientBudget">Client Budget Range (Optional)</Label>
                <Select name="clientBudget" defaultValue="flexible">
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (₱10K - ₱50K)</SelectItem>
                    <SelectItem value="medium">Medium (₱50K - ₱200K)</SelectItem>
                    <SelectItem value="high">High (₱200K+)</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    {t('analyzing')}
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    {t('getSuggestion')}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
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
                      <div className="text-center p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                          <h3 className="flex items-center justify-center gap-2 text-lg font-semibold text-muted-foreground mb-2">
                              <DollarSign className="h-5 w-5"/>
                              {t('suggestedRate')}
                          </h3>
                          <p className="text-4xl font-bold text-primary mb-2">
                              ₱{displayResult.suggestedRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-muted-foreground">Per hour</p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                          <div className="p-4 rounded-lg bg-muted/20 text-center">
                              <div className="text-2xl font-bold text-primary">₱{(displayResult.suggestedRate * 8).toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">Daily Rate</div>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/20 text-center">
                              <div className="text-2xl font-bold text-primary">₱{(displayResult.suggestedRate * 160).toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">Monthly Rate</div>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/20 text-center">
                              <div className="text-2xl font-bold text-primary">₱{(displayResult.suggestedRate * 1920).toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">Annual Rate</div>
                          </div>
                      </div>

                      <div>
                          <h3 className="flex items-center gap-2 text-lg font-semibold text-muted-foreground mb-3">
                              <Lightbulb className="h-5 w-5"/>
                              {t('reasoning')}
                          </h3>
                          <div className="p-4 rounded-lg bg-muted/20">
                              <p className="text-foreground/90 whitespace-pre-wrap">
                                  {displayResult.reasoning}
                              </p>
                          </div>
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

        {/* Market Insights */}
        {displayResult && (
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Market Insights
              </CardTitle>
              <CardDescription>Additional market analysis and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Market Position</span>
                    </div>
                    <p className="text-sm text-green-700">Your suggested rate is competitive and well-positioned in the current market.</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Location Advantage</span>
                    </div>
                    <p className="text-sm text-blue-700">Your location offers good market access with reasonable competition levels.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-800">Pricing Strategy</span>
                    </div>
                    <p className="text-sm text-purple-700">Consider value-based pricing for premium clients and project-based rates for long-term engagements.</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Growth Potential</span>
                    </div>
                    <p className="text-sm text-yellow-700">With experience and portfolio growth, you can increase rates by 15-20% annually.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
