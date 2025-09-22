"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  Crown, 
  Building2, 
  Users, 
  TrendingUp, 
  Star,
  Calendar,
  CreditCard,
  Smartphone,
  BarChart3,
  FileText,
  Zap,
  Shield,
  HeadphonesIcon,
  ArrowRight,
  Info,
  Clock,
  DollarSign,
  Target,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import { PayPalCheckoutButton } from '@/components/paypal-checkout-button';
import { ManualPaymentVerification } from '@/components/manual-payment-verification';
import PaymentHistory from './payment-history';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

// Define subscription tier types
export type SubscriptionTier = {
  id: string;
  name: string;
  price: number | string;
  idealFor: string;
  features: string[];
  badge?: string;
  isFeatured: boolean;
  type: 'provider' | 'agency';
  sortOrder: number;
};

export type AgencySubscriptionTier = SubscriptionTier;

// Provider subscription plans
const providerPlans: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    idealFor: 'New providers starting out',
    features: [
      'Basic Profile',
      'Accept Bookings',
      'Standard Commission Rate',
    ],
    badge: undefined,
    isFeatured: false,
    type: 'provider',
    sortOrder: 1,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    idealFor: 'Professionals ready to grow',
    features: [
      'Enhanced Profile Visibility',
      'Access to Quote Builder',
      'Access to Invoicing Tool',
      'Lower Commission Rate',
      'Basic Analytics',
    ],
    badge: 'Most Popular',
    isFeatured: true,
    type: 'provider',
    sortOrder: 2,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 999,
    idealFor: 'Top-tier providers and businesses',
    features: [
      'All Pro features',
      'Top placement in search results',
      'Advanced Analytics Suite',
      'Dedicated Support',
      'Lowest Commission Rate',
    ],
    badge: undefined,
    isFeatured: false,
    type: 'provider',
    sortOrder: 3,
  }
];

// Agency subscription plans
const agencyPlans: AgencySubscriptionTier[] = [
  {
    id: 'lite',
    name: 'Lite',
    price: 1999,
    idealFor: 'Small agencies starting out',
    features: [
      'Manage up to 3 Providers',
      'Agency Profile Page',
      'Centralized Booking Management',
      'Basic Performance Reports',
    ],
    badge: undefined,
    isFeatured: false,
    type: 'agency',
    sortOrder: 1,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4999,
    idealFor: 'Growing agencies scaling their team',
    features: [
      'Manage up to 10 Providers',
      'All Lite features',
      'Enhanced Reporting & Analytics',
      'Branded Communications',
    ],
    badge: 'Most Popular',
    isFeatured: true,
    type: 'agency',
    sortOrder: 2,
  },
  {
    id: 'custom',
    name: 'Custom',
    price: 'Contact Us',
    idealFor: 'Large agencies with custom needs',
    features: [
      'Unlimited Providers',
      'All Pro features',
      'API Access (coming soon)',
      'Dedicated Account Manager',
      'Custom Onboarding & Training',
    ],
    badge: undefined,
    isFeatured: false,
    type: 'agency',
    sortOrder: 3,
  }
];

// Commission structure
const commissionStructure = [
  { tier: 'Low-Ticket', range: '₱0 - ₱2,999', rate: '15%' },
  { tier: 'Mid-Ticket', range: '₱3,000 - ₱9,999', rate: '12%' },
  { tier: 'High-Ticket', range: '₱10,000+', rate: '10%' },
];

// FAQ data
const faqData = [
  {
    id: 'billing',
    question: 'How does billing work?',
    answer: 'All subscriptions are billed monthly. You can cancel anytime and your subscription will remain active until the end of your current billing period.'
  },
  {
    id: 'features',
    question: 'What features are included in each plan?',
    answer: 'Each plan includes different features. Free plans have basic functionality, while paid plans unlock advanced features like analytics, priority support, and enhanced visibility.'
  },
  {
    id: 'upgrade',
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing differences.'
  },
  {
    id: 'support',
    question: 'What kind of support do I get?',
    answer: 'Free plan users get community support, while paid plan users get priority email support. Elite plan users get dedicated support with faster response times.'
  },
  {
    id: 'refund',
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact our support team for a full refund.'
  }
];

