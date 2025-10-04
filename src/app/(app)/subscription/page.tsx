"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/shared/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Check, Star, Crown, Zap, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  commissionRate: number;
  icon: React.ReactNode;
  popular?: boolean;
  color: string;
}

const getSubscriptionPlans = (t: any): SubscriptionPlan[] => [
  {
    id: "free",
    name: t('free'),
    price: 0,
    period: "month",
    description: t('freeDescription'),
    features: [
      t('freeFeature1'),
      t('freeFeature2'),
      t('freeFeature3'),
      t('freeFeature4')
    ],
    commissionRate: 15,
    icon: <Zap className="h-6 w-6" />,
    color: "text-gray-600"
  },
  {
    id: "premium",
    name: t('premium'),
    price: 499,
    period: "month",
    description: t('premiumDescription'),
    features: [
      t('premiumFeature1'),
      t('premiumFeature2'),
      t('premiumFeature3'),
      t('premiumFeature4'),
      t('premiumFeature5'),
      t('premiumFeature6')
    ],
    commissionRate: 12,
    icon: <Star className="h-6 w-6" />,
    popular: true,
    color: "text-blue-600"
  },
  {
    id: "elite",
    name: t('elite'),
    price: 999,
    period: "month",
    description: t('eliteDescription'),
    features: [
      t('eliteFeature1'),
      t('eliteFeature2'),
      t('eliteFeature3'),
      t('eliteFeature4'),
      t('eliteFeature5'),
      t('eliteFeature6')
    ],
    commissionRate: 10,
    icon: <Crown className="h-6 w-6" />,
    color: "text-purple-600"
  }
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const t = useTranslations('Subscription');
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const subscriptionPlans = getSubscriptionPlans(t);

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    setSelectedPlan(planId);

    try {
      // Here you would typically integrate with your payment system
      // For now, we'll simulate the process
      console.log(`User ${user.email} selected plan: ${planId}`);
      
      // Redirect to payment processing or success page
      // router.push(`/payment/subscription?plan=${planId}`);
      
      // For demo purposes, show success message
      alert(`Selected ${planId} plan! Payment integration would be implemented here.`);
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert('Error selecting plan. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
          {t('title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {subscriptionPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-300 hover:shadow-lg ${
              plan.popular 
                ? 'border-primary shadow-lg scale-105' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1 font-semibold">
                  {t('mostPopular')}
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className={`mx-auto mb-4 ${plan.color}`}>
                {plan.icon}
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ₱{plan.price}
                </span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
              <p className="text-sm text-foreground/80 mt-2">
                {plan.description}
              </p>
              <div className="mt-3">
                <Badge variant="outline" className="text-xs text-foreground border-border">
                  {plan.commissionRate}% {t('commissionRate')}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full mt-6 ${
                  plan.popular 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                    : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
                }`}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isLoading && selectedPlan === plan.id}
              >
                {isLoading && selectedPlan === plan.id ? (
                  t('processing')
                ) : (
                  <>
                    {plan.price === 0 ? t('getStartedFree') : t('choosePlan')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">
          {t('additionalInfo')}
        </p>
        <div className="flex justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{t('noSetupFees')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{t('cancelAnytime')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{t('moneyBackGuarantee')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
