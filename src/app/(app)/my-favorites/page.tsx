
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Users, Heart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Provider = {
    uid: string;
    displayName: string;
    photoURL?: string;
    rating: number;
    reviewCount: number;
    keyServices?: string[];
    bio?: string;
    availabilityStatus?: 'available' | 'limited' | 'unavailable';
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
    const t = useTranslations('MyFavorites');
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !db) {
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
            
            const providersQuery = query(collection(db!, "users"), where("uid", "in", favoriteProviderIds));
            const providersSnap = await getDocs(providersQuery);

            const reviewsSnapshot = await getDocs(collection(db!, "reviews"));
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

    if (loading) {
        return (
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container space-y-8">
                
                <div className="max-w-6xl mx-auto relative z-10">
                    <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                        {t('title')}
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        {t('subtitle')}
                    </p>
                </div>
            
            {providers.length > 0 ? (
                <div className="max-w-6xl mx-auto">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {providers.map(provider => (
                            <ProviderCard key={provider.uid} provider={provider} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="flex flex-col items-center justify-center text-center p-12">
                            <Heart className="h-20 w-20 mb-6 text-primary opacity-60" />
                            <div className="space-y-3">
                                <h3 className="text-2xl font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('noFavoritesYet')}</h3>
                                <p className="text-lg text-muted-foreground max-w-md">{t('noFavoritesDescription')}</p>
                            </div>
                            <Button asChild className="mt-6 shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                <Link href="/dashboard">{t('findProviders')}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
