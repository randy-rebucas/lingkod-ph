
"use client";

import SmartRateClient from "@/components/smart-rate-client";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SmartRatePage() {
    const { subscription } = useAuth();
    const isPaidSubscriber = subscription?.status === 'active' && subscription.planId !== 'free';

    if (!isPaidSubscriber) {
        return (
            <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Smart Rate Suggestions</h1>
                    <p className="text-muted-foreground">
                    Leverage our AI-powered tool to find a competitive price for your services based on market data.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Upgrade to Access Smart Rate</CardTitle>
                        <CardDescription>This feature is available on our paid plans. Upgrade your plan to unlock AI-powered pricing suggestions.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <Sparkles className="h-16 w-16 mb-4" />
                        <p className="mb-4">Get competitive and profitable with AI rate suggestions.</p>
                         <Button asChild>
                            <Link href="/subscription">View Subscription Plans</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Smart Rate Suggestions</h1>
        <p className="text-muted-foreground">
          Leverage our AI-powered tool to find a competitive price for your services based on market data.
        </p>
      </div>
      <SmartRateClient />
    </div>
  );
}
