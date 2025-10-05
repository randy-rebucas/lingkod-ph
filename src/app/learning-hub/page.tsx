'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  UserCheck, 
  Building2, 
  ArrowRight, 
  CheckCircle, 
  CreditCard, 
  MessageSquare, 
  Calendar,
  Target,
  Globe,
  FileText,
  Video,
  Download,
  ExternalLink,
  Search
} from 'lucide-react';

const LearningHubOverviewPage = () => {
  const userTypes = [
    {
      title: "For Clients",
      description: "Learn how to find and book the best local services in your area",
      icon: <Users className="h-8 w-8" />,
      href: "/learning-hub/clients",
      color: "bg-blue-50 text-blue-600 border-blue-200",
      features: ["Find Services", "Read Reviews", "Book Instantly", "Secure Payments"]
    },
    {
      title: "For Providers",
      description: "Grow your business and connect with more clients in your community",
      icon: <UserCheck className="h-8 w-8" />,
      href: "/learning-hub/providers",
      color: "bg-green-50 text-green-600 border-green-200",
      features: ["Grow Business", "Build Reputation", "Targeted Jobs", "Quick Payments"]
    },
    {
      title: "For Agencies",
      description: "Manage multiple service providers and scale your operations",
      icon: <Building2 className="h-8 w-8" />,
      href: "/learning-hub/agencies",
      color: "bg-purple-50 text-purple-600 border-purple-200",
      features: ["Manage Teams", "Scale Operations", "Quality Control", "Analytics Dashboard"]
    },
    {
      title: "For Partners",
      description: "Join our partner ecosystem and grow together with LocalPro",
      icon: <Building2 className="h-8 w-8" />,
      href: "/learning-hub/partners",
      color: "bg-orange-50 text-orange-600 border-orange-200",
      features: ["Expand Reach", "Mutual Growth", "Premium Support", "Strategic Alignment"]
    }
  ];

  const quickStats = [
    { label: "Active Providers", value: "10,000+", icon: <UserCheck className="h-5 w-5" /> },
    { label: "Happy Clients", value: "50,000+", icon: <Users className="h-5 w-5" /> },
    { label: "Service Categories", value: "100+", icon: <Target className="h-5 w-5" /> },
    { label: "Cities Covered", value: "500+", icon: <Globe className="h-5 w-5" /> }
  ];

  const resources = [
    {
      title: "User Guides",
      description: "Comprehensive guides for all user types",
      icon: <FileText className="h-6 w-6" />,
      action: "Download PDF"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      icon: <Video className="h-6 w-6" />,
      action: "Watch Videos"
    },
    {
      title: "Community Forum",
      description: "Connect with other users and get help",
      icon: <MessageSquare className="h-6 w-6" />,
      action: "Join Forum"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20">
              <BookOpen className="h-3 w-3 mr-1" />
              Comprehensive Learning Center
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome to LocalPro Learning Hub
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Your complete guide to using LocalPro effectively. Whether you're a client looking for services, 
              a provider offering expertise, an agency managing teams, or a partner growing with us - we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link href="#user-types" className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Start Learning</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/signup" className="flex items-center space-x-2">
                  <span>Get Started</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {quickStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary mr-3">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section id="user-types" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Choose Your Learning Path</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select your role to access tailored guides, tips, and resources designed specifically for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {userTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className={`mx-auto w-16 h-16 ${type.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {type.icon}
                  </div>
                  <CardTitle className="text-2xl">{type.title}</CardTitle>
                  <CardDescription className="text-base">{type.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-2">
                    {type.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button asChild className="w-full group-hover:bg-primary/90 transition-colors">
                    <Link href={type.href} className="flex items-center justify-center space-x-2">
                      <span>Learn More</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How LocalPro Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A simple, secure, and efficient platform connecting communities with trusted service providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Search & Discover</h3>
              <p className="text-muted-foreground">
                Find verified service providers in your area with detailed profiles and reviews.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Book & Schedule</h3>
              <p className="text-muted-foreground">
                Schedule appointments directly through our platform with real-time availability.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Pay Securely</h3>
              <p className="text-muted-foreground">
                Complete transactions safely with our integrated payment system and fraud protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Additional Resources</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Download guides, watch tutorials, and access helpful resources to get the most out of LocalPro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {resources.map((resource, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                    {resource.icon}
                  </div>
                  <CardTitle>{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    {resource.action === "Download PDF" && <Download className="h-4 w-4 mr-2" />}
                    {resource.action === "Watch Videos" && <ExternalLink className="h-4 w-4 mr-2" />}
                    {resource.action === "Join Forum" && <ExternalLink className="h-4 w-4 mr-2" />}
                    {resource.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of users who are already using LocalPro to connect, 
            grow, and succeed in their communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup" className="flex items-center space-x-2">
                <span>Sign Up Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
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

export default LearningHubOverviewPage;
