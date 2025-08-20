
"use client";

import { useState, useEffect, useRef } from "react";
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
import type { EmblaCarouselType } from "embla-carousel-react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import { Megaphone, ArrowRight } from "lucide-react";


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
    const Autoplay = useRef<any>(null);

    useEffect(() => {
        import("embla-carousel-autoplay").then((plugin) => {
            Autoplay.current = plugin.default;
            if(api) {
                 api.reInit();
            }
        });
    }, [api]);


    useEffect(() => {
        const campaignsQuery = query(collection(db, "adCampaigns"), where("isActive", "==", true));
        const unsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdCampaign));
            setCampaigns(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching active ad campaigns:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <Skeleton className="h-48 w-full rounded-lg" />;
    }

    if (campaigns.length === 0) {
        return null; 
    }

    const AdCard = ({ campaign }: { campaign: AdCampaign }) => {
        const cardContent = (
            <Card className="overflow-hidden h-full flex group">
                <CardContent className="flex items-center gap-4 p-4 w-full">
                    <div className="relative h-24 w-24 flex-shrink-0">
                        {campaign.imageUrl ? (
                                <Image
                                src={campaign.imageUrl}
                                alt={campaign.name}
                                layout="fill"
                                className="object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
                            />
                        ) : (
                            <div className="h-full w-full bg-secondary rounded-md flex items-center justify-center">
                                <Megaphone className="h-8 w-8 text-muted-foreground"/>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                        <h3 className="text-base font-bold font-headline truncate">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">{campaign.description}</p>
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
    };


    return (
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
                         <Card className="overflow-hidden h-full flex flex-col items-center justify-center text-center bg-secondary">
                            <CardContent className="p-6">
                                <Megaphone className="h-10 w-10 mx-auto text-primary mb-2" />
                                <h3 className="text-lg font-bold font-headline">Advertise Your Business Here</h3>
                                <p className="text-sm text-muted-foreground mb-4">Reach thousands of potential customers daily.</p>
                                <Button asChild>
                                    <Link href="/contact-us">Contact Sales <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
        </Carousel>
    );
}
