
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Users, Heart, Lightbulb, Star, Award, Globe, CheckCircle, Quote, MapPin, DollarSign, Briefcase, GraduationCap, Coffee, Mail } from "lucide-react";
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
    content: "The collaborative culture here is amazing. Everyone&apos;s ideas are valued, and we&apos;re all working toward the same mission.",
    rating: 5,
  },
  {
    name: "Lisa Rodriguez",
    role: "UX Designer",
    content: "I love how we&apos;re encouraged to think creatively and push boundaries. The impact of our work is visible and meaningful.",
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
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Star className="w-4 h-4 mr-2" />
              Join Our Growing Team
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold font-headline mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Build the Future with Us
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12">
              Join LocalPro and help us revolutionize the service industry in the Philippines. Be part of a mission-driven team that&apos;s making a real difference in local communities.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300">
                <a href="#open-positions">
                  View Open Positions <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <a href="mailto:admin@localpro.asia">
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
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">Why Join LocalPro?</h2>
            <p className="text-lg text-muted-foreground">
              Be part of a team that&apos;s transforming how services are delivered across the Philippines
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-8 lg:grid-cols-3">
              <Card className="group shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm hover:-translate-y-2 text-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Make an Impact</h3>
                <p className="text-muted-foreground leading-relaxed">Directly contribute to a platform that empowers thousands of local service providers and improves lives.</p>
              </Card>
              
              <Card className="group shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm hover:-translate-y-2 text-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Collaborative Culture</h3>
                <p className="text-muted-foreground leading-relaxed">Work in a supportive, dynamic environment where your ideas are valued and your growth is a priority.</p>
              </Card>
              
              <Card className="group shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm hover:-translate-y-2 text-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Lightbulb className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Drive Innovation</h3>
                <p className="text-muted-foreground leading-relaxed">Help us build cutting-edge solutions that solve real challenges in the service marketplace.</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold font-headline mb-6">Benefits & Perks</h2>
            <p className="text-lg text-muted-foreground">
              We believe in taking care of our team so they can take care of our mission
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="p-6 shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm hover:-translate-y-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">Our Values</h2>
            <p className="text-lg text-muted-foreground">
              The principles that guide everything we do at LocalPro
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-8 lg:grid-cols-3">
              {ourValues.map((value) => (
                <Card key={value.title} className="group shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm hover:-translate-y-2 text-center p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Employee Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold font-headline mb-6">What Our Team Says</h2>
            <p className="text-lg text-muted-foreground">
              Hear from the people who make LocalPro great
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {employeeTestimonials.map((testimonial, index) => (
                <Card key={index} className="p-6 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">&quot;{testimonial.content}&quot;</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="open-positions" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold font-headline mb-6">{t('openPositions')}</h2>
            <p className="text-lg text-muted-foreground">
              Join our team and help us build the future of local services
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6">
              {openPositions.map((position, index) => (
                <Card key={index} className="p-6 shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{position.title}</h3>
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
                      <p className="text-muted-foreground mb-4">{position.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {position.requirements.map((req, reqIndex) => (
                          <Badge key={reqIndex} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button asChild className="shrink-0">
                      <a href={`mailto:admin@localpro.asia?subject=Application for ${position.title}`}>
                        Apply Now
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold font-headline mb-6">Application Process</h2>
            <p className="text-lg text-muted-foreground">
              Simple, transparent, and designed to find the best fit for both you and us
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {applicationProcess.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {step.icon}
                  </div>
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Ready to Join Our Mission?</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                  Don&apos;t see a position that fits? We&apos;re always looking for talented individuals who share our vision. Send us your resume and tell us how you&apos;d like to contribute.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button asChild size="lg" className="h-12 px-8 shadow-glow hover:shadow-glow/50 transition-all duration-300">
                    <a href="mailto:admin@localpro.asia">
                      Send Your Resume <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 px-8 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                    <Link href="/about">
                      Learn More About Us
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
