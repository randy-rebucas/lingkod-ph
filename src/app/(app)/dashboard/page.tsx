
"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { DollarSign, Calendar, Star, Users, Loader2, Search, MapPin, Briefcase, Users2, Heart, LayoutGrid, List, ShieldCheck, Wallet, Info } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getDb  } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp, getDocs, doc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { SkeletonCards, LoadingSpinner } from "@/components/ui/loading-states";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { format, startOfDay, endOfDay } from "date-fns";
import { findMatchingProviders } from "@/ai/flows/find-matching-providers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocationBasedProviderService } from "@/lib/location-based-provider-service";
import { getCurrentLocation } from "@/lib/geolocation-utils";
import ProviderOnboardingBanner from "@/components/provider-onboarding-banner";
import ClientOnboardingBanner from "@/components/client-onboarding-banner";
import AgencyOnboardingBanner from "@/components/agency-onboarding-banner";


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
    role?: 'provider' | 'agency';
    distance?: number;
    distanceFormatted?: string;
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

const DashboardCard = memo(({ title, icon: Icon, value, change, isLoading }: { title: string, icon: React.ElementType, value: string, change?: string, isLoading: boolean }) => {
    if (isLoading) {
        return (
            <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </CardContent>
            </Card>
        );
    }
    return (
        <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{title}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{value}</div>
                {change && <p className="text-xs text-muted-foreground mt-1">{change}</p>}
            </CardContent>
        </Card>
    )
});

