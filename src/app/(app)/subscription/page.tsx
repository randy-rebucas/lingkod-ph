
"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Mail, Star, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentDialog, type SubscriptionTier, type AgencySubscriptionTier } from "@/components/payment-dialog";


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


export default function SubscriptionPage() {
    const { userRole, subscription, loading } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | AgencySubscriptionTier | null>(null);

    const allTiers = [...providerSubscriptionTiers, ...agencySubscriptionTiers];
    const currentPlanDetails = allTiers.find(tier => tier.id === subscription?.planId);

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
                                    <Button 
                                        className="w-full"
                                        variant='default'
                                        onClick={() => setSelectedPlan(tier)}
                                    >
                                        <Star className="mr-2 h-4 w-4" />
                                        Choose Plan
                                    </Button>
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
                                    <Button 
                                        className="w-full"
                                        variant='default'
                                        onClick={() => setSelectedPlan(tier)}
                                    >
                                        <Star className="mr-2 h-4 w-4" />
                                        Choose Plan
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </section>
    );

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
                                {currentPlanDetails ? `You are on the ${currentPlanDetails.name} Plan` : 'You are on a Free Plan'}
                            </CardTitle>
                            <CardDescription>
                                {currentPlanDetails && subscription?.renewsOn ? 
                                `Your plan renews on ${subscription.renewsOn.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`
                                : `Upgrade to a paid plan to access more features.`}
                            </CardDescription>
                        </CardHeader>
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
            {selectedPlan && (
                <PaymentDialog 
                    isOpen={!!selectedPlan}
                    setIsOpen={(open) => {
                        if (!open) setSelectedPlan(null);
                    }}
                    plan={selectedPlan}
                />
            )}
        </div>
    );
}
