
"use client";

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
        <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center space-y-2">
                    <div className="flex justify-center">
                        <Logo />
                    </div>
                    <CardTitle className="text-2xl">{t('title')}</CardTitle>
                    <CardDescription>{t('subtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('email')}</Label>
                            <Input id="email" name="email" type="email" placeholder={t('emailPlaceholder')} required />
                        </div>
                        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isPending ? t('sending') : t('sendResetLink')}
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm">
                        {t('backToLogin')}{" "}
                        <Link href="/login" className="underline">
                            {t('login')}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
