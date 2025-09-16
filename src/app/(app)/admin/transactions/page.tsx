
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, Timestamp, updateDoc, doc, addDoc, serverTimestamp, where } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@/app/(app)/bookings/page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";

type PaymentVerificationBooking = Booking & {
    paymentProofUrl?: string;
    createdAt?: Timestamp;
};

export default function AdminPaymentVerificationPage() {
    const { user, userRole } = useAuth();
    const [bookings, setBookings] = useState<PaymentVerificationBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [approvingId, setApprovingId] = useState<string | null>(null);

     useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const bookingsQuery = query(collection(db, "bookings"), where("status", "==", "Pending Verification"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentVerificationBooking));
            setBookings(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);

    const handleApprovePayment = async (booking: PaymentVerificationBooking) => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Authentication error."});
            return;
        }
        setApprovingId(booking.id);
        try {
            const bookingRef = doc(db, 'bookings', booking.id);
            await updateDoc(bookingRef, { status: 'Upcoming' });

            // Notify client
            await addDoc(collection(db, `users/${booking.clientId}/notifications`), {
                type: 'booking_update',
                message: `Your payment for "${booking.serviceName}" has been confirmed! Your booking is now scheduled.`,
                link: '/bookings',
                read: false,
                createdAt: serverTimestamp(),
            });

             // Notify provider
            await addDoc(collection(db, `users/${booking.providerId}/notifications`), {
                type: 'booking_update',
                message: `You have a new confirmed booking from ${booking.clientName} for "${booking.serviceName}".`,
                link: '/bookings',
                read: false,
                createdAt: serverTimestamp(),
            });

            toast({ title: "Payment Approved!", description: `The booking for ${booking.clientName} is now active.` });

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
                    <h1 className="text-3xl font-bold font-headline">Payment Verification</h1>
                    <p className="text-muted-foreground">Review and approve manual payments.</p>
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
        <Dialog>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Payment Verification</h1>
                    <p className="text-muted-foreground">
                       Review and approve manual payments submitted by users.
                    </p>
                </div>
                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date Submitted</TableHead>
                                    <TableHead>Client Name</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.length > 0 ? bookings.map(booking => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {booking.createdAt ? format(booking.createdAt.toDate(), 'PPp') : 'N/A'}
                                        </TableCell>
                                        <TableCell>{booking.clientName}</TableCell>
                                        <TableCell className="font-medium">{booking.serviceName}</TableCell>
                                        <TableCell>₱{booking.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right flex justify-end gap-2">
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/> View Proof</Button>
                                            </DialogTrigger>
                                            <Button size="sm" onClick={() => handleApprovePayment(booking)} disabled={approvingId === booking.id}>
                                                {approvingId === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                Approve
                                            </Button>
                                        </TableCell>
                                         <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Proof of Payment</DialogTitle>
                                                <DialogDescription>
                                                    Client: {booking.clientName} | Booking ID: {booking.id}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="relative aspect-video w-full">
                                                <Image src={booking.paymentProofUrl || "https://placehold.co/600x400.png"} alt="Proof of payment" layout="fill" className="rounded-md object-contain" />
                                            </div>
                                        </DialogContent>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No pending payments to verify.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </Dialog>
    )
}
