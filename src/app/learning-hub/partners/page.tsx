'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  ArrowRight, 
  CheckCircle, 
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
  Globe,
  Heart,
  Handshake,
  Lightbulb,
  Rocket
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const PartnersLearningPage = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const features = [
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Expand Reach",
      description: "Connect with LocalPro's growing user base"
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: "Mutual Growth",
      description: "Benefit from our shared success and growth"
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Premium Support",
      description: "Get dedicated support for your partnership"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Strategic Alignment",
      description: "Align your goals with our platform objectives"
    }
  ];

  const partnershipTypes = [
    {
      icon: <Building2 className="h-5 w-5" />,
      title: "Technology Partners",
      description: "Integrate your solutions with our platform",
      benefits: ["API Access", "Technical Support", "Co-marketing", "Revenue Sharing"]
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Service Partners",
      description: "Offer complementary services to our users",
      benefits: ["Client Access", "Cross-promotion", "Joint Ventures", "Referral Programs"]
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Marketing Partners",
      description: "Cross-promote and reach new audiences",
      benefits: ["Co-marketing", "Brand Exposure", "Lead Sharing", "Event Partnerships"]
    },
    {
      icon: <Handshake className="h-5 w-5" />,
      title: "Strategic Partners",
      description: "Long-term collaboration and growth",
      benefits: ["Strategic Planning", "Market Expansion", "Innovation", "Investment"]
    }
  ];

  const partnershipProcess = [
    {
      step: 1,
      title: "Initial Discussion",
      description: "Share your partnership proposal and goals",
      details: "Contact our partnership team to discuss your business and how we can work together."
    },
    {
      step: 2,
      title: "Evaluation & Due Diligence",
      description: "We evaluate the partnership opportunity",
      details: "Our team reviews your proposal, business model, and alignment with our goals."
    },
    {
      step: 3,
      title: "Partnership Agreement",
      description: "Finalize terms and sign partnership agreement",
      details: "Negotiate terms, create legal agreements, and establish partnership framework."
    },
    {
      step: 4,
      title: "Launch & Support",
      description: "Launch partnership with ongoing support",
      details: "Execute partnership activities with dedicated support and regular check-ins."
    }
  ];

  const partnerBenefits = [
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Dedicated Support",
      description: "Get dedicated account management and support"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Co-marketing Opportunities",
      description: "Access joint marketing and promotional opportunities"
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Revenue Sharing",
      description: "Benefit from revenue sharing and referral programs"
    },
    {
      icon: <Rocket className="h-5 w-5" />,
      title: "Early Access",
      description: "Get early access to new features and opportunities"
    }
  ];

  const successStories = [
    {
      company: "TechCorp Solutions",
      partnership: "Technology Integration",
      result: "300% increase in user engagement",
      icon: <Lightbulb className="h-5 w-5" />
    },
    {
      company: "ServiceMax Agency",
      partnership: "Service Partnership",
      result: "500+ new clients acquired",
      icon: <Users className="h-5 w-5" />
    },
    {
      company: "MarketingPro",
      partnership: "Marketing Collaboration",
      result: "2x brand awareness growth",
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      company: "InnovateHub",
      partnership: "Strategic Partnership",
      result: "Expanded to 5 new markets",
      icon: <Globe className="h-5 w-5" />
    }
  ];

  const faqItems = [
    {
      question: "What types of partnerships does LocalPro offer?",
      answer: "We offer technology partnerships, service partnerships, marketing partnerships, and strategic partnerships. Each type has different benefits and requirements tailored to your business needs."
    },
    {
      question: "How do I become a LocalPro partner?",
      answer: "Contact our partnership team with your proposal. We'll evaluate your business, discuss alignment with our goals, and work together to create a mutually beneficial partnership agreement."
    },
    {
      question: "What are the requirements for partnership?",
      answer: "Requirements vary by partnership type, but generally include a strong business reputation, alignment with our values, complementary services or technology, and a commitment to mutual growth."
    },
    {
      question: "What support do partners receive?",
      answer: "Partners receive dedicated account management, technical support, co-marketing opportunities, early access to new features, and regular business reviews to ensure partnership success."
    },
    {
      question: "How does revenue sharing work?",
      answer: "Revenue sharing terms vary by partnership type and are negotiated individually. We offer competitive rates and flexible structures that benefit both parties."
    },
    {
      question: "Can I partner with LocalPro if I'm a competitor?",
      answer: "We evaluate each opportunity individually. While we may not partner with direct competitors, we're open to strategic partnerships that can benefit both parties and the market."
    }
  ];

  const metrics = [
    { metric: "Active Partners", value: "50+", icon: <Handshake className="h-5 w-5" /> },
    { metric: "Revenue Growth", value: "200%+", icon: <TrendingUp className="h-5 w-5" /> },
    { metric: "Market Reach", value: "Global", icon: <Globe className="h-5 w-5" /> },
    { metric: "Support Level", value: "24/7", icon: <MessageSquare className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-orange-100 text-orange-800 border-orange-200">
              <Building2 className="h-3 w-3 mr-1" />
              For Partners
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
              Partnership Center
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Join our partner ecosystem and grow together. We offer various partnership 
              opportunities for businesses looking to expand their reach and impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link href="/contact-us" className="flex items-center space-x-2">
                  <Handshake className="h-5 w-5" />
                  <span>Become a Partner</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#partnership-types" className="flex items-center space-x-2">
                  <span>Explore Partnerships</span>
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
            <h2 className="text-3xl font-bold mb-4">Why Partner with LocalPro?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the benefits of joining our growing partner ecosystem.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-4">
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

      {/* Metrics Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Partnership Impact</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See the impact of our successful partnerships.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600 mr-3">
                      {metric.icon}
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{metric.value}</div>
                  </div>
                  <div className="text-muted-foreground">{metric.metric}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Types Section */}
      <section id="partnership-types" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Partnership Types</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the partnership model that best fits your business goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {partnershipTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                      {type.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{type.title}</CardTitle>
                      <CardDescription className="text-base">{type.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {type.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Process Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Partnership Process</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our streamlined process makes it easy to become a LocalPro partner.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {partnershipProcess.map((step, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
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
                  <Award className="h-5 w-5 text-orange-500" />
                  <span>Partner Benefits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {partnerBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{benefit.title}</h4>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how our partners have grown with LocalPro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {successStories.map((story, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-4">
                    {story.icon}
                  </div>
                  <CardTitle className="text-lg">{story.company}</CardTitle>
                  <CardDescription>{story.partnership}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-orange-600">{story.result}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about partnering with LocalPro.
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
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Partner Resources</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Download guides, watch tutorials, and access helpful resources for partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle>Partnership Guide</CardTitle>
                <CardDescription>Complete guide to partnering with LocalPro</CardDescription>
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
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-4">
                  <Video className="h-6 w-6" />
                </div>
                <CardTitle>Partner Training</CardTitle>
                <CardDescription>Learn best practices for partnership success</CardDescription>
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
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-4">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle>Partnership Support</CardTitle>
                <CardDescription>Get help from our partnership team</CardDescription>
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
      <section className="py-20 px-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Partner with LocalPro?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join our partner ecosystem and grow together. Let's create something amazing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact-us" className="flex items-center space-x-2">
                <span>Start Partnership</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-orange-600" asChild>
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

export default PartnersLearningPage;
