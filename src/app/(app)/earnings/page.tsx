
"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { getProviderEarningsData, requestPayout } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Timestamp } from 'firebase/firestore';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { 
  DollarSign, 
  BookCheck, 
  Wallet, 
  WalletCards, 
  TrendingUp,
  Calendar,
  Clock
} from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCards, TableSkeleton, LoadingSpinner } from '@/components/ui/loading-states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import _Link from 'next/link';
import { TooltipProvider, Tooltip as TooltipUI, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import AgencyEarningsPage from '@/app/(app)/agency-earnings/page';
import { formatDistanceToNow } from 'date-fns';

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
        if (!user || userRole !== 'provider') {
            setLoading(false);
            return;
        }

        const fetchEarningsData = async () => {
            setLoading(true);
            try {
                const result = await getProviderEarningsData(user.uid);
                
                if (result.success && result.data) {
                    setBookings(result.data.completedBookings as CompletedBooking[]);
                    setPayouts(result.data.payouts as Payout[]);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: result.error || "Failed to load earnings data"
                    });
                }
            } catch (error) {
                console.error("Error fetching earnings data:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load earnings data"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchEarningsData();
    }, [user, userRole, toast]);

    const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);
    const totalPaidOut = payouts.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payouts.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
    const availableForPayout = totalRevenue - totalPaidOut - totalPending;
    
    const totalPaidBookings = bookings.length;
    const chartData = processChartData(bookings);

    const handlePayoutRequest = async () => {
        if (!user) return;
        
        setIsRequestingPayout(true);
        try {
            const result = await requestPayout({
                providerId: user.uid,
                amount: availableForPayout
            });
            
            if (result.success) {
                toast({
                    title: t('payoutRequested'),
                    description: t('payoutRequestedDescription'),
                });
                // Refresh data
                const earningsResult = await getProviderEarningsData(user.uid);
                if (earningsResult.success && earningsResult.data) {
                    setPayouts(earningsResult.data.payouts as Payout[]);
                }
            } else {
                toast({
                    variant: "destructive",
                    title: t('requestFailed'),
                    description: result.error || t('requestFailedDescription'),
                });
            }
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
                <div className=" mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('providersAndAgenciesOnly')}</p>
                </div>
            </div>
        );
    }
    

    if (loading) {
        return (
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className=" mx-auto">
                    <SkeletonCards count={4} cardClassName="h-28" />
                </div>
                <div className=" mx-auto">
                    <Skeleton className="h-80 w-full" />
                </div>
                <div className=" mx-auto">
                    <TableSkeleton rows={6} columns={4} />
                </div>
            </div>
        );
    }

    const payoutButton = (
        <Button disabled={availableForPayout <= 400 || !isSaturday || isRequestingPayout} onClick={handlePayoutRequest}>
            {isRequestingPayout && <LoadingSpinner size="sm" className="mr-2" />}
            {t('requestPayout')}
        </Button>
    );

    // Calculate advanced analytics
    const monthlyGrowth = chartData.length > 1 ? 
        ((chartData[chartData.length - 1].earnings - chartData[chartData.length - 2].earnings) / chartData[chartData.length - 2].earnings * 100) : 0;
    
    const averageMonthlyEarnings = chartData.reduce((sum, month) => sum + month.earnings, 0) / chartData.length;
    const _bestMonth = Math.max(...chartData.map(m => m.earnings));
    const _worstMonth = Math.min(...chartData.map(m => m.earnings));

    return (
        <div className="container space-y-8">
            {/* Header */}
            <div className=" mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                        <p className="text-muted-foreground mt-1">
                            {t('subtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                            <DollarSign className="h-3 w-3" />
                            ₱{totalRevenue.toFixed(2)} {t('total')}
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

            {/* Key Metrics */}
            <div className=" mx-auto">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('totalRevenue')}</p>
                                    <p className="text-2xl font-bold text-primary">₱{totalRevenue.toFixed(2)}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                        <span className="text-xs text-green-600">+{monthlyGrowth.toFixed(1)}% {t('growth')}</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-primary/10">
                                    <DollarSign className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('availableForPayout')}</p>
                                    <p className="text-2xl font-bold text-emerald-600">₱{availableForPayout.toFixed(2)}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <WalletCards className="h-3 w-3 text-blue-600" />
                                        <span className="text-xs text-blue-600">{t('readyToWithdraw')}</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-emerald-100">
                                    <WalletCards className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('completedJobs')}</p>
                                    <p className="text-2xl font-bold text-orange-600">{totalPaidBookings}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <BookCheck className="h-3 w-3 text-orange-600" />
                                        <span className="text-xs text-orange-600">{t('totalCompleted')}</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-orange-100">
                                    <BookCheck className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('avgMonthly')}</p>
                                    <p className="text-2xl font-bold text-purple-600">₱{averageMonthlyEarnings.toFixed(2)}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Calendar className="h-3 w-3 text-purple-600" />
                                        <span className="text-xs text-purple-600">{t('monthlyAverage')}</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-purple-100">
                                    <Calendar className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Earnings Chart */}
            <div className=" mx-auto">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('earningsHistory')}</CardTitle>
                        <CardDescription>{t('monthlyEarningsPerformance')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
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
            </div>

            {/* Recent Transactions and Payouts */}
            <div className=" mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('recentCompletedJobs')}</CardTitle>
                            <CardDescription>{t('latestCompletedBookings')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('client')}</TableHead>
                                        <TableHead>{t('service')}</TableHead>
                                        <TableHead className="text-right">{t('amount')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookings.slice(0, 5).length > 0 ? bookings.slice(0, 5).map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="font-medium">{booking.clientName}</TableCell>
                                            <TableCell>{booking.serviceName}</TableCell>
                                            <TableCell className="text-right font-semibold text-primary">₱{booking.price.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                                {t('noCompletedJobsYet')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('payoutHistory')}</CardTitle>
                            <CardDescription>{t('payoutRequestsAndStatus')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('dateRequested')}</TableHead>
                                        <TableHead>{t('status')}</TableHead>
                                        <TableHead className="text-right">{t('amount')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payouts.slice(0, 5).length > 0 ? payouts.slice(0, 5).map((payout) => (
                                        <TableRow key={payout.id}>
                                            <TableCell className="text-sm">
                                                {formatDistanceToNow(payout.requestedAt.toDate(), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={payout.status === 'Paid' ? 'secondary' : 'outline'}>
                                                    {payout.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-primary">₱{payout.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                                {t('noPayoutsRequestedYet')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Payout Information */}
            {availableForPayout > 0 && (
                <div className=" mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-emerald-100">
                                        <Wallet className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{t('readyForPayout')}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {t('availableForWithdrawal', { amount: availableForPayout.toFixed(2) })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isSaturday && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{t('payoutsOnlyOnSaturdays')}</span>
                                        </div>
                                    )}
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
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

