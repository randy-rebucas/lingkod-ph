
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Loader2, Star, Check } from "lucide-react";
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
        features: ["Verified badge", "Priority listing", "Calendar + Invoice generator"],
        badge: "Most Popular",
        isFeatured: true,
    },
    {
        id: "elite",
        name: "Elite",
        price: 899,
        idealFor: "Agencies or seasoned pros",
        features: ["Premium badge", "Leads priority", "Quote builder", "Analytics"],
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
    const { user, userRole } = useAuth();
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
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 11.86c.14.73.54 1.25.9 1.57.5.44 1.2.64 1.8.64.95 0 1.7-.44 1.7-1.32 0-.66-.4-1.1-1.3-1.47-1.2-.47-2.2-.9-2.2-2.32 0-1.12.8-1.84 2-1.84.88 0 1.58.4 1.9 1.15.11.23.18.44.2.62h2.2c-.05-.88-.5-1.93-1.5-2.5-1-.56-2.2-.8-3.5-.8-2.5 0-4.3 1.5-4.3 3.6 0 1.45.9 2.45 2.8 3.1zM8.9 8.2c0-.52.4-.92.9-.92.54 0 .9.37.9.95 0 .5-.37.92-.9.92-.5 0-.9-.4-.9-.95z"/>
        <path d="M22 10.4c-.06-.58-.4-1.55-1.3-2.1-1-.58-2.3-.87-3.7-.87H9.2c-1.2 0-2.3.4-3.1 1.1-.9.8-1.4 2-1.4 3.3 0 2.6 2.3 4.2 4.9 4.2h1.2c.5 0 .9-.3 1-.8l.8-5h2.8c1.3 0 2.3.2 3.1.7.9.5 1.4 1.4 1.4 2.4 0 .6-.2 1.3-.7 1.8-.5.5-1.2.8-2 .8h-1.3c-.5 0-.9.3-1 .8l-.9 5.2c-.1.5.3.9.8.9h1.3c2.6 0 4.7-1.6 5.2-4 .1-.5.1-1 .1-1.4v-1.2z"/>
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
                                            className="w-full" 
                                            variant={tier.isFeatured ? 'default' : 'outline'}
                                            disabled={isProcessing !== null}
                                            onClick={() => handlePlanChange(tier.id)}
                                            style={{backgroundColor: '#0070ba', color: 'white'}}
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

        </div>
    );
}
