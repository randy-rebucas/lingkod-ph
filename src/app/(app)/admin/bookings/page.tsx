
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, User, CircleSlash, Trash2 } from "lucide-react";
import { BookingDetailsDialog } from "@/components/booking-details-dialog";
import type { Booking as BookingType } from "@/app/(app)/bookings/page";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { handleUpdateBookingStatus } from "./actions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { AccessDenied } from "@/components/app/access-denied";
import { designTokens } from "@/lib/design-tokens";

const getStatusVariant = (status: string) => {
    switch (status) {
        case "Upcoming": return "default";
        case "In Progress": return "secondary";
        case "Completed": return "secondary";
        case "Cancelled": return "destructive";
        case "Pending": return "outline";
        default: return "outline";
    }
}


export default function AdminBookingsPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<BookingType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

     useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const bookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookingType));
            setBookings(bookingsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);

    const handleViewDetails = (booking: BookingType) => {
        setSelectedBooking(booking);
        setIsDetailsOpen(true);
    };

    const onUpdateStatus = async (bookingId: string, status: string) => {
        if (!user) return;
        const result = await handleUpdateBookingStatus(bookingId, status, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    };

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
                    <h1 className="text-3xl font-bold font-headline">Booking Management</h1>
                    <p className="text-muted-foreground">
                        Monitor all bookings on the platform.
                    </p>
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
                <h1 className="text-3xl font-bold font-headline">Booking Management</h1>
                <p className="text-muted-foreground">
                    Monitor all bookings on the platform.
                </p>
            </div>
             <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.length > 0 ? bookings.map(booking => (
                                <TableRow key={booking.id}>
                                     <TableCell className="text-xs text-muted-foreground">
                                        {booking.date ? format(booking.date.toDate(), 'PP') : 'N/A'}
                                    </TableCell>
                                    <TableCell className="font-medium">{booking.serviceName}</TableCell>
                                    <TableCell>{booking.clientName}</TableCell>
                                    <TableCell>{booking.providerName}</TableCell>
                                    <TableCell>₱{booking.price.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleViewDetails(booking)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => onUpdateStatus(booking.id, "Completed")} disabled={booking.status === 'Completed'}>Mark as Completed</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onUpdateStatus(booking.id, "Cancelled")} disabled={booking.status === 'Cancelled'}>Mark as Cancelled</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild><Link href={`/admin/users?search=${booking.clientId}`}><User className="mr-2 h-4 w-4" />View Client</Link></DropdownMenuItem>
                                                    <DropdownMenuItem asChild><Link href={`/admin/users?search=${booking.providerId}`}><User className="mr-2 h-4 w-4" />View Provider</Link></DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        No bookings found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {selectedBooking && <BookingDetailsDialog isOpen={isDetailsOpen} setIsOpen={setIsDetailsOpen} booking={selectedBooking} />}
        </div>
    )
}
