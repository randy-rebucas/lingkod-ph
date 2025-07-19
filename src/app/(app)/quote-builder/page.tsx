
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export default function QuoteBuilderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Quote Builder</h1>
        <p className="text-muted-foreground">
          Create professional quotes for your clients.
        </p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Coming Soon!</CardTitle>
          <CardDescription>This page is under construction. Elite subscribers will soon be able to build and send quotes here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
            <Calculator className="h-16 w-16 mb-4" />
            <p>Your quote building tool will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
