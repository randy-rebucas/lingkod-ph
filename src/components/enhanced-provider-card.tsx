"use client";

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    Heart, 
    MapPin, 
    Star, 
    ShieldCheck, 
    Clock, 
    MessageCircle,
    CheckCircle,
    Award,
    TrendingUp,
    Users,
    Calendar
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

// Provider type matching the dashboard with additional properties
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
    // Additional properties for enhanced display
    isTopRated?: boolean;
    isPopular?: boolean;
    completedJobs?: number;
    responseTime?: string;
};

interface EnhancedProviderCardProps {
    provider: Provider;
    isFavorite: boolean;
    onToggleFavorite: (provider: Provider) => Promise<void>;
    viewMode?: 'grid' | 'list';
}

export default function EnhancedProviderCard({ 
    provider, 
    isFavorite, 
    onToggleFavorite, 
    viewMode = 'grid'
}: EnhancedProviderCardProps) {
    const tCard = useTranslations('EnhancedProviderCard');
    
    const getAvatarFallback = (name: string) => {
        if (!name) return "??";
        return name.substring(0, 2).toUpperCase();
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={cn(
                    "h-3 w-3",
                    i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
            />
        ));
    };

    const getAvailabilityBadge = (status: "available" | "limited" | "unavailable") => {
        const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
            'available': { color: 'bg-green-100 text-green-800 border-green-200', text: tCard('available'), icon: <CheckCircle className="h-3 w-3" /> },
            'limited': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: tCard('limited'), icon: <Clock className="h-3 w-3" /> },
            'unavailable': { color: 'bg-gray-100 text-gray-800 border-gray-200', text: tCard('unavailable'), icon: <Clock className="h-3 w-3" /> }
        };

        const config = statusMap[status] || statusMap['unavailable'];
        
        return (
            <Badge variant="outline" className={cn("text-xs px-2 py-1 border", config.color)}>
                {config.icon}
                <span className="ml-1">{config.text}</span>
            </Badge>
        );
    };

    const getTrustBadges = () => {
        const badges = [];
        
        if (provider.isVerified) {
            badges.push(
                <Badge key="verified" variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    {tCard('verified')}
                </Badge>
            );
        }

        if (provider.isTopRated) {
            badges.push(
                <Badge key="top-rated" variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                    <Award className="h-3 w-3 mr-1" />
                    {tCard('topRated')}
                </Badge>
            );
        }

        if (provider.isPopular) {
            badges.push(
                <Badge key="popular" variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {tCard('popular')}
                </Badge>
            );
        }

        if (provider.completedJobs && provider.completedJobs > 50) {
            badges.push(
                <Badge key="experienced" variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {tCard('experienced')}
                </Badge>
            );
        }

        return badges;
    };

    if (viewMode === 'list') {
        return (
            <div className="flex items-center p-4 border-b last:border-b-0 hover:bg-secondary/50 transition-colors">
                <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                    <AvatarFallback>{getAvatarFallback(provider.displayName)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Link href={`/providers/${provider.uid}`} className="font-bold hover:underline truncate">
                            {provider.displayName}
                        </Link>
                        {provider.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" data-tour-highlight="verification-badge" />}
                    </div>
                    
                    {provider.searchReasoning && (
                        <p className="text-xs text-primary/80 mb-1">{provider.searchReasoning}</p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {renderStars(provider.rating)}
                        <span>({provider.reviewCount} {tCard('reviews')})</span>
                        {provider.responseTime && (
                            <>
                                <span>-</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {provider.responseTime}
                                </span>
                            </>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                        {getTrustBadges()}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                        {provider.keyServices?.slice(0, 3).map(service => (
                            <Badge key={service} variant="outline" className="text-xs">{service}</Badge>
                        ))}
                    </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => onToggleFavorite(provider)}>
                        <Heart className={cn("h-5 w-5 text-muted-foreground", isFavorite && "fill-red-500 text-red-500")} />
                    </Button>
                    <Button size="sm" asChild data-tour-highlight="contact-button">
                        <Link href={`/providers/${provider.uid}`}>
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {tCard('contact')}
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Card className="transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-glow/20 flex flex-col border-0 bg-background/80 backdrop-blur-sm shadow-soft group">
            {provider.searchReasoning && (
                <div className="border-0 border-b rounded-none bg-primary/10 text-primary-foreground p-2">
                    <p className="text-primary text-xs">{provider.searchReasoning}</p>
                </div>
            )}
            
            <CardHeader className="text-center relative pb-3">
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 rounded-full h-6 w-6 hover:bg-primary/10 transition-colors z-10"
                    onClick={() => onToggleFavorite(provider)}
                >
                    <Heart className={cn("h-4 w-4 text-muted-foreground transition-colors", isFavorite && "fill-red-500 text-red-500")} />
                </Button>
                
                <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-primary shadow-soft">
                    <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                    <AvatarFallback className="text-lg bg-gradient-to-r from-primary to-accent text-primary-foreground">
                        {getAvatarFallback(provider.displayName)}
                    </AvatarFallback>
                </Avatar>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="text-lg font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {provider.displayName}
                    </h3>
                    {provider.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500" data-tour-highlight="verification-badge" />}
                </div>
                
                {provider.availabilityStatus && getAvailabilityBadge(provider.availabilityStatus)}
                
                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {getTrustBadges()}
                </div>
            </CardHeader>
            
            <CardContent className="flex-1 space-y-3">
                {/* Rating and Reviews */}
                {provider.reviewCount > 0 ? (
                    <div className="flex items-center justify-center gap-2">
                        {renderStars(provider.rating)}
                        <span className="text-sm font-medium">({provider.reviewCount} {tCard('reviews')})</span>
                    </div>
                ) : (
                    <div className="text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {tCard('newOnPlatform')}
                        </Badge>
                    </div>
                )}
                
                {/* Location */}
                {provider.address && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{provider.address}</span>
                    </div>
                )}
                
                {provider.distanceFormatted && (
                    <div className="flex items-center gap-2 text-xs text-primary font-medium">
                        <MapPin className="h-3 w-3" />
                        <span>{provider.distanceFormatted} {tCard('away')}</span>
                    </div>
                )}
                
                {/* Response Time */}
                {provider.responseTime && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{tCard('responseTime')}: {provider.responseTime}</span>
                    </div>
                )}
                
                {/* Key Services */}
                {provider.keyServices && provider.keyServices.length > 0 && (
                    <div>
                        <div className="flex flex-wrap gap-1">
                            {provider.keyServices.slice(0, 2).map(service => (
                                <Badge key={service} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-1">
                                    {service}
                                </Badge>
                            ))}
                            {provider.keyServices.length > 2 && (
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                    +{provider.keyServices.length - 2} {tCard('more')}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Bio */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {provider.bio || tCard('noBioAvailable')}
                </p>
                
                {/* Completed Jobs */}
                {provider.completedJobs && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3" />
                        <span>{provider.completedJobs} {tCard('jobsCompleted')}</span>
                    </div>
                )}
            </CardContent>
            
            <CardFooter className="pt-2 space-y-2">
                <Button size="sm" className="w-full shadow-glow hover:shadow-glow/50 transition-all duration-300" asChild data-tour-highlight="contact-button">
                    <Link href={`/providers/${provider.uid}`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {tCard('viewProfile')}
                    </Link>
                </Button>
                
                {/* Quick Contact Options */}
                <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/providers/${provider.uid}?tab=messages`}>
                            <MessageCircle className="h-3 w-3 mr-1" />
                            {tCard('message')}
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/providers/${provider.uid}?tab=book`}>
                            <Calendar className="h-3 w-3 mr-1" />
                            {tCard('book')}
                        </Link>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
