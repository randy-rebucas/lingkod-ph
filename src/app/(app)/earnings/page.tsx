
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, BookCheck, Wallet, Loader2, WalletCards, CheckCircle, Hourglass } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { handleRequestPayout } from '@/ai/flows/request-payout';
import { TooltipProvider, Tooltip as TooltipUI, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import AgencyEarningsPage from '@/app/(app)/agency-earnings/page';

type CompletedBooking = {
    id: string;
    clientName: string;
    serviceName: string;
    price: number;
    date: Timestamp;
};

type Payout = {
    id: string;
    amount: number;
    status: 'Pending' | 'Paid';
    requestedAt: Timestamp;
};

const processChartData = (bookings: CompletedBooking[]) => {
    const monthlyEarnings: { [key: string]: number } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    bookings.forEach(booking => {
        const date = booking.date.toDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month}`;

        if (!monthlyEarnings[key]) {
            monthlyEarnings[key] = 0;
        }
        monthlyEarnings[key] += booking.price;
    });

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const chartData = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(twelveMonthsAgo);
        date.setMonth(date.getMonth() + i);
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month}`;
        
        return {
            name: `${monthNames[month]} '${year.toString().slice(-2)}`,
            earnings: monthlyEarnings[key] || 0,
        };
    });

    return chartData;
};

export default function EarningsPage() {
    const { user, userRole, subscription } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<CompletedBooking[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRequestingPayout, setIsRequestingPayout] = useState(false);
    const isPaidSubscriber = subscription?.status === 'active' && subscription.planId !== 'free';

    const isSaturday = new Date().getDay() === 6;

    useEffect(() => {
        if (!user || userRole !== 'provider' || !isPaidSubscriber) {
            setLoading(false);
            return;
        }

        const bookingsQuery = query(
            collection(db, "bookings"),
            where("providerId", "==", user.uid),
            where("status", "==", "Completed")
        );

        const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompletedBooking))
                .sort((a, b) => b.date.toMillis() - a.date.toMillis());
            setBookings(bookingsData);
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setLoading(false);
        });
        
        const payoutsQuery = query(collection(db, "payouts"), where("providerId", "==", user.uid), orderBy("requestedAt", "desc"));
        const unsubscribePayouts = onSnapshot(payoutsQuery, (snapshot) => {
            const payoutsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payout));
            setPayouts(payoutsData);
        });

        return () => {
            unsubscribeBookings();
            unsubscribePayouts();
        };
    }, [user, userRole, isPaidSubscriber]);

    const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);
    const totalPaidOut = payouts.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payouts.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
    const availableForPayout = totalRevenue - totalPaidOut - totalPending;
    
    const totalPaidBookings = bookings.length;
    const chartData = processChartData(bookings);

    const handlePayoutRequest = async () => {
        if (!user) return;
        
        // Final check for payout details before proceeding
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists() || !userDoc.data()?.payoutDetails?.method) {
            toast({
                variant: "destructive",
                title: "Payout Details Missing",
                description: "Please set up your payout method in your profile before requesting a payout.",
            });
            return;
        }
        
        setIsRequestingPayout(true);
        try {
            await handleRequestPayout({ providerId: user.uid, amount: availableForPayout });
            toast({
                title: "Payout Requested",
                description: "Your payout request has been submitted and will be processed within 3-5 business days.",
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Request Failed",
                description: "There was an error submitting your payout request. Please try again.",
            });
        } finally {
            setIsRequestingPayout(false);
        }
    };
    
    if (userRole === 'agency') {
        return <AgencyEarningsPage />;
    }

    if (userRole !== 'provider') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Earnings</h1>
                    <p className="text-muted-foreground">This page is for providers and agencies only.</p>
                </div>
            </div>
        );
    }
    
    if (!isPaidSubscriber) {
         return (
            <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Earnings</h1>
                    <p className="text-muted-foreground">
                        Track your revenue and request payouts.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Upgrade to Access Earnings</CardTitle>
                        <CardDescription>This feature is available on our paid plans. Upgrade your plan to track your earnings and manage payouts.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <DollarSign className="h-16 w-16 mb-4" />
                        <p className="mb-4">Take control of your finances and monitor your business growth.</p>
                         <Button asChild>
                            <Link href="/subscription">View Subscription Plans</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <div className="grid gap-6 md:grid-cols-4">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const payoutButton = (
        <Button disabled={availableForPayout <= 400 || !isSaturday || isRequestingPayout} onClick={handlePayoutRequest}>
            {isRequestingPayout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Request Payout
        </Button>
    );

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Earnings</h1>
                    <p className="text-muted-foreground">
                        Track your revenue and request payouts.
                    </p>
                </div>
                {isSaturday ? (
                    payoutButton
                ) : (
                    <TooltipProvider>
                        <TooltipUI>
                            <TooltipTrigger asChild>
                                <span>{payoutButton}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Payout requests are only available on Saturdays.</p>
                            </TooltipContent>
                        </TooltipUI>
                    </TooltipProvider>
                )}
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lifetime Gross Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">All-time earnings from completed jobs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{totalPaidOut.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Total amount successfully paid out</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{totalPending.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Amount currently being processed</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available for Payout</CardTitle>
                        <WalletCards className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{availableForPayout.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Minimum payout is ₱400.00</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Earnings History</CardTitle>
                    <CardDescription>Your monthly earnings over the last year.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={chartData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value}`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)"
                                }}
                            />
                            <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Completed Jobs</CardTitle>
                        <CardDescription>A detailed list of completed transactions contributing to your earnings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.slice(0, 5).length > 0 ? bookings.slice(0, 5).map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-medium">{booking.clientName}</TableCell>
                                        <TableCell>{booking.serviceName}</TableCell>
                                        <TableCell className="text-right">₱{booking.price.toFixed(2)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No transactions yet. Complete jobs to see them here.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Payout History</CardTitle>
                        <CardDescription>A record of your requested payouts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date Requested</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.slice(0, 5).length > 0 ? payouts.slice(0, 5).map((payout) => (
                                    <TableRow key={payout.id}>
                                        <TableCell>{payout.requestedAt.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell>
                                             <Badge variant={payout.status === 'Paid' ? 'secondary' : 'outline'}>
                                                {payout.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">₱{payout.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No payouts requested yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
