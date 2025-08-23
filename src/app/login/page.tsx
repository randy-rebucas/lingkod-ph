
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { doc, getDoc, setDoc, serverTimestamp, getDocs, collection, query, limit } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { useTranslations } from 'next-intl';

// Function to generate a unique referral code
const generateReferralCode = (userId: string): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const uidPart = userId.substring(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `LP-${uidPart}-${timestamp.slice(-3)}-${randomPart}`;
};


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
        if (auth.currentUser) {
            setIsSetupRequired(false);
            return;
        }; 
        try {
            const usersRef = collection(db, "users");
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
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: t('success'), description: t('loggedInSuccess') });
      router.push('/dashboard');
    } catch (error: any) {
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
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userDocRef = doc(db, 'users', user.uid);
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
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: t('googleLoginFailed'),
            description: error.message,
        });
    } finally {
        setLoading(false);
    }
  };

  if (authLoading || user || isSetupRequired === null || isSetupRequired === true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
       <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center space-y-2">
             <Link href="/" className="inline-block mx-auto">
              <Logo />
            </Link>
            <CardTitle className="text-2xl">{t('welcomeBack')}</CardTitle>
            <CardDescription>{t('enterCredentials')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                    {t('forgotPassword')}
                  </Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('loggingIn') : t('logIn')}
              </Button>
            </form>
            <Separator className="my-6" />
            <div className="space-y-4">
                <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>{t('loginWithGoogle')}</Button>
                <Button variant="outline" className="w-full" disabled>{t('loginWithFacebook')}</Button>
            </div>
                          <div className="mt-6 text-center text-sm">
                {t('noAccount')}{" "}
                <Link href="/signup" className="underline">
                  {t('signUp')}
                </Link>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
