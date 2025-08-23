
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
            return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">{t('available')}</Badge>;
        case 'limited':
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">{t('limited')}</Badge>;
        case 'unavailable':
            return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">{t('unavailable')}</Badge>;
        default:
            return null;
    }
};

const ProviderCard = ({ provider }: { provider: Provider }) => {
    const t = useTranslations('MyFavorites');
    return (
        <Card className="transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col">
            <CardHeader className="text-center">
                 <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary">
                    <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                    <AvatarFallback className="text-3xl">{getAvatarFallback(provider.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center gap-2">
                    <h3 className="text-xl font-bold">{provider.displayName}</h3>
                     {provider.availabilityStatus && getAvailabilityBadge(provider.availabilityStatus, t)}
                </div>
                 {provider.reviewCount > 0 && (
                     <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                        {renderStars(provider.rating)}
                        <span className="text-sm">({provider.reviewCount})</span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground mt-2 h-10 line-clamp-2">{provider.bio || t('noBioAvailable')}</p>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" asChild>
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

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
            
            {providers.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {providers.map(provider => (
                        <ProviderCard key={provider.uid} provider={provider} />
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <Heart className="h-16 w-16 mb-4" />
                        <h3 className="text-xl font-semibold">{t('noFavoritesYet')}</h3>
                        <p>{t('noFavoritesDescription')}</p>
                        <Button asChild className="mt-4">
                            <Link href="/dashboard">{t('findProviders')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
