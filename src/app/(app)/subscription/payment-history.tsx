
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollText } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Transaction = {
    id: string;
    planId: string;
    amount: number;
    paymentMethod: string;
    status: string;
    paypalOrderId: string;
    createdAt: Timestamp;
};

export default function PaymentHistory() {
    const { user } = useAuth();
    const t = useTranslations('PaymentHistory');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const transQuery = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(transQuery, (snapshot) => {
            const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            setTransactions(transData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>{t('title')}</CardTitle>
                    <CardDescription>{t('description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('date')}</TableHead>
                            <TableHead>{t('plan')}</TableHead>
                            <TableHead>{t('amount')}</TableHead>
                            <TableHead>{t('paymentMethod')}</TableHead>
                            <TableHead>{t('transactionId')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length > 0 ? transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{tx.createdAt ? format(tx.createdAt.toDate(), 'PPP') : t('processing')}</TableCell>
                                <TableCell className="capitalize">{tx.planId}</TableCell>
                                <TableCell>₱{tx.amount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{tx.paymentMethod}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{tx.paypalOrderId}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <ScrollText className="mx-auto h-12 w-12 text-muted-foreground mb-2"/>
                                    {t('noPaymentHistory')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
