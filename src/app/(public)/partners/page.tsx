
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building2, Handshake, Users, Wrench, Star, Award, CheckCircle, Quote, Target, Zap, Mail, MapPin, Briefcase, Clock, DollarSign, UserCheck, Lightbulb, Heart, Gauge, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';







export default function PartnersPage() {
  const t = useTranslations('Partners');

  const _partnerStats = [
    { number: "500+", label: t('stats.activePartners'), icon: <Users className="h-6 w-6" /> },
    { number: "50+", label: t('stats.citiesCovered'), icon: <MapPin className="h-6 w-6" /> },
    { number: "₱10M+", label: t('stats.partnerRevenue'), icon: <DollarSign className="h-6 w-6" /> },
    { number: "95%", label: t('stats.partnerSatisfaction'), icon: <Star className="h-6 w-6" /> },
    { number: "2,500+", label: t('stats.jobsCreated'), icon: <Briefcase className="h-6 w-6" /> },
    { number: "₱50M+", label: t('stats.economicImpact'), icon: <TrendingUp className="h-6 w-6" /> },
  ];

  const successStories = [
    {
      company: "TechCorp Philippines",
      type: "Technology",
      icon: <Building2 className="h-6 w-6 text-primary" />,
      quote: "Lingkod has transformed our workforce management. We've seen 40% improvement in project completion rates.",
      author: "Maria Santos",
      position: "HR Director",
      result: "40% improvement in project completion rates",
      description: "TechCorp Philippines leveraged Lingkod's platform to streamline their workforce management, resulting in significant operational improvements.",
      metrics: [
        "40% faster project completion",
        "60% reduction in hiring time",
        "95% client satisfaction rate"
      ]
    },
    {
      company: "GreenBuild Solutions",
      type: "Construction",
      icon: <Wrench className="h-6 w-6 text-primary" />,
      quote: "The quality of skilled workers we get through Lingkod is exceptional. Our client satisfaction has increased significantly.",
      author: "John Dela Cruz",
      position: "Operations Manager",
      result: "Exceptional worker quality and client satisfaction",
      description: "GreenBuild Solutions found reliable skilled workers through Lingkod, leading to improved project outcomes and client relationships.",
      metrics: [
        "50% increase in client satisfaction",
        "30% reduction in project delays",
        "85% worker retention rate"
      ]
    },
    {
      company: "Metro Services Inc",
      type: "Services",
      icon: <Users className="h-6 w-6 text-primary" />,
      quote: "Lingkod's platform has streamlined our hiring process. We can now find qualified professionals in half the time.",
      author: "Ana Rodriguez",
      position: "CEO",
      result: "50% faster hiring process",
      description: "Metro Services Inc optimized their recruitment process using Lingkod's platform, significantly reducing time-to-hire.",
      metrics: [
        "50% faster hiring process",
        "70% increase in qualified candidates",
        "90% hiring success rate"
      ]
    }
  ];

  const partnerTestimonials = [
    {
      name: "Carlos Mendoza",
      company: "Construction Plus",
      rating: 5,
      testimonial: "Lingkod has been instrumental in scaling our business. The platform connects us with skilled workers who deliver quality results.",
      avatar: "CM",
      verified: true,
      role: "CEO"
    },
    {
      name: "Lisa Chen",
      company: "Digital Solutions PH",
      rating: 5,
      testimonial: "The partnership with Lingkod has opened new opportunities for our company. The support team is excellent and always responsive.",
      avatar: "LC",
      verified: true,
      role: "Operations Director"
    }
  ];

  const partnershipTypes = [
    {
      icon: <Building2 className="h-12 w-12 text-primary" />,
      title: t('partnershipTypes.corporate.title'),
      description: t('partnershipTypes.corporate.description'),
      benefits: t('partnershipTypes.corporate.benefits').split(','),
      idealFor: t('partnershipTypes.corporate.idealFor'),
      features: t('partnershipTypes.corporate.features').split(','),
      cta: t('partnershipTypes.corporate.cta')
    },
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: t('partnershipTypes.community.title'),
      description: t('partnershipTypes.community.description'),
      benefits: t('partnershipTypes.community.benefits').split(','),
      idealFor: t('partnershipTypes.community.idealFor'),
      features: t('partnershipTypes.community.features').split(','),
      cta: t('partnershipTypes.community.cta')
    },
    {
      icon: <Wrench className="h-12 w-12 text-primary" />,
      title: t('partnershipTypes.supply.title'),
      description: t('partnershipTypes.supply.description'),
      benefits: t('partnershipTypes.supply.benefits').split(','),
      idealFor: t('partnershipTypes.supply.idealFor'),
      features: t('partnershipTypes.supply.features').split(','),
      cta: t('partnershipTypes.supply.cta')
    },
  ];

  const partnershipProcess = [
    {
      step: "1",
      title: t('process.initialDiscussion.title'),
      description: t('process.initialDiscussion.description'),
      icon: <Mail className="h-6 w-6" />,
      duration: t('process.initialDiscussion.duration'),
      details: t('process.initialDiscussion.details').split(',')
    },
    {
      step: "2",
      title: t('process.partnershipProposal.title'),
      description: t('process.partnershipProposal.description'),
      icon: <Target className="h-6 w-6" />,
      duration: t('process.partnershipProposal.duration'),
      details: t('process.partnershipProposal.details').split(',')
    },
    {
      step: "3",
      title: t('process.agreementOnboarding.title'),
      description: t('process.agreementOnboarding.description'),
      icon: <Handshake className="h-6 w-6" />,
      duration: t('process.agreementOnboarding.duration'),
      details: t('process.agreementOnboarding.details').split(',')
    },
    {
      step: "4",
      title: t('process.launchSupport.title'),
      description: t('process.launchSupport.description'),
      icon: <Zap className="h-6 w-6" />,
      duration: t('process.launchSupport.duration'),
      details: t('process.launchSupport.details').split(',')
    },
  ];

  const achievements = [
    {
      title: t('achievements.bestPartnershipProgram.title'),
      organization: t('achievements.bestPartnershipProgram.organization'),
      icon: <Award className="h-6 w-6" />
    },
    {
      title: t('achievements.socialImpactExcellence.title'),
      organization: t('achievements.socialImpactExcellence.organization'),
      icon: <Heart className="h-6 w-6" />
    },
    {
      title: t('achievements.innovationInEmployment.title'),
      organization: t('achievements.innovationInEmployment.organization'),
      icon: <Lightbulb className="h-6 w-6" />
    },
    {
      title: t('achievements.communityDevelopmentAward.title'),
      organization: t('achievements.communityDevelopmentAward.organization'),
      icon: <Users className="h-6 w-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Star className="w-4 h-4 mr-2" />
              {t('joinPartners')}
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold font-headline mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12">
              {t('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300">
                <Link href="#partnership-types">
                  {t('explorePartnerships')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Link href="/contact-us">
                  {t('contactUs')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Types */}
      <section id="partnership-types" className="py-20">
        <div className="container">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">{t('partnershipOpportunities')}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('partnershipOpportunitiesDescription')}
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-8 lg:grid-cols-3">
              {partnershipTypes.map((partner) => (
                <Card key={partner.title} className="group shadow-soft hover:shadow-glow/20 transition-all duration-500 border-0 bg-background/80 backdrop-blur-sm hover:-translate-y-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      {partner.icon}
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">{partner.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{partner.description}</p>
                    
                    <div className="mb-6">
                      <h4 className="font-semibold text-sm text-primary mb-3">KEY BENEFITS</h4>
                      <ul className="space-y-2">
                        {partner.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold text-sm text-primary mb-3">IDEAL FOR</h4>
                      <p className="text-sm text-muted-foreground">{partner.idealFor}</p>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold text-sm text-primary mb-3">FEATURES</h4>
                      <div className="flex flex-wrap gap-2">
                        {partner.features.map((feature, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      {partner.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">Success Stories</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              See how our partners are transforming their businesses and communities
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-8 lg:grid-cols-3">
              {successStories.map((story) => (
                <Card key={story.company} className="group shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm hover:-translate-y-1">
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        {story.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{story.company}</h3>
                        <Badge variant="outline" className="text-xs">{story.type}</Badge>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-primary mb-2">{story.result}</div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{story.description}</p>
                    </div>

                    <div className="mb-6">
                      <div className="grid grid-cols-1 gap-2">
                        {story.metrics.map((metric, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="font-medium">{metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Quote className="h-5 w-5 text-primary mb-2" />
                      <p className="text-sm italic text-muted-foreground mb-2">&quot;{story.quote}&quot;</p>
                      <p className="text-xs font-medium">— {story.author}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Process */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">Partnership Process</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our streamlined process makes it easy to get started and succeed as a LocalPro partner
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {partnershipProcess.map((step, index) => (
                <div key={step.title} className="relative">
                  <Card className="group shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm hover:-translate-y-1 h-full">
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                        {step.icon}
                      </div>
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                        {step.step}
                      </div>
                      <h3 className="font-semibold text-lg mb-3">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{step.description}</p>
                      
                      <div className="mb-4">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {step.duration}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        {step.details.map((detail, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                  
                  {index < partnershipProcess.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent transform -translate-y-1/2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">What Our Partners Say</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Hear from successful partners who have transformed their businesses with LocalPro
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-8 lg:grid-cols-2">
              {partnerTestimonials.map((testimonial) => (
                <Card key={testimonial.name} className="group shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm">
                  <div className="p-8">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    
                    <Quote className="h-8 w-8 text-primary/30 mb-4" />
                    <p className="text-muted-foreground leading-relaxed mb-6">&quot;{testimonial.testimonial}&quot;</p>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{testimonial.name}</h4>
                          {testimonial.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <p className="text-sm font-medium text-primary">{testimonial.company}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">Recognition & Awards</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our commitment to excellence and social impact has been recognized by industry leaders
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {achievements.map((achievement) => (
                <Card key={achievement.title} className="group shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm hover:-translate-y-1 text-center">
                  <div className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      {achievement.icon}
                    </div>
                    <h3 className="font-semibold text-sm mb-2">{achievement.title}</h3>
                    <p className="text-xs text-muted-foreground">{achievement.organization}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
              <div className="p-8 lg:p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Handshake className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-4xl font-bold font-headline mb-4">Ready to Make an Impact?</h2>
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    Join hundreds of successful partners who are transforming communities and growing their businesses with LocalPro. 
                    Let&apos;s create something amazing together.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                  <Button asChild size="lg" className="h-14 px-8 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300">
                    <Link href="/contact-us">
                      Start Your Partnership <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                    <a href="mailto:admin@localpro.asia">
                      <Mail className="mr-2 h-5 w-5" />
                      Contact Sales Team
                    </a>
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    <Gauge className="inline h-4 w-4 mr-1" />
                    Average response time: 2 hours
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
