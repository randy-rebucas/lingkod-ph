'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Search,
  Clock,
  TrendingUp,
  HelpCircle,
  Settings,
  Shield,
  Zap,
  Star,
  Tag
} from 'lucide-react';

const LearningHubOverviewPage = () => {
  const userRoles = [
    {
      title: "For Clients",
      description: "Learn how to find and book the best local services",
      icon: <Users className="h-8 w-8" />,
      href: "/learning-hub/clients",
      color: "bg-blue-50 text-blue-600 border-blue-200",
      articleCount: 25,
      featured: ["Finding Services", "Booking Process", "Payment Security", "Reviews & Ratings"]
    },
    {
      title: "For Providers",
      description: "Grow your business and connect with more clients",
      icon: <UserCheck className="h-8 w-8" />,
      href: "/learning-hub/providers",
      color: "bg-green-50 text-green-600 border-green-200",
      articleCount: 30,
      featured: ["Verification Process", "Profile Optimization", "Booking Management", "Earnings"]
    },
    {
      title: "For Agencies",
      description: "Manage multiple providers and scale your operations",
      icon: <Building2 className="h-8 w-8" />,
      href: "/learning-hub/agencies",
      color: "bg-purple-50 text-purple-600 border-purple-200",
      articleCount: 20,
      featured: ["Team Management", "Quality Control", "Analytics", "Growth Strategies"]
    },
    {
      title: "For Partners",
      description: "Join our partner ecosystem and grow together",
      icon: <Target className="h-8 w-8" />,
      href: "/learning-hub/partners",
      color: "bg-orange-50 text-orange-600 border-orange-200",
      articleCount: 15,
      featured: ["Partnership Types", "Benefits", "Application Process", "Success Stories"]
    }
  ];

  const knowledgeCategories = [
    {
      title: "Getting Started",
      description: "Essential guides to help you get up and running with LocalPro",
      icon: <Zap className="h-8 w-8" />,
      href: "/learning-hub/getting-started",
      color: "bg-blue-50 text-blue-600 border-blue-200",
      articleCount: 12,
      featured: ["Account Setup", "First Booking", "Profile Creation", "Payment Setup"]
    },
    {
      title: "Features & Functionality",
      description: "Learn about all the powerful features LocalPro has to offer",
      icon: <Settings className="h-8 w-8" />,
      href: "/learning-hub/features",
      color: "bg-green-50 text-green-600 border-green-200",
      articleCount: 28,
      featured: ["Advanced Search", "Booking Management", "Reviews & Ratings", "Analytics"]
    },
    {
      title: "Troubleshooting",
      description: "Find solutions to common issues and problems",
      icon: <HelpCircle className="h-8 w-8" />,
      href: "/learning-hub/troubleshooting",
      color: "bg-red-50 text-red-600 border-red-200",
      articleCount: 15,
      featured: ["Login Issues", "Payment Problems", "Booking Errors", "Account Recovery"]
    },
    {
      title: "Security & Privacy",
      description: "Learn about our security measures and privacy policies",
      icon: <Shield className="h-8 w-8" />,
      href: "/learning-hub/security",
      color: "bg-purple-50 text-purple-600 border-purple-200",
      articleCount: 8,
      featured: ["Data Protection", "Secure Payments", "Privacy Settings", "Account Security"]
    }
  ];

  const knowledgeStats = [
    { label: "Total Articles", value: "150+", icon: <FileText className="h-5 w-5" /> },
    { label: "Categories", value: "12", icon: <BookOpen className="h-5 w-5" /> },
    { label: "Video Guides", value: "45+", icon: <Video className="h-5 w-5" /> },
    { label: "Updated Weekly", value: "Yes", icon: <Clock className="h-5 w-5" /> }
  ];

  const featuredArticles = [
    {
      title: "How to Create Your First Booking",
      description: "Step-by-step guide to booking your first service on LocalPro",
      category: "Getting Started",
      readTime: "5 min read",
      isPopular: true,
      href: "/learning-hub/articles/first-booking"
    },
    {
      title: "Understanding Payment Security",
      description: "Learn about our secure payment system and fraud protection",
      category: "Security & Privacy",
      readTime: "8 min read",
      isPopular: false,
      href: "/learning-hub/articles/payment-security"
    },
    {
      title: "Troubleshooting Login Issues",
      description: "Common login problems and their solutions",
      category: "Troubleshooting",
      readTime: "3 min read",
      isPopular: true,
      href: "/learning-hub/articles/login-troubleshooting"
    },
    {
      title: "Advanced Search Features",
      description: "Master the search functionality to find exactly what you need",
      category: "Features & Functionality",
      readTime: "6 min read",
      isPopular: false,
      href: "/learning-hub/articles/advanced-search"
    }
  ];

  const popularTopics = [
    { name: "Account Setup", count: 45, href: "/learning-hub/topics/account-setup" },
    { name: "Payment Issues", count: 32, href: "/learning-hub/topics/payment-issues" },
    { name: "Booking Problems", count: 28, href: "/learning-hub/topics/booking-problems" },
    { name: "Profile Management", count: 24, href: "/learning-hub/topics/profile-management" },
    { name: "Security Settings", count: 19, href: "/learning-hub/topics/security-settings" },
    { name: "Mobile App", count: 16, href: "/learning-hub/topics/mobile-app" }
  ];

  const quickResources = [
    {
      title: "Download PDF Guides",
      description: "Comprehensive guides available for offline reading",
      icon: <Download className="h-6 w-6" />,
      action: "Download All",
      href: "/learning-hub/downloads"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides for visual learners",
      icon: <Video className="h-6 w-6" />,
      action: "Watch Now",
      href: "/learning-hub/videos"
    },
    {
      title: "Contact Support",
      description: "Get help from our support team",
      icon: <MessageSquare className="h-6 w-6" />,
      action: "Get Help",
      href: "/contact"
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
              Knowledge Base & Help Center
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              LocalPro Knowledge Base
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Find answers, learn best practices, and get the most out of LocalPro with our comprehensive 
              collection of articles, guides, and tutorials.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Search articles, guides, and tutorials..." 
                  className="pl-10 pr-4 py-3 text-lg border-2 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link href="#categories" className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Browse Articles</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact" className="flex items-center space-x-2">
                  <span>Contact Support</span>
                  <MessageSquare className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Base Stats */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {knowledgeStats.map((stat, index) => (
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

      {/* User Roles Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Choose Your Role</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get personalized guidance based on how you use LocalPro. Select your role to access tailored resources and tutorials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userRoles.map((role, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <Link href={role.href}>
                  <CardHeader className="text-center">
                    <div className={`mx-auto w-16 h-16 ${role.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      {role.icon}
                    </div>
                    <CardTitle className="text-xl">{role.title}</CardTitle>
                    <CardDescription className="text-sm">{role.description}</CardDescription>
                    <Badge variant="secondary" className="mt-2 w-fit mx-auto">
                      {role.articleCount} articles
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {role.featured.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button asChild className="w-full group-hover:bg-primary/90 transition-colors">
                      <span className="flex items-center justify-center space-x-2">
                        <span>Get Started</span>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Button>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge Categories Section */}
      <section id="categories" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore our organized collection of articles and guides to find exactly what you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {knowledgeCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className={`mx-auto w-16 h-16 ${category.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {category.icon}
                  </div>
                  <CardTitle className="text-2xl">{category.title}</CardTitle>
                  <CardDescription className="text-base">{category.description}</CardDescription>
                  <Badge variant="secondary" className="mt-2 w-fit mx-auto">
                    {category.articleCount} articles
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-2">
                    {category.featured.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button asChild className="w-full group-hover:bg-primary/90 transition-colors">
                    <Link href={category.href} className="flex items-center justify-center space-x-2">
                      <span>Browse Articles</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Articles Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Featured Articles</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start with these popular articles to get the most out of LocalPro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredArticles.map((article, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {article.category}
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

      {/* Popular Topics Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Popular Topics</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore the most searched topics and frequently asked questions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
            {popularTopics.map((topic, index) => (
              <Link key={index} href={topic.href}>
                <Card className="text-center hover:shadow-lg transition-all duration-300 group cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center space-y-2">
                      <Tag className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                      <div className="text-sm font-medium">{topic.name}</div>
                      <Badge variant="secondary" className="text-xs">
                        {topic.count} articles
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Resources Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Quick Resources</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Access additional resources and support options to enhance your LocalPro experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {quickResources.map((resource, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                    {resource.icon}
                  </div>
                  <CardTitle>{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={resource.href} className="flex items-center justify-center">
                      {resource.action === "Download All" && <Download className="h-4 w-4 mr-2" />}
                      {resource.action === "Watch Now" && <ExternalLink className="h-4 w-4 mr-2" />}
                      {resource.action === "Get Help" && <MessageSquare className="h-4 w-4 mr-2" />}
                      {resource.action}
                    </Link>
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
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you 
            get the most out of LocalPro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Contact Support</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
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

export default LearningHubOverviewPage;
