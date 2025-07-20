
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Loader2, CheckCircle, Star, User, Settings, Briefcase, Award, Users, Database, Copy } from "lucide-react";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc, Timestamp, collection, onSnapshot, query, orderBy, runTransaction, serverTimestamp, where, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import IdentityVerification from "@/components/identity-verification";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

type Reward = {
    id: string;
    title: string;
    description: string;
    pointsRequired: number;
    isActive: boolean;
};

type LoyaltyTransaction = {
    id: string;
    points: number;
    type: 'earn' | 'redeem' | 'referral';
    description: string;
    createdAt: Timestamp;
};

type Referral = {
    id: string;
    referredEmail: string;
    rewardPointsGranted: number;
    createdAt: Timestamp;
};

export default function ProfilePage() {
    const { user, userRole, loading, subscription } = useAuth();
    const { toast } = useToast();
    
    // States for form fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState(''); 
    const [bio, setBio] = useState('');
    const [gender, setGender] = useState('');
    const [birthDay, setBirthDay] = useState<string | undefined>();
    const [birthMonth, setBirthMonth] = useState<string | undefined>();
    const [birthYear, setBirthYear] = useState<string | undefined>();
    const [availabilityStatus, setAvailabilityStatus] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState<number | string>('');
    const [ownsToolsSupplies, setOwnsToolsSupplies] = useState(false);
    const [isLicensed, setIsLicensed] = useState(false);
    const [licenseNumber, setLicenseNumber] = useState('');
    const [licenseType, setLicenseType] = useState('');
    const [licenseExpirationDate, setLicenseExpirationDate] = useState('');
    const [licenseIssuingState, setLicenseIssuingState] = useState('');
    const [licenseIssuingCountry, setLicenseIssuingCountry] = useState('');
    
    // States for UI logic
    const [isSavingPublic, setIsSavingPublic] = useState(false);
    const [isSavingPersonal, setIsSavingPersonal] = useState(false);
    const [isSavingProvider, setIsSavingProvider] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States for Loyalty Program
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
    const [isRedeeming, setIsRedeeming] = useState<string | null>(null);

    // States for Referral Program
    const [referralCode, setReferralCode] = useState('');
    const [referrals, setReferrals] = useState<Referral[]>([]);

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 100 }, (_, i) => String(currentYear - i));
    }, []);

    const months = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            value: String(i),
            label: new Date(0, i).toLocaleString('default', { month: 'long' })
        }));
    }, []);

    const daysInMonth = useMemo(() => {
        if (!birthMonth || !birthYear) return 31;
        const monthIndex = parseInt(birthMonth, 10);
        const year = parseInt(birthYear, 10);
        return new Date(year, monthIndex + 1, 0).getDate();
    }, [birthMonth, birthYear]);

    useEffect(() => {
        if (!user) return;
        
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setName(data.displayName || user.displayName || '');
                setPhone(data.phone || '');
                setBio(data.bio || '');
                setGender(data.gender || '');
                setReferralCode(data.referralCode || '');
                if (data.birthdate && data.birthdate.toDate) {
                    const date = data.birthdate.toDate();
                    setBirthDay(String(date.getDate()));
                    setBirthMonth(String(date.getMonth()));
                    setBirthYear(String(date.getFullYear()));
                }
                setLoyaltyPoints(data.loyaltyPoints || 0);

                if (userRole === 'provider' || userRole === 'agency') {
                    setAvailabilityStatus(data.availabilityStatus || '');
                    setYearsOfExperience(data.yearsOfExperience || '');
                    setOwnsToolsSupplies(data.ownsToolsSupplies || false);
                    setIsLicensed(data.isLicensed || false);
                    setLicenseNumber(data.licenseNumber || '');
                    setLicenseType(data.licenseType || '');
                    setLicenseExpirationDate(data.licenseExpirationDate || '');
                    setLicenseIssuingState(data.licenseIssuingState || '');
                    setLicenseIssuingCountry(data.licenseIssuingCountry || '');
                }
            }
        });

        // Fetch loyalty rewards
        const rewardsRef = collection(db, "loyaltyRewards");
        const qRewards = query(rewardsRef, where("isActive", "==", true));
        const unsubscribeRewards = onSnapshot(qRewards, (snapshot) => {
            const rewardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
            setRewards(rewardsData);
        });

        // Fetch loyalty transactions
        const transactionsRef = collection(db, `users/${user.uid}/loyaltyTransactions`);
        const qTransactions = query(transactionsRef, orderBy("createdAt", "desc"));
        const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
            const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoyaltyTransaction));
            setTransactions(transData);
        });

        // Fetch referrals
        const referralsRef = collection(db, 'referrals');
        const qReferrals = query(referralsRef, where("referrerId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubscribeReferrals = onSnapshot(qReferrals, (snapshot) => {
            const referralsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()} as Referral));
            setReferrals(referralsData);
        });


        return () => {
            unsubscribeUser();
            unsubscribeRewards();
            unsubscribeTransactions();
            unsubscribeReferrals();
        };
    }, [user, userRole]);

    const handleCopyReferralCode = () => {
        navigator.clipboard.writeText(referralCode);
        toast({ title: 'Copied!', description: 'Your referral code has been copied to the clipboard.' });
    };

    const handleRedeemReward = async (reward: Reward) => {
        if (!user || loyaltyPoints < reward.pointsRequired) {
            toast({ variant: "destructive", title: "Error", description: "Not enough points to redeem this reward." });
            return;
        }

        setIsRedeeming(reward.id);
        const userRef = doc(db, "users", user.uid);

        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw "User document does not exist!";
                }

                const currentPoints = userDoc.data().loyaltyPoints || 0;
                if (currentPoints < reward.pointsRequired) {
                    throw "Not enough points.";
                }

                const newTotalPoints = currentPoints - reward.pointsRequired;
                transaction.update(userRef, { loyaltyPoints: newTotalPoints });

                const loyaltyTxRef = doc(collection(db, `users/${user.uid}/loyaltyTransactions`));
                transaction.set(loyaltyTxRef, {
                    points: reward.pointsRequired,
                    type: 'redeem',
                    description: `Redeemed: ${reward.title}`,
                    rewardId: reward.id,
                    createdAt: serverTimestamp()
                });
            });

            toast({
                title: "Reward Redeemed!",
                description: `You have successfully redeemed "${reward.title}".`,
            });

        } catch (error) {
            console.error("Error redeeming reward:", error);
            const errorMessage = error instanceof Error ? error.message : "Could not redeem the reward.";
            toast({ variant: "destructive", title: "Redemption Failed", description: errorMessage });
        } finally {
            setIsRedeeming(null);
        }
    };


    const getAvatarFallback = (name: string | null | undefined) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1 && parts[0] && parts[1]) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handlePublicProfileUpdate = async () => {
        if (!user) return;
        setIsSavingPublic(true);
        try {
            const userDocRef = doc(db, "users", user.uid);
            const updates: { [key: string]: any } = {
                displayName: name,
                bio: bio,
            };

            if (user.displayName !== name) {
                await updateProfile(user, { displayName: name });
            }
            
            await updateDoc(userDocRef, updates);
            toast({ title: "Success", description: "Public profile updated successfully!" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        } finally {
            setIsSavingPublic(false);
        }
    }

    const handlePersonalDetailsUpdate = async () => {
        if (!user) return;
        setIsSavingPersonal(true);
        try {
            const userDocRef = doc(db, "users", user.uid);
            const updates: { [key: string]: any } = {
                phone: phone,
                gender: gender,
            };

            if (birthDay && birthMonth && birthYear) {
                const day = parseInt(birthDay, 10);
                const month = parseInt(birthMonth, 10);
                const year = parseInt(birthYear, 10);
                updates.birthdate = Timestamp.fromDate(new Date(year, month, day));
            }

            await updateDoc(userDocRef, updates);
            toast({ title: "Success", description: "Personal details updated successfully!" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        } finally {
            setIsSavingPersonal(false);
        }
    }

    const handleProviderDetailsUpdate = async () => {
        if (!user) return;
        setIsSavingProvider(true);
         try {
            const userDocRef = doc(db, "users", user.uid);
            const updates: { [key: string]: any } = {
                availabilityStatus: availabilityStatus,
                yearsOfExperience: Number(yearsOfExperience),
                ownsToolsSupplies: ownsToolsSupplies,
                isLicensed: isLicensed,
                licenseNumber: licenseNumber,
                licenseType: licenseType,
                licenseExpirationDate: licenseExpirationDate,
                licenseIssuingState: licenseIssuingState,
                licenseIssuingCountry: licenseIssuingCountry,
            };
            
            await updateDoc(userDocRef, updates);
            toast({ title: "Success", description: "Provider details updated successfully!" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        } finally {
            setIsSavingProvider(false);
        }
    }
    
    const handleUpload = async () => {
        if (!imageFile || !user) return;

        setIsUploading(true);
        setUploadProgress(0);

        const storageRef = ref(storage, `profile-pictures/${user.uid}/${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload failed", error);
                toast({ variant: "destructive", title: "Upload Failed", description: error.message });
                setIsUploading(false);
                setUploadProgress(null);
                setImageFile(null);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    await updateProfile(user, { photoURL: downloadURL });
                    const userDocRef = doc(db, "users", user.uid);
                    await updateDoc(userDocRef, { photoURL: downloadURL });
                    toast({ title: "Success", description: "Profile picture updated!" });
                } catch (error: any) {
                     toast({ variant: "destructive", title: "Update Failed", description: "Failed to update profile picture URL." });
                } finally {
                    setIsUploading(false);
                    setUploadProgress(null);
                    setImageFile(null);
                }
            }
        );
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-1 space-y-6">
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="md:col-span-2">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!user) {
        return <p>Please log in to view your profile.</p>;
    }
    
    const TABS = ['public-profile', 'account-settings', 'loyalty', 'referrals'];
    if (userRole === 'provider' || userRole === 'agency') {
        TABS.splice(2, 0, 'provider-settings');
    }

    const totalReferralPoints = referrals.reduce((sum, ref) => sum + ref.rewardPointsGranted, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Profile</h1>
                <p className="text-muted-foreground">
                    View and manage your account details and settings.
                </p>
            </div>

            <Card>
                <CardHeader className="flex-row items-center gap-4 space-y-0">
                    <div className="relative">
                        <Avatar className="h-24 w-24 border-2 border-primary">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                            <AvatarFallback className="text-3xl">{getAvatarFallback(user.displayName)}</AvatarFallback>
                        </Avatar>
                        <Button size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8" onClick={() => fileInputRef.current?.click()}>
                            <Camera className="h-4 w-4"/>
                            <span className="sr-only">Change Photo</span>
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {user.displayName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                           {user.email}
                            <Badge variant="secondary" className="capitalize">{userRole}</Badge>
                        </CardDescription>
                         {imageFile && (
                            <div className="mt-2 space-y-2 text-left">
                                <p className="text-sm text-muted-foreground truncate">Selected: {imageFile.name}</p>
                                {isUploading && uploadProgress !== null ? (
                                    <Progress value={uploadProgress} className="w-full" />
                                ) : (
                                    <Button onClick={handleUpload} disabled={isUploading} size="sm">
                                        <Upload className="mr-2 h-4 w-4" />
                                        {isUploading ? 'Uploading...' : 'Upload Picture'}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="public-profile">
                <TabsList className={cn("grid w-full", `grid-cols-${TABS.length}`)}>
                    <TabsTrigger value="public-profile"><User className="mr-2"/> Public Profile</TabsTrigger>
                    <TabsTrigger value="account-settings"><Settings className="mr-2"/> Account</TabsTrigger>
                    {(userRole === 'provider' || userRole === 'agency') && (
                        <TabsTrigger value="provider-settings"><Briefcase className="mr-2"/> Provider</TabsTrigger>
                    )}
                    <TabsTrigger value="loyalty"><Award className="mr-2"/> Loyalty</TabsTrigger>
                    <TabsTrigger value="referrals"><Users className="mr-2"/> Referrals</TabsTrigger>
                </TabsList>

                <TabsContent value="public-profile" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Public Profile Information</CardTitle>
                            <CardDescription>This information will be displayed on your public profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{userRole === 'agency' ? 'Business Name' : 'Full Name'}</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio / About</Label>
                                <Textarea 
                                    id="bio"
                                    placeholder="Tell us a little about yourself or your business..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={5}
                                />
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button onClick={handlePublicProfileUpdate} disabled={isSavingPublic}>
                                {isSavingPublic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSavingPublic ? 'Saving...' : 'Update Profile'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                
                <TabsContent value="account-settings" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Details</CardTitle>
                            <CardDescription>This information is private and will not be shown on your profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={user.email || ''} disabled />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Mobile Number</Label>
                                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 09123456789" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={gender} onValueChange={setGender}>
                                        <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Birthdate</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Select value={birthMonth} onValueChange={setBirthMonth}>
                                        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={birthDay} onValueChange={setBirthDay}>
                                        <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                                                <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={birthYear} onValueChange={setBirthYear}>
                                        <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                        <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button onClick={handlePersonalDetailsUpdate} disabled={isSavingPersonal}>
                                {isSavingPersonal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSavingPersonal ? 'Saving...' : 'Update Details'}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Password & Security</CardTitle>
                            <CardDescription>Manage your password and account security settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full sm:w-auto" disabled>Change Password</Button>
                        </CardFooter>
                    </Card>
                    
                    <IdentityVerification />
                </TabsContent>

                <TabsContent value="loyalty" className="mt-6 space-y-6">
                    <div>
                         <h2 className="text-2xl font-bold">Loyalty Program</h2>
                         <p className="text-muted-foreground">Earn points for completed bookings and redeem them for exclusive rewards.</p>
                    </div>

                    <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
                        <CardHeader>
                            <CardTitle>Your Loyalty Points</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-5xl font-bold">{loyaltyPoints.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                             <CardHeader>
                                <CardTitle>Available Rewards</CardTitle>
                                <CardDescription>Use your points to claim these rewards.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {rewards.length > 0 ? rewards.map(reward => (
                                     <div key={reward.id} className="p-4 border rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{reward.title}</p>
                                            <p className="text-sm text-muted-foreground">{reward.description}</p>
                                            <p className="text-sm font-bold text-primary">{reward.pointsRequired.toLocaleString()} points</p>
                                        </div>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="secondary"
                                                    disabled={isRedeeming === reward.id || loyaltyPoints < reward.pointsRequired}
                                                >
                                                    {isRedeeming === reward.id ? <Loader2 className="animate-spin" /> : 'Redeem'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to redeem "{reward.title}" for {reward.pointsRequired.toLocaleString()} points? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRedeemReward(reward)}>Confirm</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )) : <p className="text-muted-foreground text-center">No rewards available at the moment.</p>}
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Points History</CardTitle>
                                <CardDescription>Your recent point transactions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Points</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.length > 0 ? transactions.slice(0, 5).map(tx => (
                                             <TableRow key={tx.id}>
                                                <TableCell className="text-xs text-muted-foreground">{tx.createdAt ? format(tx.createdAt.toDate(), 'MMM d, yyyy') : ''}</TableCell>
                                                <TableCell>{tx.description}</TableCell>
                                                <TableCell className={cn("text-right font-medium", tx.type === 'earn' || tx.type === 'referral' ? 'text-green-600' : 'text-destructive')}>
                                                    {tx.type === 'earn' || tx.type === 'referral' ? '+' : '-'}{tx.points.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No transactions yet.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="referrals" className="mt-6 space-y-6">
                     <div>
                         <h2 className="text-2xl font-bold">Referral Program</h2>
                         <p className="text-muted-foreground">Invite friends to LingkodPH and earn 250 points for each successful referral!</p>
                    </div>
                     <Card>
                        <CardHeader>
                            <CardTitle>Your Unique Referral Code</CardTitle>
                            <CardDescription>Share this code with your friends. When they sign up, you both get rewarded.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex w-full max-w-sm items-center space-x-2 p-4 border-2 border-dashed rounded-lg bg-secondary">
                                <p className="text-2xl font-mono font-bold text-primary flex-1">{referralCode}</p>
                                <Button size="icon" variant="ghost" onClick={handleCopyReferralCode}>
                                    <Copy className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Referral Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-3 rounded-md bg-secondary">
                                    <p className="font-medium">Friends Joined</p>
                                    <p className="text-2xl font-bold">{referrals.length}</p>
                                </div>
                                 <div className="flex justify-between items-center p-3 rounded-md bg-secondary">
                                    <p className="font-medium">Total Points Earned</p>
                                    <p className="text-2xl font-bold text-green-600">+{totalReferralPoints.toLocaleString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Referral History</CardTitle>
                                <CardDescription>Users who joined using your code.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date Joined</TableHead>
                                            <TableHead>Referred User</TableHead>
                                            <TableHead className="text-right">Reward</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {referrals.length > 0 ? referrals.slice(0, 5).map(ref => (
                                             <TableRow key={ref.id}>
                                                <TableCell className="text-xs text-muted-foreground">{ref.createdAt ? format(ref.createdAt.toDate(), 'MMM d, yyyy') : ''}</TableCell>
                                                <TableCell>{ref.referredEmail}</TableCell>
                                                <TableCell className="text-right font-medium text-green-600">
                                                   +{ref.rewardPointsGranted} pts
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No referrals yet.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {(userRole === 'provider' || userRole === 'agency') && (
                     <TabsContent value="provider-settings" className="mt-6">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Professional Details</CardTitle>
                                    <CardDescription>Your professional experience and qualifications.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                                            <Input id="yearsOfExperience" type="number" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="e.g., 5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="availabilityStatus">Availability Status</Label>
                                            <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                                                <SelectTrigger id="availabilityStatus"><SelectValue placeholder="Select status" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="available">Available for Bookings</SelectItem>
                                                    <SelectItem value="limited">Limited Availability</SelectItem>
                                                    <SelectItem value="unavailable">Not Available</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch id="ownsToolsSupplies" checked={ownsToolsSupplies} onCheckedChange={setOwnsToolsSupplies} />
                                        <Label htmlFor="ownsToolsSupplies">I own my own tools and supplies</Label>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleProviderDetailsUpdate} disabled={isSavingProvider}>
                                        {isSavingProvider && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isSavingProvider ? 'Saving...' : 'Update Professional Details'}
                                    </Button>
                                </CardFooter>
                            </Card>

                             <Card>
                                <CardHeader>
                                    <CardTitle>Licensing & Credentials</CardTitle>
                                    <CardDescription>Add any relevant licenses or certifications.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="isLicensed" checked={isLicensed} onCheckedChange={setIsLicensed}/>
                                        <Label htmlFor="isLicensed">I have a professional license or certification</Label>
                                    </div>
                                    {isLicensed && (
                                        <div className="space-y-4 pt-4 border-t">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                 <div className="space-y-2">
                                                    <Label htmlFor="licenseType">License/Certification Type</Label>
                                                    <Input id="licenseType" value={licenseType} onChange={e => setLicenseType(e.target.value)} placeholder="e.g., TESDA NC II" />
                                                </div>
                                                 <div className="space-y-2">
                                                    <Label htmlFor="licenseNumber">License Number</Label>
                                                    <Input id="licenseNumber" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
                                                </div>
                                            </div>
                                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                 <div className="space-y-2">
                                                    <Label htmlFor="licenseExpirationDate">Expiration Date</Label>
                                                    <Input id="licenseExpirationDate" type="date" value={licenseExpirationDate} onChange={e => setLicenseExpirationDate(e.target.value)} />
                                                </div>
                                                 <div className="space-y-2">
                                                    <Label htmlFor="licenseIssuingState">Issuing State/Region</Label>
                                                    <Input id="licenseIssuingState" value={licenseIssuingState} onChange={e => setLicenseIssuingState(e.target.value)} placeholder="e.g., NCR" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="licenseIssuingCountry">Issuing Country</Label>
                                                    <Input id="licenseIssuingCountry" value={licenseIssuingCountry} onChange={e => setLicenseIssuingCountry(e.target.value)} placeholder="e.g., Philippines" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                 <CardFooter>
                                    <Button onClick={handleProviderDetailsUpdate} disabled={isSavingProvider}>
                                        {isSavingProvider && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isSavingProvider ? 'Saving...' : 'Update Credentials'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </TabsContent>
                )}
                
            </Tabs>
        </div>
    );
}
