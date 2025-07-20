
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Brush, Wrench, Sprout, Handshake, BriefcaseBusiness, UserCheck, Star, Sparkles, Building, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Logo = () => (
  <h1 className="text-3xl font-bold font-headline text-primary">
    Lingkod<span className="text-accent">PH</span>
  </h1>
);

const Header = () => (
  <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-16 items-center justify-between">
      <Link href="/" aria-label="Go to homepage">
        <Logo />
      </Link>
      <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
        <Link href="#features" className="transition-colors hover:text-primary">Features</Link>
        <Link href="#providers" className="transition-colors hover:text-primary">Providers</Link>
        <Link href="#join" className="transition-colors hover:text-primary">For Businesses</Link>
      </nav>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="border-t bg-secondary">
    <div className="container grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
        <div>
            <Logo />
            <p className="mt-2 text-muted-foreground text-sm">Your trusted partner for home & professional services in the Philippines.</p>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Company</h4>
            <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Careers</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Partners</Link></li>
            </ul>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Support</h4>
            <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Help Center</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Contact Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
            </ul>
        </div>
        <div>
             <h4 className="font-semibold mb-2">Stay Connected</h4>
             <div className="flex space-x-4">
                <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} Lingkod PH. All rights reserved.</p>
             </div>
        </div>
    </div>
  </footer>
);

const renderStars = (rating: number, keyPrefix: string) => {
    return Array(5).fill(0).map((_, i) => (
        <Star key={`${keyPrefix}-${i}`} className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
    ));
}

