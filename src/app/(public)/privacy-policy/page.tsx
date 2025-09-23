"use client";

import { useTranslations } from 'next-intl';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Eye, 
  Lock, 
  Globe, 
  Mail, 
  Phone, 
  Calendar,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Info,
  Heart,
  Star,
  ArrowRight,
  Users,
  Database,
  FileText,
  Settings
} from "lucide-react";
import { useState } from "react";

export default function PrivacyPolicyPage() {
  const t = useTranslations('PrivacyPolicy');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  const sections = [
    {
      id: "introduction",
      title: "1. Introduction",
      icon: <Info className="h-5 w-5" />,
      content: [
        "LocalPro Services Inc. (\"we,\" \"our,\" or \"us\") is committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.",
        "This policy applies to all users of LocalPro, including service providers, clients, agencies, and visitors to our website and mobile applications.",
        "By using our services, you consent to the collection and use of information in accordance with this Privacy Policy.",
        "We comply with the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable data protection laws in the Philippines.",
      ],
      important: true
    },
    {
      id: "information-collection",
      title: "2. Information We Collect",
      icon: <Database className="h-5 w-5" />,
      content: [
        "Personal Information: Name, email address, phone number, address, date of birth, government-issued ID, and payment information.",
        "Profile Information: Service categories, skills, experience, certifications, portfolio images, and professional background.",
        "Usage Data: Information about how you use our platform, including pages visited, time spent, features used, and interactions with other users.",
        "Device Information: IP address, browser type, operating system, device identifiers, and mobile network information.",
        "Location Data: General location information based on your IP address or GPS coordinates (with your permission).",
        "Communication Data: Messages, reviews, ratings, and other communications sent through our platform.",
      ],
      important: true
    },
    {
      id: "how-we-use",
      title: "3. How We Use Your Information",
      icon: <Settings className="h-5 w-5" />,
      content: [
        "Service Provision: To connect service providers with clients, process bookings, and facilitate payments.",
        "Account Management: To create and maintain your account, verify your identity, and provide customer support.",
        "Communication: To send you important updates, notifications, and respond to your inquiries.",
        "Improvement: To analyze usage patterns and improve our platform's functionality and user experience.",
        "Marketing: To send you promotional materials and personalized offers (with your consent).",
        "Legal Compliance: To comply with applicable laws, regulations, and legal processes.",
      ],
      important: true
    },
    {
      id: "information-sharing",
      title: "4. Information Sharing and Disclosure",
      icon: <Users className="h-5 w-5" />,
      content: [
        "Service Providers: We may share information with trusted third-party service providers who assist us in operating our platform.",
        "Business Partners: We may share information with partners who provide complementary services.",
        "Legal Requirements: We may disclose information when required by law or to protect our rights and interests.",
        "Business Transfers: In the event of a merger, acquisition, or sale of assets, user information may be transferred.",
        "Consent: We may share information with your explicit consent for specific purposes.",
        "Public Information: Reviews, ratings, and profile information that you choose to make public will be visible to other users.",
      ],
      important: true
    },
    {
      id: "data-security",
      title: "5. Data Security",
      icon: <Lock className="h-5 w-5" />,
      content: [
        "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
        "All data transmission is encrypted using industry-standard SSL/TLS protocols.",
        "We regularly review and update our security practices to address emerging threats.",
        "Access to personal information is restricted to authorized personnel who need it to perform their duties.",
        "We conduct regular security audits and assessments to ensure the integrity of our systems.",
        "In the event of a data breach, we will notify affected users and relevant authorities as required by law.",
      ],
      important: true
    },
    {
      id: "data-retention",
      title: "6. Data Retention",
      icon: <Calendar className="h-5 w-5" />,
      content: [
        "We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy.",
        "Account information is retained for the duration of your account plus a reasonable period for legal and business purposes.",
        "Transaction records are retained for at least 7 years as required by Philippine tax and accounting regulations.",
        "Marketing data is retained until you opt out or for a maximum of 3 years of inactivity.",
        "We may retain certain information for longer periods if required by law or for legitimate business purposes.",
        "You may request deletion of your personal information, subject to legal and business requirements.",
      ],
      important: false
    },
    {
      id: "your-rights",
      title: "7. Your Rights and Choices",
      icon: <CheckCircle className="h-5 w-5" />,
      content: [
        "Access: You have the right to request access to your personal information and receive a copy of the data we hold about you.",
        "Correction: You can request correction of inaccurate or incomplete personal information.",
        "Deletion: You may request deletion of your personal information, subject to legal and business requirements.",
        "Portability: You can request a copy of your data in a structured, machine-readable format.",
        "Objection: You have the right to object to certain processing of your personal information.",
        "Withdrawal of Consent: You can withdraw your consent for marketing communications at any time.",
        "Account Settings: You can update your privacy preferences and account information through your account settings.",
      ],
      important: true
    },
    {
      id: "cookies-tracking",
      title: "8. Cookies and Tracking Technologies",
      icon: <Eye className="h-5 w-5" />,
      content: [
        "We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content.",
        "Essential cookies are necessary for the platform to function and cannot be disabled.",
        "Performance cookies help us understand how visitors use our website.",
        "Functional cookies enable enhanced features and personalization.",
        "Marketing cookies are used to deliver relevant advertisements.",
        "You can manage your cookie preferences through your browser settings or our cookie consent banner.",
        "For detailed information about our use of cookies, please see our Cookie Policy.",
      ],
      important: false
    },
    {
      id: "third-party-services",
      title: "9. Third-Party Services",
      icon: <Globe className="h-5 w-5" />,
      content: [
        "Our platform may contain links to third-party websites or services that are not operated by us.",
        "We use third-party services for payment processing, analytics, customer support, and other functions.",
        "These third parties have their own privacy policies, and we encourage you to review them.",
        "We are not responsible for the privacy practices of third-party services.",
        "We only share information with third parties as described in this Privacy Policy.",
        "We require our service providers to implement appropriate security measures to protect your information.",
      ],
      important: false
    },
    {
      id: "international-transfers",
      title: "10. International Data Transfers",
      icon: <Globe className="h-5 w-5" />,
      content: [
        "Your personal information may be transferred to and processed in countries other than the Philippines.",
        "We ensure that such transfers comply with applicable data protection laws.",
        "We use appropriate safeguards, such as standard contractual clauses, to protect your information during international transfers.",
        "Some of our service providers may be located outside the Philippines.",
        "By using our services, you consent to the transfer of your information to countries that may have different data protection laws.",
        "We will ensure that your information receives adequate protection regardless of where it is processed.",
      ],
      important: false
    },
    {
      id: "children-privacy",
      title: "11. Children's Privacy",
      icon: <Users className="h-5 w-5" />,
      content: [
        "Our services are not intended for children under 18 years of age.",
        "We do not knowingly collect personal information from children under 18.",
        "If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information.",
        "Parents or guardians who believe their child has provided personal information to us should contact us immediately.",
        "We encourage parents to monitor their children's online activities and teach them about online privacy.",
      ],
      important: false
    },
    {
      id: "policy-updates",
      title: "12. Updates to This Privacy Policy",
      icon: <FileText className="h-5 w-5" />,
      content: [
        "We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.",
        "When we make material changes, we will notify you through our platform or by email.",
        "We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.",
        "Your continued use of our services after any changes constitutes acceptance of the updated Privacy Policy.",
        "The 'Last Updated' date at the top of this policy indicates when it was last revised.",
        "If you do not agree with the updated policy, you may stop using our services and request deletion of your account.",
      ],
      important: false
    },
    {
      id: "contact-information",
      title: "13. Contact Us",
      icon: <Mail className="h-5 w-5" />,
      content: [
        "If you have any questions about this Privacy Policy or our data practices, please contact us:",
        "📧 Privacy Officer: privacy@localpro.asia",
        "📧 Data Protection Officer: dpo@localpro.asia",
        "📧 General Support: support@localpro.asia",
        "📞 Phone: +63 917 915 7515",
        "📍 Address: Poblacion Zone 2, A Bonifacio Street, Baybay City, Leyte, Philippines 6530",
        "We will respond to your inquiries within 48 hours and address any concerns promptly.",
      ],
      important: false
    },
  ];

  const quickSummary = [
    {
      title: t('dataCollection'),
      description: t('dataCollectionDesc'),
      icon: <Database className="h-4 w-4" />
    },
    {
      title: t('dataSecurity'),
      description: t('dataSecurityDesc'),
      icon: <Lock className="h-4 w-4" />
    },
    {
      title: t('yourRights'),
      description: t('yourRightsDesc'),
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      title: t('transparency'),
      description: t('transparencyDesc'),
      icon: <Eye className="h-4 w-4" />
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
              <Shield className="w-4 h-4 mr-2" />
              {t('privacyAndDataProtection')}
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
                  {t('quickSummary')} <ArrowRight className="ml-2 h-5 w-5" />
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
                                  {t('important')}
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
                      <h2 className="text-2xl font-bold font-headline">{t('yourPrivacyIsOurPriority')}</h2>
                      <p className="text-muted-foreground">{t('transparentDataPractices')}</p>
                    </div>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {t('introduction')}
                  </p>
                </CardContent>
              </Card>

              {/* Quick Summary */}
              <Card id="quick-summary" className="bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    {t('keyPrivacyPrinciples')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {quickSummary.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-background/60 rounded-lg">
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
                              {t('importantSection')}
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
                        {t('privacyOfficer')}
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
