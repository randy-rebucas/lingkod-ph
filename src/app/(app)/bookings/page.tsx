
"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Loader2, Calendar, Check, X, Hourglass, Briefcase, UserCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, or, runTransaction, serverTimestamp, orderBy, addDoc, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingDetailsDialog } from "@/components/booking-details-dialog";
import { LeaveReviewDialog } from "@/components/leave-review-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


type BookingStatus = "Pending" | "Upcoming" | "Completed" | "Cancelled";

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
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case "Upcoming": return "default";
        case "Completed": return "secondary";
        case "Cancelled": return "destructive";
        case "Pending": return "outline";
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

     const handleStatusUpdate = async (booking: Booking, newStatus: BookingStatus, successMessage?: string) => {
        const bookingRef = doc(db, "bookings", booking.id);
        try {
            if (newStatus === 'Completed' && userRole === 'provider') {
                await runTransaction(db, async (transaction) => {
                    // Update client's loyalty points
                    const clientRef = doc(db, "users", booking.clientId);
                    const clientDoc = await transaction.get(clientRef);
                    if (!clientDoc.exists()) throw "Client document does not exist!";
                    const pointsToAward = Math.floor(booking.price / 10);
                    const currentPoints = clientDoc.data().loyaltyPoints || 0;
                    const newTotalPoints = currentPoints + pointsToAward;
                    transaction.update(clientRef, { loyaltyPoints: newTotalPoints });

                    // Create loyalty transaction record
                    const loyaltyTxRef = doc(collection(db, `users/${booking.clientId}/loyaltyTransactions`));
                    transaction.set(loyaltyTxRef, {
                        points: pointsToAward, type: 'earn',
                        description: `Points for completing service: ${booking.serviceName}`,
                        bookingId: booking.id, createdAt: serverTimestamp()
                    });

                    // Update booking status
                    transaction.update(bookingRef, { status: newStatus });
                    
                    // Update original job post status to "Completed" if it exists
                    if (booking.jobId) {
                        const jobRef = doc(db, "jobs", booking.jobId);
                        transaction.update(jobRef, { status: "Completed" });
                    }
                });
                await createNotification(booking.clientId, `Your booking for "${booking.serviceName}" has been marked as completed.`, '/bookings');
            } else {
                 await updateDoc(bookingRef, { status: newStatus });
            }
           
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
                            
                            {/* Provider Actions */}
                            {userRole === 'provider' && booking.status === 'Pending' && (
                                <>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(booking, 'Upcoming', 'Booking has been accepted.')}><Check className="mr-2 h-4 w-4 text-green-500" />Accept</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(booking, 'Cancelled', 'Booking has been declined.')} className="text-destructive focus:text-destructive focus:bg-destructive/10"><X className="mr-2 h-4 w-4" />Decline</DropdownMenuItem>
                                </>
                            )}
                            {userRole === 'provider' && booking.status === 'Upcoming' && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(booking, 'Completed')}><Check className="mr-2 h-4 w-4 text-green-500"/>Mark as Completed</DropdownMenuItem>
                            )}

                            {/* Client Actions */}
                            {userRole === 'client' && (booking.status === 'Pending' || booking.status === 'Upcoming') && (
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
        </>
    );
};

const EmptyState = ({ status, userRole }: { status: BookingStatus, userRole: string | null }) => {
    const messages = {
        Pending: { icon: <Hourglass />, text: "You have no pending bookings at the moment." },
        Upcoming: { icon: <Calendar />, text: "You have no upcoming bookings." },
        Completed: { icon: <Check />, text: "You have no completed bookings yet." },
        Cancelled: { icon: <X />, text: "You have no cancelled bookings." }
    };
    const clientAction = "Why not book a new service today?";
    const providerAction = "You'll see new booking requests here.";

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                <div className="mb-4 text-primary">{messages[status].icon}</div>
                <h3 className="text-xl font-semibold">{messages[status].text}</h3>
                <p className="mt-2">{userRole === 'client' ? clientAction : providerAction}</p>
                 {userRole === 'client' && (
                    <Button asChild className="mt-4">
                        <Link href="/dashboard">Find a Service</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

const BookingsList = ({ bookings, isLoading, userRole }: { bookings: Booking[], isLoading: boolean, userRole: string | null }) => {
    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
        )
    }

    if (bookings.length === 0) {
        // This is a bit of a trick to get the current status from the bookings list even when it's empty
        // In a real app, you'd probably pass the status down as a prop.
        const currentTabStatus = (window.location.hash.substring(1) || 'pending') as BookingStatus;
        return <EmptyState status={currentTabStatus} userRole={userRole} />;
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

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
             const bookingsData = await Promise.all(querySnapshot.docs.map(async (bookingDoc) => {
                const data = bookingDoc.data();
                
                // Fetch related user avatars
                const clientDoc = await getDoc(doc(db, "users", data.clientId));
                const providerDoc = await getDoc(doc(db, "users", data.providerId));
                
                return {
                    id: bookingDoc.id,
                    ...data,
                    clientAvatar: clientDoc.data()?.photoURL || '',
                    providerAvatar: providerDoc.data()?.photoURL || ''
                } as Booking;
            }));

            setBookings(bookingsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch your bookings.' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast]);

    const pendingBookings = bookings.filter(b => b.status === 'Pending');
    const upcomingBookings = bookings.filter(b => b.status === 'Upcoming');
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled');
    
    const [activeTab, setActiveTab] = useState("pending");

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            setActiveTab(hash);
        }
    }, []);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        window.location.hash = value;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Bookings</h1>
                <p className="text-muted-foreground">
                    View and manage all your scheduled services here.
                </p>
            </div>
            
            <Tabs defaultValue="pending" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-6">
                     <BookingsList bookings={pendingBookings} isLoading={loading} userRole={userRole} />
                </TabsContent>
                <TabsContent value="upcoming" className="mt-6">
                     <BookingsList bookings={upcomingBookings} isLoading={loading} userRole={userRole} />
                </TabsContent>
                <TabsContent value="completed" className="mt-6">
                    <BookingsList bookings={completedBookings} isLoading={loading} userRole={userRole} />
                </TabsContent>
                <TabsContent value="cancelled" className="mt-6">
                   <BookingsList bookings={cancelledBookings} isLoading={loading} userRole={userRole} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
