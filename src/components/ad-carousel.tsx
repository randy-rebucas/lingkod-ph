
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { Megaphone, ArrowRight, Star, ExternalLink } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useErrorHandler } from '@/hooks/use-error-handler';


type AdCampaign = {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    socialLink?: string;
};

export function AdCarousel() {
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)
    const Autoplay = useRef<any>(null);
    const t = useTranslations('AdCarousel');
    const { handleError } = useErrorHandler();

    useEffect(() => {
        import("embla-carousel-autoplay").then((plugin) => {
            Autoplay.current = plugin.default;
            if(api) {
                 api.reInit();
            }
        });
    }, [api]);

    useEffect(() => {
        if (!api) {
            return
        }

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap() + 1)

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1)
        })
    }, [api]);


    useEffect(() => {
        if (!db) return;
        const campaignsQuery = query(collection(db, "adCampaigns"), where("isActive", "==", true));
        const unsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdCampaign));
            setCampaigns(data);
            setLoading(false);
        }, (error) => {
            handleError(error, 'fetch ad campaigns');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [handleError]);

    if (loading) {
        return <Skeleton className="h-48 w-full rounded-lg" />;
    }

    if (campaigns.length === 0) {
        return null; 
    }

    const AdCard = useCallback(({ campaign }: { campaign: AdCampaign }) => {
        const cardContent = (
            <Card className="overflow-hidden h-full flex group bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="flex items-center gap-6 p-6 w-full relative z-10">
                    <div className="relative h-20 w-20 flex-shrink-0">
                        {campaign.imageUrl ? (
                            <div className="relative h-full w-full rounded-xl overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                                <Image
                                    src={campaign.imageUrl}
                                    alt={campaign.name}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            </div>
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                                <Megaphone className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300"/>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2 overflow-hidden flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold font-headline truncate">{campaign.name}</h3>
                            {campaign.socialLink && (
                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{campaign.description}</p>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );

        if (campaign.socialLink) {
            return (
                <Link href={campaign.socialLink} target="_blank" rel="noopener noreferrer" className="h-full block">
                    {cardContent}
                </Link>
            )
        }
        return cardContent;
    }, []);


    return (
        <div className="relative">
            <Carousel
                setApi={setApi}
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={Autoplay.current ? [Autoplay.current({ delay: 5000, stopOnInteraction: true })] : []}
                className="w-full"
            >
                <CarouselContent>
                    {campaigns.map((campaign) => (
                        <CarouselItem key={campaign.id} className="md:basis-1/2 lg:basis-1/3">
                            <div className="p-1 h-full">
                               <AdCard campaign={campaign} />
                            </div>
                        </CarouselItem>
                    ))}
                     <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1 h-full">
                             <Card className="overflow-hidden h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <CardContent className="p-8 relative z-10">
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Megaphone className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold font-headline mb-3">{t('advertiseYourBusiness')}</h3>
                                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{t('reachThousandsOfCustomers')}</p>
                                    <Button asChild className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                        <Link href="/contact-us">{t('contactSales')} <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex -left-12 bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl hover:bg-background transition-all duration-300" />
                <CarouselNext className="hidden sm:flex -right-12 bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl hover:bg-background transition-all duration-300" />
            </Carousel>
            
            {/* Custom Dot Indicators */}
            {count > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                    {Array.from({ length: count }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => api?.scrollTo(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === current - 1
                                    ? 'bg-primary scale-125 shadow-lg'
                                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

