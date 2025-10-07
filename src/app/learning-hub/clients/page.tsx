'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ArrowRight, 
  Star, 
  Shield, 
  CreditCard, 
  MessageSquare, 
  Calendar,
  Search,
  Clock,
  Award,
  FileText,
  Video,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Heart,
  Target
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ClientsLearningPage = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const features = [
    {
      icon: <Search className="h-5 w-5" />,
      title: "Find Services",
      description: "Search and discover verified local service providers in your area"
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "Read Reviews",
      description: "Check ratings and reviews from other clients before booking"
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Book Instantly",
      description: "Schedule appointments directly through our platform"
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Secure Payments",
      description: "Pay safely with our integrated payment system"
    }
  ];

  const gettingStartedSteps = [
    {
      step: 1,
      title: "Create Your Account",
      description: "Sign up with your email and verify your account",
      details: "Provide your basic information, verify your email address, and set up your profile preferences to get started.",
      estimatedTime: "2 minutes",
      icon: <Users className="h-6 w-6" />
    },
    {
      step: 2,
      title: "Set Your Location",
      description: "Add your location to find nearby services",
      details: "Enable location services or manually set your address to discover local service providers in your area.",
      estimatedTime: "1 minute",
      icon: <Target className="h-6 w-6" />
    },
    {
      step: 3,
      title: "Search for Services",
      description: "Browse available services in your area",
      details: "Use our advanced search filters to find the perfect service provider based on location, price, ratings, and availability.",
      estimatedTime: "3 minutes",
      icon: <Search className="h-6 w-6" />
    },
    {
      step: 4,
      title: "Book & Pay",
      description: "Schedule your service and pay securely",
      details: "Choose your preferred time slot, add special instructions, and complete payment through our secure system with fraud protection.",
      estimatedTime: "5 minutes",
      icon: <CreditCard className="h-6 w-6" />
    },
    {
      step: 5,
      title: "Track Your Booking",
      description: "Monitor your service status in real-time",
      details: "Get real-time updates about your booking status, provider location, and estimated arrival time.",
      estimatedTime: "Ongoing",
      icon: <Calendar className="h-6 w-6" />
    },
    {
      step: 6,
      title: "Rate & Review",
      description: "Share your experience to help others",
      details: "Leave a detailed review and rating to help other clients make informed decisions and help providers improve their services.",
      estimatedTime: "2 minutes",
      icon: <Star className="h-6 w-6" />
    }
  ];

  const safetyFeatures = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Verified Providers",
      description: "All providers are background-checked and verified"
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Secure Payments",
      description: "Fraud protection and secure payment processing"
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "24/7 Support",
      description: "Customer support available around the clock"
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Insurance Coverage",
      description: "All services are covered by insurance"
    }
  ];

  const faqItems = [
    {
      question: "How do I find the right service provider?",
      answer: "Use our search filters to narrow down providers by location, service type, price range, and ratings. Read reviews from other clients and check provider profiles for detailed information about their experience and services."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept GCash, credit cards, debit cards, and bank transfers. All payments are processed securely through our platform with fraud protection."
    },
    {
      question: "Can I cancel or reschedule my booking?",
      answer: "Yes, you can cancel or reschedule your booking up to 24 hours before the scheduled time. Cancellation policies may vary by provider, so check the specific terms when booking."
    },
    {
      question: "What if I'm not satisfied with the service?",
      answer: "Contact our customer support team immediately. We have a comprehensive dispute resolution process and will work with you and the provider to resolve any issues fairly."
    },
    {
      question: "How do I know if a provider is trustworthy?",
      answer: "All providers on our platform are verified through background checks, ID verification, and skill assessments. You can also read reviews from other clients and check their ratings and response times."
    },
    {
      question: "Is there a fee for using LocalPro?",
      answer: "There are no hidden fees for clients. The price you see is the price you pay. Service providers pay a small commission to LocalPro, which is already included in their pricing."
    }
  ];

  const clientTutorials = [
    {
      title: "Complete Client Onboarding",
      description: "Step-by-step guide to setting up your client account and preferences",
      duration: "5 minutes",
      difficulty: "Beginner",
      topics: ["Account Setup", "Profile Creation", "Location Settings", "Payment Methods"],
      href: "/learning-hub/articles/client-onboarding"
    },
    {
      title: "Advanced Search Techniques",
      description: "Master the search functionality to find exactly what you need",
      duration: "8 minutes",
      difficulty: "Intermediate",
      topics: ["Filters", "Location Search", "Price Ranges", "Availability"],
      href: "/learning-hub/articles/advanced-search-techniques"
    },
    {
      title: "Booking Management",
      description: "How to manage, modify, and track your bookings effectively",
      duration: "6 minutes",
      difficulty: "Beginner",
      topics: ["Booking Status", "Modifications", "Cancellations", "Rescheduling"],
      href: "/learning-hub/articles/booking-management"
    },
    {
      title: "Payment Security Guide",
      description: "Understanding payment protection and security features",
      duration: "4 minutes",
      difficulty: "Beginner",
      topics: ["Secure Payments", "Fraud Protection", "Refunds", "Payment Methods"],
      href: "/learning-hub/articles/payment-security-guide"
    }
  ];

  const tips = [
    {
      icon: <Star className="h-5 w-5" />,
      title: "Read Reviews Carefully",
      description: "Look for detailed reviews that mention specific aspects of the service and check provider response rates"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Book in Advance",
      description: "Popular providers often have limited availability, especially during peak seasons"
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Communicate Clearly",
      description: "Provide detailed information about your needs, location, and any special requirements"
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: "Leave Honest Reviews",
      description: "Help other clients by sharing your experience with detailed feedback"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Set Accurate Location",
      description: "Ensure your location is precise to get accurate pricing and availability"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Verify Provider Credentials",
      description: "Check provider verification badges and certifications before booking"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              <Users className="h-3 w-3 mr-1" />
              For Clients
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Client Learning Center
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Learn how to find and book the best local services in your area. 
              Get the most out of LocalPro as a client with our comprehensive guide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link href="/signup" className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Get Started as Client</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#getting-started" className="flex items-center space-x-2">
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
            <h2 className="text-3xl font-bold mb-4">What You Can Do</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover all the ways LocalPro makes finding and booking services easy and secure.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
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

      {/* Getting Started Section */}
      <section id="getting-started" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Getting Started Guide</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Follow these simple steps to start using LocalPro and find the perfect service provider.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {gettingStartedSteps.map((step, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
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
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Safety & Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {safetyFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
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
            <h2 className="text-3xl font-bold mb-4">Client Tutorials</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Step-by-step tutorials to help you master LocalPro as a client.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {clientTutorials.map((tutorial, index) => (
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

      {/* Tips Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Pro Tips for Clients</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Make the most of your LocalPro experience with these expert tips.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                    {tip.icon}
                  </div>
                  <CardTitle className="text-lg">{tip.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{tip.description}</CardDescription>
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
              Find answers to common questions about using LocalPro as a client.
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
            <h2 className="text-3xl font-bold mb-4">Client Resources</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Download guides, watch tutorials, and access helpful resources for clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle>Client Guide</CardTitle>
                <CardDescription>Complete guide to using LocalPro as a client</CardDescription>
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
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <Video className="h-6 w-6" />
                </div>
                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription>Step-by-step video guides for clients</CardDescription>
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
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle>Client Support</CardTitle>
                <CardDescription>Get help from our support team</CardDescription>
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
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Service Provider?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of satisfied clients who trust LocalPro for all their service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup" className="flex items-center space-x-2">
                <span>Sign Up as Client</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600" asChild>
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

export default ClientsLearningPage;
