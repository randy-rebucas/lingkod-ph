
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCheck, Star, Sparkles, Building, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { AdCarousel } from '@/components/ad-carousel';
import HomeClient from '../home-client';


const renderStars = (rating: number, keyPrefix: string) => {
    return Array(5).fill(0).map((_, i) => (
        <Star key={`${keyPrefix}-${i}`} className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
    ));
}

const testimonials = [
    { name: 'Maria C.', rating: 5, comment: "Booking an electrician through LocalPro was a breeze! The provider was professional, on-time, and fixed the issue in no time. Highly recommended!", avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=2070', hint: 'woman portrait' },
    { name: 'John D.', rating: 5, comment: "As a small business owner, finding reliable contractors was always a challenge. LocalPro connected us with a fantastic team for our office renovation.", avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887', hint: 'man portrait' },
    { name: 'Anna S.', rating: 4, comment: "The platform is very user-friendly. I found a great weekly cleaning service that fits my budget. My only wish is for more providers in my specific area.", avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887', hint: 'woman smiling' },
];

const topProviders = [
    { name: 'Ricardo "Cardo" Gomez', specialty: 'Master Electrician', rating: 4.9, reviews: 128, avatar: 'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=2071', hint: 'man smiling', background: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069', bgHint: 'electrical wiring' },
    { name: 'Elena Reyes', specialty: 'Deep Cleaning Specialist', rating: 4.8, reviews: 214, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961', hint: 'woman happy', background: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070', bgHint: 'person cleaning' },
    { name: 'Benny Tan', specialty: 'HVAC & Refrigeration Expert', rating: 4.9, reviews: 98, avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070', hint: 'man portrait', background: 'https://images.unsplash.com/photo-1581822261290-991b38693d1b?q=80&w=2070', bgHint: 'air conditioner repair' },
];


export default function HomePage() {
    const t = useTranslations('HomePage');
    
    return (
        <HomeClient>
        <>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-background">
                <div className="container relative z-10 grid items-center gap-6 pb-20 pt-16 md:py-28">
                    <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
                        <Badge variant="default" className="py-2 px-4 rounded-full bg-primary/10 text-primary border-primary/20">
                            <Sparkles className="mr-2 h-4 w-4" />
                            {t('badge')}
                        </Badge>
                        <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-6xl">
                            {t('hero.title')}
                        </h1>
                        <p className="max-w-2xl text-lg text-muted-foreground">
                            {t('hero.subtitle')}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                        <Button size="lg" asChild><Link href="/signup">{t('hero.cta')} <ArrowRight className="ml-2" /></Link></Button>
                        <Button size="lg" variant="outline" asChild><Link href="#join">{t('forBusinesses')} & {t('providers')}</Link></Button>
                    </div>
                </div>
            </section>
            
            <section className="container -mt-16 relative z-20">
                <AdCarousel />
            </section>

            {/* How It Works Section */}
            <section id="features" className="bg-muted py-20 pt-32">
                <div className="container">
                    <div className="mx-auto mb-12 max-w-2xl text-center">
                        <h2 className="font-headline text-3xl font-bold">{t('seamlessExperience')}</h2>
                        <p className="mt-2 text-muted-foreground">{t('seamlessDescription')}</p>
                    </div>
                    <Tabs defaultValue="client" className="w-full max-w-4xl mx-auto">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="client">{t('forClients')}</TabsTrigger>
                            <TabsTrigger value="provider">{t('forProviders')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="client" className="mt-8">
                            <div className="grid gap-8 md:grid-cols-3">
                                <Card className="bg-background/50 border-none shadow-none text-center">
                                    <CardHeader><CardTitle>{t('searchDiscover')}</CardTitle></CardHeader>
                                    <CardContent><p className="text-muted-foreground">{t('searchDiscoverDesc')}</p></CardContent>
                                </Card>
                                <Card className="bg-background/50 border-none shadow-none text-center">
                                    <CardHeader><CardTitle>{t('bookConfidence')}</CardTitle></CardHeader>
                                    <CardContent><p className="text-muted-foreground">{t('bookConfidenceDesc')}</p></CardContent>
                                </Card>
                                <Card className="bg-background/50 border-none shadow-none text-center">
                                    <CardHeader><CardTitle>{t('jobDone')}</CardTitle></CardHeader>
                                    <CardContent><p className="text-muted-foreground">{t('jobDoneDesc')}</p></CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        <TabsContent value="provider" className="mt-8">
                            <div className="grid gap-8 md:grid-cols-3">
                                <Card className="bg-background/50 border-none shadow-none text-center">
                                    <CardHeader><CardTitle>{t('createProfile')}</CardTitle></CardHeader>
                                    <CardContent><p className="text-muted-foreground">{t('createProfileDesc')}</p></CardContent>
                                </Card>
                                <Card className="bg-background/50 border-none shadow-none text-center">
                                    <CardHeader><CardTitle>{t('manageBookings')}</CardTitle></CardHeader>
                                    <CardContent><p className="text-muted-foreground">{t('manageBookingsDesc')}</p></CardContent>
                                </Card>
                                <Card className="bg-background/50 border-none shadow-none text-center">
                                    <CardHeader><CardTitle>{t('growBusiness')}</CardTitle></CardHeader>
                                    <CardContent><p className="text-muted-foreground">{t('growBusinessDesc')}</p></CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>

            {/* Top Providers Section */}
            <section id="providers" className="bg-background py-20">
                <div className="container">
                    <div className="mx-auto mb-12 max-w-2xl text-center">
                        <h2 className="font-headline text-3xl font-bold">{t('topProviders')}</h2>
                        <p className="mt-2 text-muted-foreground">{t('topProvidersDesc')}</p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        {topProviders.map(provider => (
                            <Card key={provider.name} className="overflow-hidden transform-gpu transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group">
                                <div className="relative h-40">
                                    <Image src={provider.background} alt={provider.specialty} layout="fill" className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={provider.bgHint} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <Avatar className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-24 w-24 border-4 border-background ring-2 ring-primary">
                                        <AvatarImage src={provider.avatar} alt={provider.name} data-ai-hint={provider.hint} />
                                        <AvatarFallback>{provider.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <CardContent className="text-center p-6 pt-16">
                                <CardTitle>{provider.name}</CardTitle>
                                    <CardDescription>{provider.specialty}</CardDescription>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        {renderStars(provider.rating, provider.name)}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{provider.rating} stars ({provider.reviews} reviews)</p>
                                                                 <Button asChild variant="secondary" className="mt-4">
                                         <Link href="/signup">{t('viewProfile')}</Link>
                                     </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="bg-muted py-20">
                <div className="container">
                    <div className="mx-auto mb-12 max-w-2xl text-center">
                        <h2 className="font-headline text-3xl font-bold">{t('communitySays')}</h2>
                        <p className="mt-2 text-muted-foreground">{t('communitySaysDesc')}</p>
                    </div>
                    <div className="grid gap-8 lg:grid-cols-3">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="bg-background">
                                <CardContent className="p-6">
                                    <div className="flex items-center mb-4">
                                        <Avatar className="h-12 w-12 mr-4">
                                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.hint} />
                                            <AvatarFallback>{testimonial.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{testimonial.name}</p>
                                            <div className="flex">{renderStars(testimonial.rating, testimonial.name)}</div>
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground">"{testimonial.comment}"</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>


            {/* Join Platform Section (B2B2C CTA) */}
            <section id="join" className="bg-background py-20">
                <div className="container">
                    <div className="relative rounded-xl overflow-hidden p-12 text-white">
                        <Image src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1469" layout="fill" alt="Business team collaborating" className="object-cover" data-ai-hint="business team" />
                        <div className="absolute inset-0 bg-primary/80 mix-blend-multiply"></div>
                        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                                                             <div>
                                 <h2 className="font-headline text-4xl font-bold">{t('growBusinessTitle')}</h2>
                                 <p className="mt-4 text-lg opacity-90">{t('growBusinessSubtitle')}</p>
                             </div>
                             <div className="bg-black/20 backdrop-blur-sm p-8 rounded-lg">
                             <ul className="space-y-4">
                                 <li className="flex items-start gap-3">
                                     <div className="mt-1"><UserCheck className="h-5 w-5 text-white" /></div>
                                     <p><span className="font-semibold">{t('individualProviders')}</span> {t('individualProvidersDesc')}</p>
                                 </li>
                                 <li className="flex items-start gap-3">
                                     <div className="mt-1"><Building className="h-5 w-5 text-white" /></div>
                                     <p><span className="font-semibold">{t('agencies')}</span> {t('agenciesDesc')}</p>
                                 </li>
                             </ul>
                             <Button asChild variant="secondary" size="lg" className="mt-6 w-full text-white bg-white/20 hover:bg-white/30">
                                 <Link href="/signup">{t('joinProvider')}</Link>
                             </Button>
                             </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
        </HomeClient>
    );
}
