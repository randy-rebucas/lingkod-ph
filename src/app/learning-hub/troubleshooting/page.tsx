'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle,
  Clock,
  Star,
  ArrowRight,
  BookOpen,
  AlertTriangle,
  MessageSquare,
  Phone,
  Mail,
  Search,
  RefreshCw,
  Shield,
  CreditCard,
  User,
  Calendar
} from 'lucide-react';

const TroubleshootingPage = () => {
  const troubleshootingArticles = [
    {
      id: 9,
      title: "Troubleshooting Login Issues",
      description: "Common login problems and their solutions",
      readTime: "3 min read",
      isPopular: true,
      difficulty: "Beginner",
      lastUpdated: "2024-01-17",
      href: "/learning-hub/articles/login-troubleshooting"
    },
    {
      id: 10,
      title: "Payment Problems and Solutions",
      description: "Resolve common payment issues and errors",
      readTime: "5 min read",
      isPopular: true,
      difficulty: "Beginner",
      lastUpdated: "2024-01-15",
      href: "/learning-hub/articles/payment-troubleshooting"
    },
    {
      id: 11,
      title: "Booking Errors and Fixes",
      description: "Common booking issues and how to resolve them",
      readTime: "4 min read",
      isPopular: false,
      difficulty: "Beginner",
      lastUpdated: "2024-01-12",
      href: "/learning-hub/articles/booking-errors"
    },
    {
      id: 12,
      title: "Account Recovery Process",
      description: "How to recover your account if you're locked out",
      readTime: "6 min read",
      isPopular: false,
      difficulty: "Intermediate",
      lastUpdated: "2024-01-09",
      href: "/learning-hub/articles/account-recovery"
    }
  ];

  const commonIssues = [
    {
      category: "Account Issues",
      icon: <User className="h-6 w-6" />,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      issues: [
        "Can't log in to my account",
        "Forgot my password",
        "Account locked or suspended",
        "Email verification problems"
      ]
    },
    {
      category: "Payment Problems",
      icon: <CreditCard className="h-6 w-6" />,
      color: "bg-green-50 text-green-600 border-green-200",
      issues: [
        "Payment declined or failed",
        "Charged twice for same service",
        "Refund not processed",
        "Payment method not working"
      ]
    },
    {
      category: "Booking Issues",
      icon: <Calendar className="h-6 w-6" />,
      color: "bg-yellow-50 text-yellow-600 border-yellow-200",
      issues: [
        "Can't book a service",
        "Booking confirmation not received",
        "Wrong time or date booked",
        "Provider not responding"
      ]
    },
    {
      category: "Technical Problems",
      icon: <AlertTriangle className="h-6 w-6" />,
      color: "bg-red-50 text-red-600 border-red-200",
      issues: [
        "App crashes or freezes",
        "Pages not loading",
        "Search not working",
        "Notifications not received"
      ]
    }
  ];

  const quickFixes = [
    {
      title: "Clear Browser Cache",
      description: "Clear your browser cache and cookies to resolve loading issues",
      icon: <RefreshCw className="h-5 w-5" />,
      steps: ["Press Ctrl+Shift+Delete", "Select 'Cached images and files'", "Click 'Clear data'"]
    },
    {
      title: "Check Internet Connection",
      description: "Ensure you have a stable internet connection",
      icon: <Search className="h-5 w-5" />,
      steps: ["Test your connection", "Try a different network", "Restart your router"]
    },
    {
      title: "Update Your App",
      description: "Make sure you're using the latest version of the app",
      icon: <RefreshCw className="h-5 w-5" />,
      steps: ["Check app store for updates", "Download latest version", "Restart the app"]
    },
    {
      title: "Contact Support",
      description: "If nothing else works, our support team is here to help",
      icon: <MessageSquare className="h-5 w-5" />,
      steps: ["Use the contact form", "Include error details", "Wait for response"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-red-100 text-red-800 border-red-200">
              <HelpCircle className="h-3 w-3 mr-1" />
              Help & Support
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
              Troubleshooting & Support
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Having trouble? Find solutions to common issues and get the help you need.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link href="#common-issues" className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Find Solutions</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#contact-support" className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Contact Support</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Common Issues */}
      <section id="common-issues" className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Common Issues</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Browse our most frequently reported issues and their solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {commonIssues.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center`}>
                      {category.icon}
                    </div>
                    <CardTitle className="text-xl">{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {category.issues.map((issue, issueIndex) => (
                      <li key={issueIndex} className="flex items-start space-x-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-2"></div>
                        <span className="text-muted-foreground">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Fixes */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Quick Fixes</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Try these quick solutions before contacting support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {quickFixes.map((fix, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {fix.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{fix.title}</CardTitle>
                      <CardDescription>{fix.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {fix.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start space-x-2 text-sm">
                        <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          {stepIndex + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Troubleshooting Articles */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Detailed Troubleshooting Guides</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              In-depth guides for resolving specific issues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {troubleshootingArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {article.difficulty}
                    </Badge>
                    {article.isPopular && (
                      <Badge variant="default" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    <Link href={article.href} className="hover:underline">
                      {article.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-base">
                    {article.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {article.readTime}
                    </div>
                    <Button variant="ghost" size="sm" asChild className="group-hover:bg-primary/10">
                      <Link href={article.href} className="flex items-center space-x-1">
                        <span>Read Guide</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section id="contact-support" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our support team is here to help you resolve any issues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle>Live Chat</CardTitle>
                <CardDescription>Get instant help from our support team</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/contact" className="flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Chat
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  <Mail className="h-6 w-6" />
                </div>
                <CardTitle>Email Support</CardTitle>
                <CardDescription>Send us a detailed message about your issue</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/contact" className="flex items-center justify-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                  <Phone className="h-6 w-6" />
                </div>
                <CardTitle>Phone Support</CardTitle>
                <CardDescription>Call us for urgent issues and complex problems</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="tel:+1-800-LOCALPRO" className="flex items-center justify-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need Immediate Help?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Don't wait! Contact our support team for immediate assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Contact Support</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-red-600" asChild>
              <Link href="/learning-hub/all-articles" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Browse All Articles</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TroubleshootingPage;
