
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Analytics</h1>
        <p className="text-muted-foreground">
          Dive deep into your performance metrics.
        </p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Coming Soon!</CardTitle>
          <CardDescription>This page is under construction. Elite subscribers will soon see detailed analytics here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
            <BarChart2 className="h-16 w-16 mb-4" />
            <p>Your advanced analytics dashboard will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
