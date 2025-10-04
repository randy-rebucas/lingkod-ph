
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCheck, Star, Sparkles, Building, ArrowRight, Megaphone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/logo';
import HomeClient from './home-client';
import { AdCarousel } from '@/components/ad-carousel';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Header = () => {
  const t = useTranslations('Navigation');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="Go to homepage" className="flex items-center">
          <Logo />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-8 text-sm font-medium lg:flex" role="navigation" aria-label="Main navigation">
          <Link href="#features" className="transition-colors hover:text-primary relative group">
            {t('home')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <Link href="/our-services" className="transition-colors hover:text-primary relative group">
            {t('services')}
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

        {/* Desktop Actions */}
        <div className="hidden items-center space-x-3 lg:flex">
          <LanguageSwitcher />
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">{t('login')}</Link>
          </Button>
          <Button asChild className="shadow-sm hover:shadow-md transition-all duration-200">
            <Link href="/signup">{t('signup')}</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center space-x-2 lg:hidden">
          <LanguageSwitcher />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-6 mt-6">
                <nav className="flex flex-col space-y-4" role="navigation" aria-label="Mobile navigation">
                  <Link 
                    href="#features" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('home')}
                  </Link>
                  <Link 
                    href="/our-services" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('services')}
                  </Link>
                  <Link 
                    href="#providers" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('providers')}
                  </Link>
                  <Link 
                    href="#join" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('forBusinesses')}
                  </Link>
                  <Link 
                    href="/about" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('about')}
                  </Link>
                  <Link 
                    href="/help-center" 
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('helpCenter')}
                  </Link>
                </nav>
                <div className="flex flex-col space-y-3 pt-6 border-t">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      {t('login')}
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      {t('signup')}
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
            <ul className="space-y-3 text-sm" role="list">
              <li><Link href="/our-services" className="text-muted-foreground hover:text-primary transition-colors">{t('services')}</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">{t('about')}</Link></li>
              <li><Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors">{t('careers')}</Link></li>
              <li><Link href="/partners" className="text-muted-foreground hover:text-primary transition-colors">{t('partners')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t('support')}</h4>
            <ul className="space-y-3 text-sm" role="list">
              <li><Link href="/help-center" className="text-muted-foreground hover:text-primary transition-colors">{t('helpCenter')}</Link></li>
              <li><Link href="/contact-us" className="text-muted-foreground hover:text-primary transition-colors">{t('contact')}</Link></li>
              <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">{t('terms')}</Link></li>
              <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t('stayConnected')}</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Follow us for updates and community news.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281h-1.297v1.297h1.297V7.707zm-3.323 1.297c.718 0 1.297.579 1.297 1.297s-.579 1.297-1.297 1.297-1.297-.579-1.297-1.297.579-1.297 1.297-1.297z"/>
                  </svg>
                </a>
              </Button>
            </div>
            <div className="space-y-2 text-sm mt-4">
              <p className="text-muted-foreground">📧 admin@localpro.asia</p>
              <p className="text-muted-foreground">📞 +639179157515</p>
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
    
    return (
        <HomeClient>
            <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
                    {/* Background decorative elements */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    
                    <div className="container relative z-10 grid items-center gap-8 pb-24 pt-20 md:py-32">
                        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
                            <Badge variant="default" className="py-3 px-6 rounded-full bg-primary/10 text-primary border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
                                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                                {t('heroBadge')}
                            </Badge>
                            <h1 className="font-headline text-5xl font-bold tracking-tighter md:text-7xl lg:text-8xl bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent animate-slide-up">
                                {t('heroTitle')}
                            </h1>
                            <p className="max-w-3xl text-xl text-muted-foreground leading-relaxed animate-slide-up delay-200">
                                {t('heroDescription')}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 animate-slide-up delay-300">
                            <Button size="lg" asChild className="h-14 px-8 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                                <Link href="/signup">
                                    {t('heroCtaPrimary')} <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105">
                                <Link href="#join">{t('heroCtaSecondary')}</Link>
                            </Button>
                        </div>
                        
                        {/* Trust indicators */}
                        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-muted-foreground animate-fade-in delay-500">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>10,000+ Happy Customers</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                                <span>500+ Verified Providers</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-500"></div>
                                <span>4.9/5 Average Rating</span>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Ad Carousel Section */}
                <section className="container -mt-20 relative z-20 mb-16">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                            <Megaphone className="h-4 w-4" />
                            Featured Partners
                        </div>
                        <h2 className="font-headline text-3xl font-bold md:text-4xl mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                            Trusted by Leading Businesses
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Discover our featured partners and see how they&apos;re growing their business with LocalPro
                        </p>
                    </div>
                    <AdCarousel />
                </section>

                {/* How It Works Section */}
                <section id="features" className="bg-gradient-to-b from-muted/50 to-background py-24 pt-32 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
                    
                    <div className="container relative z-10">
                        <div className="mx-auto mb-20 max-w-4xl text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                                <Sparkles className="h-4 w-4" />
                                How It Works
                            </div>
                            <h2 className="font-headline text-4xl font-bold md:text-6xl mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                {t('seamlessExperience')}
                            </h2>
                            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">{t('seamlessDescription')}</p>
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
                                    <Card className="group bg-background/70 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 text-center p-8 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <CardHeader className="pb-4 relative z-10">
                                            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                                                <UserCheck className="h-10 w-10 text-primary" />
                                            </div>
                                            <CardTitle className="text-2xl font-bold mb-2">{t('searchDiscover')}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="relative z-10">
                                            <p className="text-muted-foreground leading-relaxed text-lg">{t('searchDiscoverDesc')}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="group bg-background/70 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 text-center p-8 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <CardHeader className="pb-4 relative z-10">
                                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                                                <Star className="h-10 w-10 text-blue-600" />
                                            </div>
                                            <CardTitle className="text-2xl font-bold mb-2">{t('bookConfidence')}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="relative z-10">
                                            <p className="text-muted-foreground leading-relaxed text-lg">{t('bookConfidenceDesc')}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="group bg-background/70 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 text-center p-8 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <CardHeader className="pb-4 relative z-10">
                                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                                                <Sparkles className="h-10 w-10 text-purple-600" />
                                            </div>
                                            <CardTitle className="text-2xl font-bold mb-2">{t('jobDone')}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="relative z-10">
                                            <p className="text-muted-foreground leading-relaxed text-lg">{t('jobDoneDesc')}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                            <TabsContent value="provider" className="mt-8">
                                <div className="grid gap-8 lg:grid-cols-3">
                                    <Card className="group bg-background/70 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 text-center p-8 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <CardHeader className="pb-4 relative z-10">
                                            <div className="w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                                                <Building className="h-10 w-10 text-green-600" />
                                            </div>
                                            <CardTitle className="text-2xl font-bold mb-2">{t('createProfile')}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="relative z-10">
                                            <p className="text-muted-foreground leading-relaxed text-lg">{t('createProfileDesc')}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="group bg-background/70 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 text-center p-8 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <CardHeader className="pb-4 relative z-10">
                                            <div className="w-20 h-20 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                                                <UserCheck className="h-10 w-10 text-orange-600" />
                                            </div>
                                            <CardTitle className="text-2xl font-bold mb-2">{t('manageBookings')}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="relative z-10">
                                            <p className="text-muted-foreground leading-relaxed text-lg">{t('manageBookingsDesc')}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="group bg-background/70 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 text-center p-8 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <CardHeader className="pb-4 relative z-10">
                                            <div className="w-20 h-20 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                                                <ArrowRight className="h-10 w-10 text-red-600" />
                                            </div>
                                            <CardTitle className="text-2xl font-bold mb-2">{t('growBusiness')}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="relative z-10">
                                            <p className="text-muted-foreground leading-relaxed text-lg">{t('growBusinessDesc')}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </section>

                {/* Top Providers Section */}
                <section id="providers" className="bg-gradient-to-b from-background to-muted/30 py-24 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>
                    <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
                    
                    <div className="container relative z-10">
                        <div className="mx-auto mb-20 max-w-4xl text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                                <Star className="h-4 w-4" />
                                Featured Providers
                            </div>
                            <h2 className="font-headline text-4xl font-bold md:text-6xl mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                {t('topProviders')}
                            </h2>
                            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">{t('topProvidersDesc')}</p>
                        </div>
                        <div className="grid gap-8 lg:grid-cols-3">
                            {topProviders.map((provider, _index) => (
                                <Card key={provider.name} className="group overflow-hidden bg-background/80 backdrop-blur-sm border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-700 hover:-translate-y-4 relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative h-56 overflow-hidden">
                                        <Image 
                                            src={provider.background} 
                                            alt={provider.specialty} 
                                            layout="fill" 
                                            className="object-cover group-hover:scale-110 transition-transform duration-700" 
                                            data-ai-hint={provider.bgHint} 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <div className="absolute top-4 right-4">
                                            <Badge className="bg-primary/95 text-primary-foreground backdrop-blur-sm shadow-lg">
                                                ⭐ Top Rated
                                            </Badge>
                                        </div>
                                        <Avatar className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-32 w-32 border-4 border-background ring-4 ring-primary/30 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                                            <AvatarImage src={provider.avatar} alt={provider.name} data-ai-hint={provider.hint} />
                                            <AvatarFallback className="text-xl font-bold">{provider.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <CardContent className="text-center p-8 pt-24 relative z-10">
                                        <CardTitle className="text-2xl font-bold mb-3">{provider.name}</CardTitle>
                                        <CardDescription className="text-lg mb-6 font-medium">{provider.specialty}</CardDescription>
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            {renderStars(provider.rating, provider.name)}
                                        </div>
                                        <p className="text-base text-muted-foreground mb-8 font-medium">{provider.rating} stars ({provider.reviews} reviews)</p>
                                        <Button asChild variant="default" className="w-full h-12 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
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
                <section className="bg-gradient-to-b from-muted/30 to-muted py-24 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>
                    <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
                    
                    <div className="container relative z-10">
                        <div className="mx-auto mb-20 max-w-4xl text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                                <Star className="h-4 w-4" />
                                Customer Reviews
                            </div>
                            <h2 className="font-headline text-4xl font-bold md:text-6xl mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                {t('communitySays')}
                            </h2>
                            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">{t('communitySaysDesc')}</p>
                        </div>
                        <div className="grid gap-8 lg:grid-cols-3">
                            {testimonials.map((testimonial, _index) => (
                                <Card key={_index} className="group bg-background/90 backdrop-blur-sm border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <CardContent className="p-8 relative z-10">
                                        <div className="flex items-center mb-8">
                                            <Avatar className="h-20 w-20 mr-6 ring-4 ring-primary/20 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                                <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.hint} />
                                                <AvatarFallback className="text-xl font-bold">{testimonial.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-xl mb-2">{testimonial.name}</p>
                                                <div className="flex">{renderStars(testimonial.rating, testimonial.name)}</div>
                                            </div>
                                        </div>
                                        <blockquote className="text-muted-foreground leading-relaxed text-lg italic relative">
                                            <div className="absolute -top-2 -left-2 text-4xl text-primary/20 font-serif">&ldquo;</div>
                                            {testimonial.comment}
                                            <div className="absolute -bottom-4 -right-2 text-4xl text-primary/20 font-serif">&rdquo;</div>
                                        </blockquote>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>


                {/* Join Platform Section (B2B2C CTA) */}
                <section id="join" className="bg-gradient-to-br from-primary via-primary to-primary/80 py-32 relative overflow-hidden">
                    {/* Enhanced background decoration */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
                    
                    <div className="container relative z-10">
                        <div className="relative rounded-3xl overflow-hidden p-12 lg:p-20 text-white shadow-2xl border border-white/20">
                            <Image 
                                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1469" 
                                layout="fill" 
                                alt="Business team collaborating" 
                                className="object-cover" 
                                data-ai-hint="business team" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/75"></div>
                            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                                <div className="space-y-8">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                                        <Sparkles className="h-4 w-4" />
                                        Join Our Community
                                    </div>
                                    <h2 className="font-headline text-5xl font-bold md:text-6xl lg:text-7xl leading-tight bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                                        {t('growBusinessTitle')}
                                    </h2>
                                    <p className="text-2xl opacity-95 leading-relaxed max-w-2xl">
                                        {t('growBusinessSubtitle')}
                                    </p>
                                </div>
                                <div className="bg-white/15 backdrop-blur-lg p-10 lg:p-12 rounded-3xl border border-white/30 shadow-2xl">
                                    <ul className="space-y-8 mb-10">
                                        <li className="flex items-start gap-6">
                                            <div className="mt-2 p-3 bg-white/25 rounded-xl shadow-lg">
                                                <UserCheck className="h-8 w-8 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-xl mb-2">{t('individualProviders')}</p>
                                                <p className="opacity-95 text-lg leading-relaxed">{t('individualProvidersDesc')}</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-6">
                                            <div className="mt-2 p-3 bg-white/25 rounded-xl shadow-lg">
                                                <Building className="h-8 w-8 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-xl mb-2">{t('agencies')}</p>
                                                <p className="opacity-95 text-lg leading-relaxed">{t('agenciesDesc')}</p>
                                            </div>
                                        </li>
                                    </ul>
                                    <Button asChild variant="secondary" size="lg" className="w-full h-16 text-xl font-bold bg-white/25 hover:bg-white/35 border-white/40 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
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
