'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap,
  Clock,
  Star,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Play,
  Download,
  FileText,
  Users,
  Calendar,
  CreditCard,
  Shield
} from 'lucide-react';

const GettingStartedPage = () => {
  const gettingStartedArticles = [
    {
      id: 1,
      title: "How to Create Your First Booking",
      description: "Step-by-step guide to booking your first service on LocalPro",
      readTime: "5 min read",
      isPopular: true,
      difficulty: "Beginner",
      lastUpdated: "2024-01-15",
      href: "/learning-hub/articles/first-booking"
    },
    {
      id: 2,
      title: "Account Setup Guide",
      description: "Complete guide to setting up your LocalPro account",
      readTime: "8 min read",
      isPopular: false,
      difficulty: "Beginner",
      lastUpdated: "2024-01-10",
      href: "/learning-hub/articles/account-setup"
    },
    {
      id: 3,
      title: "Profile Creation Best Practices",
      description: "Learn how to create an attractive and effective profile",
      readTime: "6 min read",
      isPopular: true,
      difficulty: "Beginner",
      lastUpdated: "2024-01-12",
      href: "/learning-hub/articles/profile-creation"
    },
    {
      id: 4,
      title: "Payment Setup and Verification",
      description: "How to set up and verify your payment methods",
      readTime: "4 min read",
      isPopular: false,
      difficulty: "Beginner",
      lastUpdated: "2024-01-08",
      href: "/learning-hub/articles/payment-setup"
    }
  ];

  const quickStartSteps = [
    {
      step: 1,
      title: "Create Your Account",
      description: "Sign up and verify your email address",
      icon: <Users className="h-6 w-6" />,
      estimatedTime: "2 minutes"
    },
    {
      step: 2,
      title: "Complete Your Profile",
      description: "Add your information and preferences",
      icon: <FileText className="h-6 w-6" />,
      estimatedTime: "5 minutes"
    },
    {
      step: 3,
      title: "Set Up Payment",
      description: "Add and verify your payment methods",
      icon: <CreditCard className="h-6 w-6" />,
      estimatedTime: "3 minutes"
    },
    {
      step: 4,
      title: "Make Your First Booking",
      description: "Find and book your first service",
      icon: <Calendar className="h-6 w-6" />,
      estimatedTime: "5 minutes"
    }
  ];

  const videoTutorials = [
    {
      title: "Complete Account Setup",
      duration: "3:45",
      description: "Watch how to set up your account from start to finish",
      thumbnail: "/api/placeholder/300/200"
    },
    {
      title: "First Booking Walkthrough",
      duration: "5:20",
      description: "Step-by-step guide to making your first booking",
      thumbnail: "/api/placeholder/300/200"
    },
    {
      title: "Profile Optimization Tips",
      duration: "4:15",
      description: "Learn how to create an attractive profile",
      thumbnail: "/api/placeholder/300/200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              Getting Started
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Getting Started with LocalPro
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              New to LocalPro? Start here! These essential guides will help you get up and running quickly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link href="#quick-start" className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Quick Start Guide</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/learning-hub/all-articles" className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Browse All Articles</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Steps */}
      <section id="quick-start" className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Quick Start Guide</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Follow these 4 simple steps to get started with LocalPro in just 15 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {quickStartSteps.map((step, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    <Badge variant="outline" className="text-xs">
                      Step {step.step}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {step.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {step.estimatedTime}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Essential Articles */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Essential Getting Started Articles</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Read these articles to master the basics of using LocalPro effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {gettingStartedArticles.map((article) => (
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
                        <span>Read Article</span>
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

      {/* Video Tutorials */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Video Tutorials</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Prefer watching? Check out these step-by-step video guides.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {videoTutorials.map((video, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow group cursor-pointer">
                <div className="relative">
                  <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Play className="h-8 w-8 text-primary ml-1" />
                    </div>
                  </div>
                  <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                    {video.duration}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  <CardDescription>{video.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Video
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What's Next?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ready to explore more? Check out these additional resources to get the most out of LocalPro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <CardTitle>Features Guide</CardTitle>
                <CardDescription>Learn about all the powerful features LocalPro offers</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/learning-hub/features" className="flex items-center justify-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Explore Features
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600 mb-4">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>Security & Privacy</CardTitle>
                <CardDescription>Learn how we protect your data and privacy</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/learning-hub/security" className="flex items-center justify-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Learn More
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                  <Download className="h-6 w-6" />
                </div>
                <CardTitle>Download Guides</CardTitle>
                <CardDescription>Get PDF versions of our guides for offline reading</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/learning-hub/downloads" className="flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDFs
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            You're all set! Create your account and start using LocalPro today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup" className="flex items-center space-x-2">
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600" asChild>
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

export default GettingStartedPage;
