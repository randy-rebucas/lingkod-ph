
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp, updateDoc, doc, addDoc, serverTimestamp, where } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
// import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Eye, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@/app/(app)/bookings/page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string>("");

     useEffect(() => {
        if (userRole !== 'admin' || !getDb()) {
            setLoading(false);
            return;
        }

        const bookingsQuery = query(collection(getDb(), "bookings"), where("status", "==", "Pending Verification"), orderBy("createdAt", "desc"));
        
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
            const bookingRef = doc(getDb(), 'bookings', booking.id);
            await updateDoc(bookingRef, { 
                status: 'Upcoming',
                paymentVerifiedAt: serverTimestamp(),
                paymentVerifiedBy: user.uid
            });

            // Create payment record
            await addDoc(collection(getDb(), 'transactions'), {
                bookingId: booking.id,
                clientId: booking.clientId,
                providerId: booking.providerId,
                amount: booking.price,
                type: 'booking_payment',
                status: 'completed',
                paymentMethod: 'manual_verification',
                verifiedBy: user.uid,
                verifiedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            });

            // Notify client
            await addDoc(collection(getDb(), `users/${booking.clientId}/notifications`), {
                type: 'booking_update',
                message: `Your payment for "${booking.serviceName}" has been confirmed! Your booking is now scheduled.`,
                link: '/bookings',
                read: false,
                createdAt: serverTimestamp(),
            });

             // Notify provider
            await addDoc(collection(getDb(), `users/${booking.providerId}/notifications`), {
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

    const handleRejectPayment = async (booking: PaymentVerificationBooking) => {
        if (!user || !rejectionReason.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Please provide a reason for rejection."});
            return;
        }
        setRejectingId(booking.id);
        try {
            const bookingRef = doc(getDb(), 'bookings', booking.id);
            await updateDoc(bookingRef, { 
                status: 'Payment Rejected',
                paymentRejectionReason: rejectionReason,
                paymentRejectedAt: serverTimestamp(),
                paymentRejectedBy: user.uid
            });

            // Notify client
            await addDoc(collection(getDb(), `users/${booking.clientId}/notifications`), {
                type: 'booking_update',
                message: `Your payment for "${booking.serviceName}" was rejected. Reason: ${rejectionReason}. Please contact support or try again.`,
                link: '/bookings',
                read: false,
                createdAt: serverTimestamp(),
            });

            // Create payment record for tracking
            await addDoc(collection(getDb(), 'transactions'), {
                bookingId: booking.id,
                clientId: booking.clientId,
                providerId: booking.providerId,
                amount: booking.price,
                type: 'booking_payment',
                status: 'rejected',
                paymentMethod: 'manual_verification',
                rejectionReason: rejectionReason,
                rejectedBy: user.uid,
                rejectedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            });

            toast({ title: "Payment Rejected", description: `The payment for ${booking.clientName} has been rejected.` });
            setRejectionReason("");

        } catch (error) {
            console.error("Error rejecting payment:", error);
            toast({ variant: "destructive", title: "Rejection Failed", description: "There was an error rejecting the payment." });
        } finally {
            setRejectingId(null);
        }
    }

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
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Payment Verification</h1>
                    <p className="text-muted-foreground">Review and approve manual payments.</p>
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

    return (
        <Dialog>
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Payment Verification</h1>
                    <p className="text-muted-foreground">
                       Review and approve manual payments submitted by users.
                    </p>
                </div>
                <div className=" mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
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
                                                <Button size="sm" onClick={() => handleApprovePayment(booking)} disabled={approvingId === booking.id || rejectingId === booking.id}>
                                                    {approvingId === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                    Approve
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm" disabled={approvingId === booking.id || rejectingId === booking.id}>
                                                            {rejectingId === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                                            Reject
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Reject Payment</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to reject this payment? Please provide a reason for the rejection.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                                                                <Textarea
                                                                    id="rejection-reason"
                                                                    placeholder="Please provide a detailed reason for rejecting this payment..."
                                                                    value={rejectionReason}
                                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                        </div>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleRejectPayment(booking)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Reject Payment
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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
            </div>
        </Dialog>
    )
}
