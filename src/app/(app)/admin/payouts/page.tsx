
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { handleMarkAsPaid } from "./actions";

type PayoutStatus = "Pending" | "Paid";

type Payout = {
    id: string;
    providerId: string;
    providerName: string;
    amount: number;
    status: PayoutStatus;
    requestedAt: Timestamp;
    processedAt?: Timestamp;
    payoutDetails: {
        method: 'paypal' | 'bank';
        paypalEmail?: string;
        bankName?: string;
        bankAccountNumber?: string;
        bankAccountName?: string;
    };
};

const getStatusVariant = (status: PayoutStatus) => {
    switch (status) {
        case "Paid": return "secondary";
        case "Pending": return "outline";
        default: return "default";
    }
};

const PayoutDetails = ({ payout }: { payout: Payout }) => {
    if (payout.payoutDetails.method === 'paypal') {
        return (
            <div className="text-xs">
                <p><strong>PayPal Email:</strong> {payout.payoutDetails.paypalEmail}</p>
            </div>
        )
    }
    if (payout.payoutDetails.method === 'bank') {
        return (
            <div className="text-xs">
                <p><strong>Bank:</strong> {payout.payoutDetails.bankName}</p>
                <p><strong>Acct #:</strong> {payout.payoutDetails.bankAccountNumber}</p>
                <p><strong>Name:</strong> {payout.payoutDetails.bankAccountName}</p>
            </div>
        )
    }
    return <p className="text-xs text-muted-foreground">No details.</p>;
}

export default function AdminPayoutsPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (userRole !== 'admin' || !getDb()) {
            setLoading(false);
            return;
        }

        const payoutsQuery = query(collection(getDb(), "payouts"), orderBy("requestedAt", "desc"));
        
        const unsubscribe = onSnapshot(payoutsQuery, (snapshot) => {
            const payoutsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payout));
            setPayouts(payoutsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching payouts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);

    const onMarkAsPaid = async (payout: Payout) => {
        if (!user) return;
        const result = await handleMarkAsPaid(payout.id, payout.providerId, payout.providerName, payout.amount, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    };

    if (userRole !== 'admin') {
        return (
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Access Denied</CardTitle>
                            <CardDescription>This page is for administrators only.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }
    
    if (loading) {
        return (
             <div className="container space-y-8">
                 <div className=" mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Payout Requests</h1>
                    <p className="text-muted-foreground">
                        Review and process provider payout requests.
                    </p>
                </div>
                <div className=" mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                </div>
             </div>
        )
    }

    const pendingPayouts = payouts.filter(p => p.status === 'Pending');
    const paidPayouts = payouts.filter(p => p.status === 'Paid');

    return (
        <div className="container space-y-8">
            <div className=" mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Payout Requests</h1>
                <p className="text-muted-foreground">
                     Review and process provider payout requests.
                </p>
            </div>
            <div className=" mx-auto">
                 <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Pending Payouts</CardTitle>
                        <CardDescription>These requests need to be processed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date Requested</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingPayouts.length > 0 ? pendingPayouts.map(payout => (
                                    <TableRow key={payout.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(payout.requestedAt.toDate(), 'PP')}
                                        </TableCell>
                                        <TableCell>{payout.providerName}</TableCell>
                                        <TableCell className="font-medium">₱{payout.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <PayoutDetails payout={payout} />
                                        </TableCell>
                                         <TableCell className="text-right">
                                            <Button size="sm" onClick={() => onMarkAsPaid(payout)}>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                                            No pending payouts.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div className=" mx-auto">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Completed Payouts</CardTitle>
                        <CardDescription>History of all processed payouts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date Processed</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {paidPayouts.length > 0 ? paidPayouts.map(payout => (
                                    <TableRow key={payout.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {payout.processedAt ? format(payout.processedAt.toDate(), 'PP') : 'N/A'}
                                        </TableCell>
                                        <TableCell>{payout.providerName}</TableCell>
                                        <TableCell>₱{payout.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(payout.status)}>{payout.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                 )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No completed payouts found.</TableCell>
                                    </TableRow>
                                 )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
