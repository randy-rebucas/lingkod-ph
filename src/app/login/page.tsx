
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getAuthInstance, getDb   } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { doc, getDoc, setDoc, serverTimestamp, getDocs, collection, query, limit } from "firebase/firestore";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { Logo } from "@/components/logo";
import { useTranslations } from 'next-intl';
import { generateReferralCode } from '@/lib/referral-code-generator';
import { Loader2 } from 'lucide-react';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isSetupRequired, setIsSetupRequired] = useState<boolean | null>(null);
  const t = useTranslations('Auth');

  useEffect(() => {
    // This check runs only once on component mount
    const checkUserCount = async () => {
        // No need to check if a user session is being restored or already exists
        if (getAuthInstance().currentUser) {
            setIsSetupRequired(false);
            return;
        }; 
        try {
            if (!getDb()) return;
            const usersRef = collection(getDb(), "users");
            const q = query(usersRef, limit(1));
            const snapshot = await getDocs(q);
            const setupRequired = snapshot.empty;
            setIsSetupRequired(setupRequired);
            if (setupRequired) {
                router.push('/setup');
            }
            } catch (error) {
            console.error("Error checking user count:", error);
            setIsSetupRequired(false); // Default to not required on error
        }
    };
    checkUserCount();
}, [router]);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(getAuthInstance(), email, password);
      toast({ title: t('success'), description: t('loggedInSuccess') });
      router.push('/dashboard');
    } catch {
      toast({
        variant: "destructive",
        title: t('loginFailed'),
        description: t('invalidCredentials'),
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(getAuthInstance(), provider);
        const user = result.user;
        
        const userDocRef = doc(getDb(), 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        // If it's a new user, create a document for them
        if (!userDoc.exists()) {
            const newReferralCode = generateReferralCode(user.uid);
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: 'client', // Default role for Google sign-in
                createdAt: serverTimestamp(),
                loyaltyPoints: 0,
                referralCode: newReferralCode,
            });
             toast({ title: t('welcome'), description: t('accountCreated') });
        } else {
            toast({ title: t('welcomeBackGoogle'), description: t('loggedInGoogle') });
        }
        
        router.push('/dashboard');
    } catch (error: unknown) {
        toast({
            variant: "destructive",
            title: t('googleLoginFailed'),
            description: error instanceof Error ? error.message : 'An error occurred',
        });
    } finally {
        setLoading(false);
    }
  };

  if (authLoading || user || isSetupRequired === null || isSetupRequired === true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
          <Card className="shadow-glow border-0 bg-background/80 backdrop-blur-md">
            <CardHeader className="text-center space-y-6 pb-8">
              <Link href="/" className="inline-block mx-auto">
                <Logo />
              </Link>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {t('welcomeBack')}
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  {t('enterCredentials')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-2 focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Link href="/forgot-password" className="ml-auto inline-block text-sm text-primary hover:text-primary/80 transition-colors">
                      {t('forgotPassword')}
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-2 focus:border-primary transition-colors"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {t('loggingIn')}
                    </>
                  ) : (
                    t('logIn')
                  )}
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300" 
                  onClick={handleGoogleLogin} 
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {t('loginWithGoogle')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300" 
                  disabled
                >
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  {t('loginWithFacebook')}
                </Button>
              </div>
              
              <div className="text-center text-sm">
                <span className="text-muted-foreground">{t('noAccount')}{" "}</span>
                <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  {t('signUp')}
                </Link>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
