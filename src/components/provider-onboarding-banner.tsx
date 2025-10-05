"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, HelpCircle, ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';
import Link from "next/link";

export default function ProviderOnboardingBanner() {
    const t = useTranslations('ProviderOnboardingBanner');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if this banner has been dismissed before
        const dismissed = localStorage.getItem('provider_onboarding_banner_dismissed');
        if (!dismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('provider_onboarding_banner_dismissed', 'true');
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="w-full mb-6">
            <Card className="border-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white overflow-hidden shadow-lg">
                <CardContent className="p-0">
                    <div className="flex items-center relative">
                        {/* Left Section - Illustration */}
                        <div className="flex-shrink-0 w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-l-lg flex items-center justify-center relative overflow-hidden">
                            <div className="relative z-10">
                                {/* Character illustration */}
                                <div className="w-20 h-20 relative">
                                    {/* Character body */}
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-gradient-to-b from-amber-200 to-amber-300 rounded-full"></div>
                                    {/* Character head */}
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-b from-amber-200 to-amber-300 rounded-full"></div>
                                    {/* Laptop */}
                                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-6 h-4 bg-gray-300 rounded-sm">
                                        <div className="w-full h-full bg-blue-400 rounded-sm flex items-center justify-center">
                                            <div className="w-1 h-1 bg-yellow-300 rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                    {/* Sparkles */}
                                    <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-300 rounded-full animate-pulse"></div>
                                    <div className="absolute top-3 right-0 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-pulse delay-300"></div>
                                    <div className="absolute top-0 right-2 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-pulse delay-700"></div>
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
                                <p className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                                    {t('learnHowToGetStarted')}
                                </p>
                                <h3 className="text-lg font-bold text-white leading-tight">
                                    {t('providerGuideTitle')}
                                </h3>
                                <p className="text-sm text-slate-200 leading-relaxed">
                                    {t('providerGuideDescription')}
                                </p>
                            </div>
                        </div>

                        {/* Right Section - Call to Action */}
                        <div className="flex-shrink-0 px-6 py-4">
                            <Button 
                                asChild
                                className="bg-white text-slate-800 hover:bg-slate-100 font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                            >
                                <Link href="/profile">
                                    <span>{t('exploreProviderGuide')}</span>
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        {/* Top Right Icons */}
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-300 hover:text-white hover:bg-slate-700/50"
                                onClick={() => {/* Help action */}}
                                aria-label={t('help')}
                            >
                                <HelpCircle className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-300 hover:text-white hover:bg-slate-700/50"
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
