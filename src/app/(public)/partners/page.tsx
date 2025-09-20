
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, Handshake, Users, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Partners');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container py-16">
        {/* Partnership Types */}
        <section className="mb-20">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">Partnership Opportunities</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Join forces with LocalPro to create meaningful impact and grow your business
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            {partnershipTypes.map((partner) => (
              <Card key={partner.title} className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  {partner.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{partner.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{partner.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Partnership Benefits */}
        <section className="mb-20">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">Partnership Benefits</h2>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
            <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Access to Our Network</h3>
                  <p className="text-muted-foreground leading-relaxed">Connect with thousands of verified service providers and potential customers across the Philippines.</p>
                </div>
              </div>
            </Card>
            
            <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Brand Visibility</h3>
                  <p className="text-muted-foreground leading-relaxed">Increase your brand awareness through our platform and marketing channels.</p>
                </div>
              </div>
            </Card>
            
            <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Dedicated Support</h3>
                  <p className="text-muted-foreground leading-relaxed">Get dedicated account management and technical support for your partnership needs.</p>
                </div>
              </div>
            </Card>
            
            <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Handshake className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Community Impact</h3>
                  <p className="text-muted-foreground leading-relaxed">Make a positive difference in local communities while growing your business.</p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft">
            <div className="p-8 lg:p-12">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Handshake className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold font-headline mb-4">Ready to Collaborate?</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Let's work together to create a positive impact. Reach out to our partnerships team to get started.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="h-12 px-8 shadow-glow hover:shadow-glow/50 transition-all duration-300">
                  <Link href="/contact-us">
                    {t('becomePartner')} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                  <a href="mailto:partnerships@localpro.asia">
                    {t('contactSales')}
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
