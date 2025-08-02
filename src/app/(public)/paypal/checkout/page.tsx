
"use client";

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, ShoppingCart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const plans = {
    starter: { price: 299, name: "Starter Plan" },
    pro: { price: 499, name: "Pro Plan" },
    elite: { price: 899, name: "Elite Plan" },
    lite: { price: 2500, name: "Lite Plan (Agency)" },
    custom: { price: 10000, name: "Custom Plan (Agency)" },
};

const Logo = () => (
  <h1 className="text-2xl font-bold font-headline text-blue-600">
    PayPal
  </h1>
);

function CheckoutContent() {
    const searchParams = useSearchParams();
    const planId = searchParams.get('planId') as keyof typeof plans | null;
    const userId = searchParams.get('userId');

    if (!planId || !userId || !plans[planId]) {
        return (
            <div className="text-center text-destructive">
                <p>Invalid payment details. Please go back and try again.</p>
                <Button asChild variant="link" className="mt-4"><Link href="/subscription">Return to Subscriptions</Link></Button>
            </div>
        );
    }

    const plan = plans[planId];
    const successUrl = `/subscription/success?planId=${planId}&userId=${userId}`;

    return (
        <>
            <CardHeader className="text-center">
                <Logo />
                <CardDescription>You are paying LingkodPH</CardDescription>
                <div className="text-4xl font-bold pt-4">₱{plan.price.toLocaleString()}</div>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Item</span>
                        <span>{plan.name}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Price</span>
                        <span>₱{plan.price.toLocaleString()}</span>
                    </div>
                </div>
                 <div className="flex items-start gap-4 p-4 bg-secondary rounded-lg">
                    <Avatar>
                        <AvatarImage src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" />
                        <AvatarFallback>PP</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">Login to pay with PayPal</p>
                        <p className="text-sm text-muted-foreground">Or pay with your debit or credit card.</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href={successUrl}>Pay Now</Link>
                </Button>
                 <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <ShieldCheck className="h-3 w-3" /> Secure payment
                </p>
            </CardFooter>
        </>
    );
}


export default function PaypalCheckoutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-sm shadow-xl">
            <Suspense fallback={
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <CheckoutContent />
            </Suspense>
        </Card>
    </div>
  );
}

