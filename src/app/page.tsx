
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Brush, Wrench, Sprout, Handshake, BriefcaseBusiness, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
        <Link href="#services" className="transition-colors hover:text-primary">Services</Link>
        <Link href="/signup" className="transition-colors hover:text-primary">For Providers</Link>
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
  <footer className="border-t">
    <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
      <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
        <Logo />
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built to connect you with reliable services.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Lingkod PH. All rights reserved.</p>
    </div>
  </footer>
);

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  const services = [
    { name: 'Cleaning', icon: <Brush className="h-8 w-8" />, hint: "cleaning services" },
    { name: 'Repairs', icon: <Wrench className="h-8 w-8" />, hint: "home repair" },
    { name: 'Gardening', icon: <Sprout className="h-8 w-8" />, hint: "gardening landscaping" },
    { name: 'Consulting', icon: <Handshake className="h-8 w-8" />, hint: "business consultant" },
    { name: 'Professional', icon: <BriefcaseBusiness className="h-8 w-8" />, hint: "professional services" },
    { name: 'Personal Care', icon: <UserCheck className="h-8 w-8" />, hint: "personal care" },
  ];

  const howItWorks = [
    { title: "Search for a Service", description: "Find the right professional by searching our diverse categories.", icon: <Search className="h-10 w-10 text-primary" /> },
    { title: "Book and Schedule", description: "Choose a provider, select a time that works for you, and book instantly.", icon: <BriefcaseBusiness className="h-10 w-10 text-primary" /> },
    { title: "Get the Job Done", description: "Your chosen provider arrives and completes the service to your satisfaction.", icon: <UserCheck className="h-10 w-10 text-primary" /> }
  ];

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-secondary to-background">
          <div className="container grid items-center gap-6 pb-20 pt-10 md:py-20">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
              <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-6xl">
                Your Trusted Partner for <span className="text-primary">Home & Professional</span> Services
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Easily find and book reliable service providers in the Philippines. From cleaning and repairs to professional consulting, we've got you covered.
              </p>
            </div>
            <div className="mx-auto mt-4 w-full max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search for a service (e.g., 'plumber')" className="w-full rounded-full bg-background py-7 pl-12 pr-28 shadow-lg" />
                <Button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6" size="lg">Find</Button>
              </div>
            </div>
          </div>
        </section>
        
        <section id="features" className="bg-background py-20">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold">How Lingkod PH Works</h2>
              <p className="mt-2 text-muted-foreground">A simple, streamlined process to get things done.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {howItWorks.map(step => (
                <Card key={step.title} className="transform-gpu transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                  <CardHeader className="items-center text-center">
                    {step.icon}
                    <CardTitle className="mt-4">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-muted-foreground">
                    {step.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="bg-secondary py-20">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold">Featured Services</h2>
              <p className="mt-2 text-muted-foreground">Explore our wide range of service categories.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {services.map(service => (
                <div key={service.name} data-ai-hint={service.hint} className="group flex flex-col items-center justify-center gap-2 rounded-lg border bg-card p-6 text-card-foreground transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                  {service.icon}
                  <span className="font-semibold text-center">{service.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-background py-20">
          <div className="container grid items-center gap-12 md:grid-cols-2">
            <div data-ai-hint="service provider professional" className="w-full h-96 rounded-lg bg-gray-200">
                <img src="https://placehold.co/600x400.png" alt="Service Provider" className="h-full w-full object-cover rounded-lg shadow-md"/>
            </div>
            <div className="flex flex-col items-start gap-4">
              <h2 className="font-headline text-3xl font-bold">Become a Service Provider</h2>
              <p className="text-muted-foreground">
                Join our network of trusted professionals and grow your business. Reach more customers, manage bookings, and get paid seamlessly.
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Flexible schedule and service areas</li>
                <li>Secure payments and transparent fees</li>
                <li>Tools to manage your bookings and clients</li>
              </ul>
              <Button size="lg" asChild>
                <Link href="/signup">Register Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
