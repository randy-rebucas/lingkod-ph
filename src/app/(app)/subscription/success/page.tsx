
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { finalizeSubscription } from '../actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const planId = searchParams.get('planId') as 'starter' | 'pro' | 'elite' | 'lite' | 'custom' | null;
    const userId = searchParams.get('userId');

    useEffect(() => {
        if (!planId || !userId) {
            setError("Invalid subscription details specified.");
            setLoading(false);
            return;
        }

        const processSubscription = async () => {
            const result = await finalizeSubscription(planId, userId);
            if (result.error) {
                setError(result.error);
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                 toast({ title: 'Success!', description: `Your subscription to the ${planId} plan is now active.` });
            }
            setLoading(false);
        };

        processSubscription();

    }, [planId, userId, router, toast]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h2 className="text-2xl font-bold">Processing Your Subscription...</h2>
                <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-center">
                <CardTitle className="text-2xl text-destructive">Payment Failed</CardTitle>
                <CardDescription className="mt-2">{error}</CardDescription>
                <Button asChild className="mt-6">
                    <Link href="/subscription">Try Again</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl">Payment Successful!</CardTitle>
            <CardDescription className="mt-2">
                Your subscription has been activated. Thank you for choosing LingkodPH.
            </CardDescription>
            <Button asChild className="mt-6">
                <Link href="/subscription">Go to My Subscription</Link>
            </Button>
        </div>
    );
}

export default function SubscriptionSuccessPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
             <Card className="w-full max-w-lg p-8">
                 <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
                    <SuccessContent />
                 </Suspense>
            </Card>
        </div>
    )
}
