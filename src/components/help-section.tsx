"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    HelpCircle, 
    ChevronDown, 
    ChevronRight, 
    Search, 
    MessageCircle, 
    BookOpen,
    Video,
    FileText,
    ExternalLink,
    Phone,
    Mail
} from "lucide-react";
import { useTranslations } from 'next-intl';
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: string;
}

interface HelpSectionProps {
    className?: string;
}

export default function HelpSection({ className }: HelpSectionProps) {
    const t = useTranslations('HelpSection');
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const faqItems: FAQItem[] = [
        {
            id: 'getting-started',
            question: t('faqGettingStarted'),
            answer: t('faqGettingStartedAnswer'),
            category: 'basics'
        },
        {
            id: 'finding-providers',
            question: t('faqFindingProviders'),
            answer: t('faqFindingProvidersAnswer'),
            category: 'search'
        },
        {
            id: 'booking-process',
            question: t('faqBookingProcess'),
            answer: t('faqBookingProcessAnswer'),
            category: 'booking'
        },
        {
            id: 'payment-options',
            question: t('faqPaymentOptions'),
            answer: t('faqPaymentOptionsAnswer'),
            category: 'payment'
        },
        {
            id: 'cancellation-policy',
            question: t('faqCancellationPolicy'),
            answer: t('faqCancellationPolicyAnswer'),
            category: 'policies'
        },
        {
            id: 'safety-verification',
            question: t('faqSafetyVerification'),
            answer: t('faqSafetyVerificationAnswer'),
            category: 'safety'
        }
    ];

    const helpResources = [
        {
            title: t('quickStartGuide'),
            description: t('quickStartGuideDesc'),
            icon: <BookOpen className="h-5 w-5" />,
            href: "/learning-hub/clients",
            color: "bg-blue-100 text-blue-700 border-blue-200"
        },
        {
            title: t('videoTutorials'),
            description: t('videoTutorialsDesc'),
            icon: <Video className="h-5 w-5" />,
            href: "/learning-hub/clients",
            color: "bg-green-100 text-green-700 border-green-200"
        },
        {
            title: t('contactSupport'),
            description: t('contactSupportDesc'),
            icon: <MessageCircle className="h-5 w-5" />,
            href: "/messages",
            color: "bg-purple-100 text-purple-700 border-purple-200"
        }
    ];

    const filteredFAQs = faqItems.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleExpanded = (id: string) => {
        setExpandedItem(expandedItem === id ? null : id);
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* Help Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <HelpCircle className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">{t('helpCenter')}</h2>
                </div>
                <p className="text-muted-foreground">{t('helpDescription')}</p>
            </div>

            {/* Quick Resources */}
            <div className="grid gap-4 md:grid-cols-3">
                {helpResources.map((resource, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className={cn("p-2 rounded-lg border", resource.color)}>
                                    {resource.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">{resource.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={resource.href}>
                                            {t('learnMore')}
                                            <ExternalLink className="h-3 w-3 ml-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* FAQ Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {t('frequentlyAskedQuestions')}
                    </CardTitle>
                    
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('searchFAQs')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-2">
                    {filteredFAQs.length > 0 ? (
                        filteredFAQs.map((item) => (
                            <div key={item.id} className="border border-border rounded-lg">
                                <Button
                                    variant="ghost"
                                    onClick={() => toggleExpanded(item.id)}
                                    className="w-full justify-between p-4 h-auto"
                                >
                                    <span className="text-left font-medium">{item.question}</span>
                                    {expandedItem === item.id ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </Button>
                                
                                {expandedItem === item.id && (
                                    <div className="px-4 pb-4">
                                        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>{t('noResultsFound')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-6">
                    <div className="text-center space-y-4">
                        <h3 className="text-lg font-semibold">{t('needMoreHelp')}</h3>
                        <p className="text-muted-foreground">{t('contactUsDescription')}</p>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button variant="outline" asChild>
                                <Link href="/messages">
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    {t('liveChat')}
                                </Link>
                            </Button>
                            
                            <Button variant="outline" asChild>
                                <a href="mailto:support@localpro.com">
                                    <Mail className="h-4 w-4 mr-2" />
                                    {t('emailSupport')}
                                </a>
                            </Button>
                            
                            <Button variant="outline" asChild>
                                <a href="tel:+1234567890">
                                    <Phone className="h-4 w-4 mr-2" />
                                    {t('phoneSupport')}
                                </a>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
