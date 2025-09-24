"use client";

import { ReactNode } from 'react';
import { useFeatureAccess } from '@/hooks/use-subscription';
import { SubscriptionFeatureKey } from '@/lib/subscription-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Crown, Lock, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FeatureGuardProps {
  feature: SubscriptionFeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  upgradeMessage?: string;
}

export function FeatureGuard({ 
  feature, 
  children, 
  fallback,
  showUpgrade = true,
  upgradeMessage 
}: FeatureGuardProps) {
  const { hasAccess, loading, remainingUsage, limit } = useFeatureAccess(feature);
  const t = useTranslations('FeatureGuard');

  if (loading) {
    return <div className="animate-pulse bg-muted/50 rounded-lg h-20" />;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  const defaultMessage = upgradeMessage || t('upgradeRequired', { feature });
  const isUnlimited = limit === -1;
  const usageText = isUnlimited 
    ? t('unlimited')
    : t('usageLimit', { remaining: remainingUsage || 0, limit: limit || 0 });

  return (
    <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/20">
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-3">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-lg flex items-center justify-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          {t('proFeature')}
        </CardTitle>
        <CardDescription className="text-center">
          {defaultMessage}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-xs">
            {usageText}
          </Badge>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              {t('upgradeToPro')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                {t('upgradeToPro')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-primary mb-2">
                  ₱399 <span className="text-sm font-normal text-muted-foreground">/month</span>
                </h3>
                <p className="text-muted-foreground">
                  {t('proDescription')}
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">{t('proFeatures')}</h4>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">{t('featuredPlacement')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">{t('priorityJobAccess')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">{t('performanceAnalytics')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">{t('proBadge')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">{t('suppliesDiscount')}</span>
                  </div>
                </div>
              </div>
              
              <Button className="w-full">
                {t('startProTrial')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Specialized components for common features
export function ProFeatureGuard({ children, feature }: { children: ReactNode; feature: SubscriptionFeatureKey }) {
  return (
    <FeatureGuard feature={feature}>
      {children}
    </FeatureGuard>
  );
}

export function AnalyticsGuard({ children }: { children: ReactNode }) {
  return (
    <FeatureGuard 
      feature="performance_analytics"
      upgradeMessage="Access detailed performance analytics with Pro subscription"
    >
      {children}
    </FeatureGuard>
  );
}

export function FeaturedPlacementGuard({ children }: { children: ReactNode }) {
  return (
    <FeatureGuard 
      feature="featured_placement"
      upgradeMessage="Get featured placement in search results with Pro subscription"
    >
      {children}
    </FeatureGuard>
  );
}

export function PriorityJobGuard({ children }: { children: ReactNode }) {
  return (
    <FeatureGuard 
      feature="priority_job_access"
      upgradeMessage="Get early access to high-value jobs with Pro subscription"
    >
      {children}
    </FeatureGuard>
  );
}
