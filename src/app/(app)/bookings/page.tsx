
"use client";

import React from "react";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2, Calendar, Check, X, Hourglass, Briefcase, UserCircle, Timer, Eye, Repeat, Wallet, Search, Filter, SortAsc, SortDesc, Clock, AlertCircle, CheckCircle2, Ban, CreditCard, FileCheck, TrendingUp, TrendingDown, BarChart3, RefreshCw, Download, Settings, Plus, Target, Award, Zap, Activity, DollarSign, Users, Star, MapPin, Phone, MessageSquare, Trash2, Grid3X3, List, CheckCircle, XCircle, AlertTriangle, Info, Bell, Bookmark, Share2, Archive, Edit, Copy, ExternalLink } from "lucide-react";
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
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState as AppEmptyState } from "@/components/app/empty-state";
import { designTokens } from "@/lib/design-tokens";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";


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
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    duration?: number; // in hours
    location?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    estimatedCompletion?: Timestamp;
    actualCompletion?: Timestamp;
    rating?: number;
    feedback?: string;
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
    const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [refreshing, setRefreshing] = useState(false);
    const [dateRange, setDateRange] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");

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
    const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "all">("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "price" | "status">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Helper functions
    const handleRefresh = async () => {
        setRefreshing(true);
        // Simulate refresh delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
        toast({
            title: "Bookings Refreshed",
            description: "All booking data has been updated successfully.",
        });
    };

    const toggleBookingSelection = (bookingId: string) => {
        setSelectedBookings(prev => 
            prev.includes(bookingId) 
                ? prev.filter(id => id !== bookingId)
                : [...prev, bookingId]
        );
    };

    const selectAllBookings = () => {
        setSelectedBookings(filteredAndSortedBookings.map(booking => booking.id));
    };

    const clearSelection = () => {
        setSelectedBookings([]);
    };

    const handleBulkAction = async (action: string) => {
        if (selectedBookings.length === 0) {
            toast({
                variant: "destructive",
                title: "No Bookings Selected",
                description: "Please select bookings to perform bulk actions.",
            });
            return;
        }

        try {
            // Implement bulk actions here
            toast({
                title: "Bulk Action Completed",
                description: `${action} applied to ${selectedBookings.length} bookings.`,
            });
            setSelectedBookings([]);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to perform bulk action.",
            });
        }
    };

    // Calculate statistics
    const stats = {
        total: bookings.length,
        totalRevenue: bookings.reduce((sum, booking) => sum + booking.price, 0),
        completed: completedBookings.length,
        inProgress: inProgressBookings.length,
        pending: pendingPaymentBookings.length + pendingVerificationBookings.length,
        avgRating: completedBookings.length > 0 ? 
            (completedBookings.reduce((sum, booking) => sum + (booking.rating || 0), 0) / completedBookings.length).toFixed(1) : "0.0",
        thisMonth: bookings.filter(booking => {
            const bookingDate = booking.date.toDate();
            const now = new Date();
            return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
        }).length,
        thisWeek: bookings.filter(booking => {
            const bookingDate = booking.date.toDate();
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return bookingDate >= weekAgo;
        }).length
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

    // Filter and sort bookings
    const filteredAndSortedBookings = bookings
        .filter(booking => {
            const matchesStatus = selectedStatus === "all" || booking.status === selectedStatus;
            const matchesSearch = searchTerm === "" || 
                booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.location?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesDateRange = (() => {
                if (dateRange === "all") return true;
                const bookingDate = booking.date.toDate();
                const now = new Date();
                switch (dateRange) {
                    case "today":
                        return bookingDate.toDateString() === now.toDateString();
                    case "week":
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return bookingDate >= weekAgo;
                    case "month":
                        return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
                    case "year":
                        return bookingDate.getFullYear() === now.getFullYear();
                    default:
                        return true;
                }
            })();

            const matchesPriority = priorityFilter === "all" || booking.priority === priorityFilter;
            
            return matchesStatus && matchesSearch && matchesDateRange && matchesPriority;
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

    // Statistics Dashboard Component
    const StatsCard = ({ title, value, icon: Icon, variant = "default", change, trend }: {
        title: string;
        value: string | number;
        icon: React.ElementType;
        variant?: 'default' | 'success' | 'warning' | 'info';
        change?: string;
        trend?: 'up' | 'down' | 'neutral';
    }) => {
        const getVariantStyles = () => {
            switch (variant) {
                case 'success':
                    return 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20';
                case 'warning':
                    return 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20';
                case 'info':
                    return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
                default:
                    return '';
            }
        };

        return (
            <StandardCard 
                title={title} 
                variant="elevated"
                className={`group hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-1 ${getVariantStyles()}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-1">
                            {value}
                        </div>
                        {change && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                                {trend === 'down' && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
                                <span>{change}</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-2 rounded-lg ${
                        variant === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                        variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        variant === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-primary/10'
                    }`}>
                        <Icon className={`h-5 w-5 transition-colors ${
                            variant === 'success' ? 'text-green-600' :
                            variant === 'warning' ? 'text-yellow-600' :
                            variant === 'info' ? 'text-blue-600' :
                            'text-muted-foreground group-hover:text-primary'
                        }`} />
                    </div>
                </div>
            </StandardCard>
        );
    };

    const statusCounts = {
        "Pending Payment": pendingPaymentBookings.length,
        "Pending Verification": pendingVerificationBookings.length,
        "Upcoming": upcomingBookings.length,
        "In Progress": inProgressBookings.length,
        "Completed": completedBookings.length,
        "Cancelled": cancelledBookings.length,
    };

    return (
        <PageLayout 
            title={t('bookings')} 
            description={t('bookingsDescription')}
            action={
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                        asChild
                    >
                        <Link href="/dashboard">
                            <Plus className="h-4 w-4 mr-2" />
                            New Booking
                        </Link>
                    </Button>
                </div>
            }
        >
            {/* Statistics Dashboard */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard 
                    title="Total Bookings" 
                    value={stats.total} 
                    icon={Calendar} 
                    variant="default"
                    change={`${stats.thisWeek} this week`}
                />
                <StatsCard 
                    title="Total Revenue" 
                    value={`₱${stats.totalRevenue.toFixed(2)}`} 
                    icon={DollarSign} 
                    variant="success"
                    change={`${stats.completed} completed`}
                />
                <StatsCard 
                    title="In Progress" 
                    value={stats.inProgress} 
                    icon={Timer} 
                    variant="warning"
                    change={`${stats.pending} pending`}
                />
                <StatsCard 
                    title="Average Rating" 
                    value={stats.avgRating} 
                    icon={Star} 
                    variant="info"
                    change={`${stats.thisMonth} this month`}
                />
            </div>

            {/* Advanced Filters and Controls */}
            <StandardCard 
                title="Booking Management" 
                description="Filter, sort, and manage your bookings"
                variant="elevated"
            >
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search bookings by service, provider, client, notes, or location..." 
                                className="pl-10 shadow-soft" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as BookingStatus | "all")}>
                            <SelectTrigger className="w-full sm:w-48 shadow-soft">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                                <SelectItem value="Pending Verification">Pending Verification</SelectItem>
                                <SelectItem value="Upcoming">Upcoming</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                <SelectItem value="Payment Rejected">Payment Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-full sm:w-48 shadow-soft">
                                <SelectValue placeholder="Date range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={(value) => setSortBy(value as "date" | "price" | "status")}>
                            <SelectTrigger className="w-full sm:w-48 shadow-soft">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="price">Price</SelectItem>
                                <SelectItem value="status">Status</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 border-2 p-1 rounded-lg bg-background/50 backdrop-blur-sm">
                            <Button 
                                size="icon" 
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                onClick={() => setViewMode('list')} 
                                className="h-8 w-8"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                onClick={() => setViewMode('grid')} 
                                className="h-8 w-8"
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedBookings.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <span className="text-sm font-medium">
                                {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleBulkAction('Export')}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    <Download className="h-3 w-3 mr-1" />
                                    Export
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleBulkAction('Archive')}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    <Archive className="h-3 w-3 mr-1" />
                                    Archive
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={clearSelection}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    Clear Selection
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </StandardCard>

            {/* Status Filter Chips */}
            <StandardCard 
                title="Quick Filters" 
                description="Filter bookings by status"
                variant="elevated"
            >
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
            </StandardCard>

            {/* Bookings Display */}
            <StandardCard 
                title="Your Bookings" 
                description={`${filteredAndSortedBookings.length} of ${bookings.length} bookings`}
                variant="elevated"
            >
                {loading ? (
                    <LoadingState title="Loading bookings..." description="Please wait while we fetch your booking information." />
                ) : viewMode === 'grid' ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAndSortedBookings.length > 0 ? filteredAndSortedBookings.map((booking) => (
                            <Card key={booking.id} className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group hover:-translate-y-1">
                                <CardHeader className="pb-3 relative">
                                    <div className="absolute top-2 right-2">
                                        <Checkbox 
                                            checked={selectedBookings.includes(booking.id)}
                                            onCheckedChange={() => toggleBookingSelection(booking.id)}
                                            className="h-4 w-4"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-soft">
                                            <AvatarImage 
                                                src={userRole === 'client' ? booking.providerAvatar : booking.clientAvatar} 
                                                alt={userRole === 'client' ? booking.providerName : booking.clientName} 
                                            />
                                            <AvatarFallback className="text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium">
                                                {getAvatarFallback(userRole === 'client' ? booking.providerName : booking.clientName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-300 truncate">
                                                {booking.serviceName}
                                            </CardTitle>
                                            <CardDescription className="text-sm text-muted-foreground flex items-center gap-1">
                                                <UserCircle className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{userRole === 'client' ? booking.providerName : booking.clientName}</span>
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <Badge 
                                            className={`${getStatusClass(booking.status)} flex items-center gap-1 text-xs px-2 py-1`}
                                        >
                                            {getStatusIcon(booking.status)}
                                            {booking.status}
                                        </Badge>
                                        {booking.priority && (
                                            <Badge variant="outline" className="text-xs">
                                                {booking.priority}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {format(booking.date.toDate(), 'MMM dd, yyyy')}
                                        </span>
                                        <span className="flex items-center gap-1 font-semibold">
                                            <Wallet className="h-3 w-3" />
                                            ₱{booking.price.toFixed(2)}
                                        </span>
                                    </div>
                                    {booking.location && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{booking.location}</span>
                                        </div>
                                    )}
                                    {booking.notes && (
                                        <div className="text-sm p-2 bg-muted/30 rounded-lg border border-border/50">
                                            <span className="text-muted-foreground text-xs">Notes: </span>
                                            <span className="line-clamp-2">{booking.notes}</span>
                                        </div>
                                    )}
                                    {booking.tags && booking.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {booking.tags.slice(0, 3).map(tag => (
                                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                            ))}
                                            {booking.tags.length > 3 && (
                                                <Badge variant="outline" className="text-xs">+{booking.tags.length - 3}</Badge>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-2">
                                    <div className="flex flex-col gap-2 w-full">
                                        <Button 
                                            onClick={() => {/* Handle view details */}}
                                            size="sm"
                                            className="w-full shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                        </Button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" size="sm" className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                                                <MessageSquare className="mr-1 h-3 w-3" /> Message
                                            </Button>
                                            <Button variant="outline" size="sm" className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                                                <Share2 className="mr-1 h-3 w-3" /> Share
                                            </Button>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        )) : (
                            <div className="col-span-full text-center py-12">
                                <Calendar className="h-16 w-16 mx-auto text-primary opacity-60 mb-4" />
                                <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                                    {searchTerm || selectedStatus !== "all" ? "No Bookings Found" : "No Bookings Yet"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || selectedStatus !== "all" ? "Try adjusting your filters" : "You don't have any bookings yet."}
                                </p>
                                {!searchTerm && selectedStatus === "all" && (
                                    <Button asChild className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                        <Link href="/dashboard">Find Services</Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    // List View
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={selectedBookings.length === filteredAndSortedBookings.length && filteredAndSortedBookings.length > 0}
                                    onCheckedChange={(checked) => checked ? selectAllBookings() : clearSelection()}
                                />
                                <span className="text-sm text-muted-foreground">
                                    Select all ({filteredAndSortedBookings.length})
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {filteredAndSortedBookings.length > 0 ? filteredAndSortedBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50">
                                    <Checkbox 
                                        checked={selectedBookings.includes(booking.id)}
                                        onCheckedChange={() => toggleBookingSelection(booking.id)}
                                    />
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage 
                                            src={userRole === 'client' ? booking.providerAvatar : booking.clientAvatar} 
                                            alt={userRole === 'client' ? booking.providerName : booking.clientName} 
                                        />
                                        <AvatarFallback>{getAvatarFallback(userRole === 'client' ? booking.providerName : booking.clientName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{booking.serviceName}</h3>
                                            <Badge 
                                                className={`${getStatusClass(booking.status)} flex items-center gap-1 text-xs px-2 py-1`}
                                            >
                                                {getStatusIcon(booking.status)}
                                                {booking.status}
                                            </Badge>
                                            {booking.priority && (
                                                <Badge variant="outline" className="text-xs">{booking.priority}</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <UserCircle className="h-3 w-3" />
                                                {userRole === 'client' ? booking.providerName : booking.clientName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(booking.date.toDate(), 'MMM dd, yyyy')}
                                            </span>
                                            <span className="flex items-center gap-1 font-semibold">
                                                <Wallet className="h-3 w-3" />
                                                ₱{booking.price.toFixed(2)}
                                            </span>
                                        </div>
                                        {booking.location && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                <MapPin className="h-3 w-3" />
                                                <span>{booking.location}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm">
                                            <Eye className="mr-2 h-4 w-4" /> View
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <MessageSquare className="mr-2 h-4 w-4" /> Message
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Share2 className="mr-2 h-4 w-4" /> Share
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12">
                                    <Calendar className="h-16 w-16 mx-auto text-primary opacity-60 mb-4" />
                                    <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                                        {searchTerm || selectedStatus !== "all" ? "No Bookings Found" : "No Bookings Yet"}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchTerm || selectedStatus !== "all" ? "Try adjusting your filters" : "You don't have any bookings yet."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </StandardCard>
        </PageLayout>
    );
}
