
import QuoteBuilderClient from "@/components/quote-builder-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function QuoteBuilderPage() {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Quote Builder</h1>
        <p className="text-muted-foreground">
          Create and manage professional quotes for your clients.
        </p>
      </div>
      <QuoteBuilderClient />
    </div>
  );
}
