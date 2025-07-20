
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { DollarSign, Calendar, Star, Users, Loader2, Search, MapPin, Briefcase, Users2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp, getDocs, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

type Booking = {
    id: string;
    clientId: string;
    clientName: string;
    providerId: string;
    providerName: string;
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
    availabilityStatus?: 'available' | 'limited' | 'unavailable';
    keyServices?: string[];
    address?: string;
    totalRevenue?: number;
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

const getAvailabilityBadge = (status: Provider['availabilityStatus']) => {
    switch (status) {
        case 'available':
            return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Available</Badge>;
        case 'limited':
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Limited</Badge>;
        case 'unavailable':
            return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Unavailable</Badge>;
        default:
            return null;
    }
}

const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const ProviderCard = ({ provider }: { provider: Provider }) => {
    return (
        <Card className="transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col">
            <CardHeader className="text-center">
                 <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary">
                    <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                    <AvatarFallback className="text-3xl">{getAvatarFallback(provider.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center gap-2">
                    <h3 className="text-xl font-bold">{provider.displayName}</h3>
                     {provider.availabilityStatus && getAvailabilityBadge(provider.availabilityStatus)}
                </div>
                 {provider.reviewCount > 0 && (
                     <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                        {renderStars(provider.rating)}
                        <span className="text-sm">({provider.reviewCount})</span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
               
                 {provider.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{provider.address}</span>
                    </div>
                )}

                {provider.keyServices && provider.keyServices.length > 0 && (
                    <div>
                         <h4 className="font-semibold flex items-center gap-2 mb-2"><Briefcase className="h-4 w-4" /> Key Services</h4>
                        <div className="flex flex-wrap gap-2">
                            {provider.keyServices.map(service => (
                                <Badge key={service} variant="secondary">{service}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-sm text-muted-foreground mt-2 h-10 line-clamp-2">{provider.bio || 'No bio available.'}</p>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" asChild>
                    <Link href={`/providers/${provider.uid}`}>View Profile</Link>
                </Button>
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

    // For agency dashboard
    const [agencyProviders, setAgencyProviders] = useState<Provider[]>([]);
    const [agencyBookings, setAgencyBookings] = useState<Booking[]>([]);
    const [loadingAgencyData, setLoadingAgencyData] = useState(true);


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
        if (userRole !== 'client') return;
        
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
                const q = query(collection(db, "users"), where("role", "==", "provider"));
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
                        availabilityStatus: data.availabilityStatus,
                        keyServices: data.keyServices,
                        address: data.address
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
    }, [userRole]);

    // Fetch data for agency dashboard
    useEffect(() => {
        if (userRole !== 'agency' || !user) {
             setLoadingAgencyData(false);
            return;
        }

        const fetchAgencyData = async () => {
            setLoadingAgencyData(true);
            try {
                // 1. Get all providers managed by the agency
                const providersQuery = query(collection(db, "users"), where("agencyId", "==", user.uid));
                const providersSnapshot = await getDocs(providersQuery);
                const providerIds = providersSnapshot.docs.map(doc => doc.id);
                 const fetchedProviders = providersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Provider));

                if (providerIds.length === 0) {
                    setAgencyProviders([]);
                    setAgencyBookings([]);
                    setLoadingAgencyData(false);
                    return;
                }
                
                // 2. Get all bookings for these providers
                const bookingsQuery = query(collection(db, "bookings"), where("providerId", "in", providerIds));
                const bookingsSnapshot = await getDocs(bookingsQuery);
                const fetchedBookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
                setAgencyBookings(fetchedBookings);
                
                 // 3. Get all reviews for these providers to calculate ratings and revenue
                const reviewsQuery = query(collection(db, 'reviews'), where('providerId', 'in', providerIds));
                const reviewsSnapshot = await getDocs(reviewsQuery);
                const allReviews = reviewsSnapshot.docs.map(doc => doc.data() as Review);

                const providerStats = fetchedProviders.map(p => {
                    const providerReviews = allReviews.filter(r => r.providerId === p.uid);
                    const providerBookings = fetchedBookings.filter(b => b.providerId === p.uid && b.status === 'Completed');
                    const rating = providerReviews.length > 0 ? providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length : 0;
                    const totalRevenue = providerBookings.reduce((sum, b) => sum + b.price, 0);

                    return { ...p, rating, reviewCount: providerReviews.length, totalRevenue };
                });

                setAgencyProviders(providerStats);


            } catch (error) {
                console.error("Error fetching agency data:", error);
            } finally {
                setLoadingAgencyData(false);
            }
        };
        fetchAgencyData();

    }, [user, userRole]);


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
        
    const recentBookings = bookings.slice(0, 5);
    const earningsData = processEarningsData(bookings);

    // Filter providers for client view
    const filteredProviders = useMemo(() => 
        providers.filter(provider => 
            provider.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        ), [providers, searchTerm]);

     // Derived stats for agency
    const agencyTotalRevenue = agencyBookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + b.price, 0);
    const agencyTotalBookings = agencyBookings.filter(b => b.status === 'Completed').length;
    const agencyProviderCount = agencyProviders.length;
    const agencyOverallRating = agencyProviders.length > 0
        ? (agencyProviders.reduce((sum, p) => sum + p.rating, 0) / agencyProviders.length).toFixed(1)
        : "N/A";
    const agencyRecentBookings = agencyBookings.sort((a,b) => b.date.toMillis() - a.date.toMillis()).slice(0, 5);
    const topPerformingProviders = [...agencyProviders].sort((a,b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)).slice(0, 5);



    // If user is a client
    if (userRole === 'client') {
        return (
             <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Find a Service Provider</h1>
                    <p className="text-muted-foreground">Browse our network of trusted professionals.</p>
                </div>
                 <Card>
                    <CardContent className="p-6 space-y-6">
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
                                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredProviders.length > 0 ? (
                                    filteredProviders.map(provider => (
                                        <ProviderCard key={provider.uid} provider={provider} />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center text-muted-foreground p-12">
                                        <Users className="h-16 w-16 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold">No Providers Found</h3>
                                        <p>No providers match your search term. Try another search.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Agency Dashboard
    if (userRole === 'agency') {
         return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Agency Dashboard</h1>
                    <p className="text-muted-foreground">An overview of your agency&apos;s performance.</p>
                </div>

                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <DashboardCard isLoading={loadingAgencyData} title="Total Revenue" icon={DollarSign} value={`₱${agencyTotalRevenue.toFixed(2)}`} />
                    <DashboardCard isLoading={loadingAgencyData} title="Completed Bookings" icon={Calendar} value={`${agencyTotalBookings}`} />
                    <DashboardCard isLoading={loadingAgencyData} title="Managed Providers" icon={Users2} value={`${agencyProviderCount}`} />
                    <DashboardCard isLoading={loadingAgencyData} title="Agency Rating" icon={Star} value={`${agencyOverallRating}`} change={`Based on ${agencyProviders.reduce((sum, p) => sum + p.reviewCount, 0)} reviews`} />
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="lg:col-span-4">
                        <CardHeader>
                            <CardTitle>Recent Bookings</CardTitle>
                            <CardDescription>The latest bookings across your agency.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {loadingAgencyData ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                                </div>
                            ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Provider</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {agencyRecentBookings.length > 0 ? agencyRecentBookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="font-medium">{booking.clientName}</TableCell>
                                            <TableCell>{booking.providerName}</TableCell>
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
                     <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Top Performing Providers</CardTitle>
                            <CardDescription>Your most valuable providers by revenue.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingAgencyData ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                                </div>
                            ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Provider</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topPerformingProviders.length > 0 ? topPerformingProviders.map((provider) => (
                                        <TableRow key={provider.uid}>
                                            <TableCell className="font-medium">{provider.displayName}</TableCell>
                                            <TableCell className="text-right">₱{(provider.totalRevenue || 0).toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center">No provider data yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            )}
                        </CardContent>
                         <CardFooter className="justify-center">
                            <Button asChild variant="outline">
                                <Link href="/manage-providers">Manage All Providers</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        )
    }
    
    // Provider Dashboard (Default)
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
                                    <AvatarFallback>{getAvatarFallback(review.clientName)}</AvatarFallback>
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

    