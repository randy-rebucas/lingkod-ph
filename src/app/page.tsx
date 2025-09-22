
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCheck, Star, Sparkles, Building, ArrowRight, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/logo';
import HomeClient from './home-client';
import { AdCarousel } from '@/components/ad-carousel';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Input } from '@/components/ui/input';

const Header = () => {
    const t = useTranslations('Navigation');

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-soft">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" aria-label="Go to homepage" className="flex items-center space-x-2">
                    <Logo />
                </Link>
                <nav className="hidden items-center space-x-8 text-sm font-medium md:flex">
                    <Link href="#features" className="transition-colors hover:text-primary relative group">
                        {t('home')}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                    </Link>
                    <Link href="#providers" className="transition-colors hover:text-primary relative group">
                        {t('providers')}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                    </Link>
                    <Link href="#join" className="transition-colors hover:text-primary relative group">
                        {t('forBusinesses')}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                    </Link>
                    <Link href="/about" className="transition-colors hover:text-primary relative group">
                        {t('about')}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                    </Link>
                    <Link href="/help-center" className="transition-colors hover:text-primary relative group">
                        {t('helpCenter')}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                    </Link>
                </nav>
                <div className="flex items-center space-x-3">
                    <LanguageSwitcher />
                    <Button variant="ghost" asChild className="hidden sm:inline-flex">
                        <Link href="/login">{t('login')}</Link>
                    </Button>
                    <Button asChild className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                        <Link href="/signup">{t('signup')}</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
};

