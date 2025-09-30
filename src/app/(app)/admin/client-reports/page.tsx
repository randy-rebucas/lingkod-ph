
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { getDb  } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import type { User } from '@/app/(app)/admin/users/page';

type Booking = {
    id: string;
    clientId: string;
    status: "Completed";
    price: number;
};

type Review = {
    id: string;
    clientId: string;
    rating: number;
};

type ClientReport = {
    user: User;
    completedBookings: number;
    totalSpent: number;
    averageRating: number;
};

const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const _emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
        <div className="flex items-center gap-1">
            {[...Array(fullStars)].map((_, i) => (
                 <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            ))}
            {/* Simple version without half-star for now */}
            {[...Array(5-fullStars)].map((_, i) => (
                 <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({rating.toFixed(1)})</span>
        </div>
    )
}

export default function ClientReportsPage() {
    const { userRole } = useAuth();
    const [clients, setClients] = useState<User[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userRole !== 'admin' || !getDb()) {
            setLoading(false);
            return;
        }

        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Fetch all clients
                const clientsQuery = query(collection(getDb(), "users"), where("role", "==", "client"));
                const clientsSnap = await getDocs(clientsQuery);
                setClients(clientsSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));

                // Fetch all completed bookings
                const bookingsQuery = query(collection(getDb(), "bookings"), where("status", "==", "Completed"));
                const bookingsSnap = await getDocs(bookingsQuery);
                setBookings(bookingsSnap.docs.map(doc => doc.data() as Booking));
                
                // Fetch all reviews
                const reviewsSnap = await getDocs(collection(getDb(), "reviews"));
                setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));

            } catch (error) {
                console.error("Error fetching client report data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [userRole]);

    const clientReports: ClientReport[] = useMemo(() => {
        return clients.map(client => {
            const clientBookings = bookings.filter(b => b.clientId === client.uid);
            const clientReviews = reviews.filter(r => r.clientId === client.uid);

            const totalSpent = clientBookings.reduce((sum, b) => sum + b.price, 0);
            const averageRating = clientReviews.length > 0
                ? clientReviews.reduce((sum, r) => sum + r.rating, 0) / clientReviews.length
                : 0;

            return {
                user: client,
                completedBookings: clientBookings.length,
                totalSpent,
                averageRating
            };
        }).sort((a,b) => b.totalSpent - a.totalSpent); // Sort by total spent
    }, [clients, bookings, reviews]);

    if (userRole !== 'admin') {
        return (
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
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
                 <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Client Reports</h1>
                    <p className="text-muted-foreground">Analyze client usage and satisfaction.</p>
                </div>
                <div className="max-w-6xl mx-auto">
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
        <div className="container space-y-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Client Reports</h1>
                <p className="text-muted-foreground">
                    Analyze client usage, spending habits, and satisfaction scores.
                </p>
            </div>
            <div className="max-w-6xl mx-auto">
                 <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                     <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Client Usage Overview</CardTitle>
                        <CardDescription>All clients on the platform, sorted by total amount spent.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Completed Bookings</TableHead>
                                    <TableHead>Total Spent</TableHead>
                                    <TableHead>Avg. Rating Given</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientReports.length > 0 ? clientReports.map(report => (
                                    <TableRow key={report.user.uid}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={report.user.photoURL} />
                                                    <AvatarFallback>{getAvatarFallback(report.user.displayName)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{report.user.displayName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{report.completedBookings}</TableCell>
                                        <TableCell>₱{report.totalSpent.toFixed(2)}</TableCell>
                                        <TableCell>
                                            {report.averageRating > 0 ? renderStars(report.averageRating) : <span className="text-muted-foreground text-xs">No ratings yet</span>}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            No client data to display.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
