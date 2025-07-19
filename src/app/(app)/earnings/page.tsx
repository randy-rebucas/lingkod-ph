
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function EarningsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Earnings</h1>
        <p className="text-muted-foreground">
          Track your revenue and payouts.
        </p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Coming Soon!</CardTitle>
          <CardDescription>This page is under construction. Check back later to view your earnings report.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
            <DollarSign className="h-16 w-16 mb-4" />
            <p>Your earnings and payout information will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
