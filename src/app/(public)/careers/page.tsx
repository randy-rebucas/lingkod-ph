
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Users, Heart, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the LocalPro team and help us build the future of the service industry in the Philippines. Explore our values and open positions.',
};

const ourValues = [
  {
    icon: <Heart className="h-10 w-10 text-primary" />,
    title: "Community-Focused",
    description: "We are committed to empowering local communities by creating opportunities and fostering connections.",
  },
  {
    icon: <Lightbulb className="h-10 w-10 text-primary" />,
    title: "Innovate with Purpose",
    description: "We continuously improve our platform with creative solutions that solve real-world problems for clients and providers.",
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Grow Together",
    description: "We believe in collaboration and mutual support, creating an environment where everyone can thrive and succeed.",
  },
];


export default function CareersPage() {
  const t = useTranslations('Careers');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">

      <div className="container py-16">
        {/* Why Join Us Section */}
        <section className="mb-20">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">Why Join Us?</h2>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Make an Impact</h3>
              <p className="text-muted-foreground leading-relaxed">Directly contribute to a platform that empowers thousands of local service providers and improves lives.</p>
            </Card>
            
            <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Collaborative Culture</h3>
              <p className="text-muted-foreground leading-relaxed">Work in a supportive, dynamic environment where your ideas are valued and your growth is a priority.</p>
            </Card>
            
            <Card className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Drive Innovation</h3>
              <p className="text-muted-foreground leading-relaxed">Help us build cutting-edge solutions that solve real challenges in the service marketplace.</p>
            </Card>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="mb-20">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">Our Values</h2>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            {ourValues.map((value) => (
              <Card key={value.title} className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Open Positions Section */}
      <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold font-headline">{t('openPositions')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                {t('noOpenings')} {t('checkBack')}
              </p>
              <Button asChild size="lg" className="h-12 px-8 shadow-glow hover:shadow-glow/50 transition-all duration-300">
                <a href="mailto:careers@localpro.asia">
                  {t('contactSales')} <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
