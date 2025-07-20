
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnersPage() {
  return (
    <div className="container py-12 md:py-24 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Partner with LingkodPH</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Collaborate with us to empower local businesses and communities.
        </p>
      </div>

      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Partnership Opportunities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            We believe in the power of collaboration. If you are a business, a non-profit, or a government unit interested in partnering with us, please reach out.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