const Footer = () => {
    const t = useTranslations('Footer');

    return (
        <footer className="border-t bg-gradient-to-b from-background to-muted/30">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-16">
                    <div className="space-y-4">
                        <Logo />
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                            Connecting communities with trusted local service providers across the Philippines.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-foreground">Company</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">{t('about')}</Link></li>
                            <li><Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors">{t('careers')}</Link></li>
                            <li><Link href="/partners" className="text-muted-foreground hover:text-primary transition-colors">{t('partners')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-foreground">{t('support')}</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/help-center" className="text-muted-foreground hover:text-primary transition-colors">{t('helpCenter')}</Link></li>
                            <li><Link href="/contact-us" className="text-muted-foreground hover:text-primary transition-colors">{t('contact')}</Link></li>
                            <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">{t('terms')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-foreground">{t('stayConnected')}</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                            Follow us for updates and community news.
                        </p>
                        <div className="flex space-x-4">

                            <Link href="https://www.facebook.com/localproasia/" className="h-8 w-8 p-0" target="_blank" rel="noopener noreferrer">
                                <span className="sr-only">Facebook</span>
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </Link>

                            <Link href="https://twitter.com/localpro_ph" className="h-8 w-8 p-0" target="_blank" rel="noopener noreferrer">
                                <span className="sr-only">Twitter</span>
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                </svg>
                            </Link>

                            <Link href="https://www.linkedin.com/company/localpro-ph" className="h-8 w-8 p-0" target="_blank" rel="noopener noreferrer">
                                <span className="sr-only">Linkedin</span>
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281h-1.297v1.297h1.297V7.707zm-3.323 1.297c.718 0 1.297.579 1.297 1.297s-.579 1.297-1.297 1.297-1.297-.579-1.297-1.297.579-1.297 1.297-1.297z" />
                                </svg>
                            </Link>

                        </div>
                    </div>
                </div>
                <div className="border-t pt-8 pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-muted-foreground text-sm">
                            &copy; {new Date().getFullYear()} LocalPro. {t('allRightsReserved')}
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                            <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                            <Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
                            <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

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
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleSearch = () => {
        if (searchQuery.trim()) {
            // Redirect to signup with search query as a parameter
            router.push(`/signup?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            // If no search query, just go to signup
            router.push('/signup');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <HomeClient>
            <div className="flex min-h-screen flex-col bg-background">
                <Header />
                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
                        {/* Background decoration */}
                        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>

                        <div className="container relative z-10">
                            <div className="max-w-4xl mx-auto text-center space-y-8">
                                <div className="space-y-4">
                                    <Badge variant="secondary" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20">
                                        <Sparkles className="h-4 w-4" />
                                        {t('badge')}
                                    </Badge>
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                                        {t('hero.title')}
                                    </h1>
                                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                        {t('hero.subtitle')}
                                    </p>
                                </div>

                                {/* Search Bar */}
                                <div className="max-w-2xl mx-auto">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            placeholder={t('hero.searchPlaceholder')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            className="w-full rounded-full h-14 pl-12 pr-4 shadow-soft border-2 focus:border-primary transition-colors text-base bg-background/80 backdrop-blur-sm"
                                        />
                                    </div>
                                </div>

                                {/* CTA Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    <Button onClick={handleSearch} size="lg" className="h-14 px-8 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                        {t('hero.cta')}
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                                        <Link href="#providers">Browse Providers</Link>
                                    </Button>
                                </div>

                                {/* Trust indicators */}
                                <div className="flex flex-wrap justify-center items-center gap-8 pt-8 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="h-4 w-4 text-primary" />
                                        <span>Verified Providers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-primary" />
                                        <span>5-Star Reviews</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4 text-primary" />
                                        <span>Secure Payments</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="container -mt-16 relative z-20">
                        <AdCarousel />
                    </section>

                    {/* How It Works Section */}
                    <section id="features" className="bg-gradient-to-b from-muted/50 to-background py-24 pt-36">
                        <div className="container">
                            <div className="mx-auto mb-16 max-w-3xl text-center">
                                <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">{t('seamlessExperience')}</h2>
                                <p className="text-xl text-muted-foreground leading-relaxed">{t('seamlessDescription')}</p>
                            </div>
                            <Tabs defaultValue="client" className="w-full max-w-6xl mx-auto">
                                <TabsList className="grid w-full grid-cols-2 mb-12 bg-background/80 backdrop-blur-sm border shadow-soft">
                                    <TabsTrigger value="client" className="text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        {t('forClients')}
                                    </TabsTrigger>
                                    <TabsTrigger value="provider" className="text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        {t('forProviders')}
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="client" className="mt-8">
                                    <div className="grid gap-8 lg:grid-cols-3">
                                        <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
                                            <CardHeader className="pb-4">
                                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                                    <UserCheck className="h-8 w-8 text-primary" />
                                                </div>
                                                <CardTitle className="text-xl font-semibold">{t('searchDiscover')}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground leading-relaxed">{t('searchDiscoverDesc')}</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
                                            <CardHeader className="pb-4">
                                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                                    <Star className="h-8 w-8 text-primary" />
                                                </div>
                                                <CardTitle className="text-xl font-semibold">{t('bookConfidence')}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground leading-relaxed">{t('bookConfidenceDesc')}</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
                                            <CardHeader className="pb-4">
                                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                                    <Sparkles className="h-8 w-8 text-primary" />
                                                </div>
                                                <CardTitle className="text-xl font-semibold">{t('jobDone')}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground leading-relaxed">{t('jobDoneDesc')}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                                <TabsContent value="provider" className="mt-8">
                                    <div className="grid gap-8 lg:grid-cols-3">
                                        <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
                                            <CardHeader className="pb-4">
                                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                                    <Building className="h-8 w-8 text-primary" />
                                                </div>
                                                <CardTitle className="text-xl font-semibold">{t('createProfile')}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground leading-relaxed">{t('createProfileDesc')}</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
                                            <CardHeader className="pb-4">
                                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                                    <UserCheck className="h-8 w-8 text-primary" />
                                                </div>
                                                <CardTitle className="text-xl font-semibold">{t('manageBookings')}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground leading-relaxed">{t('manageBookingsDesc')}</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
                                            <CardHeader className="pb-4">
                                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                                    <ArrowRight className="h-8 w-8 text-primary" />
                                                </div>
                                                <CardTitle className="text-xl font-semibold">{t('growBusiness')}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground leading-relaxed">{t('growBusinessDesc')}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </section>

                    {/* Top Providers Section */}
                    <section id="providers" className="bg-gradient-to-b from-background to-muted/30 py-24">
                        <div className="container">
                            <div className="mx-auto mb-16 max-w-3xl text-center">
                                <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">{t('topProviders')}</h2>
                                <p className="text-xl text-muted-foreground leading-relaxed">{t('topProvidersDesc')}</p>
                            </div>
                            <div className="grid gap-8 lg:grid-cols-3">
                                {topProviders.map((provider, index) => (
                                    <Card key={provider.name} className="group overflow-hidden bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-500 hover:-translate-y-3">
                                        <div className="relative h-48 overflow-hidden">
                                            <Image
                                                src={provider.background}
                                                alt={provider.specialty}
                                                layout="fill"
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                data-ai-hint={provider.bgHint}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                            <div className="absolute top-4 right-4">
                                                <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
                                                    Top Rated
                                                </Badge>
                                            </div>
                                            <Avatar className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-28 w-28 border-4 border-background ring-4 ring-primary/20 shadow-glow">
                                                <AvatarImage src={provider.avatar} alt={provider.name} data-ai-hint={provider.hint} />
                                                <AvatarFallback className="text-lg font-semibold">{provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <CardContent className="text-center p-8 pt-20">
                                            <CardTitle className="text-xl font-semibold mb-2">{provider.name}</CardTitle>
                                            <CardDescription className="text-base mb-4">{provider.specialty}</CardDescription>
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                {renderStars(provider.rating, provider.name)}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-6">{provider.rating} stars ({provider.reviews} reviews)</p>
                                            <Button asChild variant="default" className="w-full shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                                <Link href="/signup">{t('viewProfile')}</Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* View All Providers CTA */}
                            <div className="text-center mt-12">
                                <Button asChild size="lg" variant="outline" className="h-12 px-8 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                                    <Link href="/providers">View All Providers</Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Testimonials Section */}
                    <section className="bg-gradient-to-b from-muted/30 to-muted py-24">
                        <div className="container">
                            <div className="mx-auto mb-16 max-w-3xl text-center">
                                <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">{t('communitySays')}</h2>
                                <p className="text-xl text-muted-foreground leading-relaxed">{t('communitySaysDesc')}</p>
                            </div>
                            <div className="grid gap-8 lg:grid-cols-3">
                                {testimonials.map((testimonial, index) => (
                                    <Card key={index} className="group bg-background/80 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2">
                                        <CardContent className="p-8">
                                            <div className="flex items-center mb-6">
                                                <Avatar className="h-16 w-16 mr-4 ring-2 ring-primary/20">
                                                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.hint} />
                                                    <AvatarFallback className="text-lg font-semibold">{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-lg">{testimonial.name}</p>
                                                    <div className="flex mt-1">{renderStars(testimonial.rating, testimonial.name)}</div>
                                                </div>
                                            </div>
                                            <blockquote className="text-muted-foreground leading-relaxed text-base italic">
                                                "{testimonial.comment}"
                                            </blockquote>
                                            <div className="mt-4 flex justify-end">
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <span className="text-primary text-lg">"</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>


                    {/* Join Platform Section (B2B2C CTA) */}
                    <section id="join" className="bg-gradient-to-br from-primary via-primary to-primary/80 py-24 relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

                        <div className="container relative z-10">
                            <div className="relative rounded-3xl overflow-hidden p-12 lg:p-16 text-white shadow-2xl">
                                <Image
                                    src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1469"
                                    layout="fill"
                                    alt="Business team collaborating"
                                    className="object-cover"
                                    data-ai-hint="business team"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/70"></div>
                                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                                    <div className="space-y-6">
                                        <h2 className="font-headline text-4xl font-bold md:text-5xl lg:text-6xl leading-tight">
                                            {t('growBusinessTitle')}
                                        </h2>
                                        <p className="text-xl opacity-90 leading-relaxed">
                                            {t('growBusinessSubtitle')}
                                        </p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md p-8 lg:p-10 rounded-2xl border border-white/20">
                                        <ul className="space-y-6 mb-8">
                                            <li className="flex items-start gap-4">
                                                <div className="mt-1 p-2 bg-white/20 rounded-lg">
                                                    <UserCheck className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-lg mb-1">{t('individualProviders')}</p>
                                                    <p className="opacity-90">{t('individualProvidersDesc')}</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-4">
                                                <div className="mt-1 p-2 bg-white/20 rounded-lg">
                                                    <Building className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-lg mb-1">{t('agencies')}</p>
                                                    <p className="opacity-90">{t('agenciesDesc')}</p>
                                                </div>
                                            </li>
                                        </ul>
                                        <Button asChild variant="secondary" size="lg" className="w-full h-14 text-lg bg-white/20 hover:bg-white/30 border-white/30 text-white shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                            <Link href="/signup">{t('joinProvider')}</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </HomeClient>
    );
}
