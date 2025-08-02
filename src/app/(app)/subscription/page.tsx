
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Loader2, Star, Check, FileDown, BriefcaseBusiness, Mail, Sparkles, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";

type SubscriptionTier = {
    id: 'starter' | 'pro' | 'elite';
    name: string;
    price: number;
    idealFor: string;
    features: string[];
    badge: string | null;
    isFeatured?: boolean;
};

type AgencySubscriptionTier = {
    id: 'lite' | 'pro' | 'custom';
    name: string;
    price: number | string;
    idealFor: string;
    features: string[];
    badge: string | null;
    isFeatured?: boolean;
};


type UserSubscription = {
    planId: 'starter' | 'pro' | 'elite' | 'free' | 'lite' | 'custom';
    status: 'active' | 'cancelled' | 'none';
    renewsOn: Timestamp | null;
}

const providerSubscriptionTiers: SubscriptionTier[] = [
    {
        id: "starter",
        name: "Starter",
        price: 299,
        idealFor: "Freelancers & part-timers",
        features: ["Basic profile", "Job matching", "Calendar"],
        badge: null,
    },
    {
        id: "pro",
        name: "Pro",
        price: 499,
        idealFor: "Full-time service providers",
        features: ["Verified badge", "Priority listing", "Calendar", "Invoice generator"],
        badge: "Most Popular",
        isFeatured: true,
    },
    {
        id: "elite",
        name: "Elite",
        price: 899,
        idealFor: "Agencies or seasoned pros",
        features: ["Premium badge", "Leads priority", "Quote builder", "Analytics", "Invoice generator"],
        badge: null,
    }
];

const agencySubscriptionTiers: AgencySubscriptionTier[] = [
     {
        id: "lite",
        name: "Lite",
        price: 2500,
        idealFor: "Small teams starting out",
        features: ["Up to 5 bookings/month", "Manage up to 3 providers", "Basic Reporting"],
        badge: null,
    },
    {
        id: "pro",
        name: "Pro",
        price: 4500,
        idealFor: "Growing agencies",
        features: ["Up to 20 bookings/month", "Manage up to 10 providers", "Advanced Usage Reports"],
        badge: "Most Popular",
        isFeatured: true,
    },
    {
        id: "custom",
        name: "Custom",
        price: "Starts at ₱10,000",
        idealFor: "Large-scale operations",
        features: ["Unlimited bookings & providers", "Onboarding support", "Custom SLA", "Full dashboard access"],
        badge: "Enterprise",
    }
]

const commissionRates = [
    {
        jobType: "Low-ticket (e.g. haircut, cleaning)",
        commission: "10%",
        notes: "To keep providers profitable",
    },
    {
        jobType: "Mid-ticket (e.g. appliance repair, plumbing)",
        commission: "12%",
        notes: "Good balance",
    },
    {
        jobType: "High-ticket (e.g. renovation, roofing)",
        commission: "15%",
        notes: "More value, so higher cut is fair",
    }
];

const paymentHistory = [
    {
        date: "2024-06-25",
        planName: "Pro",
        amount: 499,
        status: "Paid",
        invoiceId: "INV-2024-001"
    },
    {
        date: "2024-05-25",
        planName: "Pro",
        amount: 499,
        status: "Paid",
        invoiceId: "INV-2024-002"
    },
    {
        date: "2024-04-25",
        planName: "Starter",
        amount: 299,
        status: "Paid",
        invoiceId: "INV-2024-003"
    },
];

// Mock function to simulate a backend payment process
const processSubscriptionChange = async (userId: string, planId: SubscriptionTier['id'] | AgencySubscriptionTier['id']): Promise<UserSubscription> => {
    console.log(`Processing subscription change for user ${userId} to plan ${planId}`);
    // In a real app, this would call a payment gateway (e.g., Stripe) 
    // and a backend function to update the subscription.
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    const newRenewsOn = Timestamp.fromDate(new Date(new Date().setMonth(new Date().getMonth() + 1)));
    
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
        subscription: {
            planId: planId,
            status: 'active',
            renewsOn: newRenewsOn,
        }
    });

    return {
        planId: planId as UserSubscription['planId'],
        status: 'active',
        renewsOn: newRenewsOn
    };
};


