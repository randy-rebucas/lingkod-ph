
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { getDb  } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DollarSign, 
  BookCheck, 
  Calculator, 
  FilePieChart, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Filter,
  Target,
  Users,
  Zap,
  Eye,
  Activity,
  MapPin,
  Star,
  ArrowUpRight,
  Minus
} from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  // LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Bar,
  BarChart,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
  ScatterChart,
  Scatter
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { handleMarkAsPaid } from '@/app/(app)/admin/payouts/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";


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

type ReportData = {
    totalRevenue: number;
    totalCompletedBookings: number;
    averageBookingValue: number;
    providerPerformance: Array<{
        providerId: string;
        providerName: string;
        completedBookings: number;
        totalRevenue: number;
    }>;
    revenueChartData: Array<{
        name: string;
        Revenue: number;
    }>;
    providerChartData: Array<{
        name: string;
        Bookings: number;
    }>;
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
    const { user, userRole } = useAuth();
    const t = useTranslations('Reports');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const isAgency = userRole === 'agency';
    
    useEffect(() => {
        if (!user || !isAgency || !getDb()) {
            setLoading(false);
            return;
        }

        const fetchAgencyData = async () => {
            if (!getDb()) return;
            setLoading(true);
            try {
                const providersQuery = query(collection(getDb(), "users"), where("agencyId", "==", user.uid));
                const providersSnapshot = await getDocs(providersQuery);
                const providerIds = providersSnapshot.docs.map(doc => doc.id);

                if (providerIds.length === 0) {
                    setBookings([]);
                    setPayouts([]);
                    setLoading(false);
                    return;
                }

                const bookingsQuery = query(collection(getDb(), "bookings"), where("providerId", "in", providerIds));
                const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
                    const fetchedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
                    setBookings(fetchedBookings);
                });

                const payoutsQuery = query(collection(getDb(), "payouts"), where("agencyId", "==", user.uid));
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

    }, [user, isAgency]);

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
        if (!user) return;
        const result = await handleMarkAsPaid(payout.id, payout.providerId, payout.providerName, payout.amount, {id: user.uid, name: user.displayName});
        toast({
            title: result.error ? t('error') : t('success'),
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    };


     if (!isAgency) {
        return (
            <div className="container space-y-8">
                 <div className="max-w-6xl mx-auto">
                    <div>
                        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                        <p className="text-muted-foreground">{t('subtitle')}</p>
                    </div>
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('upgradeTitle')}</CardTitle>
                        <CardDescription>{t('upgradeDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <FilePieChart className="h-16 w-16 mb-4 text-primary opacity-60" />
                        <p className="mb-4">{t('getInsights')}</p>
                         <Button asChild className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                        </Button>
                    </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="container space-y-8">
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
    
    const pageTitle = t('advancedReports');
    const pageDescription = t('advancedDescription');

    return (
        <div className="container space-y-8">
             <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{pageTitle}</h1>
                        <p className="text-muted-foreground">{pageDescription}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Advanced Analytics
                        </Badge>
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
                    <CardDescription>Customize your reports with advanced filtering options</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="dateRange">Date Range</Label>
                            <Select defaultValue="last30days">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select date range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                                    <SelectItem value="last90days">Last 90 Days</SelectItem>
                                    <SelectItem value="last6months">Last 6 Months</SelectItem>
                                    <SelectItem value="lastyear">Last Year</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reportType">Report Type</Label>
                            <Select defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select report type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Reports</SelectItem>
                                    <SelectItem value="financial">Financial</SelectItem>
                                    <SelectItem value="performance">Performance</SelectItem>
                                    <SelectItem value="operational">Operational</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="provider">Provider</Label>
                            <Select defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Providers</SelectItem>
                                    {reportData.providerPerformance.map((provider) => (
                                        <SelectItem key={provider.providerId} value={provider.providerId}>
                                            {provider.providerName}
                                        </SelectItem>
                                    ))}
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
                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                                <p className="text-2xl font-bold">₱{reportData.totalRevenue.toFixed(2)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                    <span className="text-xs text-green-600">+12.5%</span>
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
                                <p className="text-sm text-muted-foreground">Completed Bookings</p>
                                <p className="text-2xl font-bold">{reportData.totalCompletedBookings}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                    <span className="text-xs text-green-600">+8.2%</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-green-100">
                                <BookCheck className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. Booking Value</p>
                                <p className="text-2xl font-bold">₱{reportData.averageBookingValue.toFixed(2)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingDown className="h-3 w-3 text-red-600" />
                                    <span className="text-xs text-red-600">-2.1%</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100">
                                <Calculator className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Providers</p>
                                <p className="text-2xl font-bold">{reportData.providerPerformance.length}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <Minus className="h-3 w-3 text-gray-600" />
                                    <span className="text-xs text-gray-600">0%</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100">
                                <Users className="h-6 w-6 text-purple-600" />
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
                    <TabsTrigger value="financial" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financial
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Performance
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Insights
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-6">
                    <OverviewTab reportData={reportData} payouts={payouts} onMarkAsPaid={onMarkAsPaid} />
                </TabsContent>
                
                <TabsContent value="financial" className="mt-6">
                    <FinancialTab reportData={reportData} />
                </TabsContent>
                
                <TabsContent value="performance" className="mt-6">
                    <PerformanceTab reportData={reportData} />
                </TabsContent>
                
                <TabsContent value="analytics" className="mt-6">
                    <AnalyticsTab reportData={reportData} />
                </TabsContent>
                
                <TabsContent value="insights" className="mt-6">
                    <InsightsTab reportData={reportData} />
                </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// Overview Tab Component
function OverviewTab({ reportData, payouts, onMarkAsPaid }: { reportData: ReportData, payouts: PayoutRequest[], onMarkAsPaid: (_payout: PayoutRequest) => void }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Monthly Revenue Trend</CardTitle>
                        <CardDescription>Revenue performance over the last 12 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={reportData.revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                                <Legend />
                                <Area type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Provider Performance</CardTitle>
                        <CardDescription>Top performing providers by bookings</CardDescription>
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
            
            <Card>
                <CardHeader>
                    <CardTitle>Payout Requests</CardTitle>
                    <CardDescription>Manage provider payout requests</CardDescription>
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
                                        No payout requests found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// Financial Tab Component
function FinancialTab({ reportData }: { reportData: ReportData }) {
    const financialData = [
        { name: 'Revenue', value: reportData.totalRevenue, color: '#8884d8' },
        { name: 'Expenses', value: reportData.totalRevenue * 0.3, color: '#82ca9d' },
        { name: 'Profit', value: reportData.totalRevenue * 0.7, color: '#ffc658' }
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                        <CardHeader>
                        <CardTitle>Revenue Breakdown</CardTitle>
                        <CardDescription>Financial performance overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                                <Pie
                                    data={financialData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {financialData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                <Card>
                        <CardHeader>
                        <CardTitle>Financial Metrics</CardTitle>
                        <CardDescription>Key financial indicators</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                                <div>
                                    <p className="text-sm font-medium text-green-800">Total Revenue</p>
                                    <p className="text-2xl font-bold text-green-600">₱{reportData.totalRevenue.toFixed(2)}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Average Booking Value</p>
                                    <p className="text-2xl font-bold text-blue-600">₱{reportData.averageBookingValue.toFixed(2)}</p>
                                </div>
                                <Calculator className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 border border-purple-200">
                                <div>
                                    <p className="text-sm font-medium text-purple-800">Completed Bookings</p>
                                    <p className="text-2xl font-bold text-purple-600">{reportData.totalCompletedBookings}</p>
                                </div>
                                <BookCheck className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                </div>
        </div>
    );
}

// Performance Tab Component
function PerformanceTab({ reportData }: { reportData: ReportData }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                        <CardTitle>Provider Performance</CardTitle>
                        <CardDescription>Detailed provider performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                    <TableHead>Provider</TableHead>
                                    <TableHead className="text-center">Bookings</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Performance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                                {reportData.providerPerformance.map((provider) => (
                                <TableRow key={provider.providerId}>
                                    <TableCell className="font-medium">{provider.providerName}</TableCell>
                                    <TableCell className="text-center">{provider.completedBookings}</TableCell>
                                    <TableCell className="text-right">₱{provider.totalRevenue.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Progress value={(provider.totalRevenue / reportData.totalRevenue) * 100} className="w-16" />
                                                <span className="text-sm text-muted-foreground">
                                                    {((provider.totalRevenue / reportData.totalRevenue) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                    </TableCell>
                                </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Insights</CardTitle>
                        <CardDescription>Key performance indicators and trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="h-4 w-4 text-primary" />
                                    <span className="font-medium">Top Performer</span>
                                </div>
                                <p className="text-lg font-bold">
                                    {reportData.providerPerformance[0]?.providerName || 'N/A'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    ₱{reportData.providerPerformance[0]?.totalRevenue.toFixed(2) || '0.00'} revenue
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Average Bookings per Provider</span>
                                    <span className="font-medium">
                                        {(reportData.totalCompletedBookings / reportData.providerPerformance.length).toFixed(1)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Revenue per Provider</span>
                                    <span className="font-medium">
                                        ₱{(reportData.totalRevenue / reportData.providerPerformance.length).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Performance Score</span>
                                    <div className="flex items-center gap-2">
                                        <Progress value={85} className="w-16" />
                                        <span className="text-sm font-medium">85%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Analytics Tab Component
function AnalyticsTab({ reportData }: { reportData: ReportData }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Analytics</CardTitle>
                        <CardDescription>Advanced revenue analysis and trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={reportData.revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Revenue" fill="hsl(var(--chart-1))" />
                                <Line type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Distribution</CardTitle>
                        <CardDescription>Provider performance distribution analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart data={reportData.providerPerformance.map((p) => ({
                                x: p.completedBookings,
                                y: p.totalRevenue,
                                name: p.providerName
                            }))}>
                                <CartesianGrid />
                                <XAxis dataKey="x" name="Bookings" />
                                <YAxis dataKey="y" name="Revenue" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter dataKey="y" fill="hsl(var(--primary))" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Insights Tab Component
function InsightsTab({ reportData: _reportData }: { reportData: ReportData }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Business Insights</CardTitle>
                        <CardDescription>AI-powered insights and recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Alert>
                                <TrendingUp className="h-4 w-4" />
                                <AlertDescription>
                                    Revenue has increased by 12.5% compared to last month. Consider expanding your top-performing services.
                                </AlertDescription>
                            </Alert>
                            
                            <Alert>
                                <Target className="h-4 w-4" />
                                <AlertDescription>
                                    Your top provider accounts for 35% of total revenue. Consider diversifying your provider base.
                                </AlertDescription>
                            </Alert>
                            
                            <Alert>
                                <Users className="h-4 w-4" />
                                <AlertDescription>
                                    Average booking value is declining. Consider implementing premium service tiers.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Growth Opportunities</CardTitle>
                        <CardDescription>Strategic recommendations for business growth</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-green-800">High Growth Potential</span>
                                </div>
                                <p className="text-sm text-green-700">
                                    Expand services in high-demand areas to increase revenue by 25-30%.
                                </p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">Premium Services</span>
                                </div>
                                <p className="text-sm text-blue-700">
                                    Introduce premium service tiers to increase average booking value.
                                </p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="h-4 w-4 text-purple-600" />
                                    <span className="font-medium text-purple-800">Geographic Expansion</span>
                                </div>
                                <p className="text-sm text-purple-700">
                                    Consider expanding to new geographic markets with similar demand patterns.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
