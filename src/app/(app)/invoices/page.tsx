
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Invoices</h1>
        <p className="text-muted-foreground">
          Generate and manage invoices for your clients.
        </p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Coming Soon!</CardTitle>
          <CardDescription>This page is under construction. Pro and Elite subscribers will soon be able to generate invoices here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
            <FileText className="h-16 w-16 mb-4" />
            <p>Your invoice generator and management tool will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