export default function SubscriptionPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<SubscriptionTier['id'] | AgencySubscriptionTier['id'] | null>(null);
    const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | AgencySubscriptionTier | null>(null);


    useEffect(() => {
        const fetchSubscription = async () => {
            if (!user) return;
            setLoading(true);
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().subscription) {
                setSubscription(userDoc.data().subscription);
            } else {
                // Default to free plan if no subscription data is found
                setSubscription({ planId: 'free', status: 'active', renewsOn: null });
            }
            setLoading(false);
        };
        fetchSubscription();
    }, [user]);

    const handlePlanChange = async (planId: SubscriptionTier['id'] | AgencySubscriptionTier['id']) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        setIsProcessing(planId);
        try {
            const newSubscription = await processSubscriptionChange(user.uid, planId);
            setSubscription(newSubscription);
            const allTiers = [...providerSubscriptionTiers, ...agencySubscriptionTiers];
            toast({ title: 'Success!', description: `You have successfully subscribed to the ${allTiers.find(t => t.id === planId)?.name} plan.` });
            setPaymentDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update your subscription.' });
        } finally {
            setIsProcessing(null);
        }
    }
    
    const allTiers = [...providerSubscriptionTiers, ...agencySubscriptionTiers];
    const currentPlan = allTiers.find(tier => tier.id === subscription?.planId);

    const GCashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24">
            <path fill="#0066FF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <path fill="#FFFFFF" d="M12 7.1c-2.7 0-4.9 2.2-4.9 4.9s2.2 4.9 4.9 4.9 4.9-2.2 4.9-4.9-2.2-4.9-4.9-4.9zm0 8c-1.71 0-3.1-1.39-3.1-3.1s1.39-3.1 3.1-3.1 3.1 1.39 3.1 3.1-1.39 3.1-3.1 3.1z"/>
            <path fill="#FFFFFF" d="M12 11.1h-1v2h1c.55 0 1-.45 1-1s-.45-1-1-1zm3.6-1.5l-.8.8c.3.3.5.7.5 1.2s-.2 1.1-.5 1.2l.8.8c.5-.5.9-1.2.9-2s-.4-1.5-.9-2z"/>
        </svg>
    )

    const QRCodeSVG = () => (
        <svg width="300" height="300" viewBox="0 0 250 250" className="mx-auto border-4 border-blue-500 rounded-lg" xmlns="http://www.w3.org/2000/svg">
            <path fill="#fff" d="M0 0h250v250H0z"/>
            <path d="M50 50h50v50H50zM60 60v30h30V60zm-5 45h5v5h-5zM150 50h50v50h-50zM160 60v30h30V60zM50 150h50v50H50zM60 160v30h30v-30zM55 195h5v5h-5zM105 55h5v5h-5zM55 105h5v5h-5zM105 105h5v5h-5zM105 155h5v5h-5zM155 105h5v5h-5zM105 195h5v5h-5zM155 155h5v5h-5zM195 55h5v5h-5zM195 105h5v5h-5zM155 195h5v5h-5zM195 155h5v5h-5zM195 195h5v5h-5zM110 110h30v30h-30zM120 120v10h10v-10zM110 80h10v10h-10zM80 110h10v10H80zM120 90h10v10h-10zM90 120h10v10H90z"/>
        </svg>
    );

    const renderProviderPlans = () => (
         <section>
                 <h2 className="text-2xl font-bold font-headline mb-4">Provider Subscription Plans</h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {providerSubscriptionTiers.map(tier => {
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
                                        <DialogTrigger asChild>
                                            <Button 
                                                className="w-full"
                                                variant='default'
                                                disabled={isProcessing !== null}
                                                onClick={() => setSelectedPlan(tier)}
                                            >
                                                <GCashIcon /> Pay with GCash
                                            </Button>
                                        </DialogTrigger>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            </section>
    );

    const renderAgencyPlans = () => (
         <section>
            <h2 className="text-2xl font-bold font-headline mb-4">Agency Subscription Plans</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {agencySubscriptionTiers.map(tier => {
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
                                     <DialogTrigger asChild>
                                        <Button 
                                            className="w-full"
                                            variant='default'
                                            disabled={isProcessing !== null}
                                            onClick={() => setSelectedPlan(tier)}
                                        >
                                            <GCashIcon /> Pay with GCash
                                        </Button>
                                     </DialogTrigger>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </section>
    );

    return (
        <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
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
                                    <Star className="text-primary"/>
                                    {currentPlan ? `You are on the ${currentPlan.name} Plan` : 'You are on a Free Plan'}
                                </CardTitle>
                                <CardDescription>
                                    {currentPlan && subscription?.renewsOn ? 
                                    `Your plan renews on ${subscription.renewsOn.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`
                                    : `Upgrade to a paid plan to access more features.`}
                                </CardDescription>
                            </CardHeader>
                            {currentPlan && (
                                <CardFooter>
                                    <Button variant="outline">Manage Subscription</Button>
                                </CardFooter>
                            )}
                        </Card>
                    )}
                </section>
                
                {userRole === 'agency' ? renderAgencyPlans() : renderProviderPlans()}
                
                <section>
                    <h2 className="text-2xl font-bold font-headline mb-4">Commission per Completed Service</h2>
                     <Card>
                        <CardContent className="p-0">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Job Type</TableHead>
                                        <TableHead>Commission Rate</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {commissionRates.map(rate => (
                                        <TableRow key={rate.jobType}>
                                            <TableCell className="font-medium">{rate.jobType}</TableCell>
                                            <TableCell>{rate.commission}</TableCell>
                                            <TableCell className="text-muted-foreground">{rate.notes}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                     </Card>
                </section>

                 <section>
                    <h2 className="text-2xl font-bold font-headline mb-4">Payment History</h2>
                     <Card>
                        <CardContent className="p-0">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Invoice</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentHistory.map(item => (
                                        <TableRow key={item.invoiceId}>
                                            <TableCell className="font-medium">{item.date}</TableCell>
                                            <TableCell>{item.planName}</TableCell>
                                            <TableCell>₱{item.amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{item.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="icon">
                                                    <FileDown className="h-4 w-4" />
                                                    <span className="sr-only">Download Invoice</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                     </Card>
                </section>

                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pay with GCash</DialogTitle>
                        <DialogDescription>
                            Scan the QR code below using your GCash app to pay for the {selectedPlan?.name} plan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-center space-y-4">
                        <QRCodeSVG />
                        <div className="text-left text-sm text-muted-foreground space-y-2">
                             <p><strong>Amount:</strong> ₱{selectedPlan && typeof selectedPlan.price === 'number' ? selectedPlan.price.toLocaleString() : 'N/A'}</p>
                             <p><strong>Instructions:</strong></p>
                            <ol className="list-decimal list-inside">
                                <li>Open your GCash app and tap "Pay QR".</li>
                                <li>Align your phone's camera with the QR code to scan.</li>
                                <li>Enter the exact amount and confirm your payment.</li>
                                <li>After successful payment, click the "Confirm Payment" button below.</li>
                            </ol>
                        </div>
                    </div>
                     <CardFooter className="flex-col gap-2">
                        <Button
                            className="w-full"
                            onClick={() => selectedPlan && handlePlanChange(selectedPlan.id)}
                            disabled={isProcessing !== null}
                        >
                            {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                            {isProcessing ? 'Processing...' : 'Confirm Payment'}
                        </Button>
                        <p className="text-xs text-muted-foreground">Your plan will be activated within a few minutes of confirmation.</p>
                    </CardFooter>
                </DialogContent>
            </div>
        </Dialog>
    );
}
