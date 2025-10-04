
"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  MoreHorizontal, 
  Calendar, 
  Check, 
  X, 
  Briefcase, 
  Timer, 
  Eye, 
  Repeat, 
  Wallet, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  AlertCircle, 
  CheckCircle2, 
  Ban, 
  CreditCard, 
  FileCheck,
  Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, or, serverTimestamp, orderBy, addDoc, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingDetailsDialog } from "@/components/booking-details-dialog";
import { LeaveReviewDialog } from "@/components/leave-review-dialog";
import { CompleteBookingDialog } from "@/components/complete-booking-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
// import { BookingDialog } from "@/components/booking-dialog";
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
// import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";


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
    // Enhanced fields
    location?: string;
    description?: string;
    duration?: number;
    category?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    recurring?: boolean;
    recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    tags?: string[];
    attendees?: string[];
    reminder?: boolean;
    reminderTime?: number; // minutes before
    color?: string;
    metadata?: {
        bookingId?: string;
        clientId?: string;
        providerId?: string;
        serviceId?: string;
        [key: string]: any;
    };
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    completedAt?: Timestamp;
    cancelledAt?: Timestamp;
    cancellationReason?: string;
    rating?: number;
    feedback?: string;
    workLog?: {
        startTime?: Timestamp;
        endTime?: Timestamp;
        breaks?: number;
        notes?: string;
        photos?: string[];
    };
};

const _getStatusVariant = (status: string) => {
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

const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
        case "Completed": return <CheckCircle2 className="h-4 w-4" />;
        case "Upcoming": return <Calendar className="h-4 w-4" />;
        case "In Progress": return <Timer className="h-4 w-4" />;
        case "Cancelled": return <Ban className="h-4 w-4" />;
        case "Pending Payment": return <CreditCard className="h-4 w-4" />;
        case "Pending Verification": return <FileCheck className="h-4 w-4" />;
        case "Payment Rejected": return <AlertCircle className="h-4 w-4" />;
        default: return <Briefcase className="h-4 w-4" />;
    }
}

const getStatusClass = (status: BookingStatus) => {
    switch (status) {
        case "Completed": return "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-soft";
        case "Upcoming": return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-soft";
        case "In Progress": return "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-soft";
        case "Cancelled": return "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-soft";
        case "Pending Payment": return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-soft";
        case "Pending Verification": return "bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-soft";
        case "Payment Rejected": return "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-soft";
        default: return "bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-soft";
    }
}

