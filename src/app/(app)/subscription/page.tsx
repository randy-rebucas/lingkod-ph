
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Megaphone, Building, Star } from "lucide-react";

const subscriptionTiers = [
    {
        name: "Starter",
        price: 299,
        idealFor: "Freelancers & part-timers",
        features: ["Basic profile", "Job matching", "Calendar"],
        badge: null,
    },
    {
        name: "Pro",
        price: 499,
        idealFor: "Full-time service providers",
        features: ["Verified badge", "Priority listing", "Calendar + Invoice generator"],
        badge: "Most Popular",
        isFeatured: true,
    },
    {
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

const advertisingFees = [
    {
        type: "Featured Listing",
        rate: "₱600/month",
        duration: "30 days",
        audience: "Top of category pages",
    },
    {
        type: "Homepage Banner",
        rate: "₱1,500/week",
        duration: "7 days",
        audience: "For big promos or seasonal ads",
    },
    {
        type: "Boosted Service",
        rate: "₱100/day",
        duration: "1-day boost",
        audience: "Boost individual listings like FB ads",
    }
];

const enterprisePlans = [
    {
        name: "Lite",
        price: "₱2,500",
        includes: ["Up to 5 bookings per month", "3 partner providers"],
    },
    {
        name: "Pro",
        price: "₱4,500",
        includes: ["Up to 20 bookings/month", "Up to 10 providers", "Usage reports"],
        isFeatured: true,
    },
    {
        name: "Custom",
        price: "Starts at ₱10,000",
        includes: ["Unlimited bookings", "Onboarding support", "SLA", "Dashboard access"],
    }
]

export default function SubscriptionPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Subscription & Pricing</h1>
                <p className="text-muted-foreground">
                    Choose the perfect plan for your business and understand our commission structure.
                </p>
            </div>

            <section>
                 <h2 className="text-2xl font-bold font-headline mb-4">Provider Subscription Plans</h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {subscriptionTiers.map(tier => (
                        <Card key={tier.name} className={`flex flex-col ${tier.isFeatured ? 'border-primary shadow-lg' : ''}`}>
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
                                <Button className="w-full" variant={tier.isFeatured ? 'default' : 'outline'}>
                                    {tier.isFeatured ? 'Choose Plan' : 'Get Started'}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
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
                 <h2 className="text-2xl font-bold font-headline mb-4">Advertising Fees</h2>
                 <div className="grid gap-8 md:grid-cols-3">
                    {advertisingFees.map(ad => (
                        <Card key={ad.type}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Megaphone className="h-6 w-6 text-accent" />{ad.type}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p><span className="font-semibold">Rate:</span> {ad.rate}</p>
                                <p><span className="font-semibold">Duration:</span> {ad.duration}</p>
                                <p><span className="font-semibold">Audience:</span> {ad.audience}</p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline">Learn More</Button>
                            </CardFooter>
                        </Card>
                    ))}
                 </div>
            </section>
            
            <section>
                 <h2 className="text-2xl font-bold font-headline mb-4">Enterprise Accounts</h2>
                 <div className="grid gap-8 md:grid-cols-3">
                    {enterprisePlans.map(plan => (
                        <Card key={plan.name} className={`flex flex-col ${plan.isFeatured ? 'border-primary shadow-lg' : ''}`}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Building className="h-6 w-6 text-primary" />{plan.name}</CardTitle>
                                <p className="text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2">
                                    {plan.includes.map(item => (
                                        <li key={item} className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                 <Button className="w-full" variant={plan.isFeatured ? 'default' : 'outline'}>
                                    {plan.name === "Custom" ? "Contact Sales" : "Choose Plan"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                 </div>
            </section>

        </div>
    );
}
