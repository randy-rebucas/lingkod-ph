"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, where, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";

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
    const { toast } = useToast();

    useEffect(() => {
        if (!user || !db) return;

        const transactionsQuery = query(
            collection(db, "transactions"),
            where("clientId", "==", user.uid),
            orderBy("createdAt", "desc")
        );
        
        const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentTransaction));
            setTransactions(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'booking_payment':
                return 'Service Payment';
            case 'payout_request':
                return 'Payout Request';
            case 'refund':
                return 'Refund';
            default:
                return type;
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Payment History</h1>
                    <p className="text-muted-foreground">View all your payment transactions and receipts.</p>
                </div>
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Payment History</h1>
                    <p className="text-muted-foreground">View all your payment transactions and receipts.</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                    <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Transaction History</CardTitle>
                    <CardDescription>
                        {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                                    View Details
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Transaction Details</DialogTitle>
                                                    <DialogDescription>
                                                        Transaction ID: {transaction.id}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-sm font-medium text-muted-foreground">Type</label>
                                                            <p className="text-sm">{getTypeLabel(transaction.type)}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-muted-foreground">Amount</label>
                                                            <p className="text-sm">₱{transaction.amount.toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                                                            <p className="text-sm">{transaction.paymentMethod}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                                                            <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-muted-foreground">Date</label>
                                                            <p className="text-sm">{format(transaction.createdAt.toDate(), 'PPp')}</p>
                                                        </div>
                                                        {transaction.verifiedAt && (
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">Verified At</label>
                                                                <p className="text-sm">{format(transaction.verifiedAt.toDate(), 'PPp')}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {transaction.rejectionReason && (
                                                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                                            <label className="text-sm font-medium text-red-800">Rejection Reason</label>
                                                            <p className="text-sm text-red-800 mt-1">{transaction.rejectionReason}</p>
                                                        </div>
                                                    )}

                                                    {transaction.paypalOrderId && (
                                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                            <label className="text-sm font-medium text-blue-800">PayPal Order ID</label>
                                                            <p className="text-sm text-blue-800 mt-1 font-mono">{transaction.paypalOrderId}</p>
                                                            {transaction.payerEmail && (
                                                                <>
                                                                    <label className="text-sm font-medium text-blue-800 mt-2 block">Payer Email</label>
                                                                    <p className="text-sm text-blue-800 mt-1">{transaction.payerEmail}</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}

                                                    {transaction.bookingId && (
                                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                                            <label className="text-sm font-medium text-gray-800">Booking ID</label>
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
                                        No payment transactions found.
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