export default function SubscriptionPage() {
  const { user, subscription, userRole } = useAuth();
  const t = useTranslations('Subscription');
  const [activeTab, setActiveTab] = useState('provider');
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | AgencySubscriptionTier | null>(null);

  // Set default tab based on user role
  useEffect(() => {
    if (userRole === 'agency') {
      setActiveTab('agency');
    } else if (userRole === 'provider') {
      setActiveTab('provider');
    }
  }, [userRole]);


  // Function to handle plan selection and open modal
  const handleChoosePlan = (plan: SubscriptionTier | AgencySubscriptionTier) => {
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  // Function to close modal
  const handleCloseModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPlan(null);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Listen for pending subscription payments
    const paymentsQuery = query(
      collection(db, "subscriptionPayments"),
      where("userId", "==", user.uid),
      where("status", "==", "pending_verification"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingPayments(payments);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pending payments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('Profile')) return <Users className="h-4 w-4" />;
    if (feature.includes('Analytics')) return <BarChart3 className="h-4 w-4" />;
    if (feature.includes('Quote')) return <FileText className="h-4 w-4" />;
    if (feature.includes('Support')) return <HeadphonesIcon className="h-4 w-4" />;
    if (feature.includes('Commission')) return <TrendingUp className="h-4 w-4" />;
    if (feature.includes('placement')) return <Star className="h-4 w-4" />;
    if (feature.includes('API')) return <Zap className="h-4 w-4" />;
    if (feature.includes('Manager')) return <Shield className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getCurrentPlanInfo = () => {
    if (!subscription) return null;
    
    const allPlans = [...providerPlans, ...agencyPlans];
    const currentPlan = allPlans.find(plan => plan.id === subscription.planId);
    
    return {
      plan: currentPlan,
      status: subscription.status,
      renewsOn: subscription.renewsOn
    };
  };

  const currentPlanInfo = getCurrentPlanInfo();

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-6 w-2/3 mx-auto" />
          </div>
          
          {/* Current Plan Skeleton */}
          <Card className="border-2">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="relative">
                  <CardHeader className="text-center pb-6 pt-8">
                    <Skeleton className="h-8 w-24 mx-auto mb-2" />
                    <Skeleton className="h-12 w-32 mx-auto mb-2" />
                    <Skeleton className="h-4 w-48 mx-auto" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="flex items-center gap-3">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              {t('description')}
            </p>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground px-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <span>30-Day Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="h-4 w-4 text-purple-500" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Current Subscription Status */}
        {currentPlanInfo && (
          <Card className="border-2 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                <span className="text-2xl">{t('currentPlan')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold">
                    {currentPlanInfo.plan?.name} Plan
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {currentPlanInfo.plan?.idealFor}
                  </p>
                </div>
                <Badge 
                  variant={
                    currentPlanInfo.status === 'active' ? 'default' :
                    currentPlanInfo.status === 'pending_verification' ? 'outline' :
                    'secondary'
                  }
                  className="text-lg px-6 py-3 h-auto"
                >
                  {currentPlanInfo.status === 'active' ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Active
                    </div>
                  ) : currentPlanInfo.status === 'pending_verification' ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending Verification
                    </div>
                  ) : (
                    currentPlanInfo.status
                  )}
                </Badge>
              </div>
              
              {currentPlanInfo.status === 'pending_verification' && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Your payment is being reviewed. You'll receive an email confirmation once verified.
                  </AlertDescription>
                </Alert>
              )}

              {currentPlanInfo.renewsOn && currentPlanInfo.status === 'active' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 rounded-lg p-3">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t('planRenewsOn', { 
                      date: format(currentPlanInfo.renewsOn.toDate(), 'PPP') 
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Payments Alert */}
        {pendingPayments.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Payment Verification Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700">
                You have {pendingPayments.length} payment(s) pending verification. 
                Our team will review and activate your subscription within 24 hours.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Role-based Display */}
        <div className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold">
                {userRole === 'agency' ? 'Agency Subscription Plans' : 'Provider Subscription Plans'}
              </h2>
              <p className="text-muted-foreground">
                {userRole === 'agency' 
                  ? 'Designed for agencies and businesses managing multiple service providers and teams'
                  : 'Perfect for individual service providers looking to grow their business and access premium features'
                }
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-2"
              >
                {showComparison ? 'Hide' : 'Compare'} Plans
                {showComparison ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('history')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Payment History
              </Button>
            </div>
          </div>

          {/* Role-based Content Display */}
          {activeTab === 'history' ? (
            <PaymentHistory />
          ) : (
            <div className="space-y-8">
              {/* Plan Comparison Table */}
              {showComparison && (
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Plan Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-semibold">Features</th>
                            {(userRole === 'agency' ? agencyPlans : providerPlans).map((plan) => (
                              <th key={plan.id} className="text-center p-4 font-semibold">
                                {plan.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-4 font-medium">Price</td>
                            {(userRole === 'agency' ? agencyPlans : providerPlans).map((plan) => (
                              <td key={plan.id} className="text-center p-4">
                                {typeof plan.price === 'number' ? `₱${plan.price.toLocaleString()}/mo` : plan.price}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-4 font-medium">
                              {userRole === 'agency' ? 'Team Members' : 'Job Applications'}
                            </td>
                            {(userRole === 'agency' ? agencyPlans : providerPlans).map((plan) => (
                              <td key={plan.id} className="text-center p-4">
                                {userRole === 'agency' 
                                  ? (plan.features.includes('Up to 50 team members') ? '50' : 
                                     plan.features.includes('Up to 20 team members') ? '20' : '5')
                                  : (plan.features.includes('Unlimited job applications') ? 'Unlimited' : 
                                     plan.features.includes('Up to 50 job applications') ? '50/month' : '10/month')
                                }
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-4 font-medium">Analytics</td>
                            {(userRole === 'agency' ? agencyPlans : providerPlans).map((plan) => (
                              <td key={plan.id} className="text-center p-4">
                                {plan.features.includes('Advanced analytics') ? 'Advanced' : 
                                 plan.features.includes('Basic analytics') ? 'Basic' : 'None'}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-4 font-medium">Support</td>
                            {(userRole === 'agency' ? agencyPlans : providerPlans).map((plan) => (
                              <td key={plan.id} className="text-center p-4">
                                {plan.features.includes('Priority support') ? 'Priority' : 'Community'}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Benefits Section */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Start free, upgrade anytime</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>30-day money back guarantee</span>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
                {(userRole === 'agency' ? agencyPlans : providerPlans).map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-300 hover:shadow-xl group ${
              plan.isFeatured 
                ? 'border-2 border-primary shadow-2xl scale-105 ring-2 ring-primary/20' 
                : 'hover:border-primary/50 hover:scale-102'
            }`}
          >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-2 text-sm font-semibold shadow-lg">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-6 pt-8">
                    <CardTitle className="text-3xl font-bold mb-2">{plan.name}</CardTitle>
                    <div className="space-y-2">
                      <div className="text-5xl font-bold text-primary">
                        {typeof plan.price === 'number' ? `₱${plan.price.toLocaleString()}` : plan.price}
                      </div>
                      {typeof plan.price === 'number' && (
                        <div className="text-muted-foreground text-lg">{t('perMonth')}</div>
                      )}
                    </div>
                    <CardDescription className="text-base mt-4">
                      {plan.idealFor}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                            {getFeatureIcon(feature)}
                          </div>
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-6" />

              <div className="space-y-4">
                {currentPlanInfo?.plan?.id === plan.id ? (
                  <Button disabled className="w-full h-12 text-lg font-semibold">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {t('currentPlanButton')}
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-12 text-lg font-semibold" 
                    variant={plan.isFeatured ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleChoosePlan(plan)}
                  >
                    {typeof plan.price === 'number' && plan.price === 0 ? 'Get Started Free' : t('choosePlan')}
                  </Button>
                )}
              </div>
                  </CardContent>
                </Card>
              ))}
            </div>

              {/* Role-based Benefits Section */}
              <div className="mt-16 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8">
                <div className="text-center space-y-6">
                  <h3 className="text-2xl font-bold">
                    {userRole === 'agency' ? 'Why Choose Our Agency Plans?' : 'Why Choose Our Provider Plans?'}
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {userRole === 'agency' ? (
                      <>
                        <div className="text-center space-y-2">
                          <Building2 className="h-8 w-8 text-primary mx-auto" />
                          <h4 className="font-semibold">Team Management</h4>
                          <p className="text-sm text-muted-foreground">Manage multiple providers and team members efficiently</p>
                        </div>
                        <div className="text-center space-y-2">
                          <BarChart3 className="h-8 w-8 text-primary mx-auto" />
                          <h4 className="font-semibold">Advanced Analytics</h4>
                          <p className="text-sm text-muted-foreground">Comprehensive reporting and business insights</p>
                        </div>
                        <div className="text-center space-y-2">
                          <HeadphonesIcon className="h-8 w-8 text-primary mx-auto" />
                          <h4 className="font-semibold">Priority Support</h4>
                          <p className="text-sm text-muted-foreground">Dedicated support for your agency needs</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center space-y-2">
                          <TrendingUp className="h-8 w-8 text-primary mx-auto" />
                          <h4 className="font-semibold">Grow Your Business</h4>
                          <p className="text-sm text-muted-foreground">Access premium features to attract more clients and increase your earnings</p>
                        </div>
                        <div className="text-center space-y-2">
                          <Star className="h-8 w-8 text-primary mx-auto" />
                          <h4 className="font-semibold">Stand Out</h4>
                          <p className="text-sm text-muted-foreground">Enhanced visibility and top placement in search results</p>
                        </div>
                        <div className="text-center space-y-2">
                          <BarChart3 className="h-8 w-8 text-primary mx-auto" />
                          <h4 className="font-semibold">Track Performance</h4>
                          <p className="text-sm text-muted-foreground">Detailed analytics to optimize your business strategy</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FAQ Section */}
        <div className="mt-16 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
              <HelpCircle className="h-8 w-8 text-primary" />
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Got questions? We've got answers. Find everything you need to know about our subscription plans.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqData.map((faq) => (
              <Collapsible
                key={faq.id}
                open={expandedFAQ === faq.id}
                onOpenChange={(open) => setExpandedFAQ(open ? faq.id : null)}
              >
                <Card className="transition-all duration-200 hover:shadow-md">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-left text-lg">
                          {faq.question}
                        </CardTitle>
                        {expandedFAQ === faq.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* Contact Support Section */}
        <div className="mt-16 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8">
          <div className="text-center space-y-6">
            <h3 className="text-2xl font-bold">Still have questions?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our support team is here to help you choose the perfect plan for your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="flex items-center gap-2">
                <HeadphonesIcon className="h-4 w-4" />
                Contact Support
              </Button>
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Help Center
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-center">
              {selectedPlan?.name} Plan
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              {selectedPlan?.idealFor}
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Plan Details */}
            <div className="text-center space-y-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
              <div className="text-4xl font-bold text-primary">
                {typeof selectedPlan?.price === 'number' ? `₱${selectedPlan.price.toLocaleString()}` : selectedPlan?.price}
              </div>
              {typeof selectedPlan?.price === 'number' && (
                <div className="text-muted-foreground text-lg">
                  {selectedPlan.price === 0 ? 'Free Forever' : t('perMonth')}
                </div>
              )}
              {selectedPlan?.badge && (
                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1 text-sm font-semibold">
                  {selectedPlan.badge}
                </Badge>
              )}
            </div>

            {/* All Features */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Plan Features
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {selectedPlan?.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Payment Methods */}
            {selectedPlan && typeof selectedPlan.price === 'number' && selectedPlan.price > 0 ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-center flex items-center justify-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Choose Payment Method
                </h4>
                <div className="space-y-4">
                  <div className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                    <PayPalCheckoutButton 
                      plan={selectedPlan}
                    />
                  </div>
                  <div className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                    <ManualPaymentVerification 
                      plan={{
                        id: selectedPlan.id,
                        name: selectedPlan.name,
                        price: selectedPlan.price as number,
                        type: selectedPlan.type
                      }}
                      onPaymentSubmitted={() => {
                        handleCloseModal();
                        // Refresh pending payments
                        window.location.reload();
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-green-800 text-lg">Free Plan</h4>
                  <p className="text-sm text-green-700 mt-2">
                    No payment required. Get started immediately and enjoy all free features!
                  </p>
                </div>
                <Button 
                  className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700" 
                  variant="default"
                  size="lg"
                  onClick={() => {
                    // Handle free plan activation
                    handleCloseModal();
                    // Add your free plan activation logic here
                  }}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Activate Free Plan
                </Button>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 pt-4 border-t space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Secure payment processing</span>
              <span>•</span>
              <span>Cancel anytime</span>
            </div>
            <Button 
              variant="outline" 
              onClick={handleCloseModal}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
