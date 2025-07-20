
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function CareersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 p-4">
        <div className="container flex h-14 items-center">
          <Link href="/" className="text-2xl font-bold font-headline text-primary">
            Lingkod<span className="text-accent">PH</span>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-12 md:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Careers at LingkodPH</h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Join our team and help us build the future of service marketplaces.
            </p>
          </div>

          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We are always looking for talented individuals to join our team. While we have no specific open positions at the moment, we encourage you to send your resume to careers@lingkodph.example.com.
              </p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
