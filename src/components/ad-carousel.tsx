
"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { EmblaCarouselType } from "embla-carousel-react";

import { Skeleton } from "./ui/skeleton";

type AdCampaign = {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
};

export function AdCarousel() {
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [api, setApi] = useState<CarouselApi>()
    const Autoplay = useRef<any>(null);

    useEffect(() => {
        import("embla-carousel-autoplay").then((plugin) => {
            Autoplay.current = plugin.default;
            // When the plugin is loaded, we can initialize the carousel
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
        return null; // Don't render anything if there are no active campaigns
    }

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
                        <div className="p-1">
                            <Card className="overflow-hidden">
                                <CardContent className="relative flex aspect-video items-center justify-center p-0">
                                    {campaign.imageUrl && (
                                        <Image
                                            src={campaign.imageUrl}
                                            alt={campaign.name}
                                            layout="fill"
                                            className="object-cover"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                    <div className="absolute bottom-0 left-0 p-6 text-white">
                                        <h3 className="text-xl font-bold font-headline">{campaign.name}</h3>
                                        <p className="text-sm opacity-90 line-clamp-2">{campaign.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
        </Carousel>
    );
}
