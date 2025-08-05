
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type Transaction = {
    id: string;
    userId: string;
    payerEmail?: string;
    planId: string;
    amount: number;
    paymentMethod: string;
    status: string;
    paypalOrderId: string;
    createdAt: Timestamp;
};

export default function AdminTransactionsPage() {
    const { userRole } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const transQuery = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(transQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            setTransactions(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);

    if (userRole !== 'admin') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>This page is for administrators only.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    if (loading) {
        return (
             <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Transaction History</h1>
                    <p className="text-muted-foreground">Monitor all subscription payments.</p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
             </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Transaction History</h1>
                <p className="text-muted-foreground">
                    Monitor all subscription payments.
                </p>
            </div>
             <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User Email</TableHead>
                                <TableHead>Plan ID</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Transaction ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length > 0 ? transactions.map(tx => (
                                <TableRow key={tx.id}>
                                     <TableCell className="text-xs text-muted-foreground">
                                        {tx.createdAt ? format(tx.createdAt.toDate(), 'PPp') : 'N/A'}
                                    </TableCell>
                                    <TableCell>{tx.payerEmail || 'N/A'}</TableCell>
                                    <TableCell className="font-medium capitalize">{tx.planId}</TableCell>
                                    <TableCell>₱{tx.amount.toFixed(2)}</TableCell>
                                    <TableCell><Badge variant="secondary">{tx.paymentMethod}</Badge></TableCell>
                                    <TableCell><Badge variant={tx.status === 'completed' ? 'default' : 'destructive'} className="capitalize">{tx.status}</Badge></TableCell>
                                    <TableCell className="font-mono text-xs">{tx.paypalOrderId}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
