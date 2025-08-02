
import { Suspense } from 'react';

const Logo = () => (
  <h1 className="text-3xl font-bold font-headline text-primary">
    Lingkod<span className="text-accent">PH</span>
  </h1>
);

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="absolute top-8">
            <Logo />
        </div>
        <Suspense>
            {children}
        </Suspense>
    </div>
  );
}
