
"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Loader2, CheckCircle, Star, CalendarIcon } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';


export default function ProfilePage() {
    const { user, userRole, loading, subscription, setUser: setAuthUser } = useAuth();
    const { toast } = useToast();
    
    const [name, setName] = useState('');
    const [phone, setPhone] = useState(''); 
    const [bio, setBio] = useState('');
    const [gender, setGender] = useState('');
    const [birthdate, setBirthdate] = useState<Date | undefined>(undefined);
    
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                        setBirthdate(data.birthdate.toDate());
                    }
                }
            }
        }
        fetchUserData();
    }, [user]);

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

             if (birthdate) {
                updates.birthdate = Timestamp.fromDate(birthdate);
            }

            // Update display name in Firebase Auth if it has changed
            if (user.displayName !== name) {
                await updateProfile(user, { displayName: name });
            }
            
            await updateDoc(userDocRef, updates);

            // Manually update user in auth context to reflect changes immediately
            setAuthUser(prev => prev ? { ...prev, displayName: name } : null);

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
                    
                    // Manually update user in auth context
                    setAuthUser(prev => prev ? { ...prev, photoURL: downloadURL } : null);

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
                        <Skeleton className="h-48 w-full" />
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Profile</h1>
                <p className="text-muted-foreground">
                    View and manage your account details and settings.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1 space-y-8">
                    <Card>
                        <CardHeader className="items-center text-center">
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
                            <CardTitle className="mt-4 flex items-center gap-2">
                                {user.displayName}
                                {isPro && <Badge variant="secondary" className="bg-blue-100 text-blue-800"><CheckCircle className="h-4 w-4 mr-1"/>Verified</Badge>}
                                {isElite && <Badge variant="secondary" className="bg-purple-100 text-purple-800"><Star className="h-4 w-4 mr-1"/>Premium</Badge>}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                               {user.email}
                                <Badge variant="secondary" className="capitalize">{userRole}</Badge>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {imageFile && (
                                <div className="space-y-2 text-center">
                                    <p className="text-sm text-muted-foreground truncate">Selected: {imageFile.name}</p>
                                    {isUploading && uploadProgress !== null ? (
                                        <Progress value={uploadProgress} className="w-full" />
                                    ) : (
                                        <Button onClick={handleUpload} disabled={isUploading} size="sm" className="w-full">
                                            <Upload className="mr-2 h-4 w-4" />
                                            {isUploading ? 'Uploading...' : 'Upload Picture'}
                                        </Button>
                                    )}
                                </div>
                            )}
                             <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea 
                                    id="bio"
                                    placeholder="Tell us a little about yourself or your business..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Manage your password and account security.</CardDescription>
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
                            <Button variant="outline" className="w-full" disabled>Change Password</Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal or business details here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="name">{userRole === 'agency' ? 'Business Name' : 'Full Name'}</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            {userRole === 'agency' && (
                                <div className="space-y-2">
                                    <Label htmlFor="contact-person">Contact Person</Label>
                                    <Input id="contact-person" placeholder="e.g., Juan Dela Cruz"/>
                                </div>
                            )}
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
                                        <SelectTrigger id="gender">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
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
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !birthdate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {birthdate ? format(birthdate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={birthdate}
                                            onSelect={setBirthdate}
                                            captionLayout="dropdown-buttons"
                                            fromYear={1950}
                                            toYear={new Date().getFullYear()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full md:w-auto" onClick={handleSaveChanges} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

    