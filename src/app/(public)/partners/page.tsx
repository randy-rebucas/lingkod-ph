
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { ArrowRight, Building2, Handshake, Users, Wrench, Star, Award, CheckCircle, Quote, Target, Zap, Mail, MapPin, Briefcase, Clock, DollarSign, UserCheck, Lightbulb, Heart, Gauge, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: 'Partnerships',
  description: 'Collaborate with LocalPro to empower local businesses and build stronger communities. Explore our partnership opportunities for corporations, LGUs, and suppliers.',
};

const _partnerStats = [
  { number: "500+", label: "Active Partners", icon: <Users className="h-6 w-6" /> },
  { number: "50+", label: "Cities Covered", icon: <MapPin className="h-6 w-6" /> },
  { number: "₱10M+", label: "Partner Revenue", icon: <DollarSign className="h-6 w-6" /> },
  { number: "95%", label: "Partner Satisfaction", icon: <Star className="h-6 w-6" /> },
  { number: "2,500+", label: "Jobs Created", icon: <Briefcase className="h-6 w-6" /> },
  { number: "₱50M+", label: "Economic Impact", icon: <TrendingUp className="h-6 w-6" /> },
];

const partnershipTypes = [
  {
    icon: <Building2 className="h-12 w-12 text-primary" />,
    title: "Corporate Partners",
    description: "Offer LocalPro&apos;s trusted services as a perk to your employees or integrate our network into your business offerings. Enhance your value proposition and support local professionals.",
    benefits: [
      "Employee Benefits Program",
      "B2B Service Integration", 
      "Co-branded Marketing Campaigns",
      "Dedicated Account Management",
      "Custom Pricing & Volume Discounts",
      "Priority Customer Support"
    ],
    idealFor: "Large corporations, HR departments, employee benefit providers, B2B service companies",
    features: ["API Integration", "White-label Solutions", "Custom Reporting", "Employee Dashboard"],
    cta: "Explore Corporate Partnership"
  },
  {
    icon: <Users className="h-12 w-12 text-primary" />,
    title: "Community & LGU Partners",
    description: "Collaborate with us on community-based programs, job fairs, and skills training initiatives. Empower your constituents by connecting them with legitimate work opportunities.",
    benefits: [
      "Community Employment Programs",
      "Skills Training Workshops", 
      "Job Fair Organization",
      "Local Economic Development",
      "Social Impact Reporting",
      "Government Relations Support"
    ],
    idealFor: "Local government units, NGOs, community organizations, educational institutions",
    features: ["Community Dashboard", "Impact Analytics", "Training Materials", "Event Management"],
    cta: "Start Community Partnership"
  },
  {
    icon: <Wrench className="h-12 w-12 text-primary" />,
    title: "Supply & Material Partners",
    description: "Become a preferred supplier for our network of service providers. Gain direct access to a growing market of professionals who need quality tools, materials, and equipment.",
    benefits: [
      "Direct B2B Sales Channel",
      "Volume Discount Programs", 
      "Marketing & Brand Exposure",
      "Quality Assurance Standards",
      "Inventory Management Tools",
      "Performance Analytics"
    ],
    idealFor: "Hardware stores, material suppliers, equipment providers, tool manufacturers",
    features: ["Supplier Portal", "Inventory Integration", "Order Management", "Performance Tracking"],
    cta: "Join Supply Network"
  },
];

const successStories = [
  {
    company: "Metro Manila LGU",
    type: "Government Partnership",
    result: "300% increase in local employment",
    description: "Partnered with LocalPro to create a comprehensive job matching program for residents, resulting in over 2,000 successful job placements in the first year.",
    icon: <Users className="h-8 w-8 text-primary" />,
    metrics: ["2,000+ Jobs Created", "85% Success Rate", "₱15M Economic Impact"],
    testimonial: "LocalPro transformed our employment programs. The results speak for themselves.",
    author: "Mayor Maria Santos"
  },
  {
    company: "BuildCorp Philippines",
    type: "Corporate Partnership",
    result: "50% reduction in service costs",
    description: "Integrated LocalPro services into their employee benefits program, providing quality home services while reducing operational costs significantly.",
    icon: <Building2 className="h-8 w-8 text-primary" />,
    metrics: ["₱2M Annual Savings", "95% Employee Satisfaction", "500+ Services Used"],
    testimonial: "Our employees love the convenience, and we love the cost savings.",
    author: "HR Director Juan Cruz"
  },
  {
    company: "ToolMaster Supply",
    type: "Supply Partnership",
    result: "200% growth in B2B sales",
    description: "Became the preferred supplier for LocalPro&apos;s network of contractors, expanding their market reach and increasing sales dramatically.",
    icon: <Wrench className="h-8 w-8 text-primary" />,
    metrics: ["₱5M New Revenue", "1,200+ New Customers", "40% Market Share Growth"],
    testimonial: "LocalPro opened doors we never knew existed. Our business has never been stronger.",
    author: "CEO Ana Rodriguez"
  },
];

