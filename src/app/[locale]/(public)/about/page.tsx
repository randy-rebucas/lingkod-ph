
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Users, Heart, Lightbulb, Target, BookOpen, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({params: {locale}}: {params: {locale: string}}) {
  const t = await getTranslations({locale, namespace: 'About'});
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}


const whyChooseUs = [
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    titleKey: "trustedVerified",
    descriptionKey: "trustedVerifiedDesc",
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    titleKey: "empoweringPros",
    descriptionKey: "empoweringProsDesc",
  },
  {
    icon: <Zap className="h-10 w-10 text-primary" />,
    titleKey: "seamlessExperience",
    descriptionKey: "seamlessExperienceDesc",
  },
];


export default async function AboutPage() {
  const t = await getTranslations('About');
  
  return (
    <div className="container py-12 md:py-24 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">{t('title')}</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-16 mt-16">
        <section className="text-center">
            <Target className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-3xl font-bold font-headline">{t('mission')}</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
                {t('missionDesc')}
            </p>
        </section>

        <section className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-3xl font-bold font-headline">{t('story')}</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
               {t('storyDesc')}
            </p>
        </section>
      </div>
      
      <section className="mt-20">
         <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold font-headline">{t('whyChoose')}</h2>
         </div>
         <div className="mx-auto grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
             {whyChooseUs.map((item) => (
                <Card key={item.titleKey} className="flex flex-col items-center text-center p-6">
                    {item.icon}
                    <h3 className="mt-4 text-xl font-semibold">{t(item.titleKey)}</h3>
                    <p className="mt-2 text-muted-foreground">{t(item.descriptionKey)}</p>
                </Card>
             ))}
         </div>
      </section>
      
       <section className="mt-20">
        <Card className="max-w-3xl mx-auto bg-secondary">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('joinMission')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
                {t('joinMissionDesc')}
            </p>
            <div className="flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/careers">
                    {t('viewCareers')} <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                   <Link href="/partners">
                    {t('partnerWithUs')}
                  </Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
