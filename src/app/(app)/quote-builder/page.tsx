
"use client";

import QuoteBuilderClient from "@/components/quote-builder-client";
import { StoredQuotesList } from "@/components/stored-quotes-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { Calculator } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default function QuoteBuilderPage() {
  const { subscription } = useAuth();
  const isElite = subscription?.status === 'active' && subscription.planId === 'elite';

  if (!isElite) {
    return (
        <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold font-headline">Quote Builder</h1>
              <p className="text-muted-foreground">
                Create, view, and manage professional quotes for your clients.
              </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Upgrade to Elite to Use the Quote Builder</CardTitle>
                    <CardDescription>The Quote Builder is an exclusive feature for our Elite subscribers. Upgrade your plan to create and send professional quotes.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                    <Calculator className="h-16 w-16 mb-4" />
                    <p className="mb-4">Win more jobs with professional, AI-assisted quotes.</p>
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
        <h1 className="text-3xl font-bold font-headline">Quote Builder</h1>
        <p className="text-muted-foreground">
          Create, view, and manage professional quotes for your clients.
        </p>
      </div>

       <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Quote</TabsTrigger>
            <TabsTrigger value="stored">Stored Quotes</TabsTrigger>
        </TabsList>
        <TabsContent value="create" className="mt-4">
            <QuoteBuilderClient />
        </TabsContent>
        <TabsContent value="stored" className="mt-4">
            <StoredQuotesList />
        </TabsContent>
       </Tabs>
    </div>
  );
}
