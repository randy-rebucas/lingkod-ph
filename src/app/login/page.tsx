
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getAuthInstance, getDb   } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { getDocs, collection, query, limit } from "firebase/firestore";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { Logo } from "@/components/logo";
import { useTranslations } from 'next-intl';


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
