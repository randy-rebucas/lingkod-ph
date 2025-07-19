
import QuoteBuilderClient from "@/components/quote-builder-client";
import { StoredQuotesList } from "@/components/stored-quotes-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function QuoteBuilderPage() {

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
