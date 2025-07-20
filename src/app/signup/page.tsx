
"use client";

import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, runTransaction, getDocs, query, where, collection, writeBatch, limit, getDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const Logo = () => (
  <h1 className="text-3xl font-bold font-headline text-primary">
    Lingkod<span className="text-accent">PH</span>
  </h1>
);

type UserType = 'client' | 'provider' | 'agency';

const generateReferralCode = (uid: string): string => {
    const uidPart = uid.substring(0, 4).toUpperCase();
    const timePart = Date.now().toString(36).slice(-3).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `LP-${uidPart}-${timePart}-${randomPart}`;
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


const SignUpForm = ({ userType }: { userType: UserType }) => {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

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
      
      const displayName = userType === 'agency' ? businessName : name;
      await updateProfile(user, { displayName });

      const newReferralCode = generateReferralCode(user.uid);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        phone: phone,
        role: userType.toLowerCase(),
        createdAt: serverTimestamp(),
        loyaltyPoints: 0, // Initial points
        referralCode: newReferralCode,
        ...(userType === 'agency' && { contactPerson: contactPerson }),
      });

      if (referralCode) {
        const referralError = await handleReferral(referralCode, user);
        if (referralError) {
            toast({ variant: 'destructive', title: 'Invalid Referral Code', description: referralError });
        }
      }

      toast({ title: "Success", description: "Account created successfully!" });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSignup}>
      {userType === 'agency' ? (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${userType}-business-name`}>Business Name</Label>
            <Input id={`${userType}-business-name`} placeholder="Lingkod Inc." required value={businessName} onChange={e => setBusinessName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${userType}-contact-person`}>Contact Person</Label>
            <Input id={`${userType}-contact-person`} placeholder="Juan Dela Cruz" required value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={`${userType}-name`}>Full Name</Label>
          <Input id={`${userType}-name`} placeholder="Juan Dela Cruz" required value={name} onChange={e => setName(e.target.value)} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${userType}-email`}>Email</Label>
        <Input id={`${userType}-email`} type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${userType}-phone`}>Mobile Number</Label>
        <Input id={`${userType}-phone`} type="tel" placeholder="09123456789" required value={phone} onChange={e => setPhone(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${userType}-password`}>Password</Label>
        <Input id={`${userType}-password`} type="password" required value={password} onChange={e => setPassword(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${userType}-referral`}>Referral Code (Optional)</Label>
        <Input id={`${userType}-referral`} placeholder="LP-XXXX-YYY-ZZZ" value={referralCode} onChange={e => setReferralCode(e.target.value)} />
      </div>


      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
};


export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [activeTab, setActiveTab] = useState<UserType>('client');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleGoogleSignup = async () => {
    setLoadingGoogle(true);
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
            role: activeTab.toLowerCase(),
            createdAt: serverTimestamp(),
            loyaltyPoints: 0,
            referralCode: newReferralCode,
        });

        const refCode = searchParams.get('ref');
        if (refCode) {
          const referralError = await handleReferral(refCode, user);
          if (referralError) {
              toast({ variant: 'destructive', title: 'Invalid Referral Code', description: referralError });
          }
        }
      }
      
      toast({ title: "Success", description: "Signed up successfully with Google!" });
      router.push('/dashboard');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-up Failed",
        description: error.message,
      });
    } finally {
      setLoadingGoogle(false);
    }
  };

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
           <Link href="/" className="inline-block">
              <Logo />
            </Link>
          <CardTitle className="text-2xl">Join Lingkod PH</CardTitle>
          <CardDescription>Choose your account type and let&apos;s get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="client" className="w-full" onValueChange={(value) => setActiveTab(value as UserType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="provider">Provider</TabsTrigger>
              <TabsTrigger value="agency">Agency</TabsTrigger>
            </TabsList>
            <TabsContent value="client">
                <p className="text-sm text-muted-foreground my-4 text-center">Create an account to find and book reliable services.</p>
                <SignUpForm userType="client" />
            </TabsContent>
            <TabsContent value="provider">
                <p className="text-sm text-muted-foreground my-4 text-center">Offer your skills and services to a wider audience.</p>
                <SignUpForm userType="provider" />
            </TabsContent>
            <TabsContent value="agency">
                <p className="text-sm text-muted-foreground my-4 text-center">Manage your team and grow your service business.</p>
                <SignUpForm userType="agency" />
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="space-y-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loadingGoogle}>
                {loadingGoogle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign up with Google
            </Button>
            <Button variant="outline" className="w-full" disabled>Sign up with Facebook</Button>
          </div>

          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
