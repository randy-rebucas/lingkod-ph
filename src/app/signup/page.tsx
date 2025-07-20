
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, runTransaction, getDocs, query, where, collection, writeBatch, limit } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Logo = () => (
  <h1 className="text-3xl font-bold font-headline text-primary">
    Lingkod<span className="text-accent">PH</span>
  </h1>
);

type UserType = 'client' | 'provider' | 'agency';

const generateReferralCode = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const handleReferral = async (referralCode: string, newUser: { uid: string; email: string | null }) => {
    if (!referralCode) return;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('referralCode', '==', referralCode.toUpperCase()), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.warn('Referral code not found:', referralCode);
        return;
    }

    const referrerDoc = querySnapshot.docs[0];
    const referrerRef = referrerDoc.ref;
    const pointsToAward = 250; // Referral bonus

    const batch = writeBatch(db);

    // Update referrer's points
    const currentPoints = referrerDoc.data().loyaltyPoints || 0;
    batch.update(referrerRef, { loyaltyPoints: currentPoints + pointsToAward });

    // Add loyalty transaction for referrer
    const referrerLoyaltyTxRef = doc(collection(referrerRef, 'loyaltyTransactions'));
    batch.set(referrerLoyaltyTxRef, {
        points: pointsToAward,
        type: 'referral',
        description: `Referral bonus for ${newUser.email}`,
        referredUserId: newUser.uid,
        createdAt: serverTimestamp(),
    });

    // Add referral record
    const referralRecordRef = doc(collection(db, 'referrals'));
    batch.set(referralRecordRef, {
        referrerId: referrerDoc.id,
        referredId: newUser.uid,
        referredEmail: newUser.email,
        rewardPointsGranted: pointsToAward,
        createdAt: serverTimestamp(),
    });
    
    // Mark the new user as referred
    const newUserRef = doc(db, 'users', newUser.uid);
    batch.update(newUserRef, { referredBy: referrerDoc.id });

    await batch.commit();
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
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const displayName = userType === 'agency' ? businessName : name;
      await updateProfile(user, { displayName });

      const newReferralCode = generateReferralCode(6);

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

      await handleReferral(referralCode, user);

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
        <Input id={`${userType}-referral`} placeholder="ABC123" value={referralCode} onChange={e => setReferralCode(e.target.value)} />
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
  const { toast } = useToast();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [activeTab, setActiveTab] = useState<UserType>('client');

  const handleGoogleSignup = async () => {
    setLoadingGoogle(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // For Google Sign-Up, referral handling is more complex
      // as there's no form field. This implementation focuses on email/pass sign up.
      const newReferralCode = generateReferralCode(6);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phone: user.phoneNumber || '',
        role: activeTab.toLowerCase(),
        createdAt: serverTimestamp(),
        loyaltyPoints: 0,
        referralCode: newReferralCode,
      }, { merge: true }); // Use merge to avoid overwriting data if doc exists
      
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