const partnerTestimonials = [
  {
    name: "Maria Santos",
    role: "HR Director",
    company: "TechCorp Philippines",
    content: "LocalPro has transformed our employee benefits program. Our team loves the convenience and quality of services. The integration was seamless and the results exceeded our expectations.",
    rating: 5,
    avatar: "MS",
    verified: true
  },
  {
    name: "Juan Dela Cruz",
    role: "Mayor",
    company: "Quezon City LGU",
    content: "The partnership with LocalPro has created hundreds of jobs in our community. It&apos;s been a game-changer for local employment and economic development. Highly recommended for any LGU.",
    rating: 5,
    avatar: "JD",
    verified: true
  },
  {
    name: "Ana Rodriguez",
    role: "CEO",
    company: "BuildSupply Co.",
    content: "Being a LocalPro partner has opened up new markets we never thought possible. The growth has been incredible, and the support team is outstanding. Best business decision we&apos;ve made.",
    rating: 5,
    avatar: "AR",
    verified: true
  },
  {
    name: "Carlos Mendoza",
    role: "Operations Manager",
    company: "HomeCare Solutions",
    content: "The partnership with LocalPro has streamlined our operations and increased our customer base by 150%. The platform integration is flawless and the support is exceptional.",
    rating: 5,
    avatar: "CM",
    verified: true
  },
];

const partnershipProcess = [
  {
    step: "1",
    title: "Initial Discussion",
    description: "Let&apos;s discuss your goals, challenges, and how we can work together to achieve mutual success",
    icon: <Mail className="h-6 w-6" />,
    duration: "1-2 days",
    details: ["Discovery call", "Needs assessment", "Goal alignment"]
  },
  {
    step: "2",
    title: "Partnership Proposal",
    description: "We&apos;ll create a customized partnership proposal tailored to your organization&apos;s specific needs and objectives",
    icon: <Target className="h-6 w-6" />,
    duration: "3-5 days",
    details: ["Custom proposal", "Pricing structure", "Implementation plan"]
  },
  {
    step: "3",
    title: "Agreement & Onboarding",
    description: "Sign the partnership agreement and begin the comprehensive onboarding process with dedicated support",
    icon: <Handshake className="h-6 w-6" />,
    duration: "1-2 weeks",
    details: ["Contract signing", "Account setup", "Training sessions"]
  },
  {
    step: "4",
    title: "Launch & Support",
    description: "Launch your partnership with ongoing support, optimization, and regular performance reviews",
    icon: <Zap className="h-6 w-6" />,
    duration: "Ongoing",
    details: ["Go-live support", "Performance monitoring", "Regular check-ins"]
  },
];

const achievements = [
  {
    title: "Best Partnership Program 2024",
    organization: "Philippine Business Awards",
    icon: <Award className="h-6 w-6" />
  },
  {
    title: "Social Impact Excellence",
    organization: "ASEAN Business Council",
    icon: <Heart className="h-6 w-6" />
  },
  {
    title: "Innovation in Employment",
    organization: "Department of Labor",
    icon: <Lightbulb className="h-6 w-6" />
  },
  {
    title: "Community Development Award",
    organization: "Local Government League",
    icon: <Users className="h-6 w-6" />
  }
];

export default function PartnersPage() {
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Star className="w-4 h-4 mr-2" />
              Join 500+ Partners
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold font-headline mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Partnership Opportunities
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12">
              Partner with LocalPro to create meaningful impact, drive growth, and transform communities across the Philippines.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300">
                <Link href="#partnership-types">
                  Explore Partnerships <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Link href="/contact-us">
                  Contact Us
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
            <h2 className="font-headline text-4xl font-bold md:text-5xl mb-6">Partnership Opportunities</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Choose the partnership model that aligns with your organization&apos;s goals and create lasting impact
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
                      <p className="text-sm italic text-muted-foreground mb-2">&quot;{story.testimonial}&quot;</p>
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
                    <p className="text-muted-foreground leading-relaxed mb-6">&quot;{testimonial.content}&quot;</p>
                    
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
