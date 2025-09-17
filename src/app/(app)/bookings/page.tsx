
"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Loader2, Calendar, Check, X, Hourglass, Briefcase, UserCircle, Timer, Eye, Repeat, Wallet } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, or, runTransaction, serverTimestamp, orderBy, addDoc, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingDetailsDialog } from "@/components/booking-details-dialog";
import { LeaveReviewDialog } from "@/components/leave-review-dialog";
import { CompleteBookingDialog } from "@/components/complete-booking-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { BookingDialog } from "@/components/booking-dialog";
import { useTranslations } from 'next-intl';


type BookingStatus = "Pending Payment" | "Pending Verification" | "Upcoming" | "In Progress" | "Completed" | "Cancelled" | "Payment Rejected";

export type Booking = {
    id: string;
    jobId?: string;
    serviceName: string;
    serviceId: string;
    clientName: string;
    providerName: string;
    clientId: string;
    providerId: string;
    clientAvatar?: string;
    providerAvatar?: string;
    date: Timestamp;
    status: BookingStatus;
    price: number;
    notes?: string;
    reviewId?: string;
    completionPhotoURL?: string;
    paymentProofUrl?: string;
    paymentRejectionReason?: string;
    paymentRejectedAt?: Timestamp;
    paymentRejectedBy?: string;
    paymentVerifiedAt?: Timestamp;
    paymentVerifiedBy?: string;
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case "Upcoming": return "default";
        case "In Progress": return "secondary";
        case "Completed": return "secondary";
        case "Cancelled": return "destructive";
        case "Pending Payment": return "outline";
        case "Pending Verification": return "outline";
        case "Payment Rejected": return "destructive";
        default: return "outline";
    }
}

const createNotification = async (userId: string, message: string, link: string) => {
    try {
        const userNotifSettingsRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userNotifSettingsRef);

        if (docSnap.exists() && docSnap.data().notificationSettings?.bookingUpdates === false) {
             console.log(`User ${userId} has booking update notifications disabled.`);
             return; // User has disabled this type of notification
        }

        const notificationsRef = collection(db, `users/${userId}/notifications`);
        await addDoc(notificationsRef, {
            userId,
            message,
            link,
            type: 'booking_update',
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating notification: ", error);
    }
};

const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};


