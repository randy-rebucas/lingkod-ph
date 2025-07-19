
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const bookings = [
    {
        id: "BK001",
        service: "Deep House Cleaning",
        user: "Maria Dela Cruz",
        date: "2024-08-15",
        time: "10:00 AM",
        status: "Upcoming",
        price: 2500,
    },
    {
        id: "BK002",
        service: "Plumbing Repair",
        user: "Jose Rizal",
        date: "2024-08-10",
        time: "02:30 PM",
        status: "Completed",
        price: 1800,
    },
    {
        id: "BK003",
        service: "Garden Maintenance",
        user: "Andres Bonifacio",
        date: "2024-08-12",
        time: "09:00 AM",
        status: "Completed",
        price: 1200,
    },
    {
        id: "BK004",
        service: "Aircon Cleaning",
        user: "Gabriela Silang",
        date: "2024-08-20",
        time: "01:00 PM",
        status: "Upcoming",
        price: 1500,
    },
    {
        id: "BK005",
        service: "Haircut and Color",
        user: "Apolinario Mabini",
        date: "2024-08-05",
        time: "04:00 PM",
        status: "Cancelled",
        price: 3000,
    },
     {
        id: "BK006",
        service: "Laptop Repair",
        user: "Melchora Aquino",
        date: "2024-08-22",
        time: "11:00 AM",
        status: "Upcoming",
        price: 2000,
    },
     {
        id: "BK007",
        service: "Manicure & Pedicure",
        user: "Emilio Aguinaldo",
        date: "2024-07-28",
        time: "03:00 PM",
        status: "Completed",
        price: 800,
    },
];

const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case "upcoming":
            return "default";
        case "completed":
            return "secondary";
        case "cancelled":
            return "destructive";
        default:
            return "outline";
    }
}

const BookingTable = ({ bookings: bookingList }: { bookings: typeof bookings }) => {
    const { toast } = useToast();

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
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookingList.length > 0 ? bookingList.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell>
                                    <div className="font-medium">{booking.service}</div>
                                    <div className="text-sm text-muted-foreground md:hidden">{booking.user} - {booking.date}</div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{booking.user}</TableCell>
                                <TableCell className="hidden md:table-cell">{new Date(booking.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
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
                                                <DropdownMenuItem onClick={() => toast({ title: "Navigating...", description: `Viewing details for booking ${booking.id}` })}>View Details</DropdownMenuItem>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem disabled={booking.status !== 'Upcoming'}>Reschedule</DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                 <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem disabled={booking.status !== 'Upcoming'} className="text-destructive">Cancel</DropdownMenuItem>
                                                 </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* This is a shared dialog for both Reschedule and Cancel to simplify */}
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   This action cannot be undone. This will permanently alter the booking details.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Close</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => toast({ title: 'Action Confirmed', description: 'The booking has been updated.' })}>
                                                    Confirm
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                     </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )) : (
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
    );
};


export default function BookingsPage() {
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
            
            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-4">
                     <BookingTable bookings={upcomingBookings} />
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                    <BookingTable bookings={completedBookings} />
                </TabsContent>
                <TabsContent value="cancelled" className="mt-4">
                   <BookingTable bookings={cancelledBookings} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
