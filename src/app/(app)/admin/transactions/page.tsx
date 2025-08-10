
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, Timestamp, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Transaction = {
    id: string;
    userId: string;
    payerEmail?: string;
    planId: string;
    amount: number;
    paymentMethod: string;
    status: 'completed' | 'pending' | 'failed';
    paypalOrderId?: string;
    createdAt: Timestamp;
};

export default function AdminTransactionsPage() {
    const { userRole } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [approvingId, setApprovingId] = useState<string | null>(null);

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

    const handleApprovePayment = async (tx: Transaction) => {
        if (!tx.userId) {
            toast({ variant: "destructive", title: "Error", description: "User ID is missing for this transaction."});
            return;
        }
        setApprovingId(tx.id);
        try {
            const transactionRef = doc(db, 'transactions', tx.id);
            const userRef = doc(db, 'users', tx.userId);

            const renewalDate = new Date();
            renewalDate.setMonth(renewalDate.getMonth() + 1);

            // Update user's subscription
            await updateDoc(userRef, {
                subscription: {
                    planId: tx.planId,
                    status: "active",
                    renewsOn: Timestamp.fromDate(renewalDate),
                },
            });

            // Update transaction status
            await updateDoc(transactionRef, { status: 'completed' });

            // Send notification to user
            await addDoc(collection(db, `users/${tx.userId}/notifications`), {
                type: 'info',
                message: `Your payment for the ${tx.planId} plan has been confirmed. Your subscription is now active!`,
                link: '/subscription',
                read: false,
                createdAt: serverTimestamp(),
            });

            toast({ title: "Payment Approved!", description: `The subscription for user ${tx.userId} is now active.` });

        } catch (error) {
            console.error("Error approving payment:", error);
            toast({ variant: "destructive", title: "Approval Failed", description: "There was an error approving the payment." });
        } finally {
            setApprovingId(null);
        }
    }

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
                                <TableHead>User ID / Email</TableHead>
                                <TableHead>Plan ID</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length > 0 ? transactions.map(tx => (
                                <TableRow key={tx.id} className={tx.status === 'pending' ? 'bg-yellow-500/10' : ''}>
                                     <TableCell className="text-xs text-muted-foreground">
                                        {tx.createdAt ? format(tx.createdAt.toDate(), 'PPp') : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono">{tx.payerEmail || tx.userId}</TableCell>
                                    <TableCell className="font-medium capitalize">{tx.planId}</TableCell>
                                    <TableCell>₱{tx.amount.toFixed(2)}</TableCell>
                                    <TableCell><Badge variant="secondary">{tx.paymentMethod}</Badge></TableCell>
                                    <TableCell>
                                        <Badge variant={tx.status === 'completed' ? 'default' : (tx.status === 'pending' ? 'outline' : 'destructive')} className="capitalize">
                                            {tx.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {tx.status === 'pending' ? (
                                            <Button size="sm" onClick={() => handleApprovePayment(tx)} disabled={approvingId === tx.id}>
                                                {approvingId === tx.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                Approve
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">{tx.paypalOrderId || 'N/A'}</span>
                                        )}
                                    </TableCell>
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