const BookingCard = ({ booking, userRole }: { booking: Booking, userRole: string | null }) => {
    const { toast } = useToast();
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isCompleteOpen, setIsCompleteOpen] = useState(false);
    const [isRebookOpen, setIsRebookOpen] = useState(false);

     const handleStatusUpdate = async (booking: Booking, newStatus: BookingStatus, successMessage?: string) => {
        const bookingRef = doc(db, "bookings", booking.id);
        try {
            await updateDoc(bookingRef, { status: newStatus });
           
            toast({
                title: "Booking Updated",
                description: successMessage || `The booking has been successfully updated to ${newStatus.toLowerCase()}.`,
            });
            
            // Send notifications based on who made the change
            if (userRole === 'provider') {
                 if (newStatus === 'Upcoming') {
                    await createNotification(booking.clientId, `Your booking for "${booking.serviceName}" has been accepted by ${booking.providerName}.`, '/bookings');
                 } else if (newStatus === 'Cancelled') {
                    await createNotification(booking.clientId, `Your booking for "${booking.serviceName}" has been declined by ${booking.providerName}.`, '/bookings');
                 }
            } else if (userRole === 'client') {
                 if (newStatus === 'Cancelled') {
                    await createNotification(booking.providerId, `${booking.clientName} has cancelled their booking for "${booking.serviceName}".`, '/bookings');
                 }
            }

        } catch (error) {
            console.error("Error updating booking status:", error);
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update the booking status." });
        }
    };

    const handleViewDetails = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDetailsOpen(true);
    };

    const handleOpenReview = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsReviewOpen(true);
    };

    const handleOpenComplete = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsCompleteOpen(true);
    };

     const handleOpenRebook = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsRebookOpen(true);
    };
    
    const displayName = userRole === 'client' ? booking.providerName : booking.clientName;
    const displayAvatar = userRole === 'client' ? booking.providerAvatar : booking.clientAvatar;
    const displayDate = booking.date.toDate();

    return (
      <>
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>{booking.serviceName}</CardTitle>
                    <CardDescription>with {displayName}</CardDescription>
                </div>
                <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={displayAvatar} alt={displayName} />
                        <AvatarFallback>{getAvatarFallback(displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground">{displayName}</span>
                        <span>{userRole === 'client' ? 'Service Provider' : 'Client'}</span>
                    </div>
                </div>
                 <div className="flex justify-between items-center text-sm p-3 bg-secondary rounded-md">
                     <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{displayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at {displayDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <span className="font-bold text-lg text-primary">₱{booking.price.toFixed(2)}</span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                 {booking.status === 'Completed' && userRole === 'client' && (
                     <Button variant="secondary" onClick={() => handleOpenRebook(booking)}>
                        <Repeat className="mr-2 h-4 w-4"/> Re-book
                     </Button>
                 )}
                 {booking.status === 'In Progress' && (
                    <Button asChild>
                        <Link href={`/bookings/${booking.id}/work-log`}><Eye className="mr-2 h-4 w-4"/> View Work Log</Link>
                    </Button>
                 )}
                 {booking.status === 'Pending Payment' && userRole === 'client' && (
                    <Button asChild>
                        <Link href={`/bookings/${booking.id}/payment`}><Wallet className="mr-2 h-4 w-4"/> Proceed to Payment</Link>
                    </Button>
                 )}
                 <Button variant="outline" onClick={() => handleViewDetails(booking)}>View Details</Button>
                <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="outline">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            
                            {userRole === 'provider' && booking.status === 'Upcoming' && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(booking, 'In Progress', 'Booking has been started.')}>
                                    <Timer className="mr-2 h-4 w-4 text-blue-500"/>Start Work
                                </DropdownMenuItem>
                            )}
                            {userRole === 'provider' && booking.status === 'In Progress' && (
                                <DropdownMenuItem onClick={() => handleOpenComplete(booking)}><Check className="mr-2 h-4 w-4 text-green-500"/>Mark as Completed</DropdownMenuItem>
                            )}

                            {/* Client Actions */}
                            {userRole === 'client' && (booking.status === 'Pending Payment' || booking.status === 'Upcoming') && (
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><X className="mr-2 h-4 w-4" />Cancel Booking</DropdownMenuItem>
                                </AlertDialogTrigger>
                            )}
                            {userRole === 'client' && booking.status === 'Completed' && !booking.reviewId && (
                                <DropdownMenuItem onClick={() => handleOpenReview(booking)}>Leave a Review</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Cancellation Dialog for Client */}
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will cancel your booking for "{booking.serviceName}".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Close</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleStatusUpdate(booking, "Cancelled")}>
                                Confirm Cancellation
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
        {selectedBooking && <BookingDetailsDialog isOpen={isDetailsOpen} setIsOpen={setIsDetailsOpen} booking={selectedBooking} />}
        {selectedBooking && userRole === 'client' && <LeaveReviewDialog isOpen={isReviewOpen} setIsOpen={setIsReviewOpen} booking={selectedBooking} />}
        {selectedBooking && userRole === 'provider' && <CompleteBookingDialog isOpen={isCompleteOpen} setIsOpen={setIsCompleteOpen} booking={selectedBooking} />}
        {selectedBooking && userRole === 'client' && (
            <BookingDialog
                isOpen={isRebookOpen}
                setIsOpen={setIsRebookOpen}
                service={{ id: booking.serviceId, name: booking.serviceName, price: booking.price, category: '', description: '', status: 'Active' }}
                provider={{ uid: booking.providerId, displayName: booking.providerName, email: '', role: 'provider' }}
                onBookingConfirmed={() => {
                    toast({ title: 'Booking Request Sent!', description: 'Your new booking has been sent. Proceed to payment to confirm.'});
                    setIsRebookOpen(false);
                }}
            />
        )}
        </>
    );
};

const EmptyState = ({ status, userRole }: { status: string, userRole: string | null }) => {
    const t = useTranslations('Bookings');
    
    const messages: { [key: string]: { icon: JSX.Element, text: string } } = {
        'Pending Payment': { icon: <Wallet className="h-16 w-16" />, text: t('noBookingsAwaitingPayment') },
        'Pending Verification': { icon: <Hourglass className="h-16 w-16" />, text: t('noPaymentsPendingVerification') },
        Upcoming: { icon: <Calendar className="h-16 w-16" />, text: t('noUpcomingBookings') },
        "In Progress": { icon: <Timer className="h-16 w-16" />, text: t('noJobsInProgress') },
        Completed: { icon: <Check className="h-16 w-16" />, text: t('noCompletedBookings') },
        Cancelled: { icon: <X className="h-16 w-16" />, text: t('noCancelledBookings') }
    };
    const clientAction = t('whyNotBookNewService');
    const providerAction = t('seeNewBookingRequests');
    
    const messageInfo = messages[status];

    if (!messageInfo) {
        return null; // or a default fallback
    }

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                <div className="mb-4 text-primary">{messageInfo.icon}</div>
                <h3 className="text-xl font-semibold">{messageInfo.text}</h3>
                <p className="mt-2">{userRole === 'client' ? clientAction : providerAction}</p>
                 {userRole === 'client' && (
                    <Button asChild className="mt-4">
                        <Link href="/dashboard">{t('findAService')}</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

const BookingsList = ({ bookings, isLoading, userRole, status }: { bookings: Booking[], isLoading: boolean, userRole: string | null, status: string }) => {
    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
        )
    }

    if (bookings.length === 0) {
        return <EmptyState status={status} userRole={userRole} />;
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} userRole={userRole} />
            ))}
        </div>
    )
};


