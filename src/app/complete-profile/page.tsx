"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from 'firebase/auth';
import { getDb } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function CompleteProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTranslations('Auth');
  const tComplete = useTranslations('Auth.completeProfile');

  // Pre-fill email if available from user
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update Firebase Auth profile
      await updateProfile(user, { displayName: name });

      // Update Firestore user document
      const userDocRef = doc(getDb(), 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: name,
        email: email || user.email,
        profileCompleted: true,
        profileCompletedAt: serverTimestamp(),
      });

      toast({
        title: t('success'),
        description: tComplete('profileCompletedSuccess'),
      });

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error completing profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || tComplete('profileCompletionFailed'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{tComplete('authenticationRequired')}</h2>
          <p className="text-muted-foreground">{tComplete('signInToComplete')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-glow border-0 bg-background/80 backdrop-blur-md">
        <CardHeader className="text-center space-y-6 pb-8">
          <Logo />
          <div className="space-y-2">
            <CardTitle className="text-3xl font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {tComplete('title')}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {tComplete('subtitle')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCompleteProfile} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                {tComplete('fullName')}
              </Label>
              <Input
                id="name"
                placeholder={tComplete('fullNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 border-2 focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {tComplete('emailAddress')} <span className="text-muted-foreground">{tComplete('emailOptional')}</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={tComplete('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-2 focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground">
                {tComplete('phoneNumber')} {user.phoneNumber}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {tComplete('completingProfile')}
                </>
              ) : (
                tComplete('completeProfile')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
