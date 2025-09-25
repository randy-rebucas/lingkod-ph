
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StandardCard } from "@/components/app/standard-card";
import { designTokens } from "@/lib/design-tokens";
import { ArrowRight, Zap, Users, Heart, Lightbulb, Star, Award, TrendingUp, Globe, CheckCircle, Quote, MapPin, Clock, DollarSign, Briefcase, GraduationCap, Coffee, Calendar, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the LocalPro team and help us build the future of the service industry in the Philippines. Explore our values and open positions.',
};

const benefits = [
  {
    icon: <DollarSign className="h-8 w-8 text-primary" />,
    title: "Competitive Salary",
    description: "Market-competitive compensation packages with performance bonuses",
  },
  {
    icon: <Heart className="h-8 w-8 text-primary" />,
    title: "Health & Wellness",
    description: "Comprehensive health insurance and wellness programs",
  },
  {
    icon: <GraduationCap className="h-8 w-8 text-primary" />,
    title: "Learning & Development",
    description: "Professional development budget and training opportunities",
  },
  {
    icon: <Coffee className="h-8 w-8 text-primary" />,
    title: "Flexible Work",
    description: "Hybrid work arrangements and flexible hours",
  },
  {
    icon: <Award className="h-8 w-8 text-primary" />,
    title: "Recognition",
    description: "Employee recognition programs and career advancement",
  },
  {
    icon: <Globe className="h-8 w-8 text-primary" />,
    title: "Global Impact",
    description: "Work on products that impact thousands of lives daily",
  },
];

const openPositions = [
  {
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "Remote / Manila",
    type: "Full-time",
    description: "Build beautiful, responsive user interfaces using React, TypeScript, and modern web technologies.",
    requirements: ["5+ years React experience", "TypeScript proficiency", "UI/UX collaboration"],
  },
  {
    title: "Product Manager",
    department: "Product",
    location: "Manila",
    type: "Full-time",
    description: "Lead product strategy and roadmap for our marketplace platform, working closely with engineering and design teams.",
    requirements: ["3+ years product management", "Marketplace experience", "Data-driven decision making"],
  },
  {
    title: "UX Designer",
    department: "Design",
    location: "Remote / Manila",
    type: "Full-time",
    description: "Create intuitive and engaging user experiences that help connect service providers with customers.",
    requirements: ["3+ years UX design", "Figma expertise", "User research skills"],
  },
];

const employeeTestimonials = [
  {
    name: "Sarah Chen",
    role: "Senior Developer",
    content: "Working at LocalPro has been incredible. I get to build products that directly help Filipino families and businesses every day.",
    rating: 5,
  },
  {
    name: "Miguel Santos",
    role: "Product Manager",
    content: "The collaborative culture here is amazing. Everyone's ideas are valued, and we're all working toward the same mission.",
    rating: 5,
  },
  {
    name: "Lisa Rodriguez",
    role: "UX Designer",
    content: "I love how we're encouraged to think creatively and push boundaries. The impact of our work is visible and meaningful.",
    rating: 5,
  },
];

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

const applicationProcess = [
  {
    step: "1",
    title: "Apply Online",
    description: "Submit your application with your resume and cover letter",
    icon: <Mail className="h-6 w-6" />,
  },
  {
    step: "2",
    title: "Initial Review",
    description: "Our team reviews your application within 3-5 business days",
    icon: <CheckCircle className="h-6 w-6" />,
  },
  {
    step: "3",
    title: "Interview Process",
    description: "Meet with our team through video calls and technical assessments",
    icon: <Users className="h-6 w-6" />,
  },
  {
    step: "4",
    title: "Decision & Offer",
    description: "Receive feedback and join our amazing team!",
    icon: <Award className="h-6 w-6" />,
  },
];


