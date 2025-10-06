'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserCheck, 
  ArrowRight, 
  Star, 
  CreditCard, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Award,
  Target,
  Zap,
  FileText,
  Video,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Heart,
  Clock
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ProvidersLearningPage = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const features = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Grow Your Business",
      description: "Reach more clients and increase your bookings"
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Build Reputation",
      description: "Earn reviews and build trust with clients"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Targeted Jobs",
      description: "Get matched with relevant service requests"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Quick Payments",
      description: "Receive payments faster with our streamlined system"
    }
  ];

  const verificationSteps = [
    {
      step: 1,
      title: "Submit Documents",
      description: "Provide valid ID and business permits",
      details: "Upload clear photos of your government-issued ID, business permits, certifications, and any relevant licenses.",
      estimatedTime: "10 minutes",
      icon: <FileText className="h-6 w-6" />
    },
    {
      step: 2,
      title: "Background Check",
      description: "We verify your credentials and history",
      details: "Our team conducts a thorough background check including criminal history, employment verification, and reference checks.",
      estimatedTime: "2-3 business days",
      icon: <Shield className="h-6 w-6" />
    },
    {
      step: 3,
      title: "Skill Assessment",
      description: "Demonstrate your expertise in your field",
      details: "Complete a skills assessment, provide portfolio examples, or take a competency test relevant to your service area.",
      estimatedTime: "30-60 minutes",
      icon: <Award className="h-6 w-6" />
    },
    {
      step: 4,
      title: "Profile Setup",
      description: "Create your professional profile",
      details: "Set up your profile with photos, service descriptions, pricing, availability, and service areas.",
      estimatedTime: "20 minutes",
      icon: <UserCheck className="h-6 w-6" />
    },
    {
      step: 5,
      title: "Get Verified",
      description: "Receive your verified badge and start accepting bookings",
      details: "Once approved, you'll receive your verified badge, access to the provider dashboard, and can start accepting client bookings.",
      estimatedTime: "Immediate",
      icon: <CheckCircle className="h-6 w-6" />
    }
  ];

  const successTips = [
    {
      icon: <Star className="h-5 w-5" />,
      title: "Complete Your Profile",
      description: "Add photos, certifications, and detailed descriptions"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Respond Quickly",
      description: "Fast responses increase your booking rate"
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Maintain Quality",
      description: "Consistent quality leads to better reviews"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Set Competitive Prices",
      description: "Research market rates and price accordingly"
    }
  ];

  const providerTutorials = [
    {
      title: "Provider Onboarding Complete Guide",
      description: "Complete step-by-step guide to becoming a successful LocalPro provider",
      duration: "15 minutes",
      difficulty: "Beginner",
      topics: ["Verification", "Profile Setup", "Service Configuration", "Pricing Strategy"],
      href: "/learning-hub/articles/provider-onboarding"
    },
    {
      title: "Profile Optimization Masterclass",
      description: "Learn how to create a compelling profile that attracts more clients",
      duration: "12 minutes",
      difficulty: "Intermediate",
      topics: ["Photos", "Descriptions", "Pricing", "Availability"],
      href: "/learning-hub/articles/profile-optimization"
    },
    {
      title: "Booking Management System",
      description: "Master the booking management tools and scheduling features",
      duration: "10 minutes",
      difficulty: "Beginner",
      topics: ["Calendar", "Availability", "Bookings", "Notifications"],
      href: "/learning-hub/articles/booking-management-system"
    },
    {
      title: "Earnings and Payout Guide",
      description: "Understanding your earnings, payouts, and financial management",
      duration: "8 minutes",
      difficulty: "Beginner",
      topics: ["Earnings", "Payouts", "Taxes", "Financial Reports"],
      href: "/learning-hub/articles/earnings-payout-guide"
    }
  ];

  const businessTools = [
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Booking Management",
      description: "Manage your schedule, availability, and bookings efficiently",
      features: ["Real-time Calendar", "Availability Settings", "Booking Notifications", "Rescheduling Tools"]
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Client Communication",
      description: "Chat with clients directly through the platform",
      features: ["In-app Messaging", "Quick Responses", "Message Templates", "Communication History"]
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Payment Processing",
      description: "Secure and fast payment collection with multiple options",
      features: ["Secure Payments", "Multiple Methods", "Instant Payouts", "Payment History"]
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Analytics Dashboard",
      description: "Track your performance, earnings, and business growth",
      features: ["Earnings Reports", "Performance Metrics", "Client Analytics", "Growth Insights"]
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "Review Management",
      description: "Manage and respond to client reviews and ratings",
      features: ["Review Responses", "Rating Analytics", "Feedback Management", "Reputation Building"]
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Marketing Tools",
      description: "Promote your services and attract more clients",
      features: ["Service Promotion", "Special Offers", "Client Retention", "Referral Programs"]
    }
  ];

  const faqItems = [
    {
      question: "How do I become a verified service provider?",
      answer: "Complete the verification process by submitting your ID, business permits, and completing a skills assessment. Our team will review your application and approve you within 2-3 business days."
    },
    {
      question: "What commission does LocalPro take?",
      answer: "LocalPro takes a small commission (typically 5-10%) from each completed service. This covers platform maintenance, payment processing, and customer support."
    },
    {
      question: "How do I get paid?",
      answer: "Payments are processed automatically after service completion. You can withdraw funds to your bank account or GCash within 1-2 business days."
    },
    {
      question: "Can I set my own prices?",
      answer: "Yes, you have full control over your pricing. We provide market rate suggestions, but you can set prices that work for your business model."
    },
    {
      question: "How do I handle difficult clients?",
      answer: "Our support team is here to help mediate any issues. You can also use our rating and review system to build a reputation that attracts quality clients."
    },
    {
      question: "What if a client cancels last minute?",
      answer: "We have cancellation policies in place. Clients who cancel within 24 hours may be charged a cancellation fee, which goes to you as compensation."
    }
  ];

  const earnings = [
    { metric: "Average Hourly Rate", value: "₱500-₱2,000", icon: <CreditCard className="h-5 w-5" /> },
    { metric: "Monthly Bookings", value: "20-50+", icon: <Calendar className="h-5 w-5" /> },
    { metric: "Client Retention", value: "85%+", icon: <Heart className="h-5 w-5" /> },
    { metric: "Platform Support", value: "24/7", icon: <MessageSquare className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-green-100 text-green-800 border-green-200">
              <UserCheck className="h-3 w-3 mr-1" />
              For Service Providers
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
              Provider Success Center
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Learn how to grow your business with LocalPro. Connect with more clients, 
              build your reputation, and increase your earnings in the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link href="/signup" className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>Become a Provider</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#verification" className="flex items-center space-x-2">
                  <span>Start Learning</span>
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
            <h2 className="text-3xl font-bold mb-4">Why Choose LocalPro?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover all the benefits of joining LocalPro as a service provider.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
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

      {/* Earnings Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Earning Potential</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what you can earn as a LocalPro service provider.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {earnings.map((earning, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600 mr-3">
                      {earning.icon}
                    </div>
                    <div className="text-2xl font-bold text-green-600">{earning.value}</div>
                  </div>
                  <div className="text-muted-foreground">{earning.metric}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Verification Process Section */}
      <section id="verification" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Verification Process</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get verified and start accepting bookings in just a few simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {verificationSteps.map((step, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
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
                  <Award className="h-5 w-5 text-green-500" />
                  <span>Success Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {successTips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
                      {tip.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground">{tip.description}</p>
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
            <h2 className="text-3xl font-bold mb-4">Provider Tutorials</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tutorials to help you succeed as a LocalPro provider.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {providerTutorials.map((tutorial, index) => (
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

      {/* Business Tools Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Business Tools</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Access powerful tools to manage and grow your service business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessTools.map((tool, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                      {tool.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      <CardDescription className="text-sm">{tool.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tool.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
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
              Find answers to common questions about being a LocalPro service provider.
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
            <h2 className="text-3xl font-bold mb-4">Provider Resources</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Download guides, watch tutorials, and access helpful resources for service providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle>Provider Guide</CardTitle>
                <CardDescription>Complete guide to succeeding on LocalPro</CardDescription>
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
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  <Video className="h-6 w-6" />
                </div>
                <CardTitle>Training Videos</CardTitle>
                <CardDescription>Learn best practices and platform features</CardDescription>
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
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle>Provider Support</CardTitle>
                <CardDescription>Get help from our dedicated support team</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Business?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of successful service providers who trust LocalPro to grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup" className="flex items-center space-x-2">
                <span>Become a Provider</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-green-600" asChild>
              <Link href="/contact-us" className="flex items-center space-x-2">
                <span>Contact Us</span>
                <MessageSquare className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProvidersLearningPage;
