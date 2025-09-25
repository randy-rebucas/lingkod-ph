
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { handleUpdatePlatformSettings, type PlatformSettings } from "./actions";
import Image from "next/image";

export default function AdminSettingsPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userRole !== 'admin' || !db) {
            setLoading(false);
            return;
        }

        const fetchSettings = async () => {
            const settingsRef = doc(db, 'platform', 'settings');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as PlatformSettings;
                setSettings(data);
                if (data.logoUrl) {
                    setLogoPreview(data.logoUrl);
                }
            } else {
                setSettings({
                    appName: 'Lingkod PH',
                    supportEmail: 'support@lingkod.ph',
                    logoUrl: '',
                    commissionRates: { low: 10, mid: 12, high: 15 },
                    referralBonus: 250,
                    welcomeBonus: 100,
                });
            }
            setLoading(false);
        };
        
        fetchSettings();

    }, [userRole]);
    
     const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Invalid File Type', 
                    description: 'Please select an image file (PNG, JPG, GIF, etc.)' 
                });
                return;
            }
            
            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                toast({ 
                    variant: 'destructive', 
                    title: 'File Too Large', 
                    description: 'Please select an image smaller than 5MB' 
                });
                return;
            }
            
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!settings || !user) return;
        setIsSaving(true);
        
        let finalSettings = { ...settings };
        
        if (logoFile) {
            setIsUploadingLogo(true);
            try {
                const storagePath = `platform/logo/${Date.now()}_${logoFile.name}`;
                const storageRef = ref(storage, storagePath);
                
                console.log('Uploading logo to:', storagePath);
                const uploadResult = await uploadBytes(storageRef, logoFile);
                console.log('Upload successful:', uploadResult);
                
                const newLogoUrl = await getDownloadURL(uploadResult.ref);
                console.log('Download URL:', newLogoUrl);
                
                finalSettings.logoUrl = newLogoUrl;
                toast({ title: 'Logo Uploaded', description: 'New logo has been uploaded successfully.' });
            } catch (error: any) {
                console.error('Logo upload error:', error);
                
                let errorMessage = 'Failed to upload new logo.';
                if (error.code) {
                    switch (error.code) {
                        case 'storage/unauthorized':
                            errorMessage = 'You do not have permission to upload files.';
                            break;
                        case 'storage/canceled':
                            errorMessage = 'Upload was canceled.';
                            break;
                        case 'storage/unknown':
                            errorMessage = 'An unknown error occurred during upload.';
                            break;
                        case 'storage/invalid-format':
                            errorMessage = 'Invalid file format.';
                            break;
                        case 'storage/invalid-checksum':
                            errorMessage = 'File corruption detected.';
                            break;
                        default:
                            errorMessage = `Upload failed: ${error.message}`;
                    }
                }
                
                toast({ 
                    variant: 'destructive', 
                    title: 'Upload Error', 
                    description: errorMessage 
                });
                setIsSaving(false);
                setIsUploadingLogo(false);
                return;
            }
            setIsUploadingLogo(false);
        }
        
        try {
            const result = await handleUpdatePlatformSettings(finalSettings, { id: user.uid, name: user.displayName });

            if (result.error) {
                toast({
                    title: 'Error',
                    description: result.message,
                    variant: 'destructive',
                });
            } else {
                setSettings(finalSettings);
                toast({
                    title: 'Success',
                    description: result.message,
                    variant: 'default',
                });
            }
        } catch (error: any) {
            console.error('Settings update error:', error);
            toast({
                title: 'Error',
                description: 'Failed to save settings. Please try again.',
                variant: 'destructive',
            });
        }
        
        setIsSaving(false);
    };

    if (userRole !== 'admin') {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Access Denied</CardTitle>
                        <CardDescription>This page is for administrators only.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Platform Settings</h1>
                    <p className="text-muted-foreground">Manage global settings for the application.</p>
                </div>
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
                 <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Platform Settings</h1>
                <p className="text-muted-foreground">Manage global settings for the application.</p>
            </div>
            
            <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                    <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Branding</CardTitle>
                    <CardDescription>Customize the look and feel of your application.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="appName">App Name</Label>
                            <Input 
                                id="appName"
                                value={settings?.appName || ''}
                                onChange={(e) => setSettings(s => s ? { ...s, appName: e.target.value } : null)}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="supportEmail">Support Email</Label>
                            <Input 
                                id="supportEmail"
                                type="email"
                                value={settings?.supportEmail || ''}
                                onChange={(e) => setSettings(s => s ? { ...s, supportEmail: e.target.value } : null)}
                            />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label>Logo</Label>
                        <div className="flex items-center gap-4">
                           {logoPreview ? (
                                <Image src={logoPreview} alt="Current logo" width={64} height={64} className="rounded-md bg-muted p-1" />
                            ) : (
                                <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                    <span>No Logo</span>
                                </div>
                            )}
                            <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo}>
                                <Upload className="mr-2 h-4 w-4" />
                                {isUploadingLogo ? 'Uploading...' : 'Upload New Logo'}
                            </Button>
                            <Input type="file" className="hidden" ref={logoInputRef} onChange={handleLogoFileChange} accept="image/*" />
                        </div>
                     </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Commission Rates</CardTitle>
                    <CardDescription>Set the percentage commission taken for different job value tiers.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="low-ticket">Low-Ticket Rate (%)</Label>
                        <Input 
                            id="low-ticket" 
                            type="number" 
                            value={settings?.commissionRates.low || ''}
                            onChange={(e) => setSettings(s => s ? ({ ...s, commissionRates: { ...s.commissionRates, low: Number(e.target.value) } }) : null)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="mid-ticket">Mid-Ticket Rate (%)</Label>
                        <Input 
                            id="mid-ticket" 
                            type="number"
                             value={settings?.commissionRates.mid || ''}
                            onChange={(e) => setSettings(s => s ? ({ ...s, commissionRates: { ...s.commissionRates, mid: Number(e.target.value) } }) : null)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="high-ticket">High-Ticket Rate (%)</Label>
                        <Input 
                            id="high-ticket" 
                            type="number"
                            value={settings?.commissionRates.high || ''}
                            onChange={(e) => setSettings(s => s ? ({ ...s, commissionRates: { ...s.commissionRates, high: Number(e.target.value) } }) : null)}
                        />
                    </div>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle>Platform Rules</CardTitle>
                    <CardDescription>Configure rewards and incentives for users.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="referral-bonus">Referral Bonus (Points)</Label>
                        <Input 
                            id="referral-bonus" 
                            type="number" 
                            value={settings?.referralBonus || ''}
                            onChange={(e) => setSettings(s => s ? { ...s, referralBonus: Number(e.target.value) } : null)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="welcome-bonus">New User Welcome Bonus (Points)</Label>
                        <Input 
                            id="welcome-bonus" 
                            type="number" 
                            value={settings?.welcomeBonus || ''}
                            onChange={(e) => setSettings(s => s ? { ...s, welcomeBonus: Number(e.target.value) } : null)}
                        />
                    </div>
                </CardContent>
            </Card>

             <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save All Settings
                </Button>
            </div>
        </div>
    )
}