export default function CareersPage() {
  const t = useTranslations('Careers');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Star className="w-4 h-4 mr-2" />
              Join Our Growing Team
            </Badge>
            <h1 className={`text-5xl lg:text-7xl font-bold font-headline mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent ${designTokens.typography.pageTitle}`}>
              Build the Future with Us
            </h1>
            <p className={`text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12 ${designTokens.typography.pageDescription}`}>
              Join LocalPro and help us revolutionize the service industry in the Philippines. Be part of a mission-driven team that's making a real difference in local communities.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className={`h-14 px-8 text-lg ${designTokens.effects.buttonGlow}`}>
                <a href="#open-positions">
                  View Open Positions <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className={`h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 ${designTokens.effects.buttonGlow}`}>
                <a href="mailto:careers@localpro.asia">
                  Send Your Resume
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className={`font-headline text-4xl font-bold md:text-5xl mb-6 ${designTokens.typography.sectionTitle}`}>Why Join LocalPro?</h2>
            <p className={`text-lg text-muted-foreground ${designTokens.typography.sectionDescription}`}>
              Be part of a team that's transforming how services are delivered across the Philippines
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            <StandardCard variant="elevated" className="group hover:-translate-y-2 transition-all duration-300 text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className={`text-xl font-semibold mb-4 ${designTokens.typography.cardTitle}`}>Make an Impact</h3>
              <p className={`text-muted-foreground leading-relaxed ${designTokens.typography.cardDescription}`}>Directly contribute to a platform that empowers thousands of local service providers and improves lives.</p>
            </StandardCard>
            
            <StandardCard variant="elevated" className="group hover:-translate-y-2 transition-all duration-300 text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className={`text-xl font-semibold mb-4 ${designTokens.typography.cardTitle}`}>Collaborative Culture</h3>
              <p className={`text-muted-foreground leading-relaxed ${designTokens.typography.cardDescription}`}>Work in a supportive, dynamic environment where your ideas are valued and your growth is a priority.</p>
            </StandardCard>
            
            <StandardCard variant="elevated" className="group hover:-translate-y-2 transition-all duration-300 text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <h3 className={`text-xl font-semibold mb-4 ${designTokens.typography.cardTitle}`}>Drive Innovation</h3>
              <p className={`text-muted-foreground leading-relaxed ${designTokens.typography.cardDescription}`}>Help us build cutting-edge solutions that solve real challenges in the service marketplace.</p>
            </StandardCard>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className={`text-4xl font-bold font-headline mb-6 ${designTokens.typography.sectionTitle}`}>Benefits & Perks</h2>
            <p className={`text-lg text-muted-foreground ${designTokens.typography.sectionDescription}`}>
              We believe in taking care of our team so they can take care of our mission
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <StandardCard key={index} variant="elevated" className="p-6 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${designTokens.typography.cardTitle}`}>{benefit.title}</h3>
                <p className={`text-muted-foreground text-sm leading-relaxed ${designTokens.typography.cardDescription}`}>{benefit.description}</p>
              </StandardCard>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className={`font-headline text-4xl font-bold md:text-5xl mb-6 ${designTokens.typography.sectionTitle}`}>Our Values</h2>
            <p className={`text-lg text-muted-foreground ${designTokens.typography.sectionDescription}`}>
              The principles that guide everything we do at LocalPro
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            {ourValues.map((value) => (
              <StandardCard key={value.title} variant="elevated" className="group hover:-translate-y-2 transition-all duration-300 text-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  {value.icon}
                </div>
                <h3 className={`text-xl font-semibold mb-4 ${designTokens.typography.cardTitle}`}>{value.title}</h3>
                <p className={`text-muted-foreground leading-relaxed ${designTokens.typography.cardDescription}`}>{value.description}</p>
              </StandardCard>
            ))}
          </div>
        </div>
      </section>

      {/* Employee Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className={`text-4xl font-bold font-headline mb-6 ${designTokens.typography.sectionTitle}`}>What Our Team Says</h2>
            <p className={`text-lg text-muted-foreground ${designTokens.typography.sectionDescription}`}>
              Hear from the people who make LocalPro great
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {employeeTestimonials.map((testimonial, index) => (
              <StandardCard key={index} variant="elevated" className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className={`text-muted-foreground mb-6 leading-relaxed ${designTokens.typography.cardDescription}`}>"{testimonial.content}"</p>
                <div>
                  <div className={`font-semibold ${designTokens.typography.cardTitle}`}>{testimonial.name}</div>
                  <div className={`text-sm text-muted-foreground ${designTokens.typography.cardDescription}`}>{testimonial.role}</div>
                </div>
              </StandardCard>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="open-positions" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className={`text-4xl font-bold font-headline mb-6 ${designTokens.typography.sectionTitle}`}>{t('openPositions')}</h2>
            <p className={`text-lg text-muted-foreground ${designTokens.typography.sectionDescription}`}>
              Join our team and help us build the future of local services
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            {openPositions.map((position, index) => (
              <StandardCard key={index} variant="elevated" className="p-6 hover:shadow-glow/20 transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-xl font-semibold ${designTokens.typography.cardTitle}`}>{position.title}</h3>
                      <Badge variant="secondary">{position.department}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {position.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {position.type}
                      </div>
                    </div>
                    <p className={`text-muted-foreground mb-4 ${designTokens.typography.cardDescription}`}>{position.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {position.requirements.map((req, reqIndex) => (
                        <Badge key={reqIndex} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button asChild className={`shrink-0 ${designTokens.effects.buttonGlow}`}>
                    <a href={`mailto:careers@localpro.asia?subject=Application for ${position.title}`}>
                      Apply Now
                    </a>
                  </Button>
                </div>
              </StandardCard>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className={`text-4xl font-bold font-headline mb-6 ${designTokens.typography.sectionTitle}`}>Application Process</h2>
            <p className={`text-lg text-muted-foreground ${designTokens.typography.sectionDescription}`}>
              Simple, transparent, and designed to find the best fit for both you and us
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {applicationProcess.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {step.icon}
                  </div>
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                    {step.step}
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${designTokens.typography.cardTitle}`}>{step.title}</h3>
                  <p className={`text-muted-foreground text-sm leading-relaxed ${designTokens.typography.cardDescription}`}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container">
          <StandardCard variant="elevated" className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className={`text-3xl font-bold font-headline ${designTokens.typography.sectionTitle}`}>Ready to Join Our Mission?</CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <p className={`text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed ${designTokens.typography.sectionDescription}`}>
                Don't see a position that fits? We're always looking for talented individuals who share our vision. Send us your resume and tell us how you'd like to contribute.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className={`h-12 px-8 ${designTokens.effects.buttonGlow}`}>
                  <a href="mailto:careers@localpro.asia">
                    Send Your Resume <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className={`h-12 px-8 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 ${designTokens.effects.buttonGlow}`}>
                  <Link href="/about">
                    Learn More About Us
                  </Link>
                </Button>
              </div>
            </CardContent>
          </StandardCard>
        </div>
      </section>
    </div>
  );
}
