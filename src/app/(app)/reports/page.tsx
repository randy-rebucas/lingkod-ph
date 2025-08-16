
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, BookCheck, Calculator, FilePieChart, CheckCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Bar,
  BarChart,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { handleMarkAsPaid } from './actions';

type Booking = {
    id: string;
    providerId: string;
    providerName: string;
    status: "Upcoming" | "Completed" | "Cancelled";
    price: number;
    date: Timestamp;
};

type ProviderStats = {
    providerId: string;
    providerName: string;
    completedBookings: number;
    totalRevenue: number;
};

type PayoutRequest = {
    id: string;
    transactionId?: string;
    providerId: string;
    providerName: string;
    amount: number;
    status: "Pending" | "Paid";
    requestedAt: Timestamp;
};

const processRevenueChartData = (bookings: Booking[]) => {
    const monthlyData: { [key: string]: number } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    bookings.forEach(booking => {
        if (booking.status !== 'Completed') return;
        const date = booking.date.toDate();
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyData[key]) {
            monthlyData[key] = 0;
        }
        monthlyData[key] += booking.price;
    });

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    
    return Array.from({ length: 12 }, (_, i) => {
        const date = new Date(twelveMonthsAgo);
        date.setMonth(date.getMonth() + i);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        return {
            name: `${monthNames[date.getMonth()]} '${date.getFullYear().toString().slice(-2)}`,
            'Revenue': monthlyData[key] || 0,
        };
    });
};

const getStatusVariant = (status: PayoutRequest['status']) => {
    switch (status) {
        case 'Paid':
            return 'secondary';
        case 'Pending':
            return 'outline';
        default:
            return 'default';
    }
};

export default function ReportsPage() {
    const { user, userRole, subscription } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const isAgencyPaidSubscriber = userRole === 'agency' && subscription?.status === 'active' && subscription.planId !== 'free';
    const isProOrCustom = isAgencyPaidSubscriber && (subscription?.planId === 'pro' || subscription?.planId === 'custom');

    useEffect(() => {
        if (!user || !isAgencyPaidSubscriber) {
            setLoading(false);
            return;
        }

        const fetchAgencyData = async () => {
            setLoading(true);
            try {
                const providersQuery = query(collection(db, "users"), where("agencyId", "==", user.uid));
                const providersSnapshot = await getDocs(providersQuery);
                const providerIds = providersSnapshot.docs.map(doc => doc.id);

                if (providerIds.length === 0) {
                    setBookings([]);
                    setPayouts([]);
                    setLoading(false);
                    return;
                }

                const bookingsQuery = query(collection(db, "bookings"), where("providerId", "in", providerIds));
                const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
                    const fetchedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
                    setBookings(fetchedBookings);
                });

                const payoutsQuery = query(collection(db, "payouts"), where("agencyId", "==", user.uid));
                const unsubPayouts = onSnapshot(payoutsQuery, (snapshot) => {
                    const fetchedPayouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayoutRequest));
                    setPayouts(fetchedPayouts.sort((a,b) => b.requestedAt.toMillis() - a.requestedAt.toMillis()));
                });
                
                setLoading(false);
                return () => {
                    unsubBookings();
                    unsubPayouts();
                }
            } catch (error) {
                console.error("Error fetching agency reports data:", error);
                setLoading(false);
            }
        };

        const unsubscribePromise = fetchAgencyData();
        return () => {
             unsubscribePromise.then(unsub => unsub && unsub());
        }

    }, [user, isAgencyPaidSubscriber]);

    const reportData = useMemo(() => {
        const completedBookings = bookings.filter(b => b.status === 'Completed');
        const totalRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
        const averageBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

        const providerStats: { [key: string]: ProviderStats } = {};

        completedBookings.forEach(booking => {
            if (!providerStats[booking.providerId]) {
                providerStats[booking.providerId] = {
                    providerId: booking.providerId,
                    providerName: booking.providerName,
                    completedBookings: 0,
                    totalRevenue: 0,
                };
            }
            providerStats[booking.providerId].completedBookings++;
            providerStats[booking.providerId].totalRevenue += booking.price;
        });
        
        const providerPerformance = Object.values(providerStats).sort((a,b) => b.totalRevenue - a.totalRevenue);

        return {
            totalRevenue,
            totalCompletedBookings: completedBookings.length,
            averageBookingValue,
            providerPerformance,
            revenueChartData: processRevenueChartData(completedBookings),
            providerChartData: providerPerformance.map(p => ({name: p.providerName, Bookings: p.completedBookings}))
        };
    }, [bookings]);
    
    const onMarkAsPaid = async (payout: PayoutRequest) => {
        const result = await handleMarkAsPaid(payout.id, payout.providerId, payout.providerName, payout.amount);
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    };


     if (!isAgencyPaidSubscriber) {
        return (
            <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Reports</h1>
                    <p className="text-muted-foreground">This feature is for agency subscribers.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Upgrade to Access Reports</CardTitle>
                        <CardDescription>Upgrade your agency plan to view performance reports.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <FilePieChart className="h-16 w-16 mb-4" />
                        <p className="mb-4">Get insights into your agency's performance.</p>
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
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
    const pageTitle = isProOrCustom ? "Advanced Reports" : "Basic Reports";
    const pageDescription = isProOrCustom 
        ? "Deep dive into your agency's performance with charts and detailed tables." 
        : "An overview of your agency's performance.";

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{pageTitle}</h1>
                    <p className="text-muted-foreground">{pageDescription}</p>
                </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{reportData.totalRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
                        <BookCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportData.totalCompletedBookings}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{reportData.averageBookingValue.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Payout Requests</CardTitle>
                    <CardDescription>Manage and track payout requests from your providers.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Date Requested</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payouts.length > 0 ? payouts.map((payout) => (
                                <TableRow key={payout.id}>
                                    <TableCell className="font-mono text-xs">{payout.transactionId || 'N/A'}</TableCell>
                                    <TableCell className="font-medium">{payout.providerName}</TableCell>
                                    <TableCell>{format(payout.requestedAt.toDate(), 'PPP')}</TableCell>
                                    <TableCell>₱{payout.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={getStatusVariant(payout.status)}>{payout.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {payout.status === 'Pending' ? (
                                            <Button size="sm" onClick={() => onMarkAsPaid(payout)}>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                                            </Button>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Processed</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No payout requests.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>


            {isProOrCustom && (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Monthly Revenue</CardTitle>
                            <CardDescription>Total revenue over the last 12 months.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={reportData.revenueChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Provider Bookings</CardTitle>
                            <CardDescription>Number of completed bookings per provider.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData.providerChartData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={80} stroke="#888888" fontSize={12}/>
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}/>
                                    <Legend />
                                    <Bar dataKey="Bookings" fill="hsl(var(--chart-2))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Provider Performance</CardTitle>
                    <CardDescription>A summary of bookings and revenue by each provider.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Provider</TableHead>
                                <TableHead className="text-center">Completed Bookings</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.providerPerformance.length > 0 ? reportData.providerPerformance.map((provider) => (
                                <TableRow key={provider.providerId}>
                                    <TableCell className="font-medium">{provider.providerName}</TableCell>
                                    <TableCell className="text-center">{provider.completedBookings}</TableCell>
                                    <TableCell className="text-right">₱{provider.totalRevenue.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No data to display.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );

    