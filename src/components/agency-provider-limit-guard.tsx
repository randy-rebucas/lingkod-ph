"use client";

import { useAuth } from "@/context/auth-context";
import { canManageProviders, getMaxProviders } from "@/lib/subscription-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface AgencyProviderLimitGuardProps {
  children: React.ReactNode;
  currentProviderCount: number;
  fallback?: React.ReactNode;
}

export function AgencyProviderLimitGuard({ 
  children, 
  currentProviderCount, 
  fallback 
}: AgencyProviderLimitGuardProps) {
  const { subscription } = useAuth();
  const t = useTranslations('AgencyProviderLimit');
  
  const canAddMore = canManageProviders(subscription, currentProviderCount);
  const maxProviders = getMaxProviders(subscription);
  
  if (!canAddMore) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            {t('providerLimitReached')}
          </CardTitle>
          <CardDescription className="text-orange-700">
            {t('currentPlanAllows', { 
              current: currentProviderCount, 
              max: maxProviders === Infinity ? 'unlimited' : maxProviders 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <Users className="h-4 w-4" />
              {t('upgradeToAddMore')}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/subscription">
                {t('upgradePlan')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return <>{children}</>;
}

export function AgencyProviderLimitInfo({ currentProviderCount }: { currentProviderCount: number }) {
  const { subscription } = useAuth();
  const t = useTranslations('AgencyProviderLimit');
  
  const maxProviders = getMaxProviders(subscription);
  const canAddMore = canManageProviders(subscription, currentProviderCount);
  
  if (maxProviders === 0) {
    return null; // No subscription
  }
  
  return (
    <div className="text-sm text-muted-foreground">
      {t('providerUsage', { 
        current: currentProviderCount, 
        max: maxProviders === Infinity ? '∞' : maxProviders,
        remaining: maxProviders === Infinity ? '∞' : Math.max(0, maxProviders - currentProviderCount)
      })}
      {!canAddMore && (
        <span className="text-orange-600 font-medium ml-2">
          {t('limitReached')}
        </span>
      )}
    </div>
  );
}
