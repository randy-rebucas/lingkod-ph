
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, Handshake, Users, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: 'Partnerships',
  description: 'Collaborate with LocalPro to empower local businesses and build stronger communities. Explore our partnership opportunities for corporations, LGUs, and suppliers.',
};

const partnershipTypes = [
  {
    icon: <Building2 className="h-12 w-12 text-primary" />,
    title: "Corporate Partners",
    description: "Offer LocalPro's trusted services as a perk to your employees or integrate our network into your business offerings. Enhance your value proposition and support local professionals.",
  },
  {
    icon: <Users className="h-12 w-12 text-primary" />,
    title: "Community & LGU Partners",
    description: "Collaborate with us on community-based programs, job fairs, and skills training initiatives. Empower your constituents by connecting them with legitimate work opportunities.",
  },
  {
    icon: <Wrench className="h-12 w-12 text-primary" />,
    title: "Supply & Material Partners",
    description: "Become a preferred supplier for our network of service providers. Gain direct access to a growing market of professionals who need quality tools, materials, and equipment.",
  },
];

export default function PartnersPage() {
  return (
    <div className="container py-12 md:py-24 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">Partner with LocalPro</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Collaborate with us to empower local businesses and build stronger communities together.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
        {partnershipTypes.map((partner) => (
          <Card key={partner.title} className="flex flex-col items-center text-center">
            <CardHeader className="items-center">
              <div className="rounded-full bg-primary/10 p-4">{partner.icon}</div>
              <CardTitle className="mt-4">{partner.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{partner.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-20 max-w-4xl mx-auto bg-secondary">
        <div className="p-8 md:flex md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
              <Handshake />
              Ready to Collaborate?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Let's work together to create a positive impact. Reach out to our partnerships team to get started.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex-shrink-0">
            <Button asChild size="lg">
              <Link href="/contact-us">
                Become a Partner <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
}
