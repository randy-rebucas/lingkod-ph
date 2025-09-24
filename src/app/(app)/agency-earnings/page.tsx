
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, BookCheck, Wallet, CheckCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { handleMarkAsPaid } from '../admin/payouts/actions';
import { PageLayout } from '@/components/app/page-layout';
import { StandardCard } from '@/components/app/standard-card';
import { LoadingState } from '@/components/app/loading-state';
import { EmptyState } from '@/components/app/empty-state';
import { designTokens } from '@/lib/design-tokens';


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
    requestedAt: Timestamp;
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
                const providersQuery = query(collection(db, "users"), where("agencyId", "==", user.uid));
                const providersSnapshot = await getDocs(providersQuery);
                const providerIds = providersSnapshot.docs.map(doc => doc.id);
                setProviderCount(providerIds.length);

                if (providerIds.length > 0) {
                    const bookingsQuery = query(collection(db, "bookings"), where("providerId", "in", providerIds), where("status", "==", "Completed"));
                    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
                        setBookings(snapshot.docs.map(doc => doc.data() as Booking));
                    });

                    const payoutsQuery = query(collection(db, "payouts"), where("agencyId", "==", user.uid), orderBy("requestedAt", "desc"));
                    const unsubPayouts = onSnapshot(payoutsQuery, (snapshot) => {
                        setPayouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayoutRequest)));
                    });

                    return () => {
                        unsubBookings();
                        unsubPayouts();
                    };
                } else {
                    setBookings([]);
                    setPayouts([]);
                }
            } catch (error) {
                console.error("Error fetching agency earnings data:", error);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribePromise = fetchAgencyData();
        return () => {
            unsubscribePromise.then(unsub => unsub && unsub());
        };
    }, [user]);

    const onMarkAsPaid = async (payout: PayoutRequest) => {
        if (!user) return;
        const result = await handleMarkAsPaid(payout.id, payout.providerId, payout.providerName, payout.amount, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? t('error') : t('success'),
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    };

    const stats = useMemo(() => {
        const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);
        const totalPaidOut = payouts.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
        const totalPending = payouts.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
        
        return { totalRevenue, totalPaidOut, totalPending };
    }, [bookings, payouts]);
    
    if (loading) {
        return <LoadingState 
            title={t('title')} 
            description={t('subtitle')} 
        />;
    }

    return (
        <PageLayout 
            title={t('title')} 
            description={t('subtitle')}
        >

            <div className="grid gap-6 md:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalAgencyRevenue')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{stats.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">{t('fromCompletedJobs', { bookings: bookings.length, providers: providerCount })}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalPaidOut')}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{stats.totalPaidOut.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">{t('acrossAllProviders')}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('pendingPayouts')}</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{stats.totalPending.toFixed(2)}</div>
                         <p className="text-xs text-muted-foreground">{t('awaitingProcessing')}</p>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>{t('payoutRequests')}</CardTitle>
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
                                    <TableCell>{format(payout.requestedAt.toDate(), 'PPP')}</TableCell>
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
        </PageLayout>
    );
}
