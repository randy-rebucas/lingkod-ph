import SmartRateClient from "@/components/smart-rate-client";

export default function SmartRatePage() {
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
