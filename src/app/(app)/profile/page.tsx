
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
import { Camera, Upload } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";


export default function ProfilePage() {
    const { user, userRole, loading } = useAuth();
    const { toast } = useToast();
    
    const [name, setName] = useState('');
    const [phone, setPhone] = useState(''); 
    const [bio, setBio] = useState('');
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setName(user.displayName || '');
            // Here you would typically fetch and set other user data like phone and bio from Firestore
        }
    }, [user]);

    const getAvatarFallback = (name: string | null | undefined) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
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
                    
                    // Update Firebase Auth profile
                    await updateProfile(user, { photoURL: downloadURL });

                    // Update Firestore document
                    const userDocRef = doc(db, "users", user.uid);
                    await updateDoc(userDocRef, { photoURL: downloadURL });

                    toast({ title: "Success", description: "Profile picture updated!" });
                } catch (error: any) {
                    toast({ variant: "destructive", title: "Update Failed", description: "Failed to update profile picture URL." });
                } finally {
                    setIsUploading(false);
                    setUploadProgress(null);
                    setImageFile(null);
                    // The auth state listener in AuthProvider should automatically pick up the change.
                    // You might need a manual refresh of the user object in context if it doesn't.
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
                            <CardTitle className="mt-4">{user.displayName}</CardTitle>
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
                            <Textarea 
                                placeholder="Tell us a little about yourself or your business..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />
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
                            <Button variant="outline" className="w-full">Change Password</Button>
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
                            <div className="space-y-2">
                                <Label htmlFor="phone">Mobile Number</Label>
                                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 09123456789" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full md:w-auto">Save Changes</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

    