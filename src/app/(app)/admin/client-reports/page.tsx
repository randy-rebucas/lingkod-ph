
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star, Users } from 'lucide-react';
import type { User } from '@/app/(app)/admin/users/page';
import { PageLayout } from '@/components/app/page-layout';
import { StandardCard } from '@/components/app/standard-card';
import { LoadingState } from '@/components/app/loading-state';
import { EmptyState } from '@/components/app/empty-state';
import { AccessDenied } from '@/components/app/access-denied';
import { designTokens } from '@/lib/design-tokens';

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
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
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
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Fetch all clients
                const clientsQuery = query(collection(db, "users"), where("role", "==", "client"));
                const clientsSnap = await getDocs(clientsQuery);
                setClients(clientsSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));

                // Fetch all completed bookings
                const bookingsQuery = query(collection(db, "bookings"), where("status", "==", "Completed"));
                const bookingsSnap = await getDocs(bookingsQuery);
                setBookings(bookingsSnap.docs.map(doc => doc.data() as Booking));
                
                // Fetch all reviews
                const reviewsSnap = await getDocs(collection(db, "reviews"));
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
        return <AccessDenied 
            title="Access Denied" 
            description="This page is for administrators only." 
        />;
    }
    
    if (loading) {
        return <LoadingState 
            title="Client Reports" 
            description="Analyze client usage and satisfaction." 
        />;
    }

    if (clientReports.length === 0) {
        return (
            <PageLayout 
                title="Client Reports" 
                description="Analyze client usage, spending habits, and satisfaction scores."
            >
                <EmptyState 
                    title="No Client Data" 
                    description="No client reports available to display. Client data will appear here once users start making bookings and leaving reviews."
                    icon={Users}
                />
            </PageLayout>
        );
    }

    return (
        <PageLayout 
            title="Client Reports" 
            description="Analyze client usage, spending habits, and satisfaction scores."
        >
             <Card>
                 <CardHeader>
                    <CardTitle>Client Usage Overview</CardTitle>
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
                            {clientReports.map(report => (
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
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </PageLayout>
    )
}
