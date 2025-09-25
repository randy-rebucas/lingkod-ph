
"use client";

import React from "react";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Users, Heart, Filter, Search, TrendingUp, TrendingDown, Calendar, Clock, Target, BarChart3, RefreshCw, Download, Settings, Plus, Eye, CheckCircle, XCircle, AlertCircle, Zap, Bookmark, Phone, MapPin, DollarSign, Timer, Activity, MessageSquare, Award, User, Briefcase, Trash2, MoreHorizontal, Grid3X3, List, SortAsc, SortDesc } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { designTokens } from "@/lib/design-tokens";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Provider = {
    uid: string;
    displayName: string;
    photoURL?: string;
    rating: number;
    reviewCount: number;
    keyServices?: string[];
    bio?: string;
    availabilityStatus?: 'available' | 'limited' | 'unavailable';
    address?: string;
    phone?: string;
    email?: string;
    isVerified?: boolean;
    experience?: string;
    role?: 'provider' | 'agency';
    favoritedAt?: any; // Firestore timestamp
    category?: string;
    priceRange?: string;
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
    return Array(5).fill(0).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
    ));
};

const getAvailabilityBadge = (status: Provider['availabilityStatus'], t: any) => {
    switch (status) {
        case 'available':
            return <Badge variant="default" className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-200 shadow-soft">{t('available')}</Badge>;
        case 'limited':
            return <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-200 shadow-soft">{t('limited')}</Badge>;
        case 'unavailable':
            return <Badge variant="destructive" className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-200 shadow-soft">{t('unavailable')}</Badge>;
        default:
            return null;
    }
};

