"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function SubscriptionSuccessPage() {
    const searchParams = useSearchParams();
    const { subscription } = useAuth();
    const t = useTranslations('Subscription');
    const status = searchParams.get('status');

    const getStatusInfo = () => {
        switch (status) {
            case 'pending':
                return {
                    icon: <Clock className="h-16 w-16 text-yellow-500" />,
                    title: "Payment Submitted",
                    description: "Your payment has been submitted and is being processed. You'll receive an email confirmation once it's verified.",
                    color: "text-yellow-600",
                    bgColor: "bg-yellow-50 border-yellow-200"
                };
            case 'rejected':
                return {
                    icon: <XCircle className="h-16 w-16 text-red-500" />,
                    title: "Payment Rejected",
                    description: "Your payment was rejected. Please check the reason and try again with a different payment method.",
                    color: "text-red-600",
                    bgColor: "bg-red-50 border-red-200"
                };
            default:
                return {
                    icon: <CheckCircle className="h-16 w-16 text-green-500" />,
                    title: "Subscription Activated!",
                    description: "Your subscription has been successfully activated. You now have access to all premium features.",
                    color: "text-green-600",
                    bgColor: "bg-green-50 border-green-200"
                };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <Card className={`${statusInfo.bgColor} border-2`}>
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {statusInfo.icon}
                    </div>
                    <CardTitle className={`text-2xl ${statusInfo.color}`}>
                        {statusInfo.title}
                    </CardTitle>
                    <CardDescription className="text-lg">
                        {statusInfo.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    {subscription && (
                        <div className="bg-white p-4 rounded-lg border">
                            <h3 className="font-semibold mb-2">Current Subscription</h3>
                            <p className="text-sm text-muted-foreground">
                                Plan: <span className="font-medium">{subscription.planId}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Status: <span className="font-medium capitalize">{subscription.status}</span>
                            </p>
                        </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button asChild>
                            <Link href="/subscription">
                                View Subscription
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard">
                                Go to Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}