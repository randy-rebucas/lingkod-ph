
"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, doc, getDoc, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { 
  DollarSign, 
  BookCheck, 
  Wallet, 
  Loader2, 
  WalletCards, 
  CheckCircle, 
  Hourglass,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Calendar,
  Target,
  AlertTriangle,
  Users,
  Clock,
  Award,
  Zap,
  Eye,
  Settings,
  RefreshCw,
  Share2,
  Bell,
  Activity,
  MapPin,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calculator,
  Receipt,
  CreditCard,
  Banknote,
  PiggyBank,
  TrendingUp as Growth,
  Percent,
  FileText,
  PieChart as ChartPie
} from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { handleRequestPayout } from '@/ai/flows/request-payout';
import { TooltipProvider, Tooltip as TooltipUI, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import AgencyEarningsPage from '@/app/(app)/agency-earnings/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('Earnings');
    const [bookings, setBookings] = useState<CompletedBooking[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRequestingPayout, setIsRequestingPayout] = useState(false);

    const isSaturday = new Date().getDay() === 6;

    useEffect(() => {
        if (!user || userRole !== 'provider' || !db) {
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
    }, [user, userRole, db]);

    const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);
    const totalPaidOut = payouts.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payouts.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
    const availableForPayout = totalRevenue - totalPaidOut - totalPending;
    
    const totalPaidBookings = bookings.length;
    const chartData = processChartData(bookings);

    const handlePayoutRequest = async () => {
        if (!user || !db) return;
        
        // Final check for payout details before proceeding
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists() || !userDoc.data()?.payoutDetails?.method) {
            toast({
                variant: "destructive",
                title: t('payoutDetailsMissing'),
                description: t('payoutDetailsMissingDescription'),
            });
            return;
        }
        
        setIsRequestingPayout(true);
        try {
            await handleRequestPayout({ providerId: user.uid, amount: availableForPayout });
            toast({
                title: t('payoutRequested'),
                description: t('payoutRequestedDescription'),
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: t('requestFailed'),
                description: t('requestFailedDescription'),
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
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('providersAndAgenciesOnly')}</p>
                </div>
            </div>
        );
    }
    

    if (loading) {
        return (
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="max-w-6xl mx-auto">
                    <div className="grid gap-6 md:grid-cols-4">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                </div>
                <div className="max-w-6xl mx-auto">
                    <Skeleton className="h-80 w-full" />
                </div>
                <div className="max-w-6xl mx-auto">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    const payoutButton = (
        <Button disabled={availableForPayout <= 400 || !isSaturday || isRequestingPayout} onClick={handlePayoutRequest}>
            {isRequestingPayout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('requestPayout')}
        </Button>
    );

    // Calculate advanced analytics
    const monthlyGrowth = chartData.length > 1 ? 
        ((chartData[chartData.length - 1].earnings - chartData[chartData.length - 2].earnings) / chartData[chartData.length - 2].earnings * 100) : 0;
    
    const averageMonthlyEarnings = chartData.reduce((sum, month) => sum + month.earnings, 0) / chartData.length;
    const bestMonth = Math.max(...chartData.map(m => m.earnings));
    const worstMonth = Math.min(...chartData.map(m => m.earnings));

    return (
        <div className="container space-y-8">
             <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                        <p className="text-muted-foreground">
                            {t('subtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Advanced Analytics
                        </Badge>
                        {isSaturday ? (
                            payoutButton
                        ) : (
                            <TooltipProvider>
                                <TooltipUI>
                                    <TooltipTrigger asChild>
                                        <span>{payoutButton}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('payoutRequestsOnlyOnSaturdays')}</p>
                                    </TooltipContent>
                                </TooltipUI>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            </div>

            {/* Advanced Filter Controls */}
            <div className="max-w-6xl mx-auto">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Advanced Filters
                        </CardTitle>
                        <CardDescription>Customize your earnings analysis with advanced filtering options</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="dateRange">Date Range</Label>
                            <Select defaultValue="last12months">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select date range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="last3months">Last 3 Months</SelectItem>
                                    <SelectItem value="last6months">Last 6 Months</SelectItem>
                                    <SelectItem value="last12months">Last 12 Months</SelectItem>
                                    <SelectItem value="last2years">Last 2 Years</SelectItem>
                                    <SelectItem value="alltime">All Time</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serviceType">Service Type</Label>
                            <Select defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Services</SelectItem>
                                    <SelectItem value="consulting">Consulting</SelectItem>
                                    <SelectItem value="development">Development</SelectItem>
                                    <SelectItem value="design">Design</SelectItem>
                                    <SelectItem value="marketing">Marketing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clientType">Client Type</Label>
                            <Select defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select client type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Clients</SelectItem>
                                    <SelectItem value="new">New Clients</SelectItem>
                                    <SelectItem value="returning">Returning Clients</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="export">Export Options</Label>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    PDF
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Excel
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
                </Card>
            </div>

            {/* Enhanced KPI Cards */}
            <div className="max-w-6xl mx-auto">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Lifetime Revenue</p>
                                <p className="text-2xl font-bold">₱{totalRevenue.toFixed(2)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                    <span className="text-xs text-green-600">+{monthlyGrowth.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-primary/10">
                                <DollarSign className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Available for Payout</p>
                                <p className="text-2xl font-bold">₱{availableForPayout.toFixed(2)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <WalletCards className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs text-blue-600">Ready to withdraw</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-green-100">
                                <WalletCards className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. Monthly Earnings</p>
                                <p className="text-2xl font-bold">₱{averageMonthlyEarnings.toFixed(2)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <Calculator className="h-3 w-3 text-purple-600" />
                                    <span className="text-xs text-purple-600">12-month average</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100">
                                <Calculator className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Jobs</p>
                                <p className="text-2xl font-bold">{totalPaidBookings}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <BookCheck className="h-3 w-3 text-orange-600" />
                                    <span className="text-xs text-orange-600">Completed</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-orange-100">
                                <BookCheck className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="goals" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Goals
                    </TabsTrigger>
                    <TabsTrigger value="forecasting" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Forecasting
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Insights
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-6">
                    <OverviewTab 
                        chartData={chartData} 
                        bookings={bookings} 
                        payouts={payouts} 
                        totalRevenue={totalRevenue}
                        availableForPayout={availableForPayout}
                    />
                </TabsContent>
                
                <TabsContent value="analytics" className="mt-6">
                    <AnalyticsTab 
                        chartData={chartData} 
                        bookings={bookings} 
                        monthlyGrowth={monthlyGrowth}
                        averageMonthlyEarnings={averageMonthlyEarnings}
                        bestMonth={bestMonth}
                        worstMonth={worstMonth}
                    />
                </TabsContent>
                
                <TabsContent value="goals" className="mt-6">
                    <GoalsTab totalRevenue={totalRevenue} averageMonthlyEarnings={averageMonthlyEarnings} />
                </TabsContent>
                
                <TabsContent value="forecasting" className="mt-6">
                    <ForecastingTab chartData={chartData} averageMonthlyEarnings={averageMonthlyEarnings} />
                </TabsContent>
                
                <TabsContent value="insights" className="mt-6">
                    <InsightsTab 
                        totalRevenue={totalRevenue} 
                        monthlyGrowth={monthlyGrowth} 
                        averageMonthlyEarnings={averageMonthlyEarnings}
                        totalPaidBookings={totalPaidBookings}
                    />
                </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// Overview Tab Component
function OverviewTab({ chartData, bookings, payouts, totalRevenue, availableForPayout }: { 
    chartData: any[], 
    bookings: CompletedBooking[], 
    payouts: Payout[], 
    totalRevenue: number,
    availableForPayout: number 
}) {
    return (
        <div className="space-y-6">
            <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                    <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Earnings History</CardTitle>
                    <CardDescription>Monthly earnings performance over the last 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={chartData}>
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
                            <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Recent Completed Jobs</CardTitle>
                        <CardDescription>Your latest completed bookings and earnings</CardDescription>
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
                                            No transactions yet
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Payout History</CardTitle>
                        <CardDescription>Your payout requests and payment status</CardDescription>
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
                                            No payouts requested
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

// Analytics Tab Component
function AnalyticsTab({ chartData, bookings, monthlyGrowth, averageMonthlyEarnings, bestMonth, worstMonth }: { 
    chartData: any[], 
    bookings: CompletedBooking[], 
    monthlyGrowth: number,
    averageMonthlyEarnings: number,
    bestMonth: number,
    worstMonth: number
}) {
    const serviceBreakdown = bookings.reduce((acc, booking) => {
        acc[booking.serviceName] = (acc[booking.serviceName] || 0) + booking.price;
        return acc;
    }, {} as Record<string, number>);

    const serviceData = Object.entries(serviceBreakdown).map(([name, value]) => ({
        name,
        value,
        percentage: (value / Object.values(serviceBreakdown).reduce((sum, val) => sum + val, 0)) * 100
    }));

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Service Breakdown</CardTitle>
                        <CardDescription>Revenue distribution by service type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                                <Pie
                                    data={serviceData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {serviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                        <CardDescription>Key performance indicators and trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                                <div>
                                    <p className="text-sm font-medium text-green-800">Monthly Growth</p>
                                    <p className="text-2xl font-bold text-green-600">+{monthlyGrowth.toFixed(1)}%</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Best Month</p>
                                    <p className="text-2xl font-bold text-blue-600">₱{bestMonth.toFixed(2)}</p>
                                </div>
                                <Award className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 border border-purple-200">
                                <div>
                                    <p className="text-sm font-medium text-purple-800">Average Monthly</p>
                                    <p className="text-2xl font-bold text-purple-600">₱{averageMonthlyEarnings.toFixed(2)}</p>
                                </div>
                                <Calculator className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Goals Tab Component
function GoalsTab({ totalRevenue, averageMonthlyEarnings }: { totalRevenue: number, averageMonthlyEarnings: number }) {
    const monthlyGoal = 50000; // Example goal
    const yearlyGoal = 600000; // Example goal
    const monthlyProgress = (averageMonthlyEarnings / monthlyGoal) * 100;
    const yearlyProgress = (totalRevenue / yearlyGoal) * 100;

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Goal</CardTitle>
                        <CardDescription>Track your monthly earnings target</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold mb-2">₱{averageMonthlyEarnings.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">of ₱{monthlyGoal.toLocaleString()} goal</div>
                            </div>
                            <Progress value={monthlyProgress} className="w-full" />
                            <div className="flex justify-between text-sm">
                                <span>{monthlyProgress.toFixed(1)}% Complete</span>
                                <span>₱{(monthlyGoal - averageMonthlyEarnings).toFixed(2)} to go</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Yearly Goal</CardTitle>
                        <CardDescription>Track your annual earnings target</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold mb-2">₱{totalRevenue.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">of ₱{yearlyGoal.toLocaleString()} goal</div>
                            </div>
                            <Progress value={yearlyProgress} className="w-full" />
                            <div className="flex justify-between text-sm">
                                <span>{yearlyProgress.toFixed(1)}% Complete</span>
                                <span>₱{(yearlyGoal - totalRevenue).toFixed(2)} to go</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Forecasting Tab Component
function ForecastingTab({ chartData, averageMonthlyEarnings }: { chartData: any[], averageMonthlyEarnings: number }) {
    const forecastData = chartData.map((month, index) => ({
        ...month,
        forecast: averageMonthlyEarnings * (1 + (index * 0.05)) // Simple growth forecast
    }));

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Earnings Forecast</CardTitle>
                    <CardDescription>Projected earnings based on current trends</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={forecastData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="earnings" fill="hsl(var(--chart-1))" name="Actual" />
                            <Line type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" strokeWidth={2} name="Forecast" strokeDasharray="5 5" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

// Insights Tab Component
function InsightsTab({ totalRevenue, monthlyGrowth, averageMonthlyEarnings, totalPaidBookings }: { 
    totalRevenue: number, 
    monthlyGrowth: number, 
    averageMonthlyEarnings: number,
    totalPaidBookings: number
}) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Earnings Insights</CardTitle>
                        <CardDescription>AI-powered insights and recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Alert>
                                <TrendingUp className="h-4 w-4" />
                                <AlertDescription>
                                    Your monthly growth rate is {monthlyGrowth.toFixed(1)}%. Consider increasing your rates or taking on more clients to accelerate growth.
                                </AlertDescription>
                            </Alert>
                            
                            <Alert>
                                <Target className="h-4 w-4" />
                                <AlertDescription>
                                    You've completed {totalPaidBookings} jobs with an average value of ₱{(totalRevenue / totalPaidBookings).toFixed(2)}. Focus on higher-value projects.
                                </AlertDescription>
                            </Alert>
                            
                            <Alert>
                                <Calculator className="h-4 w-4" />
                                <AlertDescription>
                                    Your average monthly earnings of ₱{averageMonthlyEarnings.toFixed(2)} shows consistent performance. Consider setting higher targets.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Optimization Tips</CardTitle>
                        <CardDescription>Strategies to maximize your earnings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-green-800">Rate Optimization</span>
                                </div>
                                <p className="text-sm text-green-700">
                                    Consider increasing your rates by 10-15% based on your current performance and market demand.
                                </p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">Premium Services</span>
                                </div>
                                <p className="text-sm text-blue-700">
                                    Offer premium service packages to increase your average project value and overall earnings.
                                </p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="h-4 w-4 text-purple-600" />
                                    <span className="font-medium text-purple-800">Client Retention</span>
                                </div>
                                <p className="text-sm text-purple-700">
                                    Focus on building long-term relationships with existing clients to ensure steady income.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
