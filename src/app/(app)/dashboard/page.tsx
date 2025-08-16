
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { DollarSign, Calendar, Star, Users, Loader2, Search, MapPin, Briefcase, Users2, Heart, LayoutGrid, List, ShieldCheck, Clock, Wallet, Info } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp, getDocs, getDoc, doc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, startOfDay, endOfDay } from "date-fns";
import { findMatchingProviders } from "@/ai/flows/find-matching-providers";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


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
    isVerified?: boolean;
    searchRank?: number;
    searchReasoning?: string;
};

type Payout = {
    id: string;
    amount: number;
    status: 'Pending' | 'Paid';
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

const ProviderCard = ({ provider, isFavorite, onToggleFavorite }: { provider: Provider; isFavorite: boolean; onToggleFavorite: (provider: Provider) => void; }) => {
    return (
        <Card className="transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col">
            {provider.searchReasoning && (
                 <Alert className="border-0 border-b rounded-none bg-primary/10 text-primary-foreground">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-primary text-xs">{provider.searchReasoning}</AlertDescription>
                </Alert>
            )}
            <CardHeader className="text-center relative">
                 <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 rounded-full h-8 w-8"
                    onClick={() => onToggleFavorite(provider)}
                >
                    <Heart className={cn("h-5 w-5 text-muted-foreground", isFavorite && "fill-red-500 text-red-500")} />
                </Button>
                 <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary">
                    <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                    <AvatarFallback className="text-3xl">{getAvatarFallback(provider.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center gap-2">
                    <h3 className="text-xl font-bold">{provider.displayName}</h3>
                    {provider.isVerified && <ShieldCheck className="h-5 w-5 text-blue-500" title="Verified Provider" />}
                </div>
                 {provider.availabilityStatus && getAvailabilityBadge(provider.availabilityStatus)}
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

const ProviderRow = ({ provider, isFavorite, onToggleFavorite }: { provider: Provider; isFavorite: boolean; onToggleFavorite: (provider: Provider) => void; }) => {
    return (
        <div className="flex items-center p-4 border-b last:border-b-0 hover:bg-secondary/50">
            <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                <AvatarFallback>{getAvatarFallback(provider.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <Link href={`/providers/${provider.uid}`} className="font-bold hover:underline">{provider.displayName}</Link>
                    {provider.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500" title="Verified Provider" />}
                </div>
                {provider.searchReasoning && (
                    <p className="text-xs text-primary/80 mt-1">{provider.searchReasoning}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {renderStars(provider.rating)}
                    <span>({provider.reviewCount} reviews)</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                    {provider.keyServices?.slice(0, 3).map(service => (
                        <Badge key={service} variant="outline">{service}</Badge>
                    ))}
                </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => onToggleFavorite(provider)}>
                 <Heart className={cn("h-5 w-5 text-muted-foreground", isFavorite && "fill-red-500 text-red-500")} />
            </Button>
        </div>
    )
}


export default function DashboardPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [todaysJobs, setTodaysJobs] = useState<Booking[]>([]);

    
    // For client dashboard
    const [providers, setProviders] = useState<Provider[]>([]);
    const [allProviders, setAllProviders] = useState<Provider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSmartSearching, setIsSmartSearching] = useState(false);
    const [favoriteProviderIds, setFavoriteProviderIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');


    // For agency dashboard
    const [agencyProviders, setAgencyProviders] = useState<Provider[]>([]);
    const [agencyBookings, setAgencyBookings] = useState<Booking[]>([]);
    const [agencyPayouts, setAgencyPayouts] = useState<Payout[]>([]);
    const [loadingAgencyData, setLoadingAgencyData] = useState(true);


    // Fetch data for provider dashboard
    useEffect(() => {
        if (!user || userRole !== 'provider') {
            setLoading(false);
            return;
        }
        setLoading(true);

        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const bookingsQuery = query(
            collection(db, "bookings"),
            where("providerId", "==", user.uid),
            orderBy("date", "desc")
        );
        
        const todaysJobsQuery = query(
            collection(db, "bookings"),
            where("providerId", "==", user.uid),
            where("date", ">=", todayStart),
            where("date", "<=", todayEnd),
            orderBy("date", "asc")
        );

        const reviewsQuery = query(
            collection(db, "reviews"),
            where("providerId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(5)
        );
        
         const payoutsQuery = query(collection(db, "payouts"), where("providerId", "==", user.uid));

        const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
            setBookings(bookingsData);
            setLoading(false);
        }, (error) => { console.error("Firestore Error:", error); setLoading(false); });
        
        const unsubscribeTodaysJobs = onSnapshot(todaysJobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
            setTodaysJobs(jobsData);
        }, (error) => { console.error("Firestore Error:", error); });

        const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
            setReviews(reviewsData);
        });
        
         const unsubscribePayouts = onSnapshot(payoutsQuery, (snapshot) => {
            const payoutsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payout));
            setPayouts(payoutsData);
        });

        return () => {
            unsubscribeBookings();
            unsubscribeReviews();
            unsubscribePayouts();
            unsubscribeTodaysJobs();
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
                        availabilityStatus: data.availabilityStatus,
                        keyServices: data.keyServices,
                        address: data.address,
                        isVerified: data.verification?.status === 'Verified',
                    } as Provider;
                });
                setProviders(providersData);
                setAllProviders(providersData); // Store a copy for resetting search
            } catch (error) {
                console.error("Error fetching providers: ", error);
            } finally {
                setLoadingProviders(false);
            }
        };
        fetchProviders();
    }, [userRole]);

    // Fetch client's favorites
    useEffect(() => {
        if (userRole !== 'client' || !user) return;

        const favRef = collection(db, 'favorites');
        const q = query(favRef, where('userId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const favIds = snapshot.docs.map(doc => doc.data().providerId);
            setFavoriteProviderIds(favIds);
        });
        return () => unsubscribe();
    }, [user, userRole]);


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
                    setAgencyPayouts([]);
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
                
                // 4. Get all payout requests for the agency
                const payoutsQuery = query(collection(db, 'payouts'), where('agencyId', '==', user.uid));
                const payoutsSnapshot = await getDocs(payoutsQuery);
                const fetchedPayouts = payoutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payout));
                setAgencyPayouts(fetchedPayouts);


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

    const pendingPayouts = payouts
        .filter(p => p.status === 'Pending')
        .reduce((sum, p) => sum + p.amount, 0);

    const upcomingBookingsCount = bookings.filter(b => b.status === 'Upcoming').length;

    const uniqueClientIds = new Set(bookings.map(b => b.clientId));
    const totalClientsCount = uniqueClientIds.size;
    
    const overallRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "N/A";
        
    const recentBookings = bookings.slice(0, 5);
    const earningsData = processEarningsData(bookings);

    const handleSmartSearch = async () => {
        if (!searchTerm) {
            setProviders(allProviders); // Reset if search is cleared
            return;
        }
        setIsSmartSearching(true);
        try {
            const result = await findMatchingProviders({ query: searchTerm });
            if (result.providers.length > 0) {
                const rankedProviderIds = result.providers.reduce((acc, p) => {
                    acc[p.providerId] = { rank: p.rank, reasoning: p.reasoning };
                    return acc;
                }, {} as Record<string, { rank: number, reasoning: string }>);
                
                const matchedProviders = allProviders.filter(p => rankedProviderIds[p.uid]).map(p => ({
                    ...p,
                    searchRank: rankedProviderIds[p.uid].rank,
                    searchReasoning: rankedProviderIds[p.uid].reasoning
                })).sort((a,b) => (a.searchRank || 99) - (b.searchRank || 99));

                setProviders(matchedProviders);
                toast({
                    title: "Smart Search Complete",
                    description: `Found and ranked ${matchedProviders.length} providers for you.`,
                });
            } else {
                setProviders([]);
                 toast({
                    title: "No Results",
                    description: `Could not find any providers for your search. Try a broader term.`,
                });
            }
        } catch (error) {
            console.error("Smart search failed:", error);
            toast({
                title: "Smart Search Failed",
                description: "There was an error finding providers. Please try a different search.",
                variant: "destructive",
            });
        } finally {
            setIsSmartSearching(false);
        }
    };

    // Derived stats for agency
    const agencyTotalRevenue = agencyBookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + b.price, 0);
    const agencyTotalBookings = agencyBookings.filter(b => b.status === 'Completed').length;
    const agencyProviderCount = agencyProviders.length;
    const agencyPendingPayouts = agencyPayouts.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
    const agencyOverallRating = agencyProviders.length > 0
        ? (agencyProviders.reduce((sum, p) => sum + (p.rating || 0), 0) / agencyProviders.length).toFixed(1)
        : "N/A";
    const agencyRecentBookings = agencyBookings.sort((a,b) => b.date.toMillis() - a.date.toMillis()).slice(0, 5);
    const topPerformingProviders = [...agencyProviders].sort((a,b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)).slice(0, 5);

    const handleToggleFavorite = async (provider: Provider) => {
        if (!user) return;
        const favoritesRef = collection(db, 'favorites');
        const isFavorited = favoriteProviderIds.includes(provider.uid);

        try {
            if (isFavorited) {
                const q = query(favoritesRef, where('userId', '==', user.uid), where('providerId', '==', provider.uid));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const docId = snapshot.docs[0].id;
                    await deleteDoc(doc(db, 'favorites', docId));
                }
                toast({ title: "Removed from Favorites" });
            } else {
                await addDoc(favoritesRef, {
                    userId: user.uid,
                    providerId: provider.uid,
                    favoritedAt: serverTimestamp()
                });
                toast({ title: "Added to Favorites" });
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not update favorites." });
        }
    };



    // If user is a client
    if (userRole === 'client') {
        return (
             <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Find a Service Provider</h1>
                    <p className="text-muted-foreground">Describe what you need, and we'll find the right pro for the job.</p>
                </div>
                 <Card>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Input 
                                    placeholder="e.g., 'I need a plumber for a clogged kitchen sink'" 
                                    className="w-full h-12 text-base pl-4 pr-32" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
                                />
                                <Button 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9"
                                    onClick={handleSmartSearch}
                                    disabled={isSmartSearching}
                                >
                                    {isSmartSearching ? <Loader2 className="mr-2 animate-spin" /> : <Search className="mr-2" />}
                                    {isSmartSearching ? 'Searching...' : 'Search'}
                                </Button>
                            </div>
                            <div className="flex items-center gap-1 border p-1 rounded-lg bg-background h-12">
                                <Button size="icon" variant={viewMode === 'grid' ? 'secondary' : 'ghost'} onClick={() => setViewMode('grid')}>
                                    <LayoutGrid className="h-5 w-5" />
                                </Button>
                                 <Button size="icon" variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => setViewMode('list')}>
                                    <List className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        {loadingProviders || isSmartSearching ? (
                            <div className={cn("gap-6", viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-2')}>
                                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                            </div>
                        ) : (
                             providers.length > 0 ? (
                                viewMode === 'grid' ? (
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {providers.map(provider => (
                                            <ProviderCard 
                                                key={provider.uid} 
                                                provider={provider} 
                                                isFavorite={favoriteProviderIds.includes(provider.uid)}
                                                onToggleFavorite={handleToggleFavorite}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="p-0">
                                            {providers.map(provider => (
                                                 <ProviderRow 
                                                    key={provider.uid} 
                                                    provider={provider} 
                                                    isFavorite={favoriteProviderIds.includes(provider.uid)}
                                                    onToggleFavorite={handleToggleFavorite}
                                                />
                                            ))}
                                        </CardContent>
                                    </Card>
                                )
                            ) : (
                                <div className="col-span-full text-center text-muted-foreground p-12">
                                    <Users className="h-16 w-16 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold">No Providers Found</h3>
                                    <p>No providers match your search term. Try another search.</p>
                                </div>
                            )
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

                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                    <DashboardCard isLoading={loadingAgencyData} title="Total Revenue" icon={DollarSign} value={`₱${agencyTotalRevenue.toFixed(2)}`} />
                    <DashboardCard isLoading={loadingAgencyData} title="Completed Bookings" icon={Calendar} value={`${agencyTotalBookings}`} />
                    <DashboardCard isLoading={loadingAgencyData} title="Managed Providers" icon={Users2} value={`${agencyProviderCount}`} />
                    <DashboardCard isLoading={loadingAgencyData} title="Agency Rating" icon={Star} value={`${agencyOverallRating}`} change={`Based on ${agencyProviders.reduce((sum, p) => sum + (p.reviewCount || 0), 0)} reviews`} />
                    <DashboardCard isLoading={loadingAgencyData} title="Pending Payouts" icon={Wallet} value={`₱${agencyPendingPayouts.toFixed(2)}`} />
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <DashboardCard isLoading={loading} title="Total Revenue" icon={DollarSign} value={`₱${totalRevenue.toFixed(2)}`} />
                <DashboardCard isLoading={loading} title="Pending Payouts" icon={Wallet} value={`₱${pendingPayouts.toFixed(2)}`} />
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
                        <CardTitle>Today&apos;s Schedule</CardTitle>
                        <CardDescription>Your upcoming jobs for today.</CardDescription>
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
                                    <TableHead>Time</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Service</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {todaysJobs.length > 0 ? todaysJobs.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell>{format(booking.date.toDate(), 'p')}</TableCell>
                                        <TableCell className="font-medium">{booking.clientName}</TableCell>
                                        <TableCell>{booking.serviceName}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">No jobs scheduled for today.</TableCell>
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
