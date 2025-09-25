
"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2, Calendar, Check, X, Hourglass, Briefcase, UserCircle, Timer, Eye, Repeat, Wallet, Search, Filter, SortAsc, SortDesc, Clock, AlertCircle, CheckCircle2, Ban, CreditCard, FileCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { format } from 'date-fns';


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

const BookingCard = ({ booking, userRole }: { booking: Booking; userRole: string | null }) => {
    const { toast } = useToast();
    const t = useTranslations('Bookings');
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
        try {
            const bookingRef = doc(db, "bookings", booking.id);
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
            <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
                <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-soft">
                            <AvatarImage 
                                src={userRole === 'client' ? booking.providerAvatar : booking.clientAvatar} 
                                alt={userRole === 'client' ? booking.providerName : booking.clientName} 
                            />
                            <AvatarFallback className="text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium">
                                {getAvatarFallback(userRole === 'client' ? booking.providerName : booking.clientName)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-300 truncate">
                                        {booking.serviceName}
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                        <UserCircle className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{userRole === 'client' ? booking.providerName : booking.clientName}</span>
                                    </CardDescription>
                                </div>
                                <Badge 
                                    className={`${getStatusClass(booking.status)} flex items-center gap-1 text-xs px-2 py-1 ml-2`}
                                >
                                    {getStatusIcon(booking.status)}
                                    {booking.status}
                                </Badge>
                            </div>

                            {/* Details Row */}
                            <div className="flex items-center justify-between mt-3 text-sm">
                                <div className="flex items-center gap-4 text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(booking.date.toDate(), 'MMM dd, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Wallet className="h-3 w-3" />
                                        ₱{booking.price.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        onClick={() => handleViewDetails(booking)}
                                        size="sm"
                                        className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                                            <DropdownMenuLabel className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-border/50" />
                                            
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

                            {/* Notes Section */}
                            {booking.notes && (
                                <div className="mt-3 text-sm p-2 bg-muted/30 rounded-lg border border-border/50">
                                    <span className="text-muted-foreground text-xs">Notes: </span>
                                    <span className="line-clamp-1">{booking.notes}</span>
                                </div>
                            )}

                            {/* Quick Action Buttons */}
                            <div className="mt-3 flex gap-2">
                                
                                {booking.status === "In Progress" && userRole === "provider" && (
                                    <Button asChild size="sm" className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">
                                        <Link href={`/bookings/${booking.id}/work-log`}>
                                            <Timer className="h-4 w-4 mr-2" />
                                            View Work Log
                                        </Link>
                                    </Button>
                                )}
                                
                                {booking.status === "Completed" && !booking.reviewId && userRole === "client" && (
                                    <Button 
                                        onClick={() => handleOpenReview(booking)}
                                        size="sm"
                                        className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Leave Review
                                    </Button>
                                )}
                            </div>
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

const EmptyState = ({ status, userRole }: { status: string, userRole: string | null }) => {
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
    const t = useTranslations('Bookings');

    useEffect(() => {
        if (!user || !db) {
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
    const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "all">("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "price" | "status">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        const validTabs = ["pending-payment", "pending-verification", "upcoming", "in-progress", "completed", "cancelled"];
        if (hash && validTabs.includes(hash)) {
            setActiveTab(hash);
        } else {
            setActiveTab("pending-payment");
        }
    }, []);

    // Filter and sort bookings
    const filteredAndSortedBookings = bookings
        .filter(booking => {
            const matchesStatus = selectedStatus === "all" || booking.status === selectedStatus;
            const matchesSearch = searchTerm === "" || 
                booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.clientName.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => {
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
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

    const statusCounts = {
        "Pending Payment": pendingPaymentBookings.length,
        "Pending Verification": pendingVerificationBookings.length,
        "Upcoming": upcomingBookings.length,
        "In Progress": inProgressBookings.length,
        "Completed": completedBookings.length,
        "Cancelled": cancelledBookings.length,
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* Search and Sort Controls */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search bookings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-background/80 backdrop-blur-sm border-2 focus:border-primary transition-colors shadow-soft"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                                <Filter className="h-4 w-4 mr-2" />
                                Sort by {sortBy}
                                {sortOrder === "asc" ? <SortAsc className="h-4 w-4 ml-2" /> : <SortDesc className="h-4 w-4 ml-2" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                            <DropdownMenuLabel className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Sort by</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem onClick={() => setSortBy("date")}>
                                Date
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy("price")}>
                                Price
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy("status")}>
                                Status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                                {sortOrder === "asc" ? "Descending" : "Ascending"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={selectedStatus === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus("all")}
                    className="transition-all duration-300"
                >
                    All ({bookings.length})
                </Button>
                {Object.entries(statusCounts).map(([status, count]) => (
                    <Button
                        key={status}
                        variant={selectedStatus === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedStatus(status as BookingStatus)}
                        className="transition-all duration-300"
                    >
                        {status} ({count})
                    </Button>
                ))}
            </div>

            {/* Bookings List */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredAndSortedBookings.length > 0 ? (
                <div className="space-y-4">
                    {filteredAndSortedBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} userRole={userRole || 'client'} />
                    ))}
                </div>
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
    );
}