const BookingTableRow = ({ booking, userRole }: { booking: Booking; userRole: string | null }) => {
    const { toast } = useToast();
    const _t = useTranslations('Bookings');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isCompleteOpen, setIsCompleteOpen] = useState(false);

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

    const handleStatusUpdate = async (booking: Booking, newStatus: BookingStatus, message?: string) => {
        if (!getDb()) return;
        try {
            const bookingRef = doc(getDb(), "bookings", booking.id);
            await updateDoc(bookingRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            // Create notification for the other party
            const otherUserId = userRole === 'client' ? booking.providerId : booking.clientId;
            const notificationMessage = message || `Booking status updated to ${newStatus}`;
            await createNotification(otherUserId, notificationMessage, `/bookings/${booking.id}`);

            toast({
                title: "Success",
                description: `Booking ${newStatus.toLowerCase()} successfully.`
            });
        } catch (error) {
            console.error("Error updating booking status:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update booking status."
            });
        }
    };

    return (
        <>
            <TableRow className="hover:bg-muted/50 transition-colors">
                {/* Service & Contact */}
                <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8 border border-primary/20">
                            <AvatarImage 
                                src={userRole === 'client' ? booking.providerAvatar : booking.clientAvatar} 
                                alt={userRole === 'client' ? booking.providerName : booking.clientName} 
                            />
                            <AvatarFallback className="text-xs bg-gradient-to-r from-primary to-accent text-primary-foreground">
                                {getAvatarFallback(userRole === 'client' ? booking.providerName : booking.clientName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="font-medium truncate">{booking.serviceName}</div>
                            <div className="text-sm text-muted-foreground truncate">
                                {userRole === 'client' ? booking.providerName : booking.clientName}
                            </div>
                        </div>
                    </div>
                </TableCell>

                {/* Date */}
                <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(booking.date.toDate(), 'MMM dd, yyyy')}
                    </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                    <Badge 
                        className={`${getStatusClass(booking.status)} flex items-center gap-1 text-xs px-2 py-1 w-fit`}
                    >
                        {getStatusIcon(booking.status)}
                        {booking.status}
                    </Badge>
                </TableCell>

                {/* Price */}
                <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        ₱{booking.price.toFixed(2)}
                    </div>
                </TableCell>

                {/* Category */}
                <TableCell>
                    <span className="text-sm text-muted-foreground">
                        {booking.category || 'Other'}
                    </span>
                </TableCell>

                {/* Actions */}
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={() => handleViewDetails(booking)}
                            size="sm"
                            variant="outline"
                            className="h-8 px-3"
                        >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                {/* Payment Actions */}
                                {booking.status === "Pending Payment" && userRole === "client" && (
                                    <DropdownMenuItem asChild>
                                        <Link href={`/bookings/${booking.id}/payment`} className="flex items-center">
                                            <Wallet className="h-4 w-4 mr-2" />
                                            Proceed to Payment
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                
                                {/* Work Log Actions */}
                                {booking.status === "In Progress" && userRole === "provider" && (
                                    <DropdownMenuItem asChild>
                                        <Link href={`/bookings/${booking.id}/work-log`} className="flex items-center">
                                            <Timer className="h-4 w-4 mr-2" />
                                            View Work Log
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                
                                {/* Re-book Actions */}
                                {booking.status === "Completed" && userRole === "client" && (
                                    <DropdownMenuItem asChild>
                                        <Link href={`/providers/${booking.providerId}`} className="flex items-center">
                                            <Repeat className="h-4 w-4 mr-2" />
                                            Re-book Service
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                
                                {/* Review Actions */}
                                {booking.status === "Completed" && !booking.reviewId && userRole === "client" && (
                                    <DropdownMenuItem onClick={() => handleOpenReview(booking)}>
                                        <Check className="h-4 w-4 mr-2" />
                                        Leave Review
                                    </DropdownMenuItem>
                                )}
                                
                                {/* Complete Booking Actions */}
                                {booking.status === "In Progress" && userRole === "provider" && (
                                    <DropdownMenuItem onClick={() => handleOpenComplete(booking)}>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Mark Complete
                                    </DropdownMenuItem>
                                )}
                                
                                {/* Cancel Actions */}
                                {(booking.status === "Upcoming" || booking.status === "Pending Payment") && (
                                    <DropdownMenuItem 
                                        onClick={() => handleStatusUpdate(booking, "Cancelled", "Booking has been cancelled")}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel Booking
                                    </DropdownMenuItem>
                                )}
                                
                                {/* Payment Rejection Actions */}
                                {booking.status === "Payment Rejected" && userRole === "client" && (
                                    <DropdownMenuItem asChild>
                                        <Link href={`/bookings/${booking.id}/payment`} className="flex items-center">
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Retry Payment
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </TableCell>
            </TableRow>

            {selectedBooking && (
                <>
                    <BookingDetailsDialog
                        booking={selectedBooking}
                        isOpen={isDetailsOpen}
                        setIsOpen={setIsDetailsOpen}
                    />
                    <LeaveReviewDialog
                        booking={selectedBooking}
                        isOpen={isReviewOpen}
                        setIsOpen={setIsReviewOpen}
                    />
                    <CompleteBookingDialog
                        booking={selectedBooking}
                        isOpen={isCompleteOpen}
                        setIsOpen={setIsCompleteOpen}
                    />
                </>
            )}
        </>
    );
};

const BookingMobileCard = ({ booking, userRole }: { booking: Booking; userRole: string | null }) => {
    const { toast } = useToast();
    const _t = useTranslations('Bookings');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isCompleteOpen, setIsCompleteOpen] = useState(false);

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

    const handleStatusUpdate = async (booking: Booking, newStatus: BookingStatus, message?: string) => {
        if (!getDb()) return;
        try {
            const bookingRef = doc(getDb(), "bookings", booking.id);
            await updateDoc(bookingRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            // Create notification for the other party
            const otherUserId = userRole === 'client' ? booking.providerId : booking.clientId;
            const notificationMessage = message || `Booking status updated to ${newStatus}`;
            await createNotification(otherUserId, notificationMessage, `/bookings/${booking.id}`);

            toast({
                title: "Success",
                description: `Booking ${newStatus.toLowerCase()} successfully.`
            });
        } catch (error) {
            console.error("Error updating booking status:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update booking status."
            });
        }
    };

    return (
        <>
            <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 border border-primary/20">
                                <AvatarImage 
                                    src={userRole === 'client' ? booking.providerAvatar : booking.clientAvatar} 
                                    alt={userRole === 'client' ? booking.providerName : booking.clientName} 
                                />
                                <AvatarFallback className="text-xs bg-gradient-to-r from-primary to-accent text-primary-foreground">
                                    {getAvatarFallback(userRole === 'client' ? booking.providerName : booking.clientName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-medium truncate">{booking.serviceName}</h3>
                                <p className="text-sm text-muted-foreground truncate">
                                    {userRole === 'client' ? booking.providerName : booking.clientName}
                                </p>
                            </div>
                        </div>
                        <Badge 
                            className={`${getStatusClass(booking.status)} flex items-center gap-1 text-xs px-2 py-1`}
                        >
                            {getStatusIcon(booking.status)}
                            <span className="hidden sm:inline">{booking.status}</span>
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(booking.date.toDate(), 'MMM dd')}
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                            <Wallet className="h-3 w-3" />
                            ₱{booking.price.toFixed(2)}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            {booking.category || 'Other'}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={() => handleViewDetails(booking)}
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                            >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    
                                    {/* Payment Actions */}
                                    {booking.status === "Pending Payment" && userRole === "client" && (
                                        <DropdownMenuItem asChild>
                                            <Link href={`/bookings/${booking.id}/payment`} className="flex items-center">
                                                <Wallet className="h-4 w-4 mr-2" />
                                                Proceed to Payment
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {/* Work Log Actions */}
                                    {booking.status === "In Progress" && userRole === "provider" && (
                                        <DropdownMenuItem asChild>
                                            <Link href={`/bookings/${booking.id}/work-log`} className="flex items-center">
                                                <Timer className="h-4 w-4 mr-2" />
                                                View Work Log
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {/* Re-book Actions */}
                                    {booking.status === "Completed" && userRole === "client" && (
                                        <DropdownMenuItem asChild>
                                            <Link href={`/providers/${booking.providerId}`} className="flex items-center">
                                                <Repeat className="h-4 w-4 mr-2" />
                                                Re-book Service
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {/* Review Actions */}
                                    {booking.status === "Completed" && !booking.reviewId && userRole === "client" && (
                                        <DropdownMenuItem onClick={() => handleOpenReview(booking)}>
                                            <Check className="h-4 w-4 mr-2" />
                                            Leave Review
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {/* Complete Booking Actions */}
                                    {booking.status === "In Progress" && userRole === "provider" && (
                                        <DropdownMenuItem onClick={() => handleOpenComplete(booking)}>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Mark Complete
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {/* Cancel Actions */}
                                    {(booking.status === "Upcoming" || booking.status === "Pending Payment") && (
                                        <DropdownMenuItem 
                                            onClick={() => handleStatusUpdate(booking, "Cancelled", "Booking has been cancelled")}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Cancel Booking
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {/* Payment Rejection Actions */}
                                    {booking.status === "Payment Rejected" && userRole === "client" && (
                                        <DropdownMenuItem asChild>
                                            <Link href={`/bookings/${booking.id}/payment`} className="flex items-center">
                                                <CreditCard className="h-4 w-4 mr-2" />
                                                Retry Payment
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedBooking && (
                <>
                    <BookingDetailsDialog
                        booking={selectedBooking}
                        isOpen={isDetailsOpen}
                        setIsOpen={setIsDetailsOpen}
                    />
                    <LeaveReviewDialog
                        booking={selectedBooking}
                        isOpen={isReviewOpen}
                        setIsOpen={setIsReviewOpen}
                    />
                    <CompleteBookingDialog
                        booking={selectedBooking}
                        isOpen={isCompleteOpen}
                        setIsOpen={setIsCompleteOpen}
                    />
                </>
            )}
        </>
    );
};

const createNotification = async (userId: string, message: string, link: string) => {
    if (!getDb()) return;
    try {
        const userNotifSettingsRef = doc(getDb(), 'users', userId);
        const docSnap = await getDoc(userNotifSettingsRef);

        if (docSnap.exists() && docSnap.data().notificationSettings?.bookingUpdates === false) {
             console.log(`User ${userId} has booking update notifications disabled.`);
             return; // User has disabled this type of notification
        }

        const notificationsRef = collection(getDb(), `users/${userId}/notifications`);
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

const _EmptyState = ({ status, userRole }: { status: string, userRole: string | null }) => {
    const t = useTranslations('Bookings');
    
    const messages: { [key: string]: { icon: JSX.Element, text: string } } = {
        'Pending Payment': { icon: <CreditCard className="h-20 w-20" />, text: t('noBookingsAwaitingPayment') },
        'Pending Verification': { icon: <FileCheck className="h-20 w-20" />, text: t('noPaymentsPendingVerification') },
        Upcoming: { icon: <Calendar className="h-20 w-20" />, text: t('noUpcomingBookings') },
        "In Progress": { icon: <Timer className="h-20 w-20" />, text: t('noJobsInProgress') },
        Completed: { icon: <CheckCircle2 className="h-20 w-20" />, text: t('noCompletedBookings') },
        Cancelled: { icon: <Ban className="h-20 w-20" />, text: t('noCancelledBookings') }
    };
    const clientAction = t('whyNotBookNewService');
    const providerAction = t('seeNewBookingRequests');
    
    const messageInfo = messages[status];

    if (!messageInfo) {
        return null; // or a default fallback
    }

    return (
        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center text-center p-12">
                <div className="mb-6 text-primary opacity-60">{messageInfo.icon}</div>
                <div className="space-y-3">
                    <h3 className="text-2xl font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{messageInfo.text}</h3>
                    <p className="text-lg text-muted-foreground max-w-md">{userRole === 'client' ? clientAction : providerAction}</p>
                </div>
                 {userRole === 'client' && (
                    <Button asChild className="mt-6 shadow-glow hover:shadow-glow/50 transition-all duration-300">
                        <Link href="/dashboard">{t('findAService')}</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}



export default function BookingsPage() {
    const { user, userRole } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const _t = useTranslations('Bookings');

    useEffect(() => {
        if (!user || !getDb()) {
            setLoading(false);
            return;
        };

        setLoading(true);
        const bookingsRef = collection(getDb(), "bookings");
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
    
    const [_activeTab, setActiveTab] = useState("pending-payment");
    const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "all">("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "price" | "status" | "service">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [showCompleted, setShowCompleted] = useState(true);

    const handleSort = (column: "date" | "price" | "status" | "service") => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        const validTabs = ["pending-payment", "pending-verification", "upcoming", "in-progress", "completed", "cancelled"];
        if (hash && validTabs.includes(hash)) {
            setActiveTab(hash);
        } else {
            setActiveTab("pending-payment");
        }
    }, []);

    // Calculate analytics data
    const analyticsData = useMemo(() => {
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((sum, booking) => sum + booking.price, 0);
        const completedBookings = bookings.filter(b => b.status === 'Completed').length;
        const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;
        const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
        const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
        
        const todayBookings = bookings.filter(b => {
            const today = new Date();
            const bookingDate = b.date.toDate();
            return bookingDate.toDateString() === today.toDateString();
        }).length;
        
        const thisWeekBookings = bookings.filter(b => {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const bookingDate = b.date.toDate();
            return bookingDate >= weekStart && bookingDate <= weekEnd;
        }).length;
        
        const categoryBreakdown = bookings.reduce((acc, booking) => {
            const category = booking.category || 'Other';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const statusBreakdown = bookings.reduce((acc, booking) => {
            acc[booking.status] = (acc[booking.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const monthlyGrowth = bookings.filter(b => {
            const thisMonth = new Date();
            const bookingMonth = b.date.toDate();
            return bookingMonth.getMonth() === thisMonth.getMonth() && 
                   bookingMonth.getFullYear() === thisMonth.getFullYear();
        }).length;

        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthBookings = bookings.filter(b => {
            const bookingDate = b.date.toDate();
            return bookingDate.getMonth() === lastMonth.getMonth() && 
                   bookingDate.getFullYear() === lastMonth.getFullYear();
        }).length;

        const growthRate = lastMonthBookings > 0 ? ((monthlyGrowth - lastMonthBookings) / lastMonthBookings) * 100 : 0;

        return {
            totalBookings,
            totalRevenue,
            completedBookings,
            cancelledBookings,
            completionRate,
            cancellationRate,
            todayBookings,
            thisWeekBookings,
            categoryBreakdown,
            statusBreakdown,
            monthlyGrowth,
            lastMonthBookings,
            growthRate
        };
    }, [bookings]);

    // Advanced filtering logic
    const filteredAndSortedBookings = useMemo(() => {
        let filtered = bookings;

        // Apply status filter
        if (selectedStatus !== "all") {
            filtered = filtered.filter(booking => booking.status === selectedStatus);
        }

        // Apply category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(booking => (booking.category || 'Other') === filterCategory);
        }

        // Apply priority filter
        if (filterPriority !== 'all') {
            filtered = filtered.filter(booking => (booking.priority || 'medium') === filterPriority);
        }

        // Apply date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(booking => {
                const bookingDate = booking.date.toDate();
                switch (dateFilter) {
                    case 'today':
                        return bookingDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return bookingDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return bookingDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(booking => 
                booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (booking.category && booking.category.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply completed filter
        if (!showCompleted) {
            filtered = filtered.filter(booking => booking.status !== 'Completed');
        }

        // Sort bookings
        return filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "date":
                    comparison = a.date.toMillis() - b.date.toMillis();
                    break;
                case "price":
                    comparison = a.price - b.price;
                    break;
                case "status":
                    comparison = a.status.localeCompare(b.status);
                    break;
                case "service":
                    comparison = a.serviceName.localeCompare(b.serviceName);
                    break;
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });
    }, [bookings, selectedStatus, filterCategory, filterPriority, dateFilter, searchTerm, showCompleted, sortBy, sortOrder]);

    const _statusCounts = {
        "Pending Payment": pendingPaymentBookings.length,
        "Pending Verification": pendingVerificationBookings.length,
        "Upcoming": upcomingBookings.length,
        "In Progress": inProgressBookings.length,
        "Completed": completedBookings.length,
        "Cancelled": cancelledBookings.length,
    };

    return (
        <div className="container space-y-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Bookings
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your bookings and track your service appointments
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Advanced Bookings
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Advanced Filter Controls */}
            <div className="max-w-6xl mx-auto">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Advanced Filters
                        </CardTitle>
                        <CardDescription>Customize your booking view with advanced filtering options</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-6">
                        <div className="space-y-2">
                            <Label htmlFor="search">Search Bookings</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by service, provider, or client..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={selectedStatus} onValueChange={(value: BookingStatus | "all") => setSelectedStatus(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                                    <SelectItem value="Pending Verification">Pending Verification</SelectItem>
                                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {Object.keys(analyticsData.categoryBreakdown).map(category => (
                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={filterPriority} onValueChange={setFilterPriority}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Date Range</Label>
                            <Select value={dateFilter} onValueChange={setDateFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select date range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="completed">Show Completed</Label>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="completed" 
                                    checked={showCompleted}
                                    onCheckedChange={setShowCompleted}
                                />
                                <Label htmlFor="completed" className="text-sm">
                                    {showCompleted ? 'Show' : 'Hide'}
                                </Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
                </Card>
            </div>

            {/* Bookings Table */}
            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                        <Skeleton className="h-6 w-20" />
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-12" />
                                        <Skeleton className="h-8 w-16" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : filteredAndSortedBookings.length > 0 ? (
                    <>
                        {/* Desktop Table View */}
                        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hidden lg:block">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead 
                                                    className="font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => handleSort("service")}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        Service & Contact
                                                        {sortBy === "service" && (
                                                            sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                                <TableHead 
                                                    className="font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => handleSort("date")}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        Date
                                                        {sortBy === "date" && (
                                                            sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                                <TableHead 
                                                    className="font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => handleSort("status")}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        Status
                                                        {sortBy === "status" && (
                                                            sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                                <TableHead 
                                                    className="font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => handleSort("price")}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        Price
                                                        {sortBy === "price" && (
                                                            sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                                <TableHead className="font-semibold">Category</TableHead>
                                                <TableHead className="font-semibold text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAndSortedBookings.map((booking: Booking) => (
                                                <BookingTableRow key={booking.id} booking={booking} userRole={userRole || 'client'} />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mobile Card View */}
                        <div className="space-y-4 lg:hidden">
                            {filteredAndSortedBookings.map((booking: Booking) => (
                                <BookingMobileCard key={booking.id} booking={booking} userRole={userRole || 'client'} />
                            ))}
                        </div>
                    </>
                ) : (
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                            <p className="text-muted-foreground">
                                {searchTerm || selectedStatus !== "all" 
                                    ? "Try adjusting your search or filter criteria."
                                    : "You don't have any bookings yet."
                                }
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

