
"use client";

import { useTranslations } from 'next-intl';
import { Card } from "@/components/ui/card";

export default function TermsOfServicePage() {
  const t = useTranslations('TermsOfService');
  const sections = [
    {
      title: "1. Definitions",
      content: [
        "“LocalPro,” “we,” “our,” or “us” refers to LocalPro and its affiliates.",
        "“User” or “you” means anyone who accesses or uses the Platform, including service providers (“Providers”), clients (“Clients”), and agencies.",
        "“Services” refers to any service offered through the LocalPro platform by Providers to Clients.",
      ],
    },
    {
      title: "2. Eligibility",
      content: [
        "You must be at least 18 years old and capable of entering into legally binding contracts to use LocalPro. By registering, you confirm that all information provided is accurate and complete.",
      ],
    },
    {
      title: "3. Account Registration",
      content: [
        "To use certain features, you must create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.",
        "For Clients: You may browse, book, and rate service providers.",
        "For Providers: You may list your services, manage bookings, and receive payments subject to LocalPro's policies.",
      ],
    },
    {
      title: "4. Use of Platform",
      content: [
        "You agree to:",
        "Use the Platform in compliance with all applicable laws.",
        "Not use the Platform for illegal, fraudulent, or harmful purposes.",
        "Not impersonate any person or entity or misrepresent your affiliation with any person or entity.",
      ],
    },
    {
      title: "5. Payments and Fees",
      content: [
        "Clients pay Providers through the Platform. Pricing, fees, and applicable taxes will be displayed before checkout.",
        "Providers may be charged subscription fees, commissions, or advertising fees based on LocalPro’s pricing structure.",
        "All transactions are processed in USD or PHP, as selected during registration.",
      ],
    },
    {
      title: "6. Cancellations and Refunds",
      content: [
        "Cancellation and refund policies vary by service and are set by each Provider.",
        "LocalPro may intervene in disputes but is not liable for any service issues between Client and Provider.",
      ],
    },
    {
      title: "7. Service Quality and Ratings",
      content: [
        "Clients can leave reviews and ratings after a service is completed. Providers are expected to maintain high service standards. Repeated low ratings may result in suspension.",
      ],
    },
    {
      title: "8. Intellectual Property",
      content: [
        "All content on the Platform, including logos, text, images, and software, is owned by or licensed to LocalPro and protected by applicable laws. You may not reproduce, distribute, or create derivative works without written permission.",
      ],
    },
    {
      title: "9. User Content",
      content: [
        "You retain ownership of content you post, such as reviews or photos, but you grant LocalPro a non-exclusive, royalty-free license to use, display, and distribute such content on the Platform.",
      ],
    },
    {
      title: "10. Termination",
      content: [
        "We may suspend or terminate your account at any time, with or without notice, for any violation of these Terms. You may also deactivate your account at any time.",
      ],
    },
    {
      title: "11. Disclaimers",
      content: [
        "LocalPro acts only as a marketplace and is not responsible for the conduct, performance, or services of Providers.",
        "The Platform is provided “as is” and “as available.” We do not guarantee uninterrupted or error-free service.",
      ],
    },
    {
      title: "12. Limitation of Liability",
      content: [
        "To the maximum extent permitted by law, LocalPro is not liable for any indirect, incidental, or consequential damages arising from your use of the Platform.",
      ],
    },
    {
      title: "13. Indemnity",
      content: [
        "You agree to indemnify and hold harmless LocalPro and its officers, employees, and partners from any claims or disputes arising out of your use of the Platform or your violation of these Terms.",
      ],
    },
    {
      title: "14. Modifications",
      content: [
        "We may update these Terms at any time. Changes will be posted on this page, and continued use of the Platform constitutes acceptance of the revised Terms.",
      ],
    },
    {
      title: "15. Governing Law",
      content: [
        "These Terms are governed by the laws of the Republic of the Philippines, without regard to its conflict of laws principles.",
      ],
    },
    {
      title: "16. Contact Us",
      content: [
        "For questions or concerns, contact us at:",
        "📧 support@localpro.asia",
        "📞 +639179157515",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">

      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="mb-16">
            <Card className="bg-background/60 backdrop-blur-sm border-0 shadow-soft p-8">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Welcome to LocalPro. These Terms of Service (&quot;Terms&quot;) govern your use of our platform, which connects service providers with clients through our website and mobile applications (collectively, the &quot;Platform&quot;). By accessing or using LocalPro, you agree to be bound by these Terms.
              </p>
            </Card>
          </div>

          {/* Terms Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <Card key={section.title} className="bg-background/60 backdrop-blur-sm border-0 shadow-soft">
                <div className="p-8">
                  <h2 className="text-2xl font-bold font-headline mb-6 text-primary">{section.title}</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    {section.content.map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex} className="text-base">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Contact Information */}
          <div className="mt-16">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft">
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold font-headline mb-4">Questions About These Terms?</h3>
                <p className="text-muted-foreground mb-6">
                  If you have any questions or concerns about these Terms of Service, please don't hesitate to contact us.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href="mailto:support@localpro.asia" 
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    📧 support@localpro.asia
                  </a>
                  <a 
                    href="tel:+639179157515" 
                    className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    📞 +63 917 915 7515
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
