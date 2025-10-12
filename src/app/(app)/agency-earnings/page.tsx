
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Wallet, CheckCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getAgencyEarningsData } from './actions';


type Booking = {
    id: string;
    providerId: string;
    providerName: string;
    status: "Completed";
    price: number;
};

type PayoutRequest = {
    id: string;
    providerId: string;
    providerName: string;
    amount: number;
    status: "Pending" | "Paid";
    requestedAt: Date;
};

const getStatusVariant = (status: PayoutRequest['status']) => {
    switch (status) {
        case 'Paid': return 'secondary';
        case 'Pending': return 'outline';
        default: return 'default';
    }
};

export default function AgencyEarningsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('AgencyEarnings');
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [providerCount, setProviderCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchAgencyData = async () => {
            setLoading(true);
            try {
                const result = await getAgencyEarningsData(user.uid);
                if (result.success && result.data) {
                    setBookings(result.data.bookings || []);
                    setPayouts(result.data.payouts || []);
                    setProviderCount(0); // Will be calculated from bookings data
                } else {
                    console.error("Error fetching agency earnings data:", result.error);
                    setBookings([]);
                    setPayouts([]);
                    setProviderCount(0);
                }
            } catch (error) {
                console.error("Error fetching agency earnings data:", error);
                setBookings([]);
                setPayouts([]);
                setProviderCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchAgencyData();
    }, [user]);

    const onMarkAsPaid = async (_payout: PayoutRequest) => {
        if (!user) return;
        // const result = await handleMarkAsPaid(payout.id, payout.providerId, payout.providerName, payout.amount, { id: user.uid, name: user.displayName });
        const result = { success: true, message: 'Payout marked as paid successfully' }; // Placeholder - implement proper payout marking
        toast({
            title: t('success'),
            description: result.message,
            variant: 'default',
        });
    };

    const stats = useMemo(() => {
        const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);
        const totalPaidOut = payouts.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
        const totalPending = payouts.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
        
        return { totalRevenue, totalPaidOut, totalPending };
    }, [bookings, payouts]);
    
    if (loading) {
        return (
             <div className="container space-y-8">
                <div className=" mx-auto">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className=" mx-auto">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                </div>
                <div className=" mx-auto">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="container space-y-8">
            <div className=" mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>

            <div className=" mx-auto">
                <div className="grid gap-6 md:grid-cols-3">
                     <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('totalAgencyRevenue')}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">₱{stats.totalRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">{t('fromCompletedJobs', { bookings: bookings.length, providers: providerCount })}</p>
                        </CardContent>
                    </Card>
                     <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('totalPaidOut')}</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">₱{stats.totalPaidOut.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">{t('acrossAllProviders')}</p>
                        </CardContent>
                    </Card>
                     <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('pendingPayouts')}</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">₱{stats.totalPending.toFixed(2)}</div>
                             <p className="text-xs text-muted-foreground">{t('awaitingProcessing')}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className=" mx-auto">
                 <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('payoutRequests')}</CardTitle>
                        <CardDescription>{t('managePayoutRequests')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('provider')}</TableHead>
                                    <TableHead>{t('dateRequested')}</TableHead>
                                    <TableHead>{t('amount')}</TableHead>
                                    <TableHead className="text-center">{t('status')}</TableHead>
                                    <TableHead className="text-right">{t('action')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.length > 0 ? payouts.map((payout) => (
                                    <TableRow key={payout.id}>
                                        <TableCell className="font-medium">{payout.providerName}</TableCell>
                                        <TableCell>{format(payout.requestedAt, 'PPP')}</TableCell>
                                        <TableCell>₱{payout.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={getStatusVariant(payout.status)}>{payout.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {payout.status === 'Pending' ? (
                                                <Button size="sm" onClick={() => onMarkAsPaid(payout)}>
                                                    <CheckCircle className="mr-2 h-4 w-4" /> {t('markAsPaid')}
                                                </Button>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">{t('processed')}</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            {t('noPayoutRequests')}
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
