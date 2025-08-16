
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from 'react';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const status = searchParams.get('status') || 'active'; // Default to active if status is not provided

    const isPending = status === 'pending';

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/dashboard');
        }, 8000); // Redirect after 8 seconds

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
                <div className="mx-auto bg-green-100 rounded-full p-4 w-fit">
                    {isPending ? (
                        <Clock className="h-12 w-12 text-yellow-600" />
                    ) : (
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    )}
                </div>
                <CardTitle className="mt-4 text-2xl">
                    {isPending ? "Payment Submitted for Verification" : "Payment Successful!"}
                </CardTitle>
                <CardDescription>
                    {isPending 
                        ? "Your payment is being verified. We will notify you once it's active. This usually takes a few minutes to a few hours."
                        : "Your subscription is now active! You have unlocked new features."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    You will be redirected to your dashboard shortly.
                </p>
            </CardContent>
            <CardFooter>
                <Button className="w-full" asChild>
                    <Link href="/dashboard">Go to Dashboard Now</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function SubscriptionSuccessPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
           <Suspense fallback={<div>Loading...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
