'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield,
  Clock,
  Star,
  ArrowRight,
  BookOpen,
  Lock,
  Eye,
  Key,
  AlertTriangle,
  CheckCircle,
  FileText,
  CreditCard,
  Database,
  Smartphone,
  Globe
} from 'lucide-react';

const SecurityPage = () => {
  const securityArticles = [
    {
      id: 13,
      title: "Understanding Payment Security",
      description: "Learn about our secure payment system and fraud protection",
      readTime: "8 min read",
      isPopular: false,
      difficulty: "Intermediate",
      lastUpdated: "2024-01-16",
      href: "/learning-hub/articles/payment-security"
    },
    {
      id: 14,
      title: "Data Protection and Privacy",
      description: "How we protect your personal information",
      readTime: "7 min read",
      isPopular: false,
      difficulty: "Beginner",
      lastUpdated: "2024-01-14",
      href: "/learning-hub/articles/data-protection"
    },
    {
      id: 15,
      title: "Privacy Settings Guide",
      description: "Control your privacy and data sharing preferences",
      readTime: "5 min read",
      isPopular: false,
      difficulty: "Beginner",
      lastUpdated: "2024-01-11",
      href: "/learning-hub/articles/privacy-settings"
    },
    {
      id: 16,
      title: "Account Security Best Practices",
      description: "Keep your account secure with these essential tips",
      readTime: "6 min read",
      isPopular: true,
      difficulty: "Beginner",
      lastUpdated: "2024-01-13",
      href: "/learning-hub/articles/account-security"
    }
  ];

  const securityFeatures = [
    {
      title: "End-to-End Encryption",
      description: "All data is encrypted in transit and at rest",
      icon: <Lock className="h-8 w-8" />,
      color: "bg-blue-50 text-blue-600 border-blue-200"
    },
    {
      title: "Secure Payment Processing",
      description: "PCI DSS compliant payment processing",
      icon: <CreditCard className="h-8 w-8" />,
      color: "bg-green-50 text-green-600 border-green-200"
    },
    {
      title: "Data Privacy Protection",
      description: "GDPR and CCPA compliant data handling",
      icon: <Database className="h-8 w-8" />,
      color: "bg-purple-50 text-purple-600 border-purple-200"
    },
    {
      title: "Two-Factor Authentication",
      description: "Additional security layer for your account",
      icon: <Key className="h-8 w-8" />,
      color: "bg-orange-50 text-orange-600 border-orange-200"
    },
    {
      title: "Fraud Detection",
      description: "AI-powered fraud detection and prevention",
      icon: <AlertTriangle className="h-8 w-8" />,
      color: "bg-red-50 text-red-600 border-red-200"
    },
    {
      title: "Privacy Controls",
      description: "Granular privacy settings and controls",
      icon: <Eye className="h-8 w-8" />,
      color: "bg-yellow-50 text-yellow-600 border-yellow-200"
    }
  ];

  const securityTips = [
    {
      title: "Use Strong Passwords",
      description: "Create unique, complex passwords for your account",
      icon: <Key className="h-5 w-5" />,
      tips: ["Use at least 12 characters", "Include numbers and symbols", "Avoid common words", "Don't reuse passwords"]
    },
    {
      title: "Enable Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      icon: <Shield className="h-5 w-5" />,
      tips: ["Use authenticator apps", "Keep backup codes safe", "Use SMS as backup", "Enable on all devices"]
    },
    {
      title: "Keep Your App Updated",
      description: "Always use the latest version for security patches",
      icon: <Smartphone className="h-5 w-5" />,
      tips: ["Enable auto-updates", "Check for updates regularly", "Update immediately", "Restart after updates"]
    },
    {
      title: "Be Cautious with Links",
      description: "Avoid clicking suspicious links or downloading unknown files",
      icon: <Globe className="h-5 w-5" />,
      tips: ["Verify sender identity", "Check URL before clicking", "Don't download unknown files", "Report suspicious activity"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-purple-100 text-purple-800 border-purple-200">
              <Shield className="h-3 w-3 mr-1" />
              Security & Privacy
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Security & Privacy
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Learn how we protect your data and privacy, and how you can keep your account secure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link href="#security-features" className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Our Security</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#security-tips" className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Security Tips</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section id="security-features" className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Security Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We use industry-leading security measures to protect your data and privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className={`mx-auto w-16 h-16 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Tips */}
      <section id="security-tips" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Security Best Practices</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Follow these tips to keep your account and data secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityTips.map((tip, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {tip.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tip.title}</CardTitle>
                      <CardDescription>{tip.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tip.tips.map((tipItem, tipIndex) => (
                      <li key={tipIndex} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{tipItem}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Articles */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Security & Privacy Guides</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Detailed guides on security and privacy features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityArticles.map((article) => (
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

      {/* Privacy Policy & Terms */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Legal & Compliance</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn about our privacy policies and terms of service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle>Privacy Policy</CardTitle>
                <CardDescription>How we collect, use, and protect your data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/privacy-policy" className="flex items-center justify-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Read Policy
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>Terms of Service</CardTitle>
                <CardDescription>Our terms and conditions for using LocalPro</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/terms-of-service" className="flex items-center justify-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Read Terms
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                  <Database className="h-6 w-6" />
                </div>
                <CardTitle>Data Protection</CardTitle>
                <CardDescription>GDPR and CCPA compliance information</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/data-protection" className="flex items-center justify-center">
                    <Database className="h-4 w-4 mr-2" />
                    Learn More
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Questions About Security?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Our security team is here to answer any questions you may have.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Contact Security Team</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600" asChild>
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

export default SecurityPage;
