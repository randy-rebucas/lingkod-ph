
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
import { collection, onSnapshot, getDoc, doc } from "firebase/firestore";

export type SubscriptionTier = {
    id: string;
    name: string;
    price: number;
    idealFor: string;
    features: string[];
    badge: string | null;
    isFeatured?: boolean;
    type: 'provider';
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
};

export default function SubscriptionPage() {
    const { userRole, subscription, loading } = useAuth();
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
    
    const renderProviderPlans = () => {
        const providerPlans = plans.filter(p => p.type === 'provider').sort((a, b) => (a as SubscriptionTier).price - (b as SubscriptionTier).price) as SubscriptionTier[];
         return (
         <section>
            <h2 className="text-2xl font-bold font-headline mb-4">Provider Subscription Plans</h2>
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
                                    <span className="text-muted-foreground">/month</span>
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
                                        Current Plan
                                    </Button>
                                ) : (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                             <Button className="w-full" variant='default'>
                                                <Star className="mr-2 h-4 w-4" />
                                                Choose Plan
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Subscribe to {tier.name}</DialogTitle>
                                                <DialogDescription>Choose your preferred payment method.</DialogDescription>
                                            </DialogHeader>
                                            <PayPalCheckoutButton 
                                                plan={tier} 
                                                onPaymentStart={() => setPaymentDialog(true)}
                                                onPaymentSuccess={() => setPaymentDialog(false)}
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
        const agencyPlans = plans.filter(p => p.type === 'agency').sort((a,b) => (a as AgencySubscriptionTier).price as number - (b as AgencySubscriptionTier).price as number) as AgencySubscriptionTier[];
        return (
         <section>
            <h2 className="text-2xl font-bold font-headline mb-4">Agency Subscription Plans</h2>
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
                                            <span className="text-muted-foreground">/month</span>
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
                                    <Button className="w-full" disabled><Check className="mr-2 h-4 w-4" /> Current Plan</Button>
                                ) : tier.id === 'custom' ? (
                                    <Button className="w-full" variant="outline"><Mail className="mr-2 h-4 w-4" /> Contact Us</Button>
                                ) : (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="w-full" variant='default'>
                                                <Star className="mr-2 h-4 w-4" />
                                                Choose Plan
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Subscribe to {tier.name}</DialogTitle>
                                                <DialogDescription>Choose your preferred payment method.</DialogDescription>
                                            </DialogHeader>
                                            <PayPalCheckoutButton 
                                                plan={tier} 
                                                onPaymentStart={() => setPaymentDialog(true)}
                                                onPaymentSuccess={() => setPaymentDialog(false)}
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
        if (!subscription) return 'Upgrade to a paid plan to access more features.';

        if (subscription.status === 'pending') {
            return `Your payment for the ${currentPlanDetails?.name} plan is pending verification.`;
        }

        if (subscription.status === 'active' && subscription.renewsOn) {
            return `Your plan renews on ${subscription.renewsOn.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        }

        return 'Upgrade to a paid plan to access more features.';
    }

    return (
        <PayPalScriptProvider options={paypalOptions}>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Subscription & Pricing</h1>
                    <p className="text-muted-foreground">
                        Choose the perfect plan for your business and understand our commission structure.
                    </p>
                </div>

                <section>
                    <h2 className="text-2xl font-bold font-headline mb-4">Current Plan</h2>
                    {loading ? (
                        <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                    ) : (
                        <Card className="bg-secondary">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {subscription?.status === 'pending' ? <Clock className="text-yellow-500"/> : <Star className="text-primary"/>}
                                    {currentPlanDetails ? `You are on the ${currentPlanDetails.name} Plan` : 'You are on a Free Plan'}
                                    {subscription?.status && <Badge variant={subscription.status === 'pending' ? 'outline' : 'default'} className="capitalize">{subscription.status}</Badge>}
                                </CardTitle>
                                <CardDescription>{getPlanStatusDescription()}</CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </section>
                
                {loadingPlans ? <Skeleton className="h-96 w-full"/> : (userRole === 'agency' ? renderAgencyPlans() : renderProviderPlans())}

                <section>
                    <PaymentHistory />
                </section>
                
                 <section>
                    <h2 className="text-2xl font-bold font-headline mb-4">Commission per Completed Service</h2>
                    <Card>
                        <CardContent className="p-0">
                             {platformSettings ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Job Value Tier</TableHead>
                                            <TableHead>Commission Rate</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium">Low-Ticket</TableCell>
                                            <TableCell>{platformSettings.commissionRates.low}%</TableCell>
                                        </TableRow>
                                         <TableRow>
                                            <TableCell className="font-medium">Mid-Ticket</TableCell>
                                            <TableCell>{platformSettings.commissionRates.mid}%</TableCell>
                                        </TableRow>
                                         <TableRow>
                                            <TableCell className="font-medium">High-Ticket</TableCell>
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
