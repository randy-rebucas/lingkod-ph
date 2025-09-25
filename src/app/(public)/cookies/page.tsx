"use client";

import React from "react";

import { useTranslations } from 'next-intl';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Cookie, 
  Shield, 
  Settings, 
  Eye, 
  BarChart3, 
  Target, 
  Lock, 
  Globe, 
  Clock, 
  Mail, 
  Phone, 
  Calendar,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ExternalLink,
  Heart,
  Star,
  ArrowRight,
  Trash2,
  Edit,
  Download,
  Upload
} from "lucide-react";
import { useState } from "react";

export default function CookiesPage() {
  const t = useTranslations('Cookies');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  const sections = [
    {
      id: "what-are-cookies",
      title: "1. What Are Cookies?",
      icon: <Cookie className="h-5 w-5" />,
      content: [
        "Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.",
        "Cookies contain information that is transferred to your device's hard drive. They allow us to recognize your device and store some information about your preferences or past actions.",
        "LocalPro uses cookies to enhance your browsing experience, analyze site traffic, personalize content, and provide social media features. We also share information about your use of our site with our social media, advertising, and analytics partners.",
        "You can control and/or delete cookies as you wish. You can delete all cookies that are already on your device and you can set most browsers to prevent them from being placed.",
      ],
      important: true
    },
    {
      id: "types-of-cookies",
      title: "2. Types of Cookies We Use",
      icon: <Settings className="h-5 w-5" />,
      content: [
        "Essential Cookies: These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms.",
        "Performance Cookies: These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.",
        "Functional Cookies: These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.",
        "Targeting Cookies: These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant adverts on other sites.",
      ],
      important: true
    },
    {
      id: "cookie-purposes",
      title: "3. How We Use Cookies",
      icon: <Target className="h-5 w-5" />,
      content: [
        "Authentication: To keep you logged in and maintain your session across different pages of our website.",
        "Preferences: To remember your language settings, location preferences, and other customization options.",
        "Analytics: To understand how visitors interact with our website, which pages are most popular, and how we can improve user experience.",
        "Security: To protect against fraud and ensure the security of our platform and your account.",
        "Marketing: To show you relevant advertisements and measure the effectiveness of our marketing campaigns.",
        "Functionality: To enable features like chat support, booking systems, and payment processing.",
      ],
      important: false
    },
    {
      id: "third-party-cookies",
      title: "4. Third-Party Cookies",
      icon: <Globe className="h-5 w-5" />,
      content: [
        "Google Analytics: We use Google Analytics to analyze the use of our website. Google Analytics gathers information about website use by means of cookies. The information gathered relating to our website is used to create reports about the use of our website.",
        "Google Ads: We use Google Ads to display relevant advertisements. Google may use cookies to serve ads based on your prior visits to our website or other websites.",
        "Facebook Pixel: We use Facebook Pixel to track conversions from Facebook ads, optimize ads, build audiences for future ads, and remarket to people who have taken action on our website.",
        "Payment Processors: Our payment partners (Adyen, GCash) may set cookies to process payments securely and prevent fraud.",
        "Social Media: Social media platforms may set cookies when you interact with social media features on our website.",
      ],
      important: true
    },
    {
      id: "cookie-duration",
      title: "5. Cookie Duration",
      icon: <Clock className="h-5 w-5" />,
      content: [
        "Session Cookies: These are temporary cookies that expire when you close your browser. They are used to maintain your session while you navigate through our website.",
        "Persistent Cookies: These cookies remain on your device for a set period or until you delete them. They help us recognize you when you return to our website.",
        "First-Party Cookies: Set directly by LocalPro and typically last for 1-2 years, depending on their purpose.",
        "Third-Party Cookies: Set by our partners and may have different expiration periods. Please check their respective privacy policies for details.",
        "You can see the specific expiration dates for each cookie in your browser's cookie settings.",
      ],
      important: false
    },
    {
      id: "managing-cookies",
      title: "6. Managing Your Cookie Preferences",
      icon: <Settings className="h-5 w-5" />,
      content: [
        "Browser Settings: Most web browsers allow you to control cookies through their settings preferences. You can set your browser to refuse cookies or delete certain cookies.",
        "Cookie Consent Banner: When you first visit our website, you'll see a cookie consent banner where you can choose which types of cookies to accept.",
        "Cookie Settings Page: You can access our cookie settings page at any time to update your preferences.",
        "Opt-Out Links: For third-party cookies, you can often opt out directly through the third party's website or through industry opt-out pages.",
        "Important Note: Disabling certain cookies may affect the functionality of our website and your user experience.",
      ],
      important: true
    },
    {
      id: "browser-specific",
      title: "7. Browser-Specific Instructions",
      icon: <Globe className="h-5 w-5" />,
      content: [
        "Chrome: Go to Settings > Privacy and security > Cookies and other site data. You can block all cookies, block third-party cookies, or allow all cookies.",
        "Firefox: Go to Options > Privacy & Security. Under 'Cookies and Site Data', you can choose to block cookies or manage exceptions.",
        "Safari: Go to Preferences > Privacy. You can choose to block all cookies, allow cookies from websites you visit, or allow cookies from current website only.",
        "Edge: Go to Settings > Cookies and site permissions > Cookies and site data. You can block all cookies or block third-party cookies.",
        "Mobile Browsers: Cookie settings are typically found in the browser's settings menu under Privacy or Security options.",
      ],
      important: false
    },
    {
      id: "data-protection",
      title: "8. Data Protection and Privacy",
      icon: <Shield className="h-5 w-5" />,
      content: [
        "We comply with the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable data protection laws.",
        "Personal data collected through cookies is processed in accordance with our Privacy Policy.",
        "We implement appropriate technical and organizational measures to protect your personal data.",
        "You have the right to access, correct, or delete your personal data. Contact us at privacy@localpro.asia for data subject requests.",
        "We do not sell your personal data to third parties. We may share data with trusted partners only as described in our Privacy Policy.",
      ],
      important: true
    },
    {
      id: "updates-changes",
      title: "9. Updates to This Cookie Policy",
      icon: <Edit className="h-5 w-5" />,
      content: [
        "We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.",
        "When we make significant changes, we will notify you through our website or by email.",
        "We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.",
        "Your continued use of our website after any changes to this Cookie Policy constitutes your acceptance of the updated policy.",
        "The 'Last Updated' date at the top of this policy indicates when it was last revised.",
      ],
      important: false
    },
    {
      id: "contact-information",
      title: "10. Contact Us About Cookies",
      icon: <Mail className="h-5 w-5" />,
      content: [
        "If you have any questions about our use of cookies or this Cookie Policy, please contact us:",
        "📧 Privacy Team: privacy@localpro.asia",
        "📧 General Support: support@localpro.asia",
        "📞 Phone: +63 917 915 7515",
        "📍 Address: Poblacion Zone 2, A Bonifacio Street, Baybay City, Leyte, Philippines 6530",
        "We're here to help and will respond to your inquiries within 48 hours.",
      ],
      important: false
    },
  ];

  const cookieTypes = [
    {
      name: "Essential Cookies",
      description: "Required for basic website functionality",
      examples: ["Authentication", "Security", "Load balancing"],
      duration: "Session/Persistent",
      canDisable: false,
      icon: <Lock className="h-4 w-4" />
    },
    {
      name: "Performance Cookies",
      description: "Help us understand website usage",
      examples: ["Google Analytics", "Page views", "User behavior"],
      duration: "Up to 2 years",
      canDisable: true,
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      name: "Functional Cookies",
      description: "Enable enhanced features",
      examples: ["Language settings", "Preferences", "Chat support"],
      duration: "Up to 1 year",
      canDisable: true,
      icon: <Settings className="h-4 w-4" />
    },
    {
      name: "Targeting Cookies",
      description: "Used for advertising purposes",
      examples: ["Facebook Pixel", "Google Ads", "Remarketing"],
      duration: "Up to 1 year",
      canDisable: true,
      icon: <Target className="h-4 w-4" />
    }
  ];

  const quickActions = [
    {
      title: t('acceptAllCookies'),
      description: t('allowAllCookies'),
      icon: <CheckCircle className="h-4 w-4" />,
      action: "accept-all"
    },
    {
      title: t('essentialOnly'),
      description: t('onlyAllowNecessary'),
      icon: <Lock className="h-4 w-4" />,
      action: "essential-only"
    },
    {
      title: t('customizeSettings'),
      description: t('chooseWhichCookies'),
      icon: <Settings className="h-4 w-4" />,
      action: "customize"
    },
    {
      title: t('viewCookieList'),
      description: t('seeAllCookies'),
      icon: <Eye className="h-4 w-4" />,
      action: "view-list"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Cookie className="w-4 h-4 mr-2" />
              {t('privacyAndCookies')}
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold font-headline mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12">
              {t('subtitle')}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
              <Calendar className="h-4 w-4" />
              {t('lastUpdated')}
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300">
                <a href="#cookie-types">
                  {t('cookieTypes')} <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Link href="/contact-us">
                  {t('questions')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8 bg-background/60 backdrop-blur-sm border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {t('tableOfContents')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {sections.map((section, index) => (
                        <Button
                          key={section.id}
                          variant={activeSection === section.id ? "default" : "ghost"}
                          className="w-full justify-start text-left h-auto p-3"
                          onClick={() => setActiveSection(section.id)}
                        >
                          <div className="flex items-center gap-3">
                            {section.icon}
                            <div className="text-left">
                              <div className="text-sm font-medium">{section.title}</div>
                              {section.important && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Important
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Introduction */}
              <Card className="bg-background/60 backdrop-blur-sm border-0 shadow-soft">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-headline">{t('yourPrivacyMatters')}</h2>
                      <p className="text-muted-foreground">{t('transparentCookieUsage')}</p>
                    </div>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {t('introduction')}
                  </p>
                </CardContent>
              </Card>

              {/* Cookie Types Overview */}
              <Card id="cookie-types" className="bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cookie className="h-5 w-5 text-primary" />
                    {t('typesOfCookies')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {cookieTypes.map((type, index) => (
                      <div key={index} className="p-4 bg-background/60 rounded-lg border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            {type.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold">{type.name}</h4>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Examples:</span> {type.examples.join(", ")}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Duration:</span> {type.duration}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Can Disable:</span> 
                            <Badge variant={type.canDisable ? "default" : "secondary"} className="ml-2">
                              {type.canDisable ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    {t('managePreferences')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-4 justify-start text-left hover:bg-primary/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            {action.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{action.title}</h4>
                            <p className="text-xs text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Policy Sections */}
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <Card key={section.id} className="bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          {section.icon}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold font-headline text-primary">{section.title}</h2>
                          {section.important && (
                            <Badge variant="destructive" className="mt-2">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Important Section
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4 text-muted-foreground leading-relaxed">
                        {section.content.map((paragraph, paragraphIndex) => (
                          <p key={paragraphIndex} className="text-base">{paragraph}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Contact Information */}
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold font-headline mb-4">{t('contactInformation')}</h3>
                  <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    {t('contactDescription')}
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <Button asChild size="lg" className="h-12">
                      <a href="mailto:privacy@localpro.asia">
                        <Mail className="mr-2 h-5 w-5" />
                        {t('privacyTeam')}
                      </a>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-12">
                      <a href="tel:+639179157515">
                        <Phone className="mr-2 h-5 w-5" />
                        {t('callSupport')}
                      </a>
                    </Button>
                  </div>
                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>{t('address')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
