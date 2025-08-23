
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Users, Heart, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from 'next-intl/server';


export async function generateMetadata({params: {locale}}: {params: {locale: string}}) {
  const t = await getTranslations({locale, namespace: 'Careers'});
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

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


export default async function CareersPage() {
  const t = await getTranslations('Careers');
  
  return (
    <div className="container py-12 md:py-24 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">{t('title')}</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>
      
      <section className="mt-16">
         <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold font-headline">Why Join Us?</h2>
         </div>
         <div className="mx-auto grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                 <Zap className="h-12 w-12 text-primary" />
                 <h3 className="mt-4 text-xl font-semibold">Make an Impact</h3>
                 <p className="mt-2 text-muted-foreground">Directly contribute to a platform that empowers thousands of local service providers and improves lives.</p>
             </div>
              <div className="flex flex-col items-center text-center">
                 <Users className="h-12 w-12 text-primary" />
                 <h3 className="mt-4 text-xl font-semibold">Collaborative Culture</h3>
                 <p className="mt-2 text-muted-foreground">Work in a supportive, dynamic environment where your ideas are valued and your growth is a priority.</p>
             </div>
             <div className="flex flex-col items-center text-center">
                 <Lightbulb className="h-12 w-12 text-primary" />
                 <h3 className="mt-4 text-xl font-semibold">Drive Innovation</h3>
                 <p className="mt-2 text-muted-foreground">Help us build cutting-edge solutions that solve real challenges in the service marketplace.</p>
             </div>
         </div>
      </section>

      <section className="mt-20">
         <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold font-headline">Our Values</h2>
         </div>
         <div className="mx-auto grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
             {ourValues.map((value) => (
                <Card key={value.title} className="flex flex-col items-center text-center p-6">
                    {value.icon}
                    <h3 className="mt-4 text-xl font-semibold">{value.title}</h3>
                    <p className="mt-2 text-muted-foreground">{value.description}</p>
                </Card>
             ))}
         </div>
      </section>

      <section className="mt-20">
        <Card className="max-w-3xl mx-auto bg-secondary">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('openPositions')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
                {t('noOpenings')} {t('checkBack')}
            </p>
            <Button asChild size="lg">
              <a href="mailto:careers@localpro.example.com">
                {t('contactSales')} <ArrowRight className="ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
