
"use client";

import { useTranslations } from 'next-intl';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Shield, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Mail, 
  Phone, 
  Calendar,
  BookOpen,
  Scale,
  Eye,
  Info,
  Lock,
  Globe,
  Heart,
  Star,
  ArrowRight
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const t = useTranslations('TermsOfService');
  
  // Function to scroll to a specific section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      setActiveSection(sectionId);
    }
  };

  // Scroll spy functionality
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[id^="section-"]');
      const scrollPosition = window.scrollY + 100; // Offset for better UX

      sections.forEach((section) => {
        const element = section as HTMLElement;
        const sectionTop = element.offsetTop;
        const sectionHeight = element.offsetHeight;
        const sectionId = element.id.replace('section-', '');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const sections = [
    {
      id: "definitions",
      title: t('sections.definitions.title'),
      icon: <BookOpen className="h-5 w-5" />,
      content: t('sections.definitions.content'),
      important: false
    },
    {
      id: "eligibility",
      title: t('sections.eligibility.title'),
      icon: <Users className="h-5 w-5" />,
      content: t('sections.eligibility.content'),
      important: true
    },
    {
      id: "account-registration",
      title: t('sections.accountRegistration.title'),
      icon: <Lock className="h-5 w-5" />,
      content: t('sections.accountRegistration.content'),
      important: true
    },
    {
      id: "platform-use",
      title: t('sections.platformUse.title'),
      icon: <Shield className="h-5 w-5" />,
      content: t('sections.platformUse.content'),
      important: true
    },
    {
      id: "payments-fees",
      title: t('sections.paymentsFees.title'),
      icon: <CreditCard className="h-5 w-5" />,
      content: t('sections.paymentsFees.content'),
      important: true
    },
    {
      id: "cancellations-refunds",
      title: "6. Cancellations and Refunds",
      icon: <AlertTriangle className="h-5 w-5" />,
      content: [
        "Cancellation and refund policies vary by service and are set by each Provider in accordance with our platform guidelines.",
        "Clients may cancel bookings according to the Provider's cancellation policy, which will be displayed before booking.",
        "LocalPro may intervene in disputes between Clients and Providers but is not liable for service quality issues.",
        "Refund requests must be submitted within 48 hours of service completion unless otherwise specified.",
        "We reserve the right to withhold payments in cases of suspected fraud or policy violations.",
      ],
      important: false
    },
    {
      id: "service-quality",
      title: "7. Service Quality and Ratings",
      icon: <Star className="h-5 w-5" />,
      content: [
        "Clients can leave reviews and ratings after a service is completed. All reviews must be honest, accurate, and constructive.",
        "Providers are expected to maintain high service standards and professional conduct at all times.",
        "Repeated low ratings or policy violations may result in account suspension or termination.",
        "We reserve the right to remove reviews that violate our content policies or are deemed inappropriate.",
        "Both Clients and Providers are encouraged to resolve disputes amicably before escalating to LocalPro support.",
      ],
      important: false
    },
    {
      id: "intellectual-property",
      title: "8. Intellectual Property Rights",
      icon: <Scale className="h-5 w-5" />,
      content: [
        "All content on the Platform, including logos, text, images, software, and design elements, is owned by or licensed to LocalPro and protected by applicable intellectual property laws.",
        "You may not reproduce, distribute, modify, or create derivative works without our written permission.",
        "The LocalPro name, logo, and other trademarks are proprietary to LocalPro and may not be used without permission.",
        "Any unauthorized use of our intellectual property may result in legal action.",
      ],
      important: false
    },
    {
      id: "user-content",
      title: "9. User-Generated Content",
      icon: <FileText className="h-5 w-5" />,
      content: [
        "You retain ownership of content you post, such as reviews, photos, or profile information, but you grant LocalPro a non-exclusive, royalty-free, worldwide license to use, display, and distribute such content on the Platform.",
        "You are responsible for ensuring that any content you post does not violate third-party rights or applicable laws.",
        "We reserve the right to remove any content that violates these Terms or our content policies.",
        "By posting content, you represent that you have the right to grant us the license described above.",
      ],
      important: false
    },
    {
      id: "privacy-data",
      title: "10. Privacy and Data Protection",
      icon: <Eye className="h-5 w-5" />,
      content: [
        "Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.",
        "We comply with applicable data protection laws, including the Data Privacy Act of 2012 (Republic Act No. 10173).",
        "We may collect and process personal data as necessary to provide our services and improve user experience.",
        "You have the right to access, correct, or delete your personal data in accordance with our Privacy Policy.",
      ],
      important: true
    },
    {
      id: "termination",
      title: "11. Account Termination",
      icon: <AlertTriangle className="h-5 w-5" />,
      content: [
        "We may suspend or terminate your account at any time, with or without notice, for any violation of these Terms or our policies.",
        "You may deactivate your account at any time through your account settings.",
        "Upon termination, your right to use the Platform ceases immediately, but certain provisions of these Terms will survive termination.",
        "We are not obligated to provide any refunds or compensation upon account termination.",
      ],
      important: false
    },
    {
      id: "disclaimers",
      title: "12. Disclaimers and Warranties",
      icon: <Info className="h-5 w-5" />,
      content: [
        "LocalPro acts only as a marketplace connecting Clients with Providers and is not responsible for the conduct, performance, or services of Providers.",
        "The Platform is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee uninterrupted, secure, or error-free service.",
        "We make no warranties about the accuracy, reliability, or completeness of any information on the Platform.",
        "We are not responsible for any damages or losses resulting from your use of the Platform or any services obtained through it.",
      ],
      important: true
    },
    {
      id: "limitation-liability",
      title: "13. Limitation of Liability",
      icon: <Shield className="h-5 w-5" />,
      content: [
        "To the maximum extent permitted by law, LocalPro is not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.",
        "Our total liability to you for any claims arising from these Terms or your use of the Platform shall not exceed the amount you paid us in the 12 months preceding the claim.",
        "Some jurisdictions do not allow the limitation of liability, so these limitations may not apply to you.",
      ],
      important: true
    },
    {
      id: "indemnity",
      title: "14. Indemnification",
      icon: <Shield className="h-5 w-5" />,
      content: [
        "You agree to indemnify and hold harmless LocalPro and its officers, employees, agents, and partners from any claims, damages, or expenses arising out of your use of the Platform or your violation of these Terms.",
        "This includes any claims made by third parties related to your actions or content posted on the Platform.",
        "We reserve the right to assume the exclusive defense and control of any matter subject to indemnification by you.",
      ],
      important: false
    },
    {
      id: "modifications",
      title: "15. Modifications to Terms",
      icon: <Clock className="h-5 w-5" />,
      content: [
        "We may update these Terms at any time to reflect changes in our services, legal requirements, or business practices.",
        "Material changes will be posted on this page with a new effective date, and we will notify users via email or platform notification.",
        "Continued use of the Platform after changes constitutes acceptance of the revised Terms.",
        "If you do not agree to the updated Terms, you must stop using the Platform and may terminate your account.",
      ],
      important: false
    },
    {
      id: "governing-law",
      title: "16. Governing Law and Dispute Resolution",
      icon: <Globe className="h-5 w-5" />,
      content: [
        "These Terms are governed by the laws of the Republic of the Philippines, without regard to its conflict of laws principles.",
        "Any disputes arising from these Terms or your use of the Platform will be resolved through binding arbitration in accordance with Philippine arbitration laws.",
        "You agree to first attempt to resolve any disputes through good faith negotiations before initiating formal proceedings.",
        "The venue for any legal proceedings will be in the courts of Baybay City, Leyte, Philippines.",
      ],
      important: false
    },
    {
      id: "contact",
      title: "17. Contact Information",
      icon: <Mail className="h-5 w-5" />,
      content: [
        "For questions, concerns, or legal notices regarding these Terms, please contact us at:",
        "📧 Legal Department: admin@localpro.asia",
        "📧 General Support: admin@localpro.asia",
        "📞 Phone: +63 917 915 7515",
        "📍 Address: Poblacion Zone 2, A Bonifacio Street, Baybay City, Leyte, Philippines 6521",
      ],
      important: false
    },
  ];

  const quickSummary = [
    {
      title: "Service Agreement",
      description: "By using LocalPro, you agree to our terms and conditions for service provision and platform usage.",
      icon: <FileText className="h-4 w-4 text-primary" />
    },
    {
      title: "User Responsibilities", 
      description: "Users must be 18+, provide accurate information, and use the platform responsibly and legally.",
      icon: <Shield className="h-4 w-4 text-primary" />
    },
    {
      title: "Payment Terms",
      description: "Clear pricing, secure payments, and transparent fee structure for all transactions.",
      icon: <CreditCard className="h-4 w-4 text-primary" />
    },
    {
      title: "Privacy & Security",
      description: "Your data is protected with industry-standard security measures and privacy practices.",
      icon: <Users className="h-4 w-4 text-primary" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Scale className="w-4 h-4 mr-2" />
              Legal Document
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
                <a href="#quick-summary">
                  Quick Summary <ArrowRight className="ml-2 h-5 w-5" />
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
              <Card className="sticky top-8 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Table of Contents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {sections.map((section) => (
                        <Button
                          key={section.id}
                          variant={activeSection === section.id ? "default" : "ghost"}
                          className="w-full justify-start text-left h-auto p-3"
                          onClick={() => scrollToSection(`section-${section.id}`)}
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
              <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-headline">Welcome to LocalPro</h2>
                      <p className="text-muted-foreground">Your trusted local services platform</p>
                    </div>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    These Terms of Service (&quot;Terms&quot;) govern your use of our platform, which connects service providers with clients through our website and mobile applications (collectively, the &quot;Platform&quot;). By accessing or using LocalPro, you agree to be bound by these Terms.
                  </p>
                </CardContent>
              </Card>

              {/* Quick Summary */}
              <Card id="quick-summary" className="bg-gradient-to-br from-primary/5 to-accent/5 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Key Points Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-4">
                      {quickSummary.map((item) => (
                        <div key={item.title} className="flex items-center gap-3 p-3 bg-background/60 rounded-lg">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            {item.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{item.title}</h4>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Terms Sections */}
              <div className="space-y-6">
                        {sections.map((section, _index) => (
                  <Card key={section.id} id={`section-${section.id}`} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm">
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
                        {typeof section.content === 'string' ? 
                          (section.content as string).split('. ').map((sentence, sentenceIndex, _, sentences = (section.content as string).split('. ')) => (
                            <p key={sentenceIndex} className="text-base">{sentence}{sentenceIndex < sentences.length - 1 ? '.' : ''}</p>
                          )) : 
                          Array.isArray(section.content) ? 
                            section.content.map((paragraph, paragraphIndex) => (
                              <p key={paragraphIndex} className="text-base">{paragraph}</p>
                            )) :
                            <p className="text-base">{section.content}</p>
                        }
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Contact Information */}
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold font-headline mb-4">Questions About These Terms?</h3>
                  <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    If you have any questions or concerns about these Terms of Service, please don&apos;t hesitate to contact our legal team.
                  </p>
                  <div className="max-w-2xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button asChild size="lg" className="h-12">
                        <a href="mailto:admin@localpro.asia">
                          <Mail className="mr-2 h-5 w-5" />
                          Legal Department
                        </a>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="h-12">
                        <a href="tel:+639179157515">
                          <Phone className="mr-2 h-5 w-5" />
                          Call Support
                        </a>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>📍 Poblacion Zone 2, A Bonifacio Street, Baybay City, Leyte, Philippines 6521</p>
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
