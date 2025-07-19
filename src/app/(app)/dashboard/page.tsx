
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Calendar, Star, Users, Loader2, Search } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

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
    providerId: string;
    clientName: string;
    rating: number;
    comment: string;
    clientAvatar: string;
};

type Provider = {
    uid: string;
    displayName: string;
    bio?: string;
    photoURL?: string;
    rating: number;
    reviewCount: number;
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

const ProviderCard = ({ provider }: { provider: Provider }) => {
    const getAvatarFallback = (name: string | null | undefined) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1 && parts[0] && parts[1]) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <Card className="transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <CardContent className="p-6 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary">
                    <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                    <AvatarFallback className="text-3xl">{getAvatarFallback(provider.displayName)}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold">{provider.displayName}</h3>
                {provider.reviewCount > 0 && (
                     <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                        {renderStars(provider.rating)}
                        <span className="text-sm">({provider.reviewCount})</span>
                    </div>
                )}
                <p className="text-sm text-muted-foreground mt-2 h-10 line-clamp-2">{provider.bio || 'No bio available.'}</p>
            </CardContent>
            <CardFooter>
                 <Button className="w-full">View Profile</Button>
            </CardFooter>
        </Card>
    );
};


export default function DashboardPage() {
    const { user, userRole } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    
    // For client dashboard
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");


    // Fetch data for provider dashboard
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

    // Fetch data for client dashboard
    useEffect(() => {
        if (userRole && userRole !== 'provider') {
            const fetchProviders = async () => {
                setLoadingProviders(true);
                try {
                    // Fetch all reviews first to calculate ratings
                    const reviewsSnapshot = await getDocs(collection(db, "reviews"));
                    const allReviews = reviewsSnapshot.docs.map(doc => doc.data() as Review);
                    
                    const providerRatings: { [key: string]: { totalRating: number, count: number } } = {};
                    allReviews.forEach(review => {
                        if (!providerRatings[review.providerId]) {
                            providerRatings[review.providerId] = { totalRating: 0, count: 0 };
                        }
                        providerRatings[review.providerId].totalRating += review.rating;
                        providerRatings[review.providerId].count++;
                    });

                    // Fetch all providers
                    const q = query(collection(db, "users"), where("role", "in", ["provider", "agency"]));
                    const querySnapshot = await getDocs(q);
                    const providersData = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        const ratingInfo = providerRatings[data.uid];
                        return {
                            uid: data.uid,
                            displayName: data.displayName || 'Unnamed Provider',
                            bio: data.bio,
                            photoURL: data.photoURL,
                            rating: ratingInfo ? ratingInfo.totalRating / ratingInfo.count : 0,
                            reviewCount: ratingInfo ? ratingInfo.count : 0,
                        } as Provider;
                    });
                    setProviders(providersData);
                } catch (error) {
                    console.error("Error fetching providers: ", error);
                } finally {
                    setLoadingProviders(false);
                }
            };
            fetchProviders();
        }
    }, [userRole]);

    // Derived stats for provider
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

    // Filter providers for client view
    const filteredProviders = useMemo(() => 
        providers.filter(provider => 
            provider.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        ), [providers, searchTerm]);


    // If user is a client or agency
    if (userRole && userRole !== 'provider') {
        return (
             <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Find a Service Provider</h1>
                    <p className="text-muted-foreground">Browse our network of trusted professionals.</p>
                </div>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by provider name..." 
                        className="w-full max-w-lg pl-10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {loadingProviders ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                         {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredProviders.length > 0 ? (
                            filteredProviders.map(provider => (
                                <ProviderCard key={provider.uid} provider={provider} />
                            ))
                        ) : (
                             <div className="lg:col-span-3 text-center text-muted-foreground p-12">
                                <Users className="h-16 w-16 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold">No Providers Found</h3>
                                <p>No providers match your search term. Try another search.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }
    
    // Provider Dashboard
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

    