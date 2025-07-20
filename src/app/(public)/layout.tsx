
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
         <Link href="/about" className="transition-colors hover:text-primary">About</Link>
        <Link href="/careers" className="transition-colors hover:text-primary">Careers</Link>
        <Link href="/contact-us" className="transition-colors hover:text-primary">Contact Us</Link>
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
                <li><Link href="/about" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                <li><Link href="/careers" className="text-muted-foreground hover:text-primary">Careers</Link></li>
                <li><Link href="/partners" className="text-muted-foreground hover:text-primary">Partners</Link></li>
            </ul>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Support</h4>
            <ul className="space-y-2 text-sm">
                <li><Link href="/help-center" className="text-muted-foreground hover:text-primary">Help Center</Link></li>
                <li><Link href="/contact-us" className="text-muted-foreground hover:text-primary">Contact Us</Link></li>
                <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
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


export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
