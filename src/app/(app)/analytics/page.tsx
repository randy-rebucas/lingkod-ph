
"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { BarChart2, TrendingUp, Users, DollarSign, CheckCircle, PieChart, Loader2, Slash, Star, Percent, Calendar, Download, Target, MapPin, AlertCircle, TrendingDown, Activity, Clock, Award } from "lucide-react";
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
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Booking = {
    id: string;
    clientId: string;
    serviceName: string;
    status: "Upcoming" | "Completed" | "Cancelled";
    price: number;
    date: Timestamp;
    location?: string;
    serviceArea?: string;
};

type Review = {
    id: string;
    rating: number;
    createdAt: Timestamp;
}

type TimePeriod = '7d' | '30d' | '90d' | '1y' | 'all';

type ClientAnalytics = {
    newClients: number;
    returningClients: number;
    clientRetentionRate: number;
    averageClientValue: number;
}

type RevenueAnalytics = {
    totalRevenue: number;
    monthlyGrowth: number;
    projectedRevenue: number;
    revenueByMonth: Array<{month: string, revenue: number, growth: number}>;
}

type GeographicAnalytics = {
    topLocations: Array<{location: string, bookings: number, revenue: number}>;
    serviceAreas: Array<{area: string, count: number}>;
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

const filterDataByTimePeriod = (bookings: Booking[], reviews: Review[], period: TimePeriod) => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            return { bookings, reviews };
    }

    const filteredBookings = bookings.filter(booking => 
        booking.date.toDate() >= startDate
    );
    
    const filteredReviews = reviews.filter(review => 
        review.createdAt && review.createdAt.toDate() >= startDate
    );

    return { bookings: filteredBookings, reviews: filteredReviews };
};

const processClientAnalytics = (bookings: Booking[]): ClientAnalytics => {
    const clientData: { [key: string]: { firstBooking: Date, totalSpent: number, bookingCount: number } } = {};
    
    bookings.forEach(booking => {
        const bookingDate = booking.date.toDate();
        if (!clientData[booking.clientId]) {
            clientData[booking.clientId] = {
                firstBooking: bookingDate,
                totalSpent: 0,
                bookingCount: 0
            };
        }
        clientData[booking.clientId].totalSpent += booking.price;
        clientData[booking.clientId].bookingCount++;
        
        if (bookingDate < clientData[booking.clientId].firstBooking) {
            clientData[booking.clientId].firstBooking = bookingDate;
        }
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const newClients = Object.values(clientData).filter(client => 
        client.firstBooking >= thirtyDaysAgo
    ).length;
    
    const returningClients = Object.values(clientData).filter(client => 
        client.firstBooking < thirtyDaysAgo && client.bookingCount > 1
    ).length;
    
    const totalClients = Object.keys(clientData).length;
    const clientRetentionRate = totalClients > 0 ? (returningClients / totalClients) * 100 : 0;
    
    const totalRevenue = Object.values(clientData).reduce((sum, client) => sum + client.totalSpent, 0);
    const averageClientValue = totalClients > 0 ? totalRevenue / totalClients : 0;

    return {
        newClients,
        returningClients,
        clientRetentionRate,
        averageClientValue
    };
};

const processRevenueAnalytics = (bookings: Booking[]): RevenueAnalytics => {
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const monthlyRevenue: { [key: string]: number } = {};
    
    completedBookings.forEach(booking => {
        const date = booking.date.toDate();
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyRevenue[key]) {
            monthlyRevenue[key] = 0;
        }
        monthlyRevenue[key] += booking.price;
    });

    const sortedMonths = Object.entries(monthlyRevenue)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, revenue], index, array) => {
            const prevRevenue = index > 0 ? array[index - 1][1] : 0;
            const growth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
            return {
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                revenue,
                growth
            };
        });

    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
    const monthlyGrowth = sortedMonths.length > 1 ? sortedMonths[sortedMonths.length - 1].growth : 0;
    
    // Simple projection based on recent growth
    const projectedRevenue = monthlyGrowth > 0 ? 
        totalRevenue * (1 + monthlyGrowth / 100) : 
        totalRevenue;

    return {
        totalRevenue,
        monthlyGrowth,
        projectedRevenue,
        revenueByMonth: sortedMonths
    };
};

