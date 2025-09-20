
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Users, Heart, Lightbulb, Target, BookOpen, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about the mission, story, and values of LocalPro. Discover how we are empowering local communities and service professionals across the Philippines.',
};


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


export default function AboutPage() {
  const t = useTranslations('About');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">

      <div className="container py-16">
        <div className="mx-auto max-w-4xl space-y-20">
          <section className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Target className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-4xl font-bold font-headline mb-6">{t('mission')}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {t('missionDesc')}
            </p>
          </section>

          <section className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-4xl font-bold font-headline mb-6">{t('story')}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {t('storyDesc')}
            </p>
          </section>
        </div>
      </div>
      
      <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">{t('whyChoose')}</h2>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            {whyChooseUs.map((item) => (
              <Card key={item.titleKey} className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2 text-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{t(item.titleKey)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t(item.descriptionKey)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-20">
        <div className="container">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold font-headline">{t('joinMission')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                {t('joinMissionDesc')}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="h-12 px-8 shadow-glow hover:shadow-glow/50 transition-all duration-300">
                  <Link href="/careers">
                    {t('viewCareers')} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                  <Link href="/partners">
                    {t('partnerWithUs')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
