
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Calendar, Star, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type Booking = {
    id: string;
    clientId: string;
    clientName: string;
    serviceName: string;
    status: "Upcoming" | "Completed" | "Cancelled";
    price: number;
    date: Timestamp;
};

type Review = {
    id: string;
    clientName: string;
    rating: number;
    comment: string;
    clientAvatar: string;
};

const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case "upcoming": return "default";
        case "completed": return "secondary";
        default: return "outline";
    }
}

const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
    ));
}

const DashboardCard = ({ title, icon: Icon, value, change, isLoading }: { title: string, icon: React.ElementType, value: string, change?: string, isLoading: boolean }) => {
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </CardContent>
            </Card>
        );
    }
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change && <p className="text-xs text-muted-foreground">{change}</p>}
            </CardContent>
        </Card>
    )
}

// Function to process bookings for the earnings chart
const processEarningsData = (bookings: Booking[]) => {
    const monthlyEarnings: { [key: string]: number } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    bookings.forEach(booking => {
        if (booking.status === 'Completed') {
            const date = booking.date.toDate();
            const month = date.getMonth();
            const year = date.getFullYear();
            // Using a "YYYY-MM" key to handle data spanning multiple years
            const key = `${year}-${month}`;

            if (!monthlyEarnings[key]) {
                monthlyEarnings[key] = 0;
            }
            monthlyEarnings[key] += booking.price;
        }
    });

    // Get the last 6 months including the current one
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const chartData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(sixMonthsAgo);
        date.setMonth(date.getMonth() + i);
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month}`;
        
        return {
            month: monthNames[month],
            earnings: monthlyEarnings[key] || 0,
        };
    });

    return chartData;
}


export default function DashboardPage() {
    const { user, userRole } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || userRole !== 'provider') {
            setLoading(false);
            return;
        }

        const bookingsQuery = query(
            collection(db, "bookings"),
            where("providerId", "==", user.uid),
            orderBy("date", "desc")
        );

        const reviewsQuery = query(
            collection(db, "reviews"),
            where("providerId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(5)
        );

        const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
            setBookings(bookingsData);
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setLoading(false);
        });

        const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
            setReviews(reviewsData);
        });

        return () => {
            unsubscribeBookings();
            unsubscribeReviews();
        };

    }, [user, userRole]);

    // Derived stats
    const totalRevenue = bookings
        .filter(b => b.status === 'Completed')
        .reduce((sum, b) => sum + b.price, 0);

    const upcomingBookingsCount = bookings.filter(b => b.status === 'Upcoming').length;

    const uniqueClientIds = new Set(bookings.map(b => b.clientId));
    const totalClientsCount = uniqueClientIds.size;
    
    const overallRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "N/A";
        
    const recentBookings = bookings.slice(0, 3);
    const earningsData = processEarningsData(bookings);

    // If user is not a provider, show a different view
    if (userRole && userRole !== 'provider') {
        return (
             <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Welcome back, {user?.displayName || 'User'}!</h1>
                    <p className="text-muted-foreground">Manage your account from here.</p>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Dashboard</CardTitle>
                        <CardDescription>Your personal dashboard is coming soon. For now, you can manage your bookings and profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <Users className="h-16 w-16 mb-4" />
                        <p>Use the sidebar to navigate to your bookings or update your profile.</p>
                         <div className="flex gap-4 mt-6">
                            <Button asChild><a href="/bookings">View Bookings</a></Button>
                            <Button variant="outline" asChild><a href="/profile">My Profile</a></Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }
    

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Welcome back, {user?.displayName || 'User'}!</h1>
                <p className="text-muted-foreground">Here&apos;s a summary of your activity and performance.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <DashboardCard isLoading={loading} title="Total Revenue" icon={DollarSign} value={`₱${totalRevenue.toFixed(2)}`} />
                <DashboardCard isLoading={loading} title="Upcoming Bookings" icon={Calendar} value={`${upcomingBookingsCount}`} />
                <DashboardCard isLoading={loading} title="Total Clients" icon={Users} value={`${totalClientsCount}`} />
                <DashboardCard isLoading={loading} title="Overall Rating" icon={Star} value={`${overallRating}`} change={`Based on ${reviews.length} reviews`} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Earnings Overview</CardTitle>
                        <CardDescription>Your earnings for the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {loading ? (
                             <div className="flex items-center justify-center h-[300px]">
                                <Skeleton className="w-full h-full" />
                            </div>
                        ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={earningsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value >= 1000 ? `${value/1000}k` : value}`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "var(--radius)"
                                    }}
                                    cursor={{ fill: 'hsl(var(--secondary))' }}
                                />
                                <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Bookings</CardTitle>
                        <CardDescription>A list of your most recent bookings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentBookings.length > 0 ? recentBookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-medium">{booking.clientName}</TableCell>
                                        <TableCell>{booking.serviceName}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">No recent bookings.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Reviews</CardTitle>
                    <CardDescription>What your clients are saying about you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     {loading ? (
                        <div className="space-y-6">
                           {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-5 w-24" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            </div>
                           ))}
                        </div>
                    ) : reviews.length > 0 ? (
                        reviews.map((review) => (
                            <div key={review.id} className="flex items-start gap-4">
                                <Avatar>
                                    <AvatarImage src={review.clientAvatar} alt={review.clientName} />
                                    <AvatarFallback>{review.clientName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{review.clientName}</p>
                                        <div className="flex items-center gap-1">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground p-8">
                            No reviews yet.
                        </div>
                    )}
                    <div className="text-center">
                        <Button variant="outline">View All Reviews</Button>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
