
"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, or } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingDetailsDialog } from "@/components/booking-details-dialog";

type BookingStatus = "Pending" | "Upcoming" | "Completed" | "Cancelled";

export type Booking = {
    id: string;
    serviceName: string;
    serviceId: string;
    clientName: string;
    providerName: string;
    clientId: string;
    providerId: string;
    date: Timestamp;
    status: BookingStatus;
    price: number;
    notes?: string;
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

const BookingTable = ({ bookings: bookingList, isLoading, userRole }: { bookings: Booking[], isLoading: boolean, userRole: string | null }) => {
    const { toast } = useToast();
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus, successMessage?: string) => {
        const bookingRef = doc(db, "bookings", bookingId);
        try {
            await updateDoc(bookingRef, { status: newStatus });
            toast({
                title: "Booking Updated",
                description: successMessage || `The booking has been successfully updated to ${newStatus.toLowerCase()}.`,
            });
        } catch (error) {
            console.error("Error updating booking status:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update the booking status.",
            });
        }
    };

    const handleViewDetails = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDetailsOpen(true);
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead className="hidden md:table-cell">Client/Provider</TableHead>
                                <TableHead className="hidden md:table-cell">Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead className="hidden md:table-cell">{userRole === 'client' ? 'Provider' : 'Client'}</TableHead>
                                <TableHead className="hidden md:table-cell">Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookingList.length > 0 ? bookingList.map((booking) => {
                                const displayName = userRole === 'client' ? booking.providerName : booking.clientName;
                                const displayDate = booking.date.toDate();
                                return (
                                    <TableRow key={booking.id}>
                                        <TableCell>
                                            <div className="font-medium">{booking.serviceName}</div>
                                            <div className="text-sm text-muted-foreground md:hidden">{displayName} - {displayDate.toLocaleDateString()}</div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{displayName}</TableCell>
                                        <TableCell className="hidden md:table-cell">{displayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">₱{booking.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleViewDetails(booking)}>View Details</DropdownMenuItem>
                                                        
                                                        <DropdownMenuSeparator />

                                                        {/* Provider Actions */}
                                                        {userRole === 'provider' && booking.status === 'Pending' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'Upcoming', 'Booking has been accepted.')}>Accept</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'Cancelled', 'Booking has been declined.')} className="text-destructive focus:text-destructive focus:bg-destructive/10">Decline</DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {userRole === 'provider' && booking.status === 'Upcoming' && (
                                                            <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'Completed')}>Mark as Completed</DropdownMenuItem>
                                                        )}

                                                        {/* Client Actions */}
                                                        {userRole === 'client' && (booking.status === 'Pending' || booking.status === 'Upcoming') && (
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Cancel Booking</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                {/* Cancellation Dialog for Client */}
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will cancel your booking.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Close</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive hover:bg-destructive/90"
                                                            onClick={() => handleStatusUpdate(booking.id, "Cancelled")}>
                                                            Confirm Cancellation
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No bookings found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {selectedBooking && <BookingDetailsDialog isOpen={isDetailsOpen} setIsOpen={setIsDetailsOpen} booking={selectedBooking} />}
        </>
    );
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
        // Firestore doesn't support OR queries on different fields like this easily,
        // so we create a query that checks if the user's ID is in either the clientId or providerId field.
        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, 
            or(where("clientId", "==", user.uid), where("providerId", "==", user.uid))
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const bookingsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Booking));
            setBookings(bookingsData.sort((a,b) => b.date.toMillis() - a.date.toMillis())); // Sort by most recent
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Bookings</h1>
                <p className="text-muted-foreground">
                    View and manage all your scheduled services here.
                </p>
            </div>
            
            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                     <BookingTable bookings={pendingBookings} isLoading={loading} userRole={userRole} />
                </TabsContent>
                <TabsContent value="upcoming" className="mt-4">
                     <BookingTable bookings={upcomingBookings} isLoading={loading} userRole={userRole} />
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                    <BookingTable bookings={completedBookings} isLoading={loading} userRole={userRole} />
                </TabsContent>
                <TabsContent value="cancelled" className="mt-4">
                   <BookingTable bookings={cancelledBookings} isLoading={loading} userRole={userRole} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
