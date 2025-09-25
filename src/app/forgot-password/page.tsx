"use client";

import React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { forgotPasswordAction, type FormState } from "./actions";
import { useTranslations } from 'next-intl';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";

const initialState: FormState = {
  error: null,
  message: "",
};

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);
    const t = useTranslations('ForgotPassword');
    
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.error ? t('error') : t('success'),
                description: state.message,
                variant: state.error ? "destructive" : "default",
            });
            if (!state.error) {
                // Optionally redirect or clear form
            }
        }
    }, [state, toast, t]);

    if (authLoading || user) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-secondary">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-glow border-0 bg-background/80 backdrop-blur-md">
                    <CardHeader className="text-center space-y-6 pb-8">
                        <div className="flex justify-center">
                            <Logo />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {t('title')}
                            </CardTitle>
                            <CardDescription className="text-lg text-muted-foreground">
                                {t('subtitle')}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form action={formAction} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">{t('email')}</Label>
                                <Input 
                                    id="email" 
                                    name="email" 
                                    type="email" 
                                    placeholder={t('emailPlaceholder')} 
                                    required
                                    className="h-12 border-2 focus:border-primary transition-colors"
                                />
                            </div>
                            {state.error && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                    <p className="text-sm text-destructive">{state.error}</p>
                                </div>
                            )}
                            <Button 
                                type="submit" 
                                className="w-full h-12 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300" 
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {t('sending')}
                                    </>
                                ) : (
                                    t('sendResetLink')
                                )}
                            </Button>
                        </form>
                        
                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">{t('backToLogin')}{" "}</span>
                            <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                {t('login')}
                            </Link>
                        </div>
                    </CardContent>
                    </Card>
        </div>
    );
}
