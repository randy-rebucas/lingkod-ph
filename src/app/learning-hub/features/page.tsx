'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  Clock,
  Star,
  ArrowRight,
  BookOpen,
  Search,
  Calendar,
  Star as StarIcon,
  BarChart3,
  Filter,
  MapPin,
  Bell,
  MessageSquare,
  Shield,
  Zap
} from 'lucide-react';

const FeaturesPage = () => {
  const featuresArticles = [
    {
      id: 5,
      title: "Advanced Search Features",
      description: "Master the search functionality to find exactly what you need",
      readTime: "6 min read",
      isPopular: false,
      difficulty: "Intermediate",
      lastUpdated: "2024-01-14",
      href: "/learning-hub/articles/advanced-search"
    },
    {
      id: 6,
      title: "Booking Management System",
      description: "Complete guide to managing your bookings and appointments",
      readTime: "10 min read",
      isPopular: true,
      difficulty: "Intermediate",
      lastUpdated: "2024-01-16",
      href: "/learning-hub/articles/booking-management"
    },
    {
      id: 7,
      title: "Reviews and Ratings System",
      description: "How to use and benefit from the review system",
      readTime: "7 min read",
      isPopular: false,
      difficulty: "Beginner",
      lastUpdated: "2024-01-11",
      href: "/learning-hub/articles/reviews-ratings"
    },
    {
      id: 8,
      title: "Analytics Dashboard Guide",
      description: "Understanding your analytics and performance metrics",
      readTime: "9 min read",
      isPopular: false,
      difficulty: "Advanced",
      lastUpdated: "2024-01-13",
      href: "/learning-hub/articles/analytics-dashboard"
    }
  ];

  const featureCategories = [
    {
      title: "Search & Discovery",
      description: "Find services and providers with powerful search tools",
      icon: <Search className="h-8 w-8" />,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      features: ["Advanced Filters", "Location Search", "Category Browsing", "Saved Searches"]
    },
    {
      title: "Booking & Scheduling",
      description: "Manage appointments and bookings efficiently",
      icon: <Calendar className="h-8 w-8" />,
      color: "bg-green-50 text-green-600 border-green-200",
      features: ["Real-time Availability", "Recurring Bookings", "Calendar Sync", "Booking Reminders"]
    },
    {
      title: "Reviews & Ratings",
      description: "Build trust through authentic reviews and ratings",
      icon: <StarIcon className="h-8 w-8" />,
      color: "bg-yellow-50 text-yellow-600 border-yellow-200",
      features: ["5-Star Rating System", "Photo Reviews", "Verified Reviews", "Review Responses"]
    },
    {
      title: "Analytics & Insights",
      description: "Track performance and gain valuable insights",
      icon: <BarChart3 className="h-8 w-8" />,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      features: ["Performance Metrics", "Revenue Tracking", "Customer Insights", "Growth Analytics"]
    },
    {
      title: "Communication",
      description: "Stay connected with providers and customers",
      icon: <MessageSquare className="h-8 w-8" />,
      color: "bg-orange-50 text-orange-600 border-orange-200",
      features: ["In-app Messaging", "Notification System", "Email Alerts", "SMS Notifications"]
    },
    {
      title: "Payment & Security",
      description: "Secure transactions and fraud protection",
      icon: <Shield className="h-8 w-8" />,
      color: "bg-red-50 text-red-600 border-red-200",
      features: ["Secure Payments", "Fraud Protection", "Payment History", "Refund Management"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-green-100 text-green-800 border-green-200">
              <Settings className="h-3 w-3 mr-1" />
              Features & Functionality
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              LocalPro Features
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover all the powerful features that make LocalPro the best platform for connecting with local services.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link href="#feature-categories" className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Explore Features</span>
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

      {/* Feature Categories */}
      <section id="feature-categories" className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Feature Categories</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore our comprehensive set of features organized by category.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className={`mx-auto w-16 h-16 ${category.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {category.icon}
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <CardDescription className="text-base">{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {category.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Articles */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Feature Guides</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to use each feature effectively with our detailed guides.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuresArticles.map((article) => (
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

      {/* Quick Tips */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Pro Tips</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get the most out of LocalPro with these expert tips and tricks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <Filter className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Use Filters</CardTitle>
                <CardDescription className="text-sm">
                  Narrow down results with advanced filters for better matches
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  <MapPin className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Location Matters</CardTitle>
                <CardDescription className="text-sm">
                  Set your location accurately for better local service matches
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 mb-4">
                  <Bell className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Enable Notifications</CardTitle>
                <CardDescription className="text-sm">
                  Stay updated with booking confirmations and reminders
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Check Analytics</CardTitle>
                <CardDescription className="text-sm">
                  Monitor your performance and optimize your listings
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore Features?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Start using these powerful features to enhance your LocalPro experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup" className="flex items-center space-x-2">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-green-600" asChild>
              <Link href="/learning-hub/getting-started" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Getting Started</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