const ProviderCard = ({ provider }: { provider: Provider }) => {
    const t = useTranslations('MyFavorites');
    return (
        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
            <CardHeader className="text-center pb-3">
                 <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-primary/20 shadow-soft">
                    <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                    <AvatarFallback className="text-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium">{getAvatarFallback(provider.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center gap-2">
                    <h3 className="text-lg font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-300">{provider.displayName}</h3>
                     {provider.availabilityStatus && getAvailabilityBadge(provider.availabilityStatus, t)}
                </div>
                 {provider.reviewCount > 0 && (
                     <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                        {renderStars(provider.rating)}
                        <span className="text-sm">({provider.reviewCount})</span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 space-y-3 px-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{provider.bio || t('noBioAvailable')}</p>
            </CardContent>
            <CardFooter className="pt-2 px-4 pb-4">
                 <Button className="w-full shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground" asChild>
                    <Link href={`/providers/${provider.uid}`}>{t('viewProfile')}</Link>
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function MyFavoritesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('MyFavorites');
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("recent");
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("all");

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const favoritesRef = collection(db, 'favorites');
        const q = query(favoritesRef, where('userId', '==', user.uid));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            setLoading(true);
            const favoriteProviderIds = snapshot.docs.map(doc => doc.data().providerId);

            if (favoriteProviderIds.length === 0) {
                setProviders([]);
                setLoading(false);
                return;
            }
            
            const providersQuery = query(collection(db, "users"), where("uid", "in", favoriteProviderIds));
            const providersSnap = await getDocs(providersQuery);

            const reviewsSnapshot = await getDocs(collection(db, "reviews"));
            const allReviews = reviewsSnapshot.docs.map(doc => doc.data());
            
            const providerRatings: { [key: string]: { totalRating: number, count: number } } = {};
            allReviews.forEach((review: any) => {
                if (!providerRatings[review.providerId]) {
                    providerRatings[review.providerId] = { totalRating: 0, count: 0 };
                }
                providerRatings[review.providerId].totalRating += review.rating;
                providerRatings[review.providerId].count++;
            });
            
            const providersData = providersSnap.docs.map(doc => {
                const data = doc.data();
                const ratingInfo = providerRatings[data.uid];
                return {
                    ...data,
                    uid: doc.id,
                    rating: ratingInfo ? ratingInfo.totalRating / ratingInfo.count : 0,
                    reviewCount: ratingInfo ? ratingInfo.count : 0,
                } as Provider;
            });
            setProviders(providersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Filter and sort providers
    const filteredAndSortedProviders = providers
        .filter(provider => {
            const matchesSearch = provider.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                provider.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                provider.keyServices?.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = categoryFilter === "all" || 
                                  (categoryFilter === "providers" && provider.role === 'provider') ||
                                  (categoryFilter === "agencies" && provider.role === 'agency') ||
                                  (categoryFilter === "verified" && provider.isVerified) ||
                                  (categoryFilter === "available" && provider.availabilityStatus === 'available');
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "recent":
                    return (b.favoritedAt?.toMillis() || 0) - (a.favoritedAt?.toMillis() || 0);
                case "rating":
                    return b.rating - a.rating;
                case "reviews":
                    return b.reviewCount - a.reviewCount;
                case "name":
                    return a.displayName.localeCompare(b.displayName);
                case "oldest":
                    return (a.favoritedAt?.toMillis() || 0) - (b.favoritedAt?.toMillis() || 0);
                default:
                    return 0;
            }
        });

    // Calculate statistics
    const stats = {
        total: providers.length,
        providers: providers.filter(p => p.role === 'provider').length,
        agencies: providers.filter(p => p.role === 'agency').length,
        verified: providers.filter(p => p.isVerified).length,
        available: providers.filter(p => p.availabilityStatus === 'available').length,
        avgRating: providers.length > 0 ? (providers.reduce((sum, p) => sum + p.rating, 0) / providers.length).toFixed(1) : "0.0"
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        // Simulate refresh delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
        toast({
            title: "Favorites Refreshed",
            description: "All favorite data has been updated successfully.",
        });
    };

    const toggleProviderSelection = (providerId: string) => {
        setSelectedProviders(prev => 
            prev.includes(providerId) 
                ? prev.filter(id => id !== providerId)
                : [...prev, providerId]
        );
    };

    const selectAllProviders = () => {
        setSelectedProviders(filteredAndSortedProviders.map(provider => provider.uid));
    };

    const clearSelection = () => {
        setSelectedProviders([]);
    };

    const handleBulkAction = async (action: string) => {
        if (selectedProviders.length === 0) {
            toast({
                variant: "destructive",
                title: "No Providers Selected",
                description: "Please select providers to perform bulk actions.",
            });
            return;
        }

        try {
            // Implement bulk actions here
            toast({
                title: "Bulk Action Completed",
                description: `${action} applied to ${selectedProviders.length} providers.`,
            });
            setSelectedProviders([]);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to perform bulk action.",
            });
        }
    };

    if (loading) {
        return <LoadingState 
            title={t('title')} 
            description={t('subtitle')} 
        />;
    }

    // Statistics Dashboard Component
    const StatsCard = ({ title, value, icon: Icon, variant = "default", change, trend }: {
        title: string;
        value: string | number;
        icon: React.ElementType;
        variant?: 'default' | 'success' | 'warning' | 'info';
        change?: string;
        trend?: 'up' | 'down' | 'neutral';
    }) => {
        const getVariantStyles = () => {
            switch (variant) {
                case 'success':
                    return 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20';
                case 'warning':
                    return 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20';
                case 'info':
                    return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
                default:
                    return '';
            }
        };

        return (
            <StandardCard 
                title={title} 
                variant="elevated"
                className={`group hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-1 ${getVariantStyles()}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-1">
                            {value}
                        </div>
                        {change && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                                {trend === 'down' && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
                                <span>{change}</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-2 rounded-lg ${
                        variant === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                        variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        variant === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-primary/10'
                    }`}>
                        <Icon className={`h-5 w-5 transition-colors ${
                            variant === 'success' ? 'text-green-600' :
                            variant === 'warning' ? 'text-yellow-600' :
                            variant === 'info' ? 'text-blue-600' :
                            'text-muted-foreground group-hover:text-primary'
                        }`} />
                    </div>
                </div>
            </StandardCard>
        );
    };

    return (
        <PageLayout 
            title={t('title')} 
            description={t('subtitle')}
            action={
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                        asChild
                    >
                        <Link href="/dashboard">
                            <Plus className="h-4 w-4 mr-2" />
                            Find More
                        </Link>
                    </Button>
                </div>
            }
        >
            {/* Statistics Dashboard */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard 
                    title="Total Favorites" 
                    value={stats.total} 
                    icon={Heart} 
                    variant="default"
                />
                <StatsCard 
                    title="Service Providers" 
                    value={stats.providers} 
                    icon={User} 
                    variant="info"
                    change={`${stats.total > 0 ? Math.round((stats.providers / stats.total) * 100) : 0}% of total`}
                />
                <StatsCard 
                    title="Agencies" 
                    value={stats.agencies} 
                    icon={Users} 
                    variant="success"
                    change={`${stats.total > 0 ? Math.round((stats.agencies / stats.total) * 100) : 0}% of total`}
                />
                <StatsCard 
                    title="Average Rating" 
                    value={stats.avgRating} 
                    icon={Star} 
                    variant="warning"
                    change={`${stats.verified} verified`}
                />
            </div>

            {/* Filters and Controls */}
            <StandardCard 
                title="Favorites Management" 
                description="Filter, sort, and manage your favorite providers"
                variant="elevated"
            >
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search favorites by name, bio, or services..." 
                                className="pl-10 shadow-soft" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full sm:w-48 shadow-soft">
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="providers">Service Providers</SelectItem>
                                <SelectItem value="agencies">Agencies</SelectItem>
                                <SelectItem value="verified">Verified Only</SelectItem>
                                <SelectItem value="available">Available Now</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-48 shadow-soft">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Recently Added</SelectItem>
                                <SelectItem value="rating">Highest Rating</SelectItem>
                                <SelectItem value="reviews">Most Reviews</SelectItem>
                                <SelectItem value="name">Name A-Z</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 border-2 p-1 rounded-lg bg-background/50 backdrop-blur-sm">
                            <Button 
                                size="icon" 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                onClick={() => setViewMode('grid')} 
                                className="h-8 w-8"
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                onClick={() => setViewMode('list')} 
                                className="h-8 w-8"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedProviders.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <span className="text-sm font-medium">
                                {selectedProviders.length} provider{selectedProviders.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleBulkAction('Message')}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Message All
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleBulkAction('Remove')}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Remove All
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={clearSelection}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    Clear Selection
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </StandardCard>

            {/* Favorites Display */}
            <StandardCard 
                title="Your Favorites" 
                description={`${filteredAndSortedProviders.length} of ${providers.length} favorites`}
                variant="elevated"
            >
                {viewMode === 'grid' ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredAndSortedProviders.length > 0 ? filteredAndSortedProviders.map(provider => (
                            <Card key={provider.uid} className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group hover:-translate-y-1">
                                <CardHeader className="text-center pb-3 relative">
                                    <div className="absolute top-2 right-2">
                                        <Checkbox 
                                            checked={selectedProviders.includes(provider.uid)}
                                            onCheckedChange={() => toggleProviderSelection(provider.uid)}
                                            className="h-4 w-4"
                                        />
                                    </div>
                                    <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-primary/20 shadow-soft">
                                        <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                                        <AvatarFallback className="text-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium">{getAvatarFallback(provider.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center justify-center gap-2">
                                        <CardTitle className="text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-300">{provider.displayName}</CardTitle>
                                        {provider.isVerified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                                    </div>
                                    {provider.availabilityStatus && getAvailabilityBadge(provider.availabilityStatus, t)}
                                    {provider.reviewCount > 0 && (
                                         <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                                            {renderStars(provider.rating)}
                                            <span className="text-sm">({provider.reviewCount})</span>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-1 space-y-3 px-4">
                                    {provider.keyServices && provider.keyServices.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm"><Briefcase className="h-4 w-4" /> Key Services</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {provider.keyServices.slice(0, 2).map(service => (
                                                    <span key={service} className="text-xs bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground py-1 px-2 rounded-full border border-border/50 shadow-soft">{service}</span>
                                                ))}
                                                {provider.keyServices.length > 2 && (
                                                    <span className="text-xs text-muted-foreground py-1 px-2">+{provider.keyServices.length - 2} more</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-sm text-muted-foreground line-clamp-2">{provider.bio || t('noBioAvailable')}</p>
                                    {provider.address && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{provider.address}</span>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-2 px-4 pb-4">
                                    <div className="flex flex-col gap-2 w-full">
                                        <Button className="w-full shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground" asChild>
                                            <Link href={`/providers/${provider.uid}`}>{t('viewProfile')}</Link>
                                        </Button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" size="sm" className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                                                <MessageSquare className="mr-1 h-3 w-3" /> Message
                                            </Button>
                                            <Button variant="outline" size="sm" className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                                                <Heart className="mr-1 h-3 w-3 fill-red-500 text-red-500" /> Remove
                                            </Button>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        )) : (
                            <div className="col-span-full text-center py-12">
                                <Heart className="h-16 w-16 mx-auto text-primary opacity-60 mb-4" />
                                <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                                    {searchTerm || categoryFilter !== "all" ? "No Favorites Found" : "No Favorites Yet"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || categoryFilter !== "all" ? "Try adjusting your filters" : t('noFavoritesDescription')}
                                </p>
                                {!searchTerm && categoryFilter === "all" && (
                                    <Button asChild className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                        <Link href="/dashboard">{t('findProviders')}</Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    // List View
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={selectedProviders.length === filteredAndSortedProviders.length && filteredAndSortedProviders.length > 0}
                                    onCheckedChange={(checked) => checked ? selectAllProviders() : clearSelection()}
                                />
                                <span className="text-sm text-muted-foreground">
                                    Select all ({filteredAndSortedProviders.length})
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {filteredAndSortedProviders.length > 0 ? filteredAndSortedProviders.map((provider) => (
                                <div key={provider.uid} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50">
                                    <Checkbox 
                                        checked={selectedProviders.includes(provider.uid)}
                                        onCheckedChange={() => toggleProviderSelection(provider.uid)}
                                    />
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                                        <AvatarFallback>{getAvatarFallback(provider.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{provider.displayName}</h3>
                                            {provider.isVerified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                                            {provider.role === 'agency' && <Users className="h-4 w-4 text-purple-500" />}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                            <div className="flex items-center gap-1">
                                                {renderStars(provider.rating)}
                                                <span>({provider.reviewCount})</span>
                                            </div>
                                            {provider.availabilityStatus && getAvailabilityBadge(provider.availabilityStatus, t)}
                                        </div>
                                        {provider.keyServices && provider.keyServices.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {provider.keyServices.slice(0, 3).map(service => (
                                                    <Badge key={service} variant="outline" className="text-xs">{service}</Badge>
                                                ))}
                                                {provider.keyServices.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">+{provider.keyServices.length - 3}</Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/providers/${provider.uid}`}>
                                                <User className="mr-2 h-4 w-4" /> View Profile
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <MessageSquare className="mr-2 h-4 w-4" /> Message
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                            <Heart className="mr-2 h-4 w-4 fill-red-500" /> Remove
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12">
                                    <Heart className="h-16 w-16 mx-auto text-primary opacity-60 mb-4" />
                                    <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                                        {searchTerm || categoryFilter !== "all" ? "No Favorites Found" : "No Favorites Yet"}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchTerm || categoryFilter !== "all" ? "Try adjusting your filters" : t('noFavoritesDescription')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </StandardCard>
        </PageLayout>
    );
}
