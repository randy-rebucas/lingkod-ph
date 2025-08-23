"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Mail, Star, Check, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button";
import PaymentHistory from "./payment-history";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, getDoc, doc, updateDoc } from "firebase/firestore";
import { useTranslations } from "next-intl";

export type SubscriptionTier = {
    id: string;
    name: string;
    price: number;
    idealFor: string;
    features: string[];
    badge: string | null;
    isFeatured?: boolean;
    type: 'provider';
    sortOrder: number;
};

export type AgencySubscriptionTier = {
    id: string;
    name: string;
    price: number | string;
    idealFor: string;
    features: string[];
    badge: string | null;
    isFeatured?: boolean;
    type: 'agency';
    sortOrder: number;
};

export default function SubscriptionPage() {
    const { user, userRole, subscription, loading } = useAuth();
    const t = useTranslations('Subscription');
    const [isPaymentDialog, setPaymentDialog] = useState(false);
    const [plans, setPlans] = useState<(SubscriptionTier | AgencySubscriptionTier)[]>([]);
    const [platformSettings, setPlatformSettings] = useState<any>(null);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        const unsubPlans = onSnapshot(collection(db, "subscriptions"), (snapshot) => {
            const fetchedPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as (SubscriptionTier | AgencySubscriptionTier)));
            setPlans(fetchedPlans);
            setLoadingPlans(false);
        });
        
        const unsubSettings = onSnapshot(doc(db, "platform", "settings"), (doc) => {
            if (doc.exists()) {
                setPlatformSettings(doc.data());
            }
        });

        return () => {
            unsubPlans();
            unsubSettings();
        };
    }, []);

    const currentPlanDetails = plans.find(tier => tier.id === subscription?.planId);
    
    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
        return <div>PayPal Client ID not configured.</div>
    }

    const paypalOptions = {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        currency: "PHP",
        intent: "capture",
    };

    const handleRoleUpgrade = async (newRole: 'provider' | 'agency') => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { role: newRole });
    };
    
    const renderProviderPlans = () => {
        const providerPlans = plans.filter(p => p.type === 'provider').sort((a, b) => a.sortOrder - b.sortOrder) as SubscriptionTier[];
         return (
         <section>
            <h2 className="text-2xl font-bold font-headline mb-4">{t('providerSubscriptionPlans')}</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {providerPlans.map(tier => {
                    const isCurrentPlan = tier.id === subscription?.planId;
                    return (
                        <Card key={tier.id} className={`flex flex-col ${tier.isFeatured ? 'border-primary shadow-lg' : ''}`}>
                            <CardHeader className="relative">
                                {tier.badge && (
                                    <Badge className="absolute top-4 right-4">{tier.badge}</Badge>
                                )}
                                <CardTitle>{tier.name}</CardTitle>
                                <CardDescription>{tier.idealFor}</CardDescription>
                                <div className="flex items-baseline">
                                    <span className="text-4xl font-bold">₱{tier.price}</span>
                                    <span className="text-muted-foreground">{t('perMonth')}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                            <ul className="space-y-3">
                                    {tier.features.map(feature => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                            </ul>
                            </CardContent>
                            <CardFooter>
                                {isCurrentPlan ? (
                                    <Button className="w-full" disabled>
                                        <Check className="mr-2 h-4 w-4" />
                                        {t('currentPlanButton')}
                                    </Button>
                                ) : (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                             <Button className="w-full" variant='default'>
                                                <Star className="mr-2 h-4 w-4" />
                                                {t('choosePlan')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>{t('subscribeTo', { planName: tier.name })}</DialogTitle>
                                                <DialogDescription>{t('choosePaymentMethod')}</DialogDescription>
                                            </DialogHeader>
                                            <PayPalCheckoutButton 
                                                plan={tier} 
                                                onPaymentStart={() => setPaymentDialog(true)}
                                                onPaymentSuccess={() => {
                                                    setPaymentDialog(false)
                                                    handleRoleUpgrade('provider');
                                                }}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </section>
        )
    };

    const renderAgencyPlans = () => {
        const agencyPlans = plans.filter(p => p.type === 'agency').sort((a,b) => a.sortOrder - b.sortOrder) as AgencySubscriptionTier[];
        return (
         <section>
            <h2 className="text-2xl font-bold font-headline mb-4">{t('agencySubscriptionPlans')}</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {agencyPlans.map(tier => {
                    const isCurrentPlan = tier.id === subscription?.planId;
                    return (
                        <Card key={tier.id} className={`flex flex-col ${tier.isFeatured ? 'border-primary shadow-lg' : ''}`}>
                            <CardHeader className="relative">
                                {tier.badge && (
                                    <Badge className="absolute top-4 right-4">{tier.badge}</Badge>
                                )}
                                <CardTitle>{tier.name}</CardTitle>
                                <CardDescription>{tier.idealFor}</CardDescription>
                                <div className="flex items-baseline">
                                     {typeof tier.price === 'number' ? (
                                        <>
                                            <span className="text-4xl font-bold">₱{tier.price.toLocaleString()}</span>
                                            <span className="text-muted-foreground">{t('perMonth')}</span>
                                        </>
                                     ) : (
                                        <span className="text-2xl font-bold">{tier.price}</span>
                                     )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <ul className="space-y-3">
                                    {tier.features.map(feature => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                 {isCurrentPlan ? (
                                    <Button className="w-full" disabled><Check className="mr-2 h-4 w-4" /> {t('currentPlanButton')}</Button>
                                ) : tier.id === 'custom' ? (
                                    <Button asChild className="w-full" variant="outline"><a href="mailto:sales@localpro.com"><Mail className="mr-2 h-4 w-4" /> {t('contactUs')}</a></Button>
                                ) : (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="w-full" variant='default'>
                                                <Star className="mr-2 h-4 w-4" />
                                                {t('choosePlan')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>{t('subscribeTo', { planName: tier.name })}</DialogTitle>
                                                <DialogDescription>{t('choosePaymentMethod')}</DialogDescription>
                                            </DialogHeader>
                                            <PayPalCheckoutButton 
                                                plan={tier} 
                                                onPaymentStart={() => setPaymentDialog(true)}
                                                onPaymentSuccess={() => {
                                                    setPaymentDialog(false);
                                                    handleRoleUpgrade('agency');
                                                }}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </section>
    )};

    const getPlanStatusDescription = () => {
        if (!subscription) return t('upgradeToPaidPlan');

        if (subscription.status === 'pending') {
            return t('paymentPending', { planName: currentPlanDetails?.name || 'Unknown Plan' });
        }

        if (subscription.status === 'active' && subscription.renewsOn) {
            return t('planRenewsOn', { date: subscription.renewsOn.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) });
        }

        return t('upgradeToPaidPlan');
    }

    return (
        <PayPalScriptProvider options={paypalOptions}>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                    <p className="text-muted-foreground">
                        {t('description')}
                    </p>
                </div>

                <section>
                    <h2 className="text-2xl font-bold font-headline mb-4">{t('currentPlan')}</h2>
                    {loading ? (
                        <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                    ) : (
                        <Card className="bg-secondary">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {subscription?.status === 'pending' ? <Clock className="text-yellow-500"/> : <Star className="text-primary"/>}
                                    {currentPlanDetails ? t('youAreOnPlan', { planName: currentPlanDetails.name }) : t('youAreOnFreePlan')}
                                    {subscription?.status && <Badge variant={subscription.status === 'pending' ? 'outline' : 'default'} className="capitalize">{subscription.status}</Badge>}
                                </CardTitle>
                                <CardDescription>{getPlanStatusDescription()}</CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </section>
                
                {loadingPlans ? <Skeleton className="h-96 w-full"/> : (userRole === 'provider' ? renderAgencyPlans() : renderProviderPlans())}

                <section>
                    <PaymentHistory />
                </section>
                
                 <section>
                    <h2 className="text-2xl font-bold font-headline mb-4">{t('commissionPerCompletedService')}</h2>
                    <Card>
                        <CardContent className="p-0">
                             {platformSettings ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('jobValueTier')}</TableHead>
                                            <TableHead>{t('commissionRate')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium">{t('lowTicket')}</TableCell>
                                            <TableCell>{platformSettings.commissionRates.low}%</TableCell>
                                        </TableRow>
                                         <TableRow>
                                            <TableCell className="font-medium">{t('midTicket')}</TableCell>
                                            <TableCell>{platformSettings.commissionRates.mid}%</TableCell>
                                        </TableRow>
                                         <TableRow>
                                            <TableCell className="font-medium">{t('highTicket')}</TableCell>
                                            <TableCell>{platformSettings.commissionRates.high}%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-6">
                                    <Skeleton className="h-32 w-full" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </PayPalScriptProvider>
    );
}
