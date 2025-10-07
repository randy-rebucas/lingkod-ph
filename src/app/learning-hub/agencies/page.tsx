'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  ArrowRight, 
  Shield, 
  CreditCard, 
  MessageSquare, 
  TrendingUp,
  Award,
  Target,
  FileText,
  Video,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Users,
  BarChart3,
  Settings,
  Globe
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const AgenciesLearningPage = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const features = [
    {
      icon: <Users className="h-5 w-5" />,
      title: "Manage Teams",
      description: "Oversee multiple service providers and projects"
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      title: "Scale Operations",
      description: "Expand your business with our platform tools"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Quality Control",
      description: "Maintain high standards across all services"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Analytics Dashboard",
      description: "Track performance and optimize your operations"
    }
  ];

  const setupSteps = [
    {
      step: 1,
      title: "Agency Registration",
      description: "Register your agency and provide business documentation",
      details: "Submit your business registration, permits, insurance certificates, and agency information for verification.",
      estimatedTime: "15 minutes",
      icon: <Building2 className="h-6 w-6" />
    },
    {
      step: 2,
      title: "Business Verification",
      description: "Complete business verification and compliance checks",
      details: "Our team verifies your business credentials, insurance coverage, and compliance with local regulations.",
      estimatedTime: "3-5 business days",
      icon: <Shield className="h-6 w-6" />
    },
    {
      step: 3,
      title: "Team Onboarding",
      description: "Add and verify your service providers",
      details: "Invite your team members, ensure they complete individual provider verification, and set up team hierarchies.",
      estimatedTime: "2-3 days per provider",
      icon: <Users className="h-6 w-6" />
    },
    {
      step: 4,
      title: "Platform Setup",
      description: "Configure your agency dashboard and settings",
      details: "Set up your agency profile, service categories, pricing structures, operational preferences, and quality standards.",
      estimatedTime: "30 minutes",
      icon: <Settings className="h-6 w-6" />
    },
    {
      step: 5,
      title: "Quality Assurance Setup",
      description: "Establish quality control and monitoring systems",
      details: "Set up quality standards, monitoring systems, training programs, and performance metrics for your team.",
      estimatedTime: "1 hour",
      icon: <Award className="h-6 w-6" />
    },
    {
      step: 6,
      title: "Go Live",
      description: "Start accepting bookings and managing operations",
      details: "Launch your agency on LocalPro, begin serving clients, and start building your reputation in the market.",
      estimatedTime: "Immediate",
      icon: <Target className="h-6 w-6" />
    }
  ];

  const agencyTutorials = [
    {
      title: "Agency Setup Complete Guide",
      description: "Complete step-by-step guide to setting up your agency on LocalPro",
      duration: "20 minutes",
      difficulty: "Beginner",
      topics: ["Registration", "Verification", "Team Setup", "Configuration"],
      href: "/learning-hub/articles/agency-setup-guide"
    },
    {
      title: "Team Management Best Practices",
      description: "Learn how to effectively manage and coordinate your service provider team",
      duration: "15 minutes",
      difficulty: "Intermediate",
      topics: ["Team Coordination", "Scheduling", "Performance", "Communication"],
      href: "/learning-hub/articles/team-management"
    },
    {
      title: "Quality Control Systems",
      description: "Establish and maintain high service quality standards across your agency",
      duration: "12 minutes",
      difficulty: "Intermediate",
      topics: ["Quality Standards", "Monitoring", "Training", "Improvement"],
      href: "/learning-hub/articles/quality-control"
    },
    {
      title: "Agency Analytics and Reporting",
      description: "Understanding your agency's performance metrics and growth analytics",
      duration: "10 minutes",
      difficulty: "Beginner",
      topics: ["Analytics", "Reports", "KPIs", "Growth Metrics"],
      href: "/learning-hub/articles/agency-analytics"
    }
  ];

  const managementTools = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Performance Analytics",
      description: "Track bookings, revenue, and provider performance",
      features: ["Revenue Reports", "Provider Performance", "Client Analytics", "Growth Metrics"]
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Team Management",
      description: "Manage provider schedules, assignments, and performance",
      features: ["Team Scheduling", "Assignment Management", "Performance Tracking", "Communication Tools"]
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Quality Assurance",
      description: "Monitor service quality and client satisfaction",
      features: ["Quality Monitoring", "Client Feedback", "Training Programs", "Standards Management"]
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Market Expansion",
      description: "Access new markets and customer segments",
      features: ["Market Analysis", "Expansion Tools", "Client Acquisition", "Territory Management"]
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Financial Management",
      description: "Manage agency finances, payouts, and revenue",
      features: ["Revenue Tracking", "Provider Payouts", "Financial Reports", "Tax Management"]
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Brand Management",
      description: "Maintain consistent brand standards and reputation",
      features: ["Brand Guidelines", "Reputation Management", "Marketing Tools", "Client Relations"]
    }
  ];

  const growthStrategies = [
    {
      icon: <Target className="h-5 w-5" />,
      title: "Market Expansion",
      description: "Access new markets and customer segments"
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Brand Management",
      description: "Maintain consistent brand standards"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Quality Assurance",
      description: "Monitor and improve service quality"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Training Resources",
      description: "Access training materials for your team"
    }
  ];

  const faqItems = [
    {
      question: "How do I register my agency on LocalPro?",
      answer: "Contact our business development team to start the agency registration process. You'll need to provide business documentation, agency information, and details about your service providers."
    },
    {
      question: "What are the requirements for agency registration?",
      answer: "You need a registered business, valid permits, insurance coverage, and a team of verified service providers. We also require references and a business plan."
    },
    {
      question: "How do I manage multiple service providers?",
      answer: "Our agency dashboard provides tools to manage provider schedules, assign jobs, track performance, and handle payments. You can also set up automated workflows and quality control processes."
    },
    {
      question: "What commission structure applies to agencies?",
      answer: "Agencies benefit from reduced commission rates (typically 3-7%) and can set their own pricing structure. We also offer volume discounts and performance bonuses."
    },
    {
      question: "How do I ensure quality across my team?",
      answer: "Use our quality assurance tools, implement training programs, monitor client feedback, and establish clear service standards. We provide resources and support for maintaining high quality."
    },
    {
      question: "Can I expand to new markets?",
      answer: "Yes, we help agencies expand to new cities and regions. Our platform provides market insights, client demand data, and expansion support services."
    }
  ];

  const benefits = [
    { metric: "Reduced Commission", value: "3-7%", icon: <CreditCard className="h-5 w-5" /> },
    { metric: "Team Size", value: "5-100+", icon: <Users className="h-5 w-5" /> },
    { metric: "Market Coverage", value: "Multi-City", icon: <Globe className="h-5 w-5" /> },
    { metric: "Support Level", value: "Dedicated", icon: <MessageSquare className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-purple-100 text-purple-800 border-purple-200">
              <Building2 className="h-3 w-3 mr-1" />
              For Agencies
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              Agency Management Center
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Manage multiple service providers and scale your operations with LocalPro's 
              comprehensive agency tools and features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link href="/contact-us" className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Contact Business Team</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#setup" className="flex items-center space-x-2">
                  <span>Learn More</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Agency Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for managing service agencies.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Agency Benefits</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Exclusive benefits and features for registered agencies.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600 mr-3">
                      {benefit.icon}
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{benefit.value}</div>
                  </div>
                  <div className="text-muted-foreground">{benefit.metric}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Process Section */}
      <section id="setup" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Agency Setup Process</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get your agency up and running on LocalPro in just a few steps.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {setupSteps.map((step, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground mb-2">{step.description}</p>
                        <p className="text-sm text-muted-foreground">{step.details}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <span>Management Tools</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {managementTools.map((tool, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
                      {tool.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{tool.title}</h4>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tutorials Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Agency Tutorials</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tutorials to help you build and manage a successful agency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {agencyTutorials.map((tutorial, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {tutorial.difficulty}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {tutorial.duration}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    <Link href={tutorial.href} className="hover:underline">
                      {tutorial.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-base">
                    {tutorial.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {tutorial.topics.map((topic, topicIndex) => (
                      <Badge key={topicIndex} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" asChild className="w-full group-hover:bg-primary/10">
                    <Link href={tutorial.href} className="flex items-center justify-center space-x-1">
                      <span>Start Tutorial</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Strategies Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Growth Strategies</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Scale your agency with proven strategies and LocalPro's support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {growthStrategies.map((strategy, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                    {strategy.icon}
                  </div>
                  <CardTitle className="text-lg">{strategy.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{strategy.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about running an agency on LocalPro.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, index) => (
              <Collapsible key={index}>
                <Card>
                  <CollapsibleTrigger 
                    className="w-full"
                    onClick={() => toggleSection(`faq-${index}`)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-left">{item.question}</CardTitle>
                      {openSections[`faq-${index}`] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <p className="text-muted-foreground">{item.answer}</p>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Agency Resources</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Download guides, watch tutorials, and access helpful resources for agencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle>Agency Guide</CardTitle>
                <CardDescription>Complete guide to managing your agency on LocalPro</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                  <Video className="h-6 w-6" />
                </div>
                <CardTitle>Training Videos</CardTitle>
                <CardDescription>Learn best practices for agency management</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Watch Videos
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle>Business Support</CardTitle>
                <CardDescription>Get help from our dedicated business team</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact Team
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Scale Your Agency?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join leading agencies who trust LocalPro to manage and grow their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact-us" className="flex items-center space-x-2">
                <span>Contact Business Team</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600" asChild>
              <Link href="/partners" className="flex items-center space-x-2">
                <span>Learn More</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AgenciesLearningPage;