// Function to process bookings for the earnings chart
const processEarningsData = (bookings: Booking[], t: any) => {
    const monthlyEarnings: { [key: string]: number } = {};
    const monthNames = [
        t('monthNames.jan'), t('monthNames.feb'), t('monthNames.mar'), t('monthNames.apr'),
        t('monthNames.may'), t('monthNames.jun'), t('monthNames.jul'), t('monthNames.aug'),
        t('monthNames.sep'), t('monthNames.oct'), t('monthNames.nov'), t('monthNames.dec')
    ];

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

const getAvailabilityBadge = (status: Provider['availabilityStatus'], t: any) => {
    switch (status) {
        case 'available':
            return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">{t('available')}</Badge>;
        case 'limited':
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">{t('limited')}</Badge>;
        case 'unavailable':
            return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">{t('unavailable')}</Badge>;
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

const ProviderCard = ({ provider, isFavorite, onToggleFavorite, t }: { provider: Provider; isFavorite: boolean; onToggleFavorite: (provider: Provider) => void; t: any; }) => {
    return (
        <Card className="transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-glow/20 flex flex-col border-0 bg-background/80 backdrop-blur-sm shadow-soft group">
            {provider.searchReasoning && (
                 <Alert className="border-0 border-b rounded-none bg-primary/10 text-primary-foreground">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-primary text-xs">{provider.searchReasoning}</AlertDescription>
                </Alert>
            )}
            <CardHeader className="text-center relative pb-3">
                 <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 rounded-full h-6 w-6 hover:bg-primary/10 transition-colors"
                    onClick={() => onToggleFavorite(provider)}
                >
                    <Heart className={cn("h-4 w-4 text-muted-foreground transition-colors", isFavorite && "fill-red-500 text-red-500")} />
                </Button>
                 <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-primary shadow-soft">
                    <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                    <AvatarFallback className="text-lg bg-gradient-to-r from-primary to-accent text-primary-foreground">{getAvatarFallback(provider.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center gap-2">
                    <h3 className="text-lg font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{provider.displayName}</h3>
                    {provider.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                </div>
                 {provider.availabilityStatus && getAvailabilityBadge(provider.availabilityStatus, t)}
                 {provider.reviewCount > 0 && (
                     <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                        {renderStars(provider.rating)}
                        <span className="text-xs">({provider.reviewCount})</span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                 {provider.address && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{provider.address}</span>
                    </div>
                )}
                {provider.distanceFormatted && (
                    <div className="flex items-center gap-2 text-xs text-primary font-medium">
                        <MapPin className="h-3 w-3" />
                        <span>{provider.distanceFormatted} {t('away')}</span>
                    </div>
                )}

                {provider.keyServices && provider.keyServices.length > 0 && (
                    <div>
                        <div className="flex flex-wrap gap-1">
                            {provider.keyServices.slice(0, 2).map(service => (
                                <Badge key={service} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-1 py-0">{service}</Badge>
                            ))}
                            {provider.keyServices.length > 2 && (
                                <Badge variant="outline" className="text-xs px-1 py-0">+{provider.keyServices.length - 2}</Badge>
                            )}
                        </div>
                    </div>
                )}

                <p className="text-xs text-muted-foreground line-clamp-1">{provider.bio || t('noBioAvailable')}</p>
            </CardContent>
            <CardFooter className="pt-2">
                 <Button size="sm" className="w-full shadow-glow hover:shadow-glow/50 transition-all duration-300" asChild>
                    <Link href={`/providers/${provider.uid}`}>{t('viewProfile')}</Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

const AgencyCard = ({ agency, isFavorite, onToggleFavorite, t }: { agency: Provider; isFavorite: boolean; onToggleFavorite: (agency: Provider) => void; t: any; }) => {
    return (
        <Card className="transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col border-2 border-gradient-to-r from-purple-500 to-blue-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
            {agency.searchReasoning && (
                 <Alert className="border-0 border-b rounded-none bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30">
                    <Info className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <AlertDescription className="text-purple-700 dark:text-purple-300 text-xs">{agency.searchReasoning}</AlertDescription>
                </Alert>
            )}
            <CardHeader className="text-center relative pb-3">
                 <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 rounded-full h-6 w-6"
                    onClick={() => onToggleFavorite(agency)}
                >
                    <Heart className={cn("h-4 w-4 text-muted-foreground", isFavorite && "fill-red-500 text-red-500")} />
                </Button>
                 <div className="relative">
                    <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-gradient-to-r from-purple-500 to-blue-500">
                        <AvatarImage src={agency.photoURL} alt={agency.displayName} />
                        <AvatarFallback className="text-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white">{getAvatarFallback(agency.displayName)}</AvatarFallback>
                    </Avatar>
                    <Badge className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 text-xs px-1 py-0">
                        <Users2 className="h-2 w-2 mr-1" />
{t('agency')}
                    </Badge>
                </div>
                <div className="flex items-center justify-center gap-2 mt-3">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{agency.displayName}</h3>
                    {agency.isVerified && <ShieldCheck className="h-4 w-4 text-purple-500" />}
                </div>
                 {agency.availabilityStatus && getAvailabilityBadge(agency.availabilityStatus, t)}
                 {agency.reviewCount > 0 && (
                     <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                        {renderStars(agency.rating)}
                        <span className="text-xs">({agency.reviewCount})</span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                 {agency.address && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{agency.address}</span>
                    </div>
                )}
                {agency.distanceFormatted && (
                    <div className="flex items-center gap-2 text-xs text-purple-600 font-medium">
                        <MapPin className="h-3 w-3" />
                        <span>{agency.distanceFormatted} {t('away')}</span>
                    </div>
                )}

                {agency.keyServices && agency.keyServices.length > 0 && (
                    <div>
                        <div className="flex flex-wrap gap-1">
                            {agency.keyServices.slice(0, 2).map(service => (
                                <Badge key={service} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700 text-xs px-1 py-0">{service}</Badge>
                            ))}
                            {agency.keyServices.length > 2 && (
                                <Badge variant="outline" className="text-xs px-1 py-0">+{agency.keyServices.length - 2}</Badge>
                            )}
                        </div>
                    </div>
                )}

                <p className="text-xs text-muted-foreground line-clamp-1">{agency.bio || t('professionalAgencyServices')}</p>
            </CardContent>
            <CardFooter className="pt-2">
                 <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0" asChild>
                    <Link href={`/agencies/${agency.uid}`}>{t('viewAgency')}</Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

const ProviderRow = ({ provider, isFavorite, onToggleFavorite, t }: { provider: Provider; isFavorite: boolean; onToggleFavorite: (provider: Provider) => void; t: any; }) => {
    return (
        <div className="flex items-center p-4 border-b last:border-b-0 hover:bg-secondary/50">
            <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                <AvatarFallback>{getAvatarFallback(provider.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <Link href={`/providers/${provider.uid}`} className="font-bold hover:underline">{provider.displayName}</Link>
                    {provider.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                </div>
                {provider.searchReasoning && (
                    <p className="text-xs text-primary/80 mt-1">{provider.searchReasoning}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {renderStars(provider.rating)}
                    <span>({provider.reviewCount} {t('reviews')})</span>
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

const AgencyRow = ({ agency, isFavorite, onToggleFavorite, t }: { agency: Provider; isFavorite: boolean; onToggleFavorite: (agency: Provider) => void; t: any; }) => {
    return (
        <div className="flex items-center p-4 border-b last:border-b-0 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-950/20 dark:hover:to-blue-950/20 bg-gradient-to-r from-purple-50/30 to-blue-50/30 dark:from-purple-950/10 dark:to-blue-950/10">
            <div className="relative">
                <Avatar className="h-12 w-12 mr-4 border-2 border-gradient-to-r from-purple-500 to-blue-500">
                    <AvatarImage src={agency.photoURL} alt={agency.displayName} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">{getAvatarFallback(agency.displayName)}</AvatarFallback>
                </Avatar>
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 text-xs flex items-center justify-center">
                    <Users2 className="h-3 w-3" />
                </Badge>
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <Link href={`/agencies/${agency.uid}`} className="font-bold hover:underline bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{agency.displayName}</Link>
                    {agency.isVerified && <ShieldCheck className="h-4 w-4 text-purple-500" />}
                </div>
                {agency.searchReasoning && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{agency.searchReasoning}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {renderStars(agency.rating)}
                    <span>({agency.reviewCount} {t('reviews')})</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                    {agency.keyServices?.slice(0, 3).map(service => (
                        <Badge key={service} variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">{service}</Badge>
                    ))}
                </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => onToggleFavorite(agency)}>
                 <Heart className={cn("h-5 w-5 text-muted-foreground", isFavorite && "fill-red-500 text-red-500")} />
            </Button>
        </div>
    )
}


const DashboardPage = memo(function DashboardPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const { handleError } = useErrorHandler();
    const t = useTranslations('Dashboard');
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
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [isSmartSearching, setIsSmartSearching] = useState(false);
    const [favoriteProviderIds, setFavoriteProviderIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [showNearbyProviders, setShowNearbyProviders] = useState(false);
    const [isLoadingNearby, setIsLoadingNearby] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchCache, setSearchCache] = useState<Map<string, Provider[]>>(new Map());


    // For agency dashboard
    const [agencyProviders, setAgencyProviders] = useState<Provider[]>([]);
    const [agencyBookings, setAgencyBookings] = useState<Booking[]>([]);
    const [agencyPayouts, setAgencyPayouts] = useState<Payout[]>([]);
    const [loadingAgencyData, setLoadingAgencyData] = useState(true);


    // Fetch data for provider dashboard
    useEffect(() => {
        if (!user || userRole !== 'provider' || !getDb()) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const bookingsQuery = query(
            collection(getDb(), "bookings"),
            where("providerId", "==", user.uid),
            orderBy("date", "desc")
        );
        
        const todaysJobsQuery = query(
            collection(getDb(), "bookings"),
            where("providerId", "==", user.uid),
            where("date", ">=", todayStart),
            where("date", "<=", todayEnd),
            orderBy("date", "asc")
        );

        const reviewsQuery = query(
            collection(getDb(), "reviews"),
            where("providerId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(5)
        );
        
         const payoutsQuery = query(collection(getDb(), "payouts"), where("providerId", "==", user.uid));

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

    // Handle debounced search - moved after handleSmartSearch definition

    // Fetch data for client dashboard
    useEffect(() => {
        if (userRole !== 'client' || !getDb()) return;
        
        const fetchProviders = async () => {
            if (!getDb()) return;
            setLoadingProviders(true);
            try {
                // Fetch all reviews first to calculate ratings
                const reviewsSnapshot = await getDocs(collection(getDb(), "reviews"));
                const allReviews = reviewsSnapshot.docs.map(doc => doc.data() as Review);
                
                const providerRatings: { [key: string]: { totalRating: number, count: number } } = {};
                allReviews.forEach(review => {
                    if (!providerRatings[review.providerId]) {
                        providerRatings[review.providerId] = { totalRating: 0, count: 0 };
                    }
                    providerRatings[review.providerId].totalRating += review.rating;
                    providerRatings[review.providerId].count++;
                });

                // Fetch all providers and agencies
                const q = query(collection(getDb(), "users"), where("role", "in", ["provider", "agency"]));
                const querySnapshot = await getDocs(q);
                const providersData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const ratingInfo = providerRatings[data.uid];
                    return {
                        uid: data.uid,
                        displayName: data.displayName || t('unnamedProvider'),
                        bio: data.bio,
                        photoURL: data.photoURL,
                        rating: ratingInfo ? ratingInfo.totalRating / ratingInfo.count : 0,
                        reviewCount: ratingInfo ? ratingInfo.count : 0,
                        availabilityStatus: data.availabilityStatus,
                        keyServices: data.keyServices,
                        address: data.address,
                        isVerified: data.verification?.status === 'Verified',
                        role: data.role,
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
        if (userRole !== 'client' || !user || !getDb()) return;

        const favRef = collection(getDb(), 'favorites');
        const q = query(favRef, where('userId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const favIds = snapshot.docs.map(doc => doc.data().providerId);
            setFavoriteProviderIds(favIds);
        });
        return () => unsubscribe();
    }, [user, userRole]);


    // Fetch data for agency dashboard
    useEffect(() => {
        if (userRole !== 'agency' || !user || !getDb()) {
             setLoadingAgencyData(false);
            return;
        }

        const fetchAgencyData = async () => {
            if (!getDb()) return;
            setLoadingAgencyData(true);
            try {
                // 1. Get all providers managed by the agency
                const providersQuery = query(collection(getDb(), "users"), where("agencyId", "==", user.uid));
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
                const bookingsQuery = query(collection(getDb(), "bookings"), where("providerId", "in", providerIds));
                const bookingsSnapshot = await getDocs(bookingsQuery);
                const fetchedBookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
                setAgencyBookings(fetchedBookings);
                
                 // 3. Get all reviews for these providers to calculate ratings and revenue
                const reviewsQuery = query(collection(getDb(), 'reviews'), where('providerId', 'in', providerIds));
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
                const payoutsQuery = query(collection(getDb(), 'payouts'), where('agencyId', '==', user.uid));
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
        
    const _recentBookings = bookings.slice(0, 5);
    const earningsData = processEarningsData(bookings, t);

    const handleSmartSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setProviders(allProviders);
            return;
        }

        // Check cache first
        const cacheKey = query.toLowerCase().trim();
        if (searchCache.has(cacheKey)) {
            setProviders(searchCache.get(cacheKey)!);
            return;
        }

        setIsSmartSearching(true);
        try {
            const result = await findMatchingProviders({ query });
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

                // Cache the results
                setSearchCache(prev => new Map(prev).set(cacheKey, matchedProviders));
                setProviders(matchedProviders);
                
                toast({
                    title: t('smartSearchComplete'),
                    description: t('foundAndRankedProviders', { count: matchedProviders.length }),
                });
            } else {
                setProviders([]);
                toast({
                    title: t('noResults'),
                    description: t('noProvidersFoundForSearch'),
                });
            }
        } catch (error) {
            console.error("Smart search failed:", error);
            handleError(error);
            toast({
                title: t('smartSearchFailed'),
                description: t('errorFindingProviders'),
                variant: "destructive",
            });
        } finally {
            setIsSmartSearching(false);
        }
    }, [allProviders, searchCache, t, handleError]);

    // Handle debounced search
    useEffect(() => {
        if (debouncedSearchTerm !== searchTerm) return;
        handleSmartSearch(debouncedSearchTerm);
    }, [debouncedSearchTerm, searchTerm, handleSmartSearch]);

    const handleNearbyProviders = async () => {
        setIsLoadingNearby(true);
        setShowNearbyProviders(true);
        
        try {
            // Get user's current location
            const location = await getCurrentLocation();
            
            if (!location) {
                toast({
                    title: t('locationAccessRequired'),
                    description: t('enableLocationServices'),
                    variant: "destructive",
                });
                setShowNearbyProviders(false);
                return;
            }

            setUserLocation(location);

            // Get nearby providers
            const locationService = LocationBasedProviderService.getInstance();
            const nearbyProviders = await locationService.getNearbyProvidersFromCoordinates(location, {
                maxDistance: 50, // 50km radius
                limit: 20,
                includeUnavailable: false,
                minRating: 0
            });

            setProviders(nearbyProviders);
            
            toast({
                title: t('nearbyProvidersFoundTitle'),
                description: t('foundProvidersWithin50km', { count: nearbyProviders.length }),
            });

        } catch (error) {
            console.error("Error finding nearby providers:", error);
            toast({
                title: t('errorFindingNearbyProviders'),
                description: t('errorFindingProvidersNearYou'),
                variant: "destructive",
            });
            setShowNearbyProviders(false);
        } finally {
            setIsLoadingNearby(false);
        }
    };

    const handleClearLocationSearch = () => {
        setShowNearbyProviders(false);
        setUserLocation(null);
        setProviders(allProviders);
        setSearchTerm("");
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

    const handleToggleFavorite = useCallback(async (provider: Provider) => {
        if (!user || !getDb()) return;
        const favoritesRef = collection(getDb(), 'favorites');
        const isFavorited = favoriteProviderIds.includes(provider.uid);

        try {
            if (isFavorited) {
                const q = query(favoritesRef, where('userId', '==', user.uid), where('providerId', '==', provider.uid));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const docId = snapshot.docs[0].id;
                    await deleteDoc(doc(getDb(), 'favorites', docId));
                }
                toast({ title: t('removedFromFavorites') });
            } else {
                await addDoc(favoritesRef, {
                    userId: user.uid,
                    providerId: provider.uid,
                    favoritedAt: serverTimestamp()
                });
                toast({ title: t('addedToFavorites') });
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            handleError(error);
            toast({ 
                variant: "destructive", 
                title: t('error'), 
                description: t('couldNotUpdateFavorites') 
            });
        }
    }, [user, favoriteProviderIds, t, handleError]);

    // Memoized provider filtering
    const { agencies, serviceProviders } = useMemo(() => {
        const agencies = providers.filter(p => p.role === 'agency');
        const serviceProviders = providers.filter(p => p.role === 'provider');
        return { agencies, serviceProviders };
    }, [providers]);

    // If user is a client
    if (userRole === 'client') {
        return (
             <div className="container space-y-8">
                 {/* Client Onboarding Banner */}
                 <ClientOnboardingBanner />
                 
                 {/* Provider Verification Note */}
                 <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                     <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                     <AlertDescription className="text-amber-800 dark:text-amber-200">
                         <strong>{t('verificationNoteTitle')}:</strong> {t('verificationNote', { 
                             count: '100+', 
                             plural: 's' 
                         })}
                     </AlertDescription>
                 </Alert>
                 
                 <Card className="border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">{t('findServiceProviders')}</h2>
                                <p className="text-muted-foreground">{t('discoverTrustedProfessionals')}</p>
                            </div>
                            <div className="flex items-center gap-1 border rounded-lg p-1 bg-background/50">
                                <Button size="icon" variant={viewMode === 'grid' ? 'secondary' : 'ghost'} onClick={() => setViewMode('grid')} className="h-8 w-8">
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => setViewMode('list')} className="h-8 w-8">
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="relative">
                            <Input 
                                placeholder={t('searchPlaceholder')} 
                                className="w-full h-12 text-base pl-4 pr-20 sm:pr-32 border-2 focus:border-primary transition-colors" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch(searchTerm)}
                                aria-label={t('searchForServiceProviders')}
                                aria-describedby="search-help"
                            />
                            <Button 
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 sm:px-3 px-2"
                                onClick={() => handleSmartSearch(searchTerm)}
                                disabled={isSmartSearching}
                                aria-label={isSmartSearching ? t('searchingForProviders') : t('searchProviders')}
                            >
                                {isSmartSearching ? <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-1 sm:mr-2 h-4 w-4" />}
                                <span className="hidden sm:inline">{isSmartSearching ? t('searching') : t('search')}</span>
                            </Button>
                        </div>
                        <p id="search-help" className="text-xs text-muted-foreground">
{t('searchHelp')}
                        </p>
                        
                        {/* Quick Filter Buttons */}
                        <div className="flex flex-wrap gap-2 sm:gap-3" role="group" aria-label={t('quickServiceFilters')}>
                            <Button 
                                variant="default" 
                                size="sm"
                                onClick={handleNearbyProviders}
                                disabled={isLoadingNearby}
                                className="text-xs bg-primary hover:bg-primary/90"
                                aria-label={t('findProvidersNearLocation')}
                            >
                                {isLoadingNearby ? (
                                    <>
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        {t('finding')}
                                    </>
                                ) : (
                                    <>
                                        📍 {t('findNearbyProviders')}
                                    </>
                                )}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSearchTerm('house cleaning')}
                                className="text-xs"
                                aria-label={t('searchForHouseCleaning')}
                            >
                                🏠 {t('houseCleaning')}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSearchTerm('web design')}
                                className="text-xs"
                                aria-label={t('searchForWebDesign')}
                            >
                                💻 {t('webDesign')}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSearchTerm('tutoring')}
                                className="text-xs"
                                aria-label={t('searchForTutoring')}
                            >
                                📚 {t('tutoring')}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSearchTerm('photography')}
                                className="text-xs"
                                aria-label={t('searchForPhotography')}
                            >
                                📸 {t('photography')}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSearchTerm('plumbing')}
                                className="text-xs"
                                aria-label={t('searchForPlumbing')}
                            >
                                🔧 {t('plumbing')}
                            </Button>
                        </div>
                        {loadingProviders || isSmartSearching || isLoadingNearby ? (
                            <div className="space-y-4" role="status" aria-live="polite">
                                <LoadingSpinner 
                                    size="lg"
                                    text={isLoadingNearby ? t('findingNearbyProviders') : 
                                          isSmartSearching ? t('searchingWithAI') : 
                                          t('loadingProviders')}
                                    centered
                                />
                                {viewMode === 'grid' ? (
                                    <SkeletonCards count={6} />
                                ) : (
                                    <div className="space-y-2">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <Skeleton key={i} className="h-20 w-full" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                             providers.length > 0 ? (
                                (() => {
                                    return (
                                        <div className="space-y-8">
                                            {/* Results Summary */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-5 w-5 text-primary" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {showNearbyProviders ? (
                                                            <>
                                                                {providers.length} {t('nearbyProvidersFound')}{providers.length !== 1 ? 's' : ''} {t('found')}
                                                                {userLocation && (
                                                                    <span className="text-xs text-primary ml-2">
                                                                        ({t('within50km')})
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {providers.length} {t('providersFound')}{providers.length !== 1 ? 's' : ''} {t('found')}
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                                {(searchTerm || showNearbyProviders) && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={showNearbyProviders ? handleClearLocationSearch : () => setSearchTerm('')}
                                                        className="text-xs"
                                                    >
                                                        {t('clearSearch')} {showNearbyProviders ? t('clearLocationSearch') : t('clearSearch')}
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            {/* Agencies Section */}
                                            {agencies.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Users2 className="h-5 w-5 text-purple-600" />
                                                        <h2 className="text-xl font-semibold">
                                                            {t('agencies')} ({agencies.length})
                                                        </h2>
                                                    </div>
                                                    {viewMode === 'grid' ? (
                                                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                            {agencies.map(agency => (
                                                                <AgencyCard 
                                                                    key={agency.uid} 
                                                                    agency={agency} 
                                                                    isFavorite={favoriteProviderIds.includes(agency.uid)}
                                                                    onToggleFavorite={handleToggleFavorite}
                                                                    t={t}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <Card>
                                                            <CardContent className="p-0">
                                                                {agencies.map(agency => (
                                                                    <AgencyRow 
                                                                        key={agency.uid} 
                                                                        agency={agency} 
                                                                        isFavorite={favoriteProviderIds.includes(agency.uid)}
                                                                        onToggleFavorite={handleToggleFavorite}
                                                                        t={t}
                                                                    />
                                                                ))}
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </div>
                                            )}

                                            {/* Service Providers Section */}
                                            {serviceProviders.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Briefcase className="h-5 w-5 text-blue-600" />
                                                        <h2 className="text-xl font-semibold">
                                                            {t('serviceProviders')} ({serviceProviders.length})
                                                        </h2>
                                                    </div>
                                                    {viewMode === 'grid' ? (
                                                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                            {serviceProviders.map(provider => (
                                                                <ProviderCard 
                                                                    key={provider.uid} 
                                                                    provider={provider} 
                                                                    isFavorite={favoriteProviderIds.includes(provider.uid)}
                                                                    onToggleFavorite={handleToggleFavorite}
                                                                    t={t}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <Card>
                                                            <CardContent className="p-0">
                                                                {serviceProviders.map(provider => (
                                                                    <ProviderRow 
                                                                        key={provider.uid} 
                                                                        provider={provider} 
                                                                        isFavorite={favoriteProviderIds.includes(provider.uid)}
                                                                        onToggleFavorite={handleToggleFavorite}
                                                                        t={t}
                                                                    />
                                                                ))}
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="text-center py-16">
                                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                                        <Search className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{t('noProvidersFound')}</h3>
                                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                        {searchTerm ? 
                                            t('noProvidersMatch', { searchTerm }) :
                                            t('startBySearching')
                                        }
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setSearchTerm('')}
                                        >
{t('clearSearchButton')}
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setSearchTerm('house cleaning')}
                                        >
{t('tryHouseCleaning')}
                                        </Button>
                                    </div>
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
            <div className="container space-y-8">
                {/* Agency Onboarding Banner */}
                <AgencyOnboardingBanner />

                 <div className=" mx-auto">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                        <DashboardCard isLoading={loadingAgencyData} title={t('totalRevenue')} icon={DollarSign} value={`₱${agencyTotalRevenue.toFixed(2)}`} />
                        <DashboardCard isLoading={loadingAgencyData} title={t('completedBookings')} icon={Calendar} value={`${agencyTotalBookings}`} />
                        <DashboardCard isLoading={loadingAgencyData} title={t('managedProviders')} icon={Users2} value={`${agencyProviderCount}`} />
                        <DashboardCard isLoading={loadingAgencyData} title={t('agencyRating')} icon={Star} value={`${agencyOverallRating}`} change={t('basedOnReviews', { count: agencyProviders.reduce((sum, p) => sum + (p.reviewCount || 0), 0) })} />
                        <DashboardCard isLoading={loadingAgencyData} title={t('pendingPayouts')} icon={Wallet} value={`₱${agencyPendingPayouts.toFixed(2)}`} />
                    </div>
                </div>
                
                 <div className=" mx-auto">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="lg:col-span-4 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('recentBookings')}</CardTitle>
                                <CardDescription>{t('latestBookingsAcrossAgency')}</CardDescription>
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
                                            <TableHead>{t('client')}</TableHead>
                                            <TableHead>{t('provider')}</TableHead>
                                            <TableHead>{t('status')}</TableHead>
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
                                                <TableCell colSpan={3} className="h-24 text-center">{t('noRecentBookings')}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                )}
                            </CardContent>
                        </Card>
                         <Card className="lg:col-span-3 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('topPerformingProviders')}</CardTitle>
                                <CardDescription>{t('mostValuableProvidersByRevenue')}</CardDescription>
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
                                            <TableHead>{t('provider')}</TableHead>
                                            <TableHead className="text-right">{t('revenue')}</TableHead>
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
                                                <TableCell colSpan={2} className="h-24 text-center">{t('noProviderDataYet')}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                )}
                            </CardContent>
                             <CardFooter className="justify-center">
                                <Button asChild variant="outline">
                                    <Link href="/manage-providers">{t('manageAllProviders')}</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }
    
    // Provider Dashboard (Default)
    return (
        <div className="container space-y-8">
            {/* Provider Onboarding Banner */}
            <ProviderOnboardingBanner />
            
            <div className=" mx-auto">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                    <DashboardCard isLoading={loading} title={t('totalRevenue')} icon={DollarSign} value={`₱${totalRevenue.toFixed(2)}`} />
                    <DashboardCard isLoading={loading} title={t('pendingPayouts')} icon={Wallet} value={`₱${pendingPayouts.toFixed(2)}`} />
                    <DashboardCard isLoading={loading} title={t('upcomingBookings')} icon={Calendar} value={`${upcomingBookingsCount}`} />
                    <DashboardCard isLoading={loading} title={t('totalClients')} icon={Users} value={`${totalClientsCount}`} />
                    <DashboardCard isLoading={loading} title={t('overallRating')} icon={Star} value={`${overallRating}`} change={`${t('basedOn')} ${reviews.length} ${t('reviews')}`} />
                </div>
            </div>

            <div className=" mx-auto">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                     <Card className="lg:col-span-4 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('earningsOverview')}</CardTitle>
                            <CardDescription>{t('earningsForLast6Months')}</CardDescription>
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
                    <Card className="lg:col-span-3 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('todaysSchedule')}</CardTitle>
                            <CardDescription>{t('upcomingJobsForToday')}</CardDescription>
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
                                        <TableHead>{t('time')}</TableHead>
                                        <TableHead>{t('client')}</TableHead>
                                        <TableHead>{t('service')}</TableHead>
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
                                            <TableCell colSpan={3} className="h-24 text-center">{t('noJobsScheduledForToday')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <div className=" mx-auto">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('recentReviews')}</CardTitle>
                        <CardDescription>{t('whatClientsAreSaying')}</CardDescription>
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
                                {t('noReviewsYet')}
                            </div>
                        )}
                        <div className="text-center">
                            <Button variant="outline" className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">{t('viewAllReviews')}</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
});

export default DashboardPage;