const testimonials = [
    { name: 'Maria C.', rating: 5, comment: "Booking an electrician through LingkodPH was a breeze! The provider was professional, on-time, and fixed the issue in no time. Highly recommended!", avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=300', hint: 'woman portrait' },
    { name: 'John D.', rating: 5, comment: "As a small business owner, finding reliable contractors was always a challenge. LingkodPH connected us with a fantastic team for our office renovation.", avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300', hint: 'man portrait' },
    { name: 'Anna S.', rating: 4, comment: "The platform is very user-friendly. I found a great weekly cleaning service that fits my budget. My only wish is for more providers in my specific area.", avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300', hint: 'woman smiling' },
];

const topProviders = [
    { name: 'Ricardo "Cardo" Gomez', specialty: 'Master Electrician', rating: 4.9, reviews: 128, avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=300', hint: 'man smiling', background: 'https://images.unsplash.com/photo-1487532322495-2c355823e595?q=80&w=600', bgHint: 'electrical tools' },
    { name: 'Elena Reyes', specialty: 'Deep Cleaning Specialist', rating: 4.8, reviews: 214, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300', hint: 'woman happy', background: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600', bgHint: 'cleaning supplies' },
    { name: 'Benny Tan', specialty: 'HVAC & Refrigeration Expert', rating: 4.9, reviews: 98, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300', hint: 'man portrait', background: 'https://images.unsplash.com/photo-1542438408-42a3ce919793?q=80&w=600', bgHint: 'air conditioner' },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p>Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-secondary">
            <div className="container relative z-10 grid items-center gap-6 pb-20 pt-16 md:py-28">
                <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
                    <Badge variant="default" className="py-2 px-4 rounded-full bg-primary/10 text-primary border-primary/20">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Connecting Clients, Empowering Businesses
                    </Badge>
                    <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-6xl">
                        Find Trusted Pros. Grow Your Business.
                    </h1>
                    <p className="max-w-2xl text-lg text-muted-foreground">
                        LingkodPH is the all-in-one platform for discovering reliable service providers and empowering businesses to thrive in the digital marketplace.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                    <Button size="lg" asChild><Link href="/signup">Find a Service Pro <ArrowRight className="ml-2" /></Link></Button>
                    <Button size="lg" variant="outline" asChild><Link href="#join">For Businesses & Providers</Link></Button>
                </div>
            </div>
        </section>

        {/* How It Works Section */}
        <section id="features" className="bg-background py-20">
            <div className="container">
                <div className="mx-auto mb-12 max-w-2xl text-center">
                    <h2 className="font-headline text-3xl font-bold">A Seamless Experience for Everyone</h2>
                    <p className="mt-2 text-muted-foreground">Whether you're hiring or providing a service, our process is simple and transparent.</p>
                </div>
                <Tabs defaultValue="client" className="w-full max-w-4xl mx-auto">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="client">For Clients</TabsTrigger>
                        <TabsTrigger value="provider">For Providers & Agencies</TabsTrigger>
                    </TabsList>
                    <TabsContent value="client" className="mt-8">
                        <div className="grid gap-8 md:grid-cols-3">
                            <Card className="bg-background/50 border-none shadow-none text-center">
                                <CardHeader><CardTitle>1. Search & Discover</CardTitle></CardHeader>
                                <CardContent><p className="text-muted-foreground">Browse profiles, read reviews, and find the perfect professional for your job.</p></CardContent>
                            </Card>
                            <Card className="bg-background/50 border-none shadow-none text-center">
                                <CardHeader><CardTitle>2. Book with Confidence</CardTitle></CardHeader>
                                <CardContent><p className="text-muted-foreground">Schedule services directly through our secure platform at a time that works for you.</p></CardContent>
                            </Card>
                            <Card className="bg-background/50 border-none shadow-none text-center">
                                <CardHeader><CardTitle>3. Job Done, Rate & Relax</CardTitle></CardHeader>
                                <CardContent><p className="text-muted-foreground">Enjoy top-quality service, then leave a review to help our community grow.</p></CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="provider" className="mt-8">
                         <div className="grid gap-8 md:grid-cols-3">
                            <Card className="bg-background/50 border-none shadow-none text-center">
                                <CardHeader><CardTitle>1. Create Your Profile</CardTitle></CardHeader>
                                <CardContent><p className="text-muted-foreground">Showcase your skills, services, and pricing to attract clients.</p></CardContent>
                            </Card>
                            <Card className="bg-background/50 border-none shadow-none text-center">
                                <CardHeader><CardTitle>2. Manage Bookings</CardTitle></CardHeader>
                                <CardContent><p className="text-muted-foreground">Use our dashboard to manage your schedule, communicate with clients, and send quotes.</p></CardContent>
                            </Card>
                            <Card className="bg-background/50 border-none shadow-none text-center">
                                <CardHeader><CardTitle>3. Grow Your Business</CardTitle></CardHeader>
                                <CardContent><p className="text-muted-foreground">Get paid securely, build your reputation with reviews, and access business analytics.</p></CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </section>

         {/* Top Providers Section */}
        <section id="providers" className="bg-secondary py-20">
            <div className="container">
                <div className="mx-auto mb-12 max-w-2xl text-center">
                    <h2 className="font-headline text-3xl font-bold">Meet Our Top-Rated Providers</h2>
                    <p className="mt-2 text-muted-foreground">A glimpse of the trusted and skilled professionals in our network.</p>
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
                                    <Link href="/signup">View Profile</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-background py-20">
            <div className="container">
                 <div className="mx-auto mb-12 max-w-2xl text-center">
                    <h2 className="font-headline text-3xl font-bold">What Our Community Says</h2>
                    <p className="mt-2 text-muted-foreground">Real stories from satisfied clients and successful providers.</p>
                </div>
                <div className="grid gap-8 lg:grid-cols-3">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="bg-secondary">
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
        <section id="join" className="bg-secondary py-20">
            <div className="container">
                <div className="relative rounded-xl overflow-hidden p-12 text-primary-foreground">
                    <Image src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1469" layout="fill" alt="Business team collaborating" className="object-cover" data-ai-hint="business team" />
                     <div className="absolute inset-0 bg-primary/80 mix-blend-multiply"></div>
                     <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h2 className="font-headline text-4xl font-bold">Ready to Grow Your Service Business?</h2>
                            <p className="mt-4 text-lg opacity-90">Whether you're an individual provider or a growing agency, LingkodPH provides the tools, visibility, and support you need to succeed.</p>
                        </div>
                        <div className="bg-background/20 backdrop-blur-sm p-8 rounded-lg">
                           <ul className="space-y-4 text-primary-foreground">
                               <li className="flex items-start gap-3">
                                   <div className="mt-1"><UserCheck className="h-5 w-5" /></div>
                                   <p><span className="font-semibold">For Individual Providers:</span> Build your reputation, manage bookings effortlessly, and connect with a steady stream of clients.</p>
                               </li>
                               <li className="flex items-start gap-3">
                                   <div className="mt-1"><Building className="h-5 w-5" /></div>
                                   <p><span className="font-semibold">For Agencies:</span> Onboard your team, manage multiple providers, and access powerful analytics to scale your operations.</p>
                               </li>
                           </ul>
                           <Button asChild variant="secondary" size="lg" className="mt-6 w-full text-primary-foreground bg-white hover:bg-white/90 text-primary">
                               <Link href="/signup">Join as a Provider or Agency</Link>
                           </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