const processGeographicAnalytics = (bookings: Booking[]): GeographicAnalytics => {
    const locationData: { [key: string]: { bookings: number, revenue: number } } = {};
    const serviceAreaData: { [key: string]: number } = {};
    
    bookings.filter(b => b.status === 'Completed').forEach(booking => {
        // Process location data
        const location = booking.location || 'Unknown Location';
        if (!locationData[location]) {
            locationData[location] = { bookings: 0, revenue: 0 };
        }
        locationData[location].bookings++;
        locationData[location].revenue += booking.price;
        
        // Process service area data
        const area = booking.serviceArea || 'General';
        serviceAreaData[area] = (serviceAreaData[area] || 0) + 1;
    });
    
    const topLocations = Object.entries(locationData)
        .map(([location, data]) => ({ location, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    
    const serviceAreas = Object.entries(serviceAreaData)
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    return {
        topLocations,
        serviceAreas
    };
};


export default function AnalyticsPage() {
    const { user } = useAuth();
    const t = useTranslations('Analytics');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');

    const exportData = () => {
        const exportData = {
            timePeriod,
            generatedAt: new Date().toISOString(),
            analytics: {
                totalRevenue: analyticsData.revenueAnalytics.totalRevenue,
                monthlyGrowth: analyticsData.revenueAnalytics.monthlyGrowth,
                totalBookings: analyticsData.totalBookings,
                totalClients: analyticsData.totalClients,
                averageBookingValue: analyticsData.averageBookingValue,
                cancellationRate: analyticsData.cancellationRate,
                utilizationRate: analyticsData.utilizationRate,
                averageRating: analyticsData.averageRating,
                clientRetentionRate: analyticsData.clientAnalytics.clientRetentionRate,
                newClients: analyticsData.clientAnalytics.newClients,
                returningClients: analyticsData.clientAnalytics.returningClients,
                topServices: analyticsData.topServices,
                topLocations: analyticsData.geographicAnalytics.topLocations
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-export-${timePeriod}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    useEffect(() => {
        if (!user || !db) {
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
    }, [user, db]);

    const analyticsData = useMemo(() => {
        const { bookings: filteredBookings, reviews: filteredReviews } = filterDataByTimePeriod(bookings, reviews, timePeriod);
        
        const completedBookings = filteredBookings.filter(b => b.status === 'Completed');
        const totalRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
        const averageBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;
        
        const totalClients = new Set(filteredBookings.map(b => b.clientId)).size;
        
        const bookingTrends = processBookingTrends(filteredBookings);
        const servicePerformance = processServicePerformance(completedBookings);
        const clientAnalytics = processClientAnalytics(filteredBookings);
        const revenueAnalytics = processRevenueAnalytics(filteredBookings);
        const geographicAnalytics = processGeographicAnalytics(filteredBookings);

        const totalBookings = filteredBookings.length;
        const cancelledBookings = filteredBookings.filter(b => b.status === 'Cancelled').length;
        const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

        const totalPotentialJobs = filteredBookings.filter(b => b.status === 'Upcoming' || b.status === 'Completed').length;
        const utilizationRate = totalPotentialJobs > 0 ? (completedBookings.length / totalPotentialJobs) * 100 : 0;
        
        const averageRating = filteredReviews.length > 0 ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length : 0;
        
        // Performance indicators
        const isPerformingWell = {
            revenue: revenueAnalytics.monthlyGrowth > 0,
            retention: clientAnalytics.clientRetentionRate > 50,
            utilization: utilizationRate > 70,
            rating: averageRating > 4.0
        };
        
        return {
            averageBookingValue,
            totalBookings: filteredBookings.length,
            totalClients,
            bookingTrends,
            servicePerformance,
            topServices: servicePerformance.slice(0, 5),
            cancellationRate,
            utilizationRate,
            averageRating,
            clientAnalytics,
            revenueAnalytics,
            geographicAnalytics,
            isPerformingWell,
            filteredBookings,
            filteredReviews
        };
    }, [bookings, reviews, timePeriod]);

    if (!user) {
        return (
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                    <p className="text-muted-foreground">
                        {t('subtitle')}
                    </p>
                </div>
                <div className="max-w-6xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('upgradeToElite')}</CardTitle>
                            <CardDescription>{t('eliteExclusive')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                            <BarChart2 className="h-16 w-16 mb-4" />
                            <p className="mb-4">{t('advancedAnalytics')}</p>
                             <Button asChild>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="container space-y-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('advancedAnalyticsTitle')}</h1>
                    <p className="text-muted-foreground">
                        {t('deepDiveDescription')}
                    </p>
                </div>
                    <div className="flex items-center gap-4">
                        <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
                            <SelectTrigger className="w-[180px]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="90d">Last 90 days</SelectItem>
                                <SelectItem value="1y">Last year</SelectItem>
                                <SelectItem value="all">All time</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={exportData}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Performance Alerts */}
            <div className="max-w-6xl mx-auto">
                {!analyticsData.isPerformingWell.revenue && analyticsData.revenueAnalytics.monthlyGrowth < 0 && (
                    <Alert>
                        <TrendingDown className="h-4 w-4" />
                        <AlertDescription>
                            Revenue has decreased by {Math.abs(analyticsData.revenueAnalytics.monthlyGrowth).toFixed(1)}% this month. Consider reviewing your pricing strategy.
                        </AlertDescription>
                    </Alert>
                )}
                
                {analyticsData.isPerformingWell.revenue && analyticsData.revenueAnalytics.monthlyGrowth > 0 && (
                    <Alert className="border-green-200 bg-green-50">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            Great! Revenue is up {analyticsData.revenueAnalytics.monthlyGrowth.toFixed(1)}% this month.
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">₱{analyticsData.revenueAnalytics.totalRevenue.toFixed(2)}</div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                {analyticsData.revenueAnalytics.monthlyGrowth > 0 ? (
                                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                                ) : (
                                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                                )}
                                {analyticsData.revenueAnalytics.monthlyGrowth.toFixed(1)}% vs last month
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('avgBookingValue')}</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">₱{analyticsData.averageBookingValue.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground mt-1">Per completed booking</div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">New Clients</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{analyticsData.clientAnalytics.newClients}</div>
                            <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Client Retention</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{analyticsData.clientAnalytics.clientRetentionRate.toFixed(1)}%</div>
                            <Progress value={analyticsData.clientAnalytics.clientRetentionRate} className="mt-2 h-1" />
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('utilizationRate')}</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{analyticsData.utilizationRate.toFixed(1)}%</div>
                            <Progress value={analyticsData.utilizationRate} className="mt-2 h-1" />
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('avgRating')}</CardTitle>
                            <Star className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{analyticsData.averageRating.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground mt-1">From {analyticsData.filteredReviews.length} reviews</div>
                        </CardContent>
                    </Card>
                    </div>
                )}
            </div>
            
            {/* Revenue Analytics */}
            <div className="max-w-6xl mx-auto">
                <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Revenue Growth</CardTitle>
                        <CardDescription>Monthly revenue trends and projections</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analyticsData.revenueAnalytics.revenueByMonth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                                    formatter={(value: number, name: string) => [`₱${value.toFixed(2)}`, name]}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="hsl(var(--primary))" 
                                    fill="hsl(var(--primary))" 
                                    fillOpacity={0.3}
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Client Analytics</CardTitle>
                        <CardDescription>New vs returning client distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={[
                                        { name: 'New Clients', value: analyticsData.clientAnalytics.newClients },
                                        { name: 'Returning Clients', value: analyticsData.clientAnalytics.returningClients }
                                    ]} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={100} 
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    <Cell fill="hsl(var(--chart-1))" />
                                    <Cell fill="hsl(var(--chart-2))" />
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>

            {/* Booking Trends and Service Performance */}
            <div className="max-w-6xl mx-auto">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card className="lg:col-span-3 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('bookingTrends')}</CardTitle>
                        <CardDescription>{t('totalVsCompleted')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={analyticsData.bookingTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                                <Legend />
                                <Bar dataKey={t('totalBookings')} fill="hsl(var(--muted-foreground))" opacity={0.6} />
                                <Line type="monotone" dataKey={t('completedJobs')} stroke="hsl(var(--primary))" strokeWidth={2} />
                            </ComposedChart>
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
                                <Pie data={analyticsData.servicePerformance} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                                    {analyticsData.servicePerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                                    formatter={(value: number) => [`₱${value.toFixed(2)}`, 'Revenue']}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>
            
            {/* Performance Insights */}
            <div className="max-w-6xl mx-auto">
                <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Performance Insights</CardTitle>
                        <CardDescription>Key performance indicators and recommendations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? <Skeleton className="h-48 w-full" /> : (
                            <>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${analyticsData.isPerformingWell.revenue ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {analyticsData.isPerformingWell.revenue ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">Revenue Growth</p>
                                            <p className="text-sm text-muted-foreground">
                                                {analyticsData.revenueAnalytics.monthlyGrowth > 0 ? '+' : ''}{analyticsData.revenueAnalytics.monthlyGrowth.toFixed(1)}% this month
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={analyticsData.isPerformingWell.revenue ? 'default' : 'destructive'}>
                                        {analyticsData.isPerformingWell.revenue ? 'Good' : 'Needs Attention'}
                                    </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${analyticsData.isPerformingWell.retention ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Client Retention</p>
                                            <p className="text-sm text-muted-foreground">
                                                {analyticsData.clientAnalytics.clientRetentionRate.toFixed(1)}% returning clients
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={analyticsData.isPerformingWell.retention ? 'default' : 'secondary'}>
                                        {analyticsData.isPerformingWell.retention ? 'Excellent' : 'Good'}
                                    </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${analyticsData.isPerformingWell.utilization ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                            <Activity className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Utilization Rate</p>
                                            <p className="text-sm text-muted-foreground">
                                                {analyticsData.utilizationRate.toFixed(1)}% of bookings completed
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={analyticsData.isPerformingWell.utilization ? 'default' : 'secondary'}>
                                        {analyticsData.isPerformingWell.utilization ? 'High' : 'Moderate'}
                                    </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${analyticsData.isPerformingWell.rating ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                            <Star className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Average Rating</p>
                                            <p className="text-sm text-muted-foreground">
                                                {analyticsData.averageRating.toFixed(2)}/5.0 from {analyticsData.filteredReviews.length} reviews
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={analyticsData.isPerformingWell.rating ? 'default' : 'secondary'}>
                                        {analyticsData.isPerformingWell.rating ? 'Excellent' : 'Good'}
                                    </Badge>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
                
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Quick Stats</CardTitle>
                        <CardDescription>At-a-glance business metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? <Skeleton className="h-48 w-full" /> : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 rounded-lg bg-muted/20">
                                        <div className="text-2xl font-bold text-primary">₱{analyticsData.clientAnalytics.averageClientValue.toFixed(0)}</div>
                                        <div className="text-sm text-muted-foreground">Avg. Client Value</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-muted/20">
                                        <div className="text-2xl font-bold text-primary">{analyticsData.totalClients}</div>
                                        <div className="text-sm text-muted-foreground">Total Clients</div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 rounded-lg bg-muted/20">
                                        <div className="text-2xl font-bold text-primary">{analyticsData.totalBookings}</div>
                                        <div className="text-sm text-muted-foreground">Total Bookings</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-muted/20">
                                        <div className="text-2xl font-bold text-primary">{analyticsData.cancellationRate.toFixed(1)}%</div>
                                        <div className="text-sm text-muted-foreground">Cancellation Rate</div>
                                    </div>
                                </div>
                                
                                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="h-4 w-4 text-primary" />
                                        <span className="font-medium text-primary">Projected Revenue</span>
                                    </div>
                                    <div className="text-xl font-bold">₱{analyticsData.revenueAnalytics.projectedRevenue.toFixed(2)}</div>
                                    <div className="text-sm text-muted-foreground">Next month forecast</div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>

            {/* Geographic Analytics */}
            <div className="max-w-6xl mx-auto">
                <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Top Locations</CardTitle>
                        <CardDescription>Revenue by location</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-[300px] w-full" /> : (
                            <div className="space-y-4">
                                {analyticsData.geographicAnalytics.topLocations.length > 0 ? (
                                    analyticsData.geographicAnalytics.topLocations.map((location, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-primary/10">
                                                    <MapPin className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{location.location}</p>
                                                    <p className="text-sm text-muted-foreground">{location.bookings} bookings</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">₱{location.revenue.toFixed(2)}</p>
                                                <p className="text-sm text-muted-foreground">Revenue</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No location data available</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Service Areas</CardTitle>
                        <CardDescription>Distribution of service areas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-[300px] w-full" /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analyticsData.geographicAnalytics.serviceAreas}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                    <XAxis dataKey="area" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                    <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('topPerformingServices')}</CardTitle>
                    <CardDescription>{t('mostProfitableServices')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-48 w-full" /> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('service')}</TableHead>
                                <TableHead className="text-right">{t('totalRevenue')}</TableHead>
                                <TableHead className="text-right">Bookings</TableHead>
                                <TableHead className="text-right">Avg. Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analyticsData.topServices.length > 0 ? analyticsData.topServices.map((service, index) => {
                                const serviceBookings = analyticsData.filteredBookings.filter(b => b.serviceName === service.name && b.status === 'Completed');
                                const avgValue = serviceBookings.length > 0 ? service.value / serviceBookings.length : 0;
                                
                                return (
                                <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                {service.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">₱{service.value.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{serviceBookings.length}</TableCell>
                                        <TableCell className="text-right">₱{avgValue.toFixed(2)}</TableCell>
                                </TableRow>
                                );
                            }) : (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">{t('noCompletedServices')}</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
                </Card>
            </div>

        </div>
    );
}
