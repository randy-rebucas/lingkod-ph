"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { AlertTriangle, Mail, Phone, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';

export default function AccountSuspendedPage() {
  const router = useRouter();
  const tSuspended = useTranslations('Auth.accountSuspended');
  const { user, loading } = useAuth();

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="text-center">
          <Logo />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
      <Card className="w-full max-w-md shadow-glow border-0 bg-background/80 backdrop-blur-md">
        <CardHeader className="text-center space-y-6 pb-8">
          <Logo />
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-headline text-destructive">
                {tSuspended('title')}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {tSuspended('subtitle')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">{tSuspended('contactSupport')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {tSuspended('supportDescription')}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('mailto:support@localpro.asia', '_blank')}
              >
                <Mail className="mr-3 h-4 w-4" />
                {tSuspended('supportEmail')}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('tel:+639123456789', '_blank')}
              >
                <Phone className="mr-3 h-4 w-4" />
                {tSuspended('supportPhone')}
              </Button>
            </div>

            <div className="text-center pt-4 space-y-3">
              <Button
                variant="outline"
                onClick={() => router.push('/help-center')}
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Help Center
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="text-muted-foreground hover:text-foreground"
              >
                {tSuspended('returnToHome')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
