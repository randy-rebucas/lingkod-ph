"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, HelpCircle, ArrowRight, Share2, DollarSign, Target } from "lucide-react";
import { useTranslations } from 'next-intl';
import Link from "next/link";

export default function PartnerOnboardingBanner() {
    const t = useTranslations('PartnerOnboardingBanner');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if this banner has been dismissed before
        const dismissed = localStorage.getItem('partner_onboarding_banner_dismissed');
        console.log('Partner Banner - Dismissed status:', dismissed);
        
        // For testing: always show the banner (comment out the dismissed check)
        setIsVisible(true);
        console.log('Partner Banner - Setting visible to true (testing mode)');
        
        // Original logic (uncomment for production):
        // if (!dismissed) {
        //     setIsVisible(true);
        //     console.log('Partner Banner - Setting visible to true');
        // }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('partner_onboarding_banner_dismissed', 'true');
        setIsVisible(false);
    };

    if (!isVisible) {
        console.log('Partner Banner - Not visible, returning null');
        return null;
    }

    console.log('Partner Banner - Rendering banner');
    return (
        <div className="w-full mb-6">
            <Card className="border-0 bg-gradient-to-r from-emerald-800 to-teal-900 text-white overflow-hidden shadow-lg">
                <CardContent className="p-0">
                    <div className="flex items-center relative">
                        {/* Left Section - Illustration */}
                        <div className="flex-shrink-0 w-32 h-32 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-l-lg flex items-center justify-center relative overflow-hidden">
                            <div className="relative z-10">
                                {/* Partner illustration */}
                                <div className="w-20 h-20 relative">
                                    {/* Character body */}
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-gradient-to-b from-amber-200 to-amber-300 rounded-full"></div>
                                    {/* Character head */}
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-b from-amber-200 to-amber-300 rounded-full"></div>
                                    {/* Share icon */}
                                    <div className="absolute top-2 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <Share2 className="w-2 h-2 text-emerald-600" />
                                    </div>
                                    {/* Dollar sign */}
                                    <div className="absolute bottom-2 right-0 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
                                        <DollarSign className="w-1.5 h-1.5 text-white" />
                                    </div>
                                    {/* Target icon */}
                                    <div className="absolute top-1 left-0 w-2 h-2 bg-yellow-300 rounded-full flex items-center justify-center">
                                        <Target className="w-1 h-1 text-emerald-600" />
                                    </div>
                                </div>
                            </div>
                            {/* Background pattern */}
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full"></div>
                                <div className="absolute top-4 right-3 w-1 h-1 bg-white rounded-full"></div>
                                <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                        </div>

                        {/* Middle Section - Text Content */}
                        <div className="flex-1 px-6 py-4">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-emerald-200 uppercase tracking-wide">
                                    {t('learnHowToGetStarted')}
                                </p>
                                <h3 className="text-lg font-bold text-white leading-tight">
                                    {t('partnerGuideTitle')}
                                </h3>
                                <p className="text-sm text-emerald-100 leading-relaxed">
                                    {t('partnerGuideDescription')}
                                </p>
                            </div>
                        </div>

                        {/* Right Section - Call to Action */}
                        <div className="flex-shrink-0 px-6 py-4">
                            <Button 
                                asChild
                                className="bg-white text-emerald-800 hover:bg-emerald-50 font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                            >
                                <Link href="/partners/referral-tracking">
                                    <span>{t('explorePartnerGuide')}</span>
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        {/* Top Right Icons */}
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-emerald-200 hover:text-white hover:bg-emerald-700/50"
                                onClick={() => {/* Help action */}}
                                aria-label={t('help')}
                            >
                                <HelpCircle className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-emerald-200 hover:text-white hover:bg-emerald-700/50"
                                onClick={handleDismiss}
                                aria-label={t('close')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
