
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
import { Camera, Upload, Loader2, CheckCircle, Star, User, Settings, Briefcase, Award, Users, ShieldCheck, Lock } from "lucide-react";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { user, userRole, loading, subscription, setUser } = useAuth();
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
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        const fetchUserData = async () => {
            if (user) {
                setName(user.displayName || '');
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setPhone(data.phone || '');
                    setBio(data.bio || '');
                    setGender(data.gender || '');
                    if (data.birthdate && data.birthdate.toDate) {
                        const date = data.birthdate.toDate();
                        setBirthDay(String(date.getDate()));
                        setBirthMonth(String(date.getMonth()));
                        setBirthYear(String(date.getFullYear()));
                    }
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
            }
        }
        fetchUserData();
    }, [user, userRole]);

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
    
    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const userDocRef = doc(db, "users", user.uid);
            const updates: { [key: string]: any } = {
                displayName: name,
                phone: phone,
                bio: bio,
                gender: gender,
            };

            if (birthDay && birthMonth && birthYear) {
                const day = parseInt(birthDay, 10);
                const month = parseInt(birthMonth, 10);
                const year = parseInt(birthYear, 10);
                updates.birthdate = Timestamp.fromDate(new Date(year, month, day));
            }

            if(userRole === 'provider' || userRole === 'agency') {
                updates.availabilityStatus = availabilityStatus;
                updates.yearsOfExperience = Number(yearsOfExperience);
                updates.ownsToolsSupplies = ownsToolsSupplies;
                updates.isLicensed = isLicensed;
                updates.licenseNumber = licenseNumber;
                updates.licenseType = licenseType;
                updates.licenseExpirationDate = licenseExpirationDate;
                updates.licenseIssuingState = licenseIssuingState;
                updates.licenseIssuingCountry = licenseIssuingCountry;
            }

            if (user.displayName !== name) {
                await updateProfile(user, { displayName: name });
            }
            
            await updateDoc(userDocRef, updates);

            toast({ title: "Success", description: "Profile updated successfully!" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

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
    
    const isPro = subscription?.planId === 'pro';
    const isElite = subscription?.planId === 'elite';
    
    const TABS = ['public-profile', 'account-settings'];
    if (userRole === 'provider' || userRole === 'agency') {
        TABS.push('provider-settings');
    }
    TABS.push('loyalty', 'referrals');

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
                            {isPro && <Badge variant="secondary" className="bg-blue-100 text-blue-800"><CheckCircle className="h-4 w-4 mr-1"/>Verified</Badge>}
                            {isElite && <Badge variant="secondary" className="bg-purple-100 text-purple-800"><Star className="h-4 w-4 mr-1"/>Premium</Badge>}
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
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Identity Verification</CardTitle>
                            <CardDescription>Verify your identity to build trust on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground p-12">
                            <ShieldCheck className="h-12 w-12 mx-auto mb-4"/>
                            <p>The identity verification feature is coming soon to enhance security.</p>
                        </CardContent>
                    </Card>
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
                            </Card>
                        </div>
                    </TabsContent>
                )}
                
                 <TabsContent value="loyalty" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Loyalty Program</CardTitle>
                            <CardDescription>View your points and rewards.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground p-12">
                            <Award className="h-12 w-12 mx-auto mb-4"/>
                            <p>Our loyalty program is coming soon! Stay tuned for exciting rewards.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="referrals" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Referral Program</CardTitle>
                            <CardDescription>Invite friends and earn rewards.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground p-12">
                            <Users className="h-12 w-12 mx-auto mb-4"/>
                            <p>Our referral program is under construction. Get ready to share and earn!</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
             <div className="flex justify-end mt-6">
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? "Saving..." : "Save All Changes"}
                </Button>
            </div>
        </div>
    );
}

    