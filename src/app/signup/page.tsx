"use client";

import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getAuthInstance, getDb   } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, runTransaction, getDocs, query, where, collection, limit, getDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";
import { useTranslations } from 'next-intl';
import { generateReferralCode } from '@/lib/referral-code-generator';
import { Loader2 } from 'lucide-react';

const handleReferral = async (referralCode: string, newUser: { uid: string; email: string | null }) => {
    if (!referralCode) return;

    const usersRef = collection(getDb(), 'users');
    const q = query(usersRef, where('referralCode', '==', referralCode.toUpperCase()), limit(1));
    
    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn('Referral code not found:', referralCode);
            return 'Referral code not found';
        }

        const referrerDoc = querySnapshot.docs[0];
        
        if (referrerDoc.id === newUser.uid) {
            return "You cannot use your own referral code.";
        }

        const referrerRef = referrerDoc.ref;
        const pointsToAward = 250; // Referral bonus
        
        await runTransaction(getDb(), async (transaction) => {
            const freshReferrerDoc = await transaction.get(referrerRef);
            if (!freshReferrerDoc.exists()) {
                throw new Error("Referrer document does not exist!");
            }

            // Update referrer's points
            const currentPoints = freshReferrerDoc.data().loyaltyPoints || 0;
            transaction.update(referrerRef, { loyaltyPoints: currentPoints + pointsToAward });

            // Add loyalty transaction for referrer
            const referrerLoyaltyTxRef = doc(collection(referrerRef, 'loyaltyTransactions'));
            transaction.set(referrerLoyaltyTxRef, {
                points: pointsToAward,
                type: 'referral',
                description: `Referral bonus for ${newUser.email}`,
                referredUserId: newUser.uid,
                createdAt: serverTimestamp(),
            });
            
            // Add referral record
            const referralRecordRef = doc(collection(getDb(), 'referrals'));
            transaction.set(referralRecordRef, {
                referrerId: referrerDoc.id,
                referredId: newUser.uid,
                referredEmail: newUser.email,
                rewardPointsGranted: pointsToAward,
                createdAt: serverTimestamp(),
            });
            
            // Mark the new user as referred and give them bonus points
            const newUserRef = doc(getDb(), 'users', newUser.uid);
            transaction.update(newUserRef, { 
                referredBy: referrerDoc.id,
                loyaltyPoints: 100 // Welcome bonus for being referred
            });

            // Add loyalty transaction for the new user
            const newUserLoyaltyTxRef = doc(collection(newUserRef, 'loyaltyTransactions'));
            transaction.set(newUserLoyaltyTxRef, {
                points: 100,
                type: 'referral',
                description: `Welcome bonus for using referral code`,
                createdAt: serverTimestamp(),
            });
        });

    } catch (error) {
        console.error("Error processing referral: ", error);
        return "Failed to process referral.";
    }

    return null; // Success
};

const SignupFormContainer = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const t = useTranslations('Auth');

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(getAuthInstance(), email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });

      const newReferralCode = generateReferralCode(user.uid);
      
      await setDoc(doc(getDb(), "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        phone: phone,
        role: 'client', // All new users are clients
        accountStatus: 'active',
        createdAt: serverTimestamp(),
        loyaltyPoints: 0, // Initial points
        referralCode: newReferralCode,
      });

      if (referralCode) {
        const referralError = await handleReferral(referralCode, user);
        if (referralError) {
            toast({ variant: 'destructive', title: t('invalidReferralCode'), description: referralError });
        } else {
             toast({ title: t('referralApplied'), description: t('referralBonus') });
        }
      }

      toast({ title: t('success'), description: t('accountCreatedSuccess') });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('signupFailed'),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
    <form className="space-y-6" onSubmit={handleSignup}>
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">{t('fullName')}</Label>
          <Input 
            id="name" 
            placeholder="Juan Dela Cruz" 
            required 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="h-12 border-2 focus:border-primary transition-colors"
          />
        </div>
        <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m@example.com" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="h-12 border-2 focus:border-primary transition-colors"
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">{t('mobileNumber')}</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="09123456789" 
              required 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              className="h-12 border-2 focus:border-primary transition-colors"
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="h-12 border-2 focus:border-primary transition-colors"
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="referral" className="text-sm font-medium">{t('referralCode')}</Label>
            <Input 
              id="referral" 
              placeholder="LP-XXXX-YYY-ZZZ" 
              value={referralCode} 
              onChange={e => setReferralCode(e.target.value)}
              className="h-12 border-2 focus:border-primary transition-colors"
            />
        </div>
        <Button 
          type="submit" 
          className="w-full h-12 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300" 
          disabled={loading}
        >
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {loading ? t('creatingAccount') : t('createAccountBtn')}
        </Button>
    </form>
    
    </>
  );
};


export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('Auth.signup');
  
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-glow border-0 bg-background/80 backdrop-blur-md">
          <CardHeader className="text-center space-y-6 pb-8">
            <Link href="/" className="inline-block mx-auto">
              <Logo />
            </Link>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t('createAccount')}
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                {t('joinLocalPro')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
              <SignupFormContainer />
            </Suspense>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t('alreadyHaveAccount')}{" "}</span>
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                {t('logInLink')}
              </Link>
            </div>
          </CardContent>
          </Card>
    </div>
  );
}