export default function BookingsPage() {
    const { user, userRole } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const t = useTranslations('Bookings');

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        };

        setLoading(true);
        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, 
            or(where("clientId", "==", user.uid), where("providerId", "==", user.uid)),
            orderBy("date", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
             const bookingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
            setBookings(bookingsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch your bookings.' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast]);

    const pendingPaymentBookings = bookings.filter(b => b.status === 'Pending Payment');
    const pendingVerificationBookings = bookings.filter(b => b.status === 'Pending Verification');
    const upcomingBookings = bookings.filter(b => b.status === 'Upcoming');
    const inProgressBookings = bookings.filter(b => b.status === 'In Progress');
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled');
    
    const [activeTab, setActiveTab] = useState("pending-payment");

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        const validTabs = ["pending-payment", "pending-verification", "upcoming", "in-progress", "completed", "cancelled"];
        if (hash && validTabs.includes(hash)) {
            setActiveTab(hash);
        } else {
            setActiveTab("pending-payment");
        }
    }, []);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        window.location.hash = value;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">{t('myBookingsTitle')}</h1>
                <p className="text-muted-foreground">
                    {t('myBookingsDescription')}
                </p>
            </div>
            
            <Tabs defaultValue="pending-payment" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
                    <TabsTrigger value="pending-payment">{t('awaitingPayment')}</TabsTrigger>
                    <TabsTrigger value="pending-verification">{t('forVerification')}</TabsTrigger>
                    <TabsTrigger value="upcoming">{t('upcoming')}</TabsTrigger>
                    <TabsTrigger value="in-progress">{t('inProgress')}</TabsTrigger>
                    <TabsTrigger value="completed">{t('completed')}</TabsTrigger>
                    <TabsTrigger value="cancelled">{t('cancelled')}</TabsTrigger>
                </TabsList>
                 <TabsContent value="pending-payment" className="mt-6">
                     <BookingsList bookings={pendingPaymentBookings} isLoading={loading} userRole={userRole} status="Pending Payment"/>
                </TabsContent>
                 <TabsContent value="pending-verification" className="mt-6">
                     <BookingsList bookings={pendingVerificationBookings} isLoading={loading} userRole={userRole} status="Pending Verification"/>
                </TabsContent>
                <TabsContent value="upcoming" className="mt-6">
                     <BookingsList bookings={upcomingBookings} isLoading={loading} userRole={userRole} status="Upcoming" />
                </TabsContent>
                <TabsContent value="in-progress" className="mt-6">
                    <BookingsList bookings={inProgressBookings} isLoading={loading} userRole={userRole} status="In Progress" />
                </TabsContent>
                <TabsContent value="completed" className="mt-6">
                    <BookingsList bookings={completedBookings} isLoading={loading} userRole={userRole} status="Completed" />
                </TabsContent>
                <TabsContent value="cancelled" className="mt-6">
                   <BookingsList bookings={cancelledBookings} isLoading={loading} userRole={userRole} status="Cancelled" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
