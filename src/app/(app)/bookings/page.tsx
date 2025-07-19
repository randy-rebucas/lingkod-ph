import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";

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

export default function BookingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Bookings</h1>
                <p className="text-muted-foreground">
                    View and manage all your scheduled services here.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Booking History</CardTitle>
                    <CardDescription>A list of all your recent and upcoming bookings.</CardDescription>
                </CardHeader>
                <CardContent>
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
                            {bookings.map((booking) => (
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
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Reschedule</DropdownMenuItem>
                                                <DropdownMenuItem>Cancel</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
