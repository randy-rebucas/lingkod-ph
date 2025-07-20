
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Loader2, Star, Check, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type SubscriptionTier = {
    id: 'starter' | 'pro' | 'elite';
    name: string;
    price: number;
    idealFor: string;
    features: string[];
    badge: string | null;
    isFeatured?: boolean;
};

type UserSubscription = {
    planId: 'starter' | 'pro' | 'elite' | 'free';
    status: 'active' | 'cancelled' | 'none';
    renewsOn: Timestamp | null;
}

const subscriptionTiers: SubscriptionTier[] = [
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
const processSubscriptionChange = async (userId: string, planId: SubscriptionTier['id']): Promise<UserSubscription> => {
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
        planId,
        status: 'active',
        renewsOn: newRenewsOn
    };
};


export default function SubscriptionPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<SubscriptionTier['id'] | null>(null);

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

    const handlePlanChange = async (planId: SubscriptionTier['id']) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        setIsProcessing(planId);
        try {
            const newSubscription = await processSubscriptionChange(user.uid, planId);
            setSubscription(newSubscription);
            toast({ title: 'Success!', description: `You have successfully subscribed to the ${subscriptionTiers.find(t => t.id === planId)?.name} plan.` });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update your subscription.' });
        } finally {
            setIsProcessing(null);
        }
    }
    
    const currentPlan = subscriptionTiers.find(tier => tier.id === subscription?.planId);

    const PayPalIcon = () => (
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
            <title>PayPal</title>
            <path d="M7.076 21.337H2.478l.146-1.03-1.082-6.983 2.223.362.88 5.612h2.22s.223-1.38.855-2.223c.59-1.127 1.635-1.78 3.1-1.78h1.01s.292-1.815.88-2.658c.624-.878 1.6-1.345 2.872-1.345h.068c.328 0 .66.03.95.126.9.29 1.575.98 1.875 1.81.03.1.042.225.06.316.15.7.15 1.575-.09 2.28-.27 1.04-1.14 1.845-2.296 2.055-.5.09-1.02.15-1.546.15H9.64c-.56 0-1.054.48-1.15 1.053l-.56 3.424H7.076zm14.373-10.12c0-2.32-1.63-4.11-4.125-4.11H8.86l1.223-7.734H14.4s.258-1.47.825-2.222C15.848.48 16.923 0 18.2 0h.06c.36 0 .675.03.93.122.9.29 1.575.945 1.875 1.815.03.1.045.225.06.315.15.7.15 1.575-.09 2.28-.27 1.04-1.14 1.845-2.295 2.055-.5.09-1.02.15-1.545.15H14.9c-.56 0-1.054.48-1.15 1.053l-.56 3.424h2.956c2.4 0 4.218-1.78 4.218-4.11z" fill="#0070BA"/>
        </svg>
    )

    return (
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

            <section>
                 <h2 className="text-2xl font-bold font-headline mb-4">Provider Subscription Plans</h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {subscriptionTiers.map(tier => {
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
                                        <Button 
                                            className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white"
                                            variant='default'
                                            disabled={isProcessing !== null}
                                            onClick={() => handlePlanChange(tier.id)}
                                        >
                                            {isProcessing === tier.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                            ) : (
                                                <PayPalIcon />
                                            )}
                                            {isProcessing === tier.id ? 'Processing...' : 'Pay with PayPal'}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            </section>
            
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

        </div>
    );
}
