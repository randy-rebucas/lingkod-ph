
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from 'react';

export default function SubscriptionSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/dashboard');
        }, 5000); // Redirect after 5 seconds

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <div className="mx-auto bg-green-100 rounded-full p-4 w-fit">
                         <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Payment Submitted!</CardTitle>
                    <CardDescription>
                        Your subscription is now pending verification. We will notify you once it's active. This usually takes a few minutes.
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
        </div>
    );
}
