'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  Clock,
  Star,
  ArrowRight,
  BookOpen,
  FileText,
  Video,
  Download,
  Tag,
  TrendingUp,
  Calendar
} from 'lucide-react';

const AllArticlesPage = () => {
  const allArticles = [
    // Client Articles
    {
      id: 1,
      title: "How to Find and Book Services as a Client",
      description: "Complete guide to finding and booking the best local services on LocalPro",
      category: "For Clients",
      readTime: "8 min read",
      isPopular: true,
      lastUpdated: "2024-01-15",
      tags: ["booking", "client", "services", "tutorial"],
      href: "/learning-hub/articles/client-booking-guide"
    },
    {
      id: 2,
      title: "Understanding Client Payment Security",
      description: "Learn how your payments are protected and secure on LocalPro",
      category: "For Clients",
      readTime: "6 min read",
      isPopular: false,
      lastUpdated: "2024-01-14",
      tags: ["payment", "security", "client", "protection"],
      href: "/learning-hub/articles/client-payment-security"
    },
    {
      id: 3,
      title: "How to Write Effective Reviews",
      description: "Tips for writing helpful reviews that benefit other clients",
      category: "For Clients",
      readTime: "4 min read",
      isPopular: true,
      lastUpdated: "2024-01-13",
      tags: ["reviews", "feedback", "client", "tips"],
      href: "/learning-hub/articles/writing-reviews"
    },
    {
      id: 4,
      title: "Client Account Management",
      description: "How to manage your client account, preferences, and settings",
      category: "For Clients",
      readTime: "5 min read",
      isPopular: false,
      lastUpdated: "2024-01-12",
      tags: ["account", "settings", "client", "management"],
      href: "/learning-hub/articles/client-account-management"
    },

    // Provider Articles
    {
      id: 5,
      title: "Provider Verification Process",
      description: "Complete guide to becoming a verified service provider on LocalPro",
      category: "For Providers",
      readTime: "10 min read",
      isPopular: true,
      lastUpdated: "2024-01-16",
      tags: ["verification", "provider", "setup", "process"],
      href: "/learning-hub/articles/provider-verification"
    },
    {
      id: 6,
      title: "Optimizing Your Provider Profile",
      description: "Best practices for creating an attractive and effective provider profile",
      category: "For Providers",
      readTime: "7 min read",
      isPopular: true,
      lastUpdated: "2024-01-15",
      tags: ["profile", "optimization", "provider", "marketing"],
      href: "/learning-hub/articles/provider-profile-optimization"
    },
    {
      id: 7,
      title: "Managing Bookings and Schedule",
      description: "How to efficiently manage your bookings and availability",
      category: "For Providers",
      readTime: "8 min read",
      isPopular: false,
      lastUpdated: "2024-01-14",
      tags: ["bookings", "schedule", "provider", "management"],
      href: "/learning-hub/articles/provider-booking-management"
    },
    {
      id: 8,
      title: "Provider Earnings and Payouts",
      description: "Understanding how earnings work and how to get paid",
      category: "For Providers",
      readTime: "6 min read",
      isPopular: false,
      lastUpdated: "2024-01-13",
      tags: ["earnings", "payouts", "provider", "finance"],
      href: "/learning-hub/articles/provider-earnings"
    },

    // Agency Articles
    {
      id: 9,
      title: "Agency Setup and Registration",
      description: "How to register and set up your agency on LocalPro",
      category: "For Agencies",
      readTime: "12 min read",
      isPopular: true,
      lastUpdated: "2024-01-17",
      tags: ["agency", "setup", "registration", "business"],
      href: "/learning-hub/articles/agency-setup"
    },
    {
      id: 10,
      title: "Managing Multiple Providers",
      description: "Best practices for managing a team of service providers",
      category: "For Agencies",
      readTime: "9 min read",
      isPopular: false,
      lastUpdated: "2024-01-16",
      tags: ["team", "management", "agency", "providers"],
      href: "/learning-hub/articles/agency-team-management"
    },
    {
      id: 11,
      title: "Agency Quality Control",
      description: "How to maintain high service quality across your agency",
      category: "For Agencies",
      readTime: "7 min read",
      isPopular: false,
      lastUpdated: "2024-01-15",
      tags: ["quality", "control", "agency", "standards"],
      href: "/learning-hub/articles/agency-quality-control"
    },
    {
      id: 12,
      title: "Agency Analytics and Reporting",
      description: "Understanding your agency's performance metrics and analytics",
      category: "For Agencies",
      readTime: "8 min read",
      isPopular: false,
      lastUpdated: "2024-01-14",
      tags: ["analytics", "reporting", "agency", "metrics"],
      href: "/learning-hub/articles/agency-analytics"
    },

    // Partner Articles
    {
      id: 13,
      title: "Partnership Application Process",
      description: "How to apply and become a LocalPro partner",
      category: "For Partners",
      readTime: "10 min read",
      isPopular: true,
      lastUpdated: "2024-01-18",
      tags: ["partnership", "application", "process", "business"],
      href: "/learning-hub/articles/partnership-application"
    },
    {
      id: 14,
      title: "Partnership Benefits and Opportunities",
      description: "Understanding the benefits and opportunities available to partners",
      category: "For Partners",
      readTime: "6 min read",
      isPopular: false,
      lastUpdated: "2024-01-17",
      tags: ["benefits", "opportunities", "partnership", "growth"],
      href: "/learning-hub/articles/partnership-benefits"
    },
    {
      id: 15,
      title: "Partner Success Strategies",
      description: "Proven strategies for successful partnerships with LocalPro",
      category: "For Partners",
      readTime: "8 min read",
      isPopular: false,
      lastUpdated: "2024-01-16",
      tags: ["success", "strategies", "partnership", "growth"],
      href: "/learning-hub/articles/partner-success-strategies"
    },

    // Getting Started Articles
    {
      id: 16,
      title: "How to Create Your First Booking",
      description: "Step-by-step guide to booking your first service on LocalPro",
      category: "Getting Started",
      readTime: "5 min read",
      isPopular: true,
      lastUpdated: "2024-01-15",
      tags: ["booking", "first-time", "tutorial"],
      href: "/learning-hub/articles/first-booking"
    },
    {
      id: 2,
      title: "Account Setup Guide",
      description: "Complete guide to setting up your LocalPro account",
      category: "Getting Started",
      readTime: "8 min read",
      isPopular: false,
      lastUpdated: "2024-01-10",
      tags: ["account", "setup", "profile"],
      href: "/learning-hub/articles/account-setup"
    },
    {
      id: 3,
      title: "Profile Creation Best Practices",
      description: "Learn how to create an attractive and effective profile",
      category: "Getting Started",
      readTime: "6 min read",
      isPopular: true,
      lastUpdated: "2024-01-12",
      tags: ["profile", "optimization", "tips"],
      href: "/learning-hub/articles/profile-creation"
    },
    {
      id: 4,
      title: "Payment Setup and Verification",
      description: "How to set up and verify your payment methods",
      category: "Getting Started",
      readTime: "4 min read",
      isPopular: false,
      lastUpdated: "2024-01-08",
      tags: ["payment", "verification", "setup"],
      href: "/learning-hub/articles/payment-setup"
    },

    // Features & Functionality Articles
    {
      id: 5,
      title: "Advanced Search Features",
      description: "Master the search functionality to find exactly what you need",
      category: "Features & Functionality",
      readTime: "6 min read",
      isPopular: false,
      lastUpdated: "2024-01-14",
      tags: ["search", "filters", "advanced"],
      href: "/learning-hub/articles/advanced-search"
    },
    {
      id: 6,
      title: "Booking Management System",
      description: "Complete guide to managing your bookings and appointments",
      category: "Features & Functionality",
      readTime: "10 min read",
      isPopular: true,
      lastUpdated: "2024-01-16",
      tags: ["booking", "management", "calendar"],
      href: "/learning-hub/articles/booking-management"
    },
    {
      id: 7,
      title: "Reviews and Ratings System",
      description: "How to use and benefit from the review system",
      category: "Features & Functionality",
      readTime: "7 min read",
      isPopular: false,
      lastUpdated: "2024-01-11",
      tags: ["reviews", "ratings", "feedback"],
      href: "/learning-hub/articles/reviews-ratings"
    },
    {
      id: 8,
      title: "Analytics Dashboard Guide",
      description: "Understanding your analytics and performance metrics",
      category: "Features & Functionality",
      readTime: "9 min read",
      isPopular: false,
      lastUpdated: "2024-01-13",
      tags: ["analytics", "dashboard", "metrics"],
      href: "/learning-hub/articles/analytics-dashboard"
    },

    // Troubleshooting Articles
    {
      id: 9,
      title: "Troubleshooting Login Issues",
      description: "Common login problems and their solutions",
      category: "Troubleshooting",
      readTime: "3 min read",
      isPopular: true,
      lastUpdated: "2024-01-17",
      tags: ["login", "troubleshooting", "password"],
      href: "/learning-hub/articles/login-troubleshooting"
    },
    {
      id: 10,
      title: "Payment Problems and Solutions",
      description: "Resolve common payment issues and errors",
      category: "Troubleshooting",
      readTime: "5 min read",
      isPopular: true,
      lastUpdated: "2024-01-15",
      tags: ["payment", "errors", "solutions"],
      href: "/learning-hub/articles/payment-troubleshooting"
    },
    {
      id: 11,
      title: "Booking Errors and Fixes",
      description: "Common booking issues and how to resolve them",
      category: "Troubleshooting",
      readTime: "4 min read",
      isPopular: false,
      lastUpdated: "2024-01-12",
      tags: ["booking", "errors", "fixes"],
      href: "/learning-hub/articles/booking-errors"
    },
    {
      id: 12,
      title: "Account Recovery Process",
      description: "How to recover your account if you're locked out",
      category: "Troubleshooting",
      readTime: "6 min read",
      isPopular: false,
      lastUpdated: "2024-01-09",
      tags: ["account", "recovery", "security"],
      href: "/learning-hub/articles/account-recovery"
    },

    // Security & Privacy Articles
    {
      id: 13,
      title: "Understanding Payment Security",
      description: "Learn about our secure payment system and fraud protection",
      category: "Security & Privacy",
      readTime: "8 min read",
      isPopular: false,
      lastUpdated: "2024-01-16",
      tags: ["security", "payment", "fraud"],
      href: "/learning-hub/articles/payment-security"
    },
    {
      id: 14,
      title: "Data Protection and Privacy",
      description: "How we protect your personal information",
      category: "Security & Privacy",
      readTime: "7 min read",
      isPopular: false,
      lastUpdated: "2024-01-14",
      tags: ["privacy", "data", "protection"],
      href: "/learning-hub/articles/data-protection"
    },
    {
      id: 15,
      title: "Privacy Settings Guide",
      description: "Control your privacy and data sharing preferences",
      category: "Security & Privacy",
      readTime: "5 min read",
      isPopular: false,
      lastUpdated: "2024-01-11",
      tags: ["privacy", "settings", "control"],
      href: "/learning-hub/articles/privacy-settings"
    },
    {
      id: 16,
      title: "Account Security Best Practices",
      description: "Keep your account secure with these essential tips",
      category: "Security & Privacy",
      readTime: "6 min read",
      isPopular: true,
      lastUpdated: "2024-01-13",
      tags: ["security", "account", "best-practices"],
      href: "/learning-hub/articles/account-security"
    }
  ];

  const categories = ["All", "For Clients", "For Providers", "For Agencies", "For Partners", "Getting Started", "Features & Functionality", "Troubleshooting", "Security & Privacy"];
  const sortOptions = ["Most Recent", "Most Popular", "Alphabetical", "Reading Time"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20">
              <BookOpen className="h-3 w-3 mr-1" />
              Complete Article Library
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              All Articles
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Browse our complete collection of {allArticles.length} articles covering everything you need to know about LocalPro.
            </p>
            
            {/* Search and Filter Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Search articles by title, description, or tags..." 
                  className="pl-10 pr-4 py-3 text-lg border-2 focus:border-primary"
                />
              </div>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by category:</span>
                <div className="flex gap-2">
                  {categories.map((category) => (
                    <Badge 
                      key={category} 
                      variant={category === "All" ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">All Articles ({allArticles.length})</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select className="px-3 py-1 border rounded-md text-sm">
                {sortOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-all duration-300 group">
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
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    <Link href={article.href} className="hover:underline">
                      {article.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-3">
                    {article.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{article.tags.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(article.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Read Article Button */}
                  <Button variant="ghost" size="sm" asChild className="w-full group-hover:bg-primary/10">
                    <Link href={article.href} className="flex items-center justify-center space-x-1">
                      <span>Read Article</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Can't find what you're looking for? Try these additional resources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <Video className="h-6 w-6" />
                </div>
                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription>Watch step-by-step video guides</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/learning-hub/videos" className="flex items-center justify-center">
                    <Video className="h-4 w-4 mr-2" />
                    Watch Videos
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <Download className="h-6 w-6" />
                </div>
                <CardTitle>Download Guides</CardTitle>
                <CardDescription>Get PDF versions of our guides</CardDescription>
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

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Get help from our support team</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/contact" className="flex items-center justify-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Get Help
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AllArticlesPage;
