
"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { BarChart2, TrendingUp, Users, DollarSign, CheckCircle, PieChart, Loader2, Slash, Star, Percent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Booking = {
    id: string;
    clientId: string;
    serviceName: string;
    status: "Upcoming" | "Completed" | "Cancelled";
    price: number;
    date: Timestamp;
};

type Review = {
    id: string;
    rating: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const processBookingTrends = (bookings: Booking[]) => {
    const monthlyData: { [key: string]: { total: number; completed: number } } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    bookings.forEach(booking => {
        const date = booking.date.toDate();
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyData[key]) {
            monthlyData[key] = { total: 0, completed: 0 };
        }
        monthlyData[key].total++;
        if (booking.status === 'Completed') {
            monthlyData[key].completed++;
        }
    });

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    
    return Array.from({ length: 12 }, (_, i) => {
        const date = new Date(twelveMonthsAgo);
        date.setMonth(date.getMonth() + i);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        return {
            name: `${monthNames[date.getMonth()]} '${date.getFullYear().toString().slice(-2)}`,
            'Total Bookings': monthlyData[key]?.total || 0,
            'Completed Jobs': monthlyData[key]?.completed || 0,
        };
    });
};

const processServicePerformance = (bookings: Booking[]) => {
    const serviceRevenue: { [key: string]: number } = {};
    bookings.filter(b => b.status === 'Completed').forEach(booking => {
        if (!serviceRevenue[booking.serviceName]) {
            serviceRevenue[booking.serviceName] = 0;
        }
        serviceRevenue[booking.serviceName] += booking.price;
    });

    return Object.entries(serviceRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
};


export default function AnalyticsPage() {
    const { user, subscription } = useAuth();
    const t = useTranslations('Analytics');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const isElite = subscription?.status === 'active' && subscription.planId === 'elite';


    useEffect(() => {
        if (!user || !isElite) {
            setLoading(false);
            return;
        };

        setLoading(true);
        const bookingsQuery = query(collection(db, "bookings"), where("providerId", "==", user.uid));
        const reviewsQuery = query(collection(db, "reviews"), where("providerId", "==", user.uid));
        
        const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
            setBookings(bookingsData);
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error (Bookings):", error);
            setLoading(false);
        });

        const unsubReviews = onSnapshot(reviewsQuery, (snapshot) => {
             const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
            setReviews(reviewsData);
        });

        return () => {
            unsubBookings();
            unsubReviews();
        };
    }, [user, isElite]);

    const analyticsData = useMemo(() => {
        const completedBookings = bookings.filter(b => b.status === 'Completed');
        const totalRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
        const averageBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;
        
        const totalClients = new Set(bookings.map(b => b.clientId)).size;
        
        const bookingTrends = processBookingTrends(bookings);
        const servicePerformance = processServicePerformance(completedBookings);

        const totalBookings = bookings.length;
        const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;
        const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

        const totalPotentialJobs = bookings.filter(b => b.status === 'Upcoming' || b.status === 'Completed').length;
        const utilizationRate = totalPotentialJobs > 0 ? (completedBookings.length / totalPotentialJobs) * 100 : 0;
        
        const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
        
        return {
            averageBookingValue,
            totalBookings: bookings.length,
            totalClients,
            bookingTrends,
            servicePerformance,
            topServices: servicePerformance.slice(0, 5),
            cancellationRate,
            utilizationRate,
            averageRating,
        };
    }, [bookings, reviews]);

    if (!isElite) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                    <p className="text-muted-foreground">
                        {t('subtitle')}
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('upgradeToElite')}</CardTitle>
                        <CardDescription>{t('eliteExclusive')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <BarChart2 className="h-16 w-16 mb-4" />
                        <p className="mb-4">{t('advancedAnalytics')}</p>
                         <Button asChild>
                            <Link href="/subscription">{t('viewSubscriptionPlans')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">{t('advancedAnalyticsTitle')}</h1>
                <p className="text-muted-foreground">
                    {t('deepDiveDescription')}
                </p>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('avgBookingValue')}</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₱{analyticsData.averageBookingValue.toFixed(2)}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('cancellationRate')}</CardTitle><Slash className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{analyticsData.cancellationRate.toFixed(1)}%</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('utilizationRate')}</CardTitle><Percent className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{analyticsData.utilizationRate.toFixed(1)}%</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('avgRating')}</CardTitle><Star className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{analyticsData.averageRating.toFixed(2)}</div></CardContent></Card>
                </div>
            )}
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>{t('bookingTrends')}</CardTitle>
                        <CardDescription>{t('totalVsCompleted')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analyticsData.bookingTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                                <Legend />
                                <Line type="monotone" dataKey={t('totalBookings')} stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey={t('completedJobs')} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('servicePerformance')}</CardTitle>
                        <CardDescription>{t('revenueDistribution')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {loading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={analyticsData.servicePerformance} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {analyticsData.servicePerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{t('topPerformingServices')}</CardTitle>
                    <CardDescription>{t('mostProfitableServices')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-48 w-full" /> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('service')}</TableHead>
                                <TableHead className="text-right">{t('totalRevenue')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analyticsData.topServices.length > 0 ? analyticsData.topServices.map((service, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell className="text-right">₱{service.value.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={2} className="h-24 text-center">{t('noCompletedServices')}</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
