"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/loading-states";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslations } from 'next-intl';
import { getPaymentsData } from './actions';
import { Timestamp } from 'firebase/firestore';
// import Image from "next/image";

type PaymentTransaction = {
    id: string;
    bookingId?: string;
    clientId: string;
    providerId?: string;
    amount: number;
    type: 'booking_payment' | 'payout_request' | 'refund';
    status: 'pending' | 'completed' | 'rejected' | 'failed';
    paymentMethod: string;
    createdAt: Timestamp;
    verifiedAt?: Timestamp;
    verifiedBy?: string;
    rejectedAt?: Timestamp;
    rejectedBy?: string;
    rejectionReason?: string;
    paypalOrderId?: string;
    payerEmail?: string;
};

export default function PaymentHistoryPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast: _toast } = useToast();
    const t = useTranslations('Payments');

    useEffect(() => {
        if (!user) return;

        const fetchPayments = async () => {
            setLoading(true);
            try {
                const result = await getPaymentsData(user.uid);
                if (result.success && result.data) {
                    setTransactions(result.data);
                } else {
                    console.error("Error fetching payments:", result.error);
                    setTransactions([]);
                }
            } catch (error) {
                console.error("Error fetching payments:", error);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [user]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">{t('completed')}</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">{t('pending')}</Badge>;
            case 'rejected':
                return <Badge variant="destructive">{t('rejected')}</Badge>;
            case 'failed':
                return <Badge variant="destructive">{t('failed')}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'booking_payment':
                return t('servicePayment');
            case 'payout_request':
                return t('payoutRequest');
            case 'refund':
                return t('refund');
            default:
                return type;
        }
    };

    if (loading) {
        return (
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
                <div className=" mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <TableSkeleton rows={6} columns={5} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="container space-y-8">
            <div className=" mx-auto flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('refresh')}
                </Button>
            </div>

            <div className=" mx-auto">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('transactionHistory')}</CardTitle>
                        <CardDescription>
                            {transactions.length} {transactions.length === 1 ? t('transactionFound') : t('transactionsFound')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('date')}</TableHead>
                                    <TableHead>{t('type')}</TableHead>
                                    <TableHead>{t('amount')}</TableHead>
                                    <TableHead>{t('method')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead className="text-right">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? transactions.map(transaction => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="text-sm">
                                            {format(transaction.createdAt.toDate(), 'PPp')}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {getTypeLabel(transaction.type)}
                                        </TableCell>
                                        <TableCell>₱{transaction.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-sm">
                                            {transaction.paymentMethod}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(transaction.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        {t('viewDetails')}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>{t('transactionDetails')}</DialogTitle>
                                                        <DialogDescription>
                                                            {t('transactionId')}: {transaction.id}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">{t('type')}</label>
                                                                <p className="text-sm">{getTypeLabel(transaction.type)}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">{t('amount')}</label>
                                                                <p className="text-sm">₱{transaction.amount.toFixed(2)}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">{t('paymentMethod')}</label>
                                                                <p className="text-sm">{transaction.paymentMethod}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">{t('status')}</label>
                                                                <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">{t('date')}</label>
                                                                <p className="text-sm">{format(transaction.createdAt.toDate(), 'PPp')}</p>
                                                            </div>
                                                            {transaction.verifiedAt && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-muted-foreground">{t('verifiedAt')}</label>
                                                                    <p className="text-sm">{format(transaction.verifiedAt.toDate(), 'PPp')}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {transaction.rejectionReason && (
                                                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                                                <label className="text-sm font-medium text-red-800">{t('rejectionReason')}</label>
                                                                <p className="text-sm text-red-800 mt-1">{transaction.rejectionReason}</p>
                                                            </div>
                                                        )}

                                                        {transaction.paypalOrderId && (
                                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                                <label className="text-sm font-medium text-blue-800">{t('paypalOrderId')}</label>
                                                                <p className="text-sm text-blue-800 mt-1 font-mono">{transaction.paypalOrderId}</p>
                                                                {transaction.payerEmail && (
                                                                    <>
                                                                        <label className="text-sm font-medium text-blue-800 mt-2 block">{t('payerEmail')}</label>
                                                                        <p className="text-sm text-blue-800 mt-1">{transaction.payerEmail}</p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}

                                                        {transaction.bookingId && (
                                                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                                                <label className="text-sm font-medium text-gray-800">{t('bookingId')}</label>
                                                                <p className="text-sm text-gray-800 mt-1 font-mono">{transaction.bookingId}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            {t('noTransactionsFound')}
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

