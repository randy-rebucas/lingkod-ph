"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    X, 
    ArrowRight, 
    ArrowLeft, 
    Search, 
    MapPin, 
    Star, 
    ShieldCheck, 
    MessageCircle,
    CheckCircle,
    Play,
    SkipForward
} from "lucide-react";
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";

interface TourStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    highlight?: string;
    action?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface InteractiveOnboardingTourProps {
    onComplete?: () => void;
    onSkip?: () => void;
}

export default function InteractiveOnboardingTour({ onComplete, onSkip }: InteractiveOnboardingTourProps) {
    const t = useTranslations('InteractiveOnboardingTour');
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const tourRef = useRef<HTMLDivElement>(null);

    const tourSteps: TourStep[] = [
        {
            id: 'welcome',
            title: t('welcomeTitle'),
            description: t('welcomeDescription'),
            icon: <Play className="h-6 w-6" />,
            position: 'bottom'
        },
        {
            id: 'search',
            title: t('searchTitle'),
            description: t('searchDescription'),
            icon: <Search className="h-6 w-6" />,
            highlight: 'search-bar',
            action: t('searchAction'),
            position: 'bottom'
        },
        {
            id: 'filters',
            title: t('filtersTitle'),
            description: t('filtersDescription'),
            icon: <MapPin className="h-6 w-6" />,
            highlight: 'quick-filters',
            action: t('filtersAction'),
            position: 'bottom'
        },
        {
            id: 'providers',
            title: t('providersTitle'),
            description: t('providersDescription'),
            icon: <Star className="h-6 w-6" />,
            highlight: 'provider-cards',
            action: t('providersAction'),
            position: 'top'
        },
        {
            id: 'trust',
            title: t('trustTitle'),
            description: t('trustDescription'),
            icon: <ShieldCheck className="h-6 w-6" />,
            highlight: 'verification-badge',
            action: t('trustAction'),
            position: 'left'
        },
        {
            id: 'booking',
            title: t('bookingTitle'),
            description: t('bookingDescription'),
            icon: <MessageCircle className="h-6 w-6" />,
            highlight: 'contact-button',
            action: t('bookingAction'),
            position: 'top'
        },
        {
            id: 'complete',
            title: t('completeTitle'),
            description: t('completeDescription'),
            icon: <CheckCircle className="h-6 w-6" />,
            position: 'bottom'
        }
    ];

    useEffect(() => {
        // Check if tour has been completed before
        const tourCompleted = localStorage.getItem('interactive_onboarding_tour_completed');
        if (!tourCompleted) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('interactive_onboarding_tour_completed', 'true');
        setIsVisible(false);
        onComplete?.();
    };

    const handleSkip = () => {
        localStorage.setItem('interactive_onboarding_tour_completed', 'true');
        setIsVisible(false);
        onSkip?.();
    };

    const handleStartTour = () => {
        setIsPlaying(true);
        setCurrentStep(0);
    };

    const getHighlightElement = (highlightId: string) => {
        if (typeof document !== 'undefined') {
            return document.querySelector(`[data-tour-highlight="${highlightId}"]`);
        }
        return null;
    };

    const scrollToHighlight = (highlightId: string) => {
        const element = getHighlightElement(highlightId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    useEffect(() => {
        const currentStepData = tourSteps[currentStep];
        if (currentStepData.highlight && isPlaying) {
            setTimeout(() => scrollToHighlight(currentStepData.highlight!), 300);
        }
    }, [currentStep, isPlaying]);

    if (!isVisible) {
        return null;
    }

    const currentStepData = tourSteps[currentStep];
    const progress = ((currentStep + 1) / tourSteps.length) * 100;

    return (
        <>
            {/* Overlay */}
            {isPlaying && (
                <div className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" />
            )}

            {/* Tour Container */}
            <div 
                ref={tourRef}
                className={cn(
                    "fixed z-50 transition-all duration-300",
                    isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            >
                {/* Welcome Screen */}
                {!isPlaying && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <Card className="w-full max-w-md mx-4 border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl">
                            <CardContent className="p-8 text-center space-y-6">
                                <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                                    <Play className="h-10 w-10 text-white" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold">{t('welcomeTitle')}</h2>
                                    <p className="text-blue-100 leading-relaxed">
                                        {t('welcomeDescription')}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Button 
                                        onClick={handleStartTour}
                                        className="w-full bg-white text-blue-600 hover:bg-blue-50 font-medium"
                                    >
                                        <Play className="mr-2 h-4 w-4" />
                                        {t('startTour')}
                                    </Button>
                                    
                                    <Button 
                                        variant="ghost" 
                                        onClick={handleSkip}
                                        className="w-full text-blue-200 hover:text-white hover:bg-blue-700/50"
                                    >
                                        <SkipForward className="mr-2 h-4 w-4" />
                                        {t('skipTour')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tour Steps */}
                {isPlaying && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <Card className="w-full max-w-sm mx-4 border-0 bg-white shadow-2xl pointer-events-auto">
                            <CardContent className="p-6">
                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-600">
                                            {t('step')} {currentStep + 1} {t('of')} {tourSteps.length}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleSkip}
                                            className="h-6 w-6 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Step Content */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            {currentStepData.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {currentStepData.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 leading-relaxed">
                                        {currentStepData.description}
                                    </p>

                                    {currentStepData.action && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-sm text-blue-800 font-medium">
                                                {currentStepData.action}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between items-center mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={currentStep === 0}
                                        className="flex items-center gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        {t('previous')}
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {currentStep === tourSteps.length - 1 ? (
                                            <>
                                                <CheckCircle className="h-4 w-4" />
                                                {t('complete')}
                                            </>
                                        ) : (
                                            <>
                                                {t('next')}
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </>
    );
}
