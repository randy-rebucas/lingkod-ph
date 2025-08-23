"use client";

import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, User, getAdditionalUserInfo } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, runTransaction, getDocs, query, where, collection, writeBatch, limit, getDoc, updateDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";
import { useTranslations } from 'next-intl';


// Function to generate a unique referral code
const generateReferralCode = (userId: string): string => {
    // Create a more unique and readable referral code
    const timestamp = Date.now().toString(36).toUpperCase();
    const uidPart = userId.substring(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    // Format: LP-XXXX-YYY-ZZZ (where XXXX is uid part, YYY is timestamp part, ZZZ is random part)
    return `LP-${uidPart}-${timestamp.slice(-3)}-${randomPart}`;
};

const handleReferral = async (referralCode: string, newUser: { uid: string; email: string | null }) => {
    if (!referralCode) return;

    const usersRef = collection(db, 'users');
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
        
        await runTransaction(db, async (transaction) => {
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
            const referralRecordRef = doc(collection(db, 'referrals'));
            transaction.set(referralRecordRef, {
                referrerId: referrerDoc.id,
                referredId: newUser.uid,
                referredEmail: newUser.email,
                rewardPointsGranted: pointsToAward,
                createdAt: serverTimestamp(),
            });
            
            // Mark the new user as referred and give them bonus points
            const newUserRef = doc(db, 'users', newUser.uid);
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });

      const newReferralCode = generateReferralCode(user.uid);
      
      await setDoc(doc(db, "users", user.uid), {
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

  const handleGoogleSignup = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const newReferralCode = generateReferralCode(user.uid);
        
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            phone: user.phoneNumber || '',
            role: 'client', // All new users are clients
            accountStatus: 'active',
            createdAt: serverTimestamp(),
            loyaltyPoints: 0,
            referralCode: newReferralCode,
        });

        const refCode = searchParams.get('ref');
        if (refCode) {
          const referralError = await handleReferral(refCode, user);
          if (referralError) {
              toast({ variant: 'destructive', title: t('invalidReferralCode'), description: referralError });
          } else {
             toast({ title: t('referralApplied'), description: t('referralBonus') });
          }
        }
      } 
      
      toast({ title: t('success'), description: t('signedUpGoogle') });
      router.push('/dashboard');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('googleSignupFailed'),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <form className="space-y-4" onSubmit={handleSignup}>
        <div className="space-y-2">
          <Label htmlFor="name">{t('fullName')}</Label>
          <Input id="name" placeholder="Juan Dela Cruz" required value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="phone">{t('mobileNumber')}</Label>
            <Input id="phone" type="tel" placeholder="09123456789" required value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="referral">{t('referralCode')}</Label>
            <Input id="referral" placeholder="LP-XXXX-YYY-ZZZ" value={referralCode} onChange={e => setReferralCode(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? t('creatingAccount') : t('createAccountBtn')}
        </Button>
    </form>
    <Separator className="my-6" />
    <div className="space-y-4">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('signUpWithGoogle')}
        </Button>
    </div>
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
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
         <CardHeader className="text-center space-y-2">
           <Link href="/" className="inline-block mx-auto">
              <Logo />
            </Link>
          <CardTitle className="text-2xl">{t('createAccount')}</CardTitle>
          <CardDescription>{t('joinLocalPro')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <SignupFormContainer />
          </Suspense>

          <div className="mt-6 text-center text-sm">
            {t('alreadyHaveAccount')}{" "}
            <Link href="/login" className="underline">
              {t('logInLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
