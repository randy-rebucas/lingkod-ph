"use client";

import React from "react";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Gift, 
  ShoppingCart, 
  Percent, 
  Clock, 
  MapPin, 
  Star,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Crown
} from 'lucide-react';
import { VerifiedProBadge } from '@/components/pro-badge';
import { FeatureGuard } from '@/components/feature-guard';
import { format } from 'date-fns';
import { PageLayout } from '@/components/app/page-layout';
import { StandardCard } from '@/components/app/standard-card';
import { LoadingState } from '@/components/app/loading-state';
import { EmptyState } from '@/components/app/empty-state';
import { designTokens } from '@/lib/design-tokens';

// Types
interface SuppliesDiscount {
  id: string;
  name: string;
  description: string;
  discount: number;
  category: string;
  terms: string[];
  validUntil: Date;
  validFrom: Date;
  validTo: Date;
  partnerName: string;
  discountPercentage: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  isActive: boolean;
  isProOnly: boolean;
}

// Hook for pro subscription
function useProSubscription() {
  return { isPro: true, isActive: true }; // Mock implementation
}

export default function SuppliesPage() {
  const { user } = useAuth();
  const { isPro, isActive } = useProSubscription();
  const t = useTranslations('Supplies');
  const [discounts, setDiscounts] = useState<SuppliesDiscount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isPro || !isActive) {
      setLoading(false);
      return;
    }

    const fetchDiscounts = async () => {
      try {
        // No subscription discounts available
        const availableDiscounts: any[] = [];
        setDiscounts(availableDiscounts);
      } catch (error) {
        console.error('Error fetching discounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, [user, isPro, isActive]);

  const getDiscountStatus = (discount: SuppliesDiscount) => {
    const now = new Date();
    const validFrom = discount.validFrom;
    const validTo = discount.validTo;

    if (now < validFrom) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    } else if (now > validTo) {
      return { status: 'expired', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    } else {
      return { status: 'active', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cleaning':
        return '🧽';
      case 'tools':
        return '🔧';
      case 'equipment':
        return '⚙️';
      case 'supplies':
        return '📦';
      default:
        return '🛍️';
    }
  };

  if (loading) {
    return <LoadingState title={t('title')} description={t('subtitle')} />;
  }

  return (
    <FeatureGuard feature="supplies_discount">
      <PageLayout 
        title={t('title')} 
        description={t('subtitle')}
      >
        <div className="flex items-center justify-between">
          <div>
            <VerifiedProBadge variant="large" />
          </div>
        </div>

        {/* Pro Benefits Banner */}
        <Card className="border-0 shadow-soft bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800">
                  {t('proBenefits')}
                </h3>
                <p className="text-yellow-700">
                  {t('proBenefitsDescription')}
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                Pro Exclusive
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Discounts Grid */}
        {discounts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {discounts.map((discount) => {
              const status = getDiscountStatus(discount);
              const isActive = status.status === 'active';
              
              return (
                <Card 
                  key={discount.id} 
                  className={`border-0 shadow-soft transition-all duration-200 hover:shadow-lg ${
                    isActive ? 'ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(discount.category)}</span>
                        <div>
                          <CardTitle className="text-lg">{discount.partnerName}</CardTitle>
                          <CardDescription className="text-sm">
                            {discount.category} Supplies
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={status.color}>
                        {status.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Discount Info */}
                    <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                      <div className="text-3xl font-bold text-primary">
                        {discount.discountPercentage}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('discount')}
                      </div>
                    </div>

                    {/* Terms */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('minOrder')}</span>
                        <span className="font-semibold">₱{discount.minOrderAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('maxDiscount')}</span>
                        <span className="font-semibold">₱{discount.maxDiscountAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground">
                      {discount.description}
                    </p>

                    {/* Validity Period */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('validFrom')}</span>
                        <span className="font-medium">
                          {format(discount.validFrom, 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('validTo')}</span>
                        <span className="font-medium">
                          {format(discount.validTo, 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    {discount.terms.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">{t('terms')}</h4>
                        <ul className="space-y-1">
                          {discount.terms.slice(0, 3).map((term: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{term}</span>
                            </li>
                          ))}
                          {discount.terms.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{discount.terms.length - 3} more terms
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>

                  <CardContent className="pt-0">
                    <Button 
                      className="w-full" 
                      disabled={!isActive}
                      onClick={() => {
                        // In a real implementation, this would redirect to the partner's website
                        // with the discount code or open a modal with more details
                        window.open('#', '_blank');
                      }}
                    >
                      {isActive ? (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {t('shopNow')}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          {status.status === 'expired' ? t('expired') : t('upcoming')}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('noDiscounts')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('noDiscountsDescription')}
              </p>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('viewAllPartners')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Partner Information */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              {t('partnerProgram')}
            </CardTitle>
            <CardDescription>
              {t('partnerProgramDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-semibold">{t('howItWorks')}</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">1</div>
                    <span className="text-sm">{t('step1')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">2</div>
                    <span className="text-sm">{t('step2')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">3</div>
                    <span className="text-sm">{t('step3')}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">{t('benefits')}</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {t('benefit1')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {t('benefit2')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {t('benefit3')}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    </FeatureGuard>
  );
}
