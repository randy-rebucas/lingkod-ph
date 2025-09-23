
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Users, Heart, Lightbulb, Target, BookOpen, ShieldCheck, Star, Award, TrendingUp, Globe, CheckCircle, Quote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about the mission, story, and values of LocalPro. Discover how we are empowering local communities and service professionals across the Philippines.',
};

const stats = [
  { number: "10,000+", label: "Active Providers" },
  { number: "50,000+", label: "Happy Customers" },
  { number: "100+", label: "Cities Covered" },
  { number: "99.8%", label: "Success Rate" },
];

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

const testimonials = [
  {
    name: "Maria Santos",
    role: "Homeowner",
    content: "LocalPro made finding a reliable plumber so easy. The service was professional and the pricing was fair.",
    rating: 5,
  },
  {
    name: "Juan Dela Cruz",
    role: "Service Provider",
    content: "Since joining LocalPro, my business has grown by 300%. The platform connects me with quality clients.",
    rating: 5,
  },
  {
    name: "Ana Rodriguez",
    role: "Business Owner",
    content: "The verification process gives me confidence. I know I'm working with trusted professionals.",
    rating: 5,
  },
];

const values = [
  {
    icon: <Heart className="h-8 w-8 text-primary" />,
    title: "Community First",
    description: "We prioritize the well-being and growth of our local communities above all else.",
  },
  {
    icon: <Award className="h-8 w-8 text-primary" />,
    title: "Excellence",
    description: "We maintain the highest standards in everything we do, from service quality to user experience.",
  },
  {
    icon: <Globe className="h-8 w-8 text-primary" />,
    title: "Accessibility",
    description: "We believe quality services should be accessible to everyone, everywhere in the Philippines.",
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-primary" />,
    title: "Innovation",
    description: "We continuously evolve our platform to better serve our community's changing needs.",
  },
];


export default function AboutPage() {
  const t = useTranslations('About');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 50,000+ Customers
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold font-headline mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12">
              {t('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300">
                <Link href="/signup">
                  Join Our Community <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Link href="/providers">
                  Find Services
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-4xl font-bold font-headline mb-6">{t('mission')}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  {t('missionDesc')}
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground">Verified & Background-Checked Providers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground">Secure Payment Processing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground">24/7 Customer Support</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-12 w-12 text-primary" />
                    </div>
                    <p className="text-muted-foreground font-medium">Building Stronger Communities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="aspect-square bg-gradient-to-br from-accent/10 to-primary/10 rounded-3xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-12 w-12 text-accent" />
                    </div>
                    <p className="text-muted-foreground font-medium">From Idea to Impact</p>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-4xl font-bold font-headline mb-6">{t('story')}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t('storyDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold font-headline mb-6">Our Core Values</h2>
            <p className="text-lg text-muted-foreground">
              The principles that guide everything we do at LocalPro
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center p-6 border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Why Choose Us Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">{t('whyChoose')}</h2>
            <p className="text-lg text-muted-foreground">
              Discover what makes LocalPro the trusted choice for service providers and customers alike
            </p>
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

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold font-headline mb-6">What Our Community Says</h2>
            <p className="text-lg text-muted-foreground">
              Real stories from real people who trust LocalPro
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 border-0 shadow-soft">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
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
