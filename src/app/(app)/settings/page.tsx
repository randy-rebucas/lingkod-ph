
"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun, Bell, AtSign, MessageSquare, Loader2, UserPlus } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

type NotificationSettings = {
    bookingUpdates: boolean;
    newMessages: boolean;
    promotionalEmails: boolean;
    agencyInvites: boolean;
}

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const { user } = useAuth();
    const { toast } = useToast();

    const [settings, setSettings] = useState<NotificationSettings>({
        bookingUpdates: true,
        newMessages: true,
        promotionalEmails: false,
        agencyInvites: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().notificationSettings) {
                    setSettings(userDoc.data().notificationSettings);
                }
            }
            setIsLoading(false);
        };

        fetchSettings();
    }, [user]);

    const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveChanges = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in to save settings." });
            return;
        }
        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { notificationSettings: settings });
            toast({ title: "Success", description: "Your preferences have been saved." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Save Failed", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize the look and feel of the app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
                                <span>Theme</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Select your preferred theme.
                                </span>
                            </Label>
                             <div className="flex items-center gap-2">
                                <Sun className={`h-6 w-6 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <Switch 
                                    id="theme-mode"
                                    checked={theme === 'dark'}
                                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                />
                                <Moon className={`h-6 w-6 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Choose how you want to be notified.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? (
                            <div className="space-y-6">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="booking-updates" className="flex items-center gap-3">
                                        <Bell className="h-5 w-5 text-accent" />
                                        <span className="font-semibold">Booking Updates</span>
                                    </Label>
                                    <Switch id="booking-updates" checked={settings.bookingUpdates} onCheckedChange={(v) => handleNotificationChange('bookingUpdates', v)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="new-messages" className="flex items-center gap-3">
                                        <MessageSquare className="h-5 w-5 text-accent" />
                                        <span className="font-semibold">New Messages</span>
                                    </Label>
                                    <Switch id="new-messages" checked={settings.newMessages} onCheckedChange={(v) => handleNotificationChange('newMessages', v)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="agency-invites" className="flex items-center gap-3">
                                        <UserPlus className="h-5 w-5 text-accent" />
                                        <span className="font-semibold">Agency Invites</span>
                                    </Label>
                                    <Switch id="agency-invites" checked={settings.agencyInvites} onCheckedChange={(v) => handleNotificationChange('agencyInvites', v)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="promotional-emails" className="flex items-center gap-3">
                                        <AtSign className="h-5 w-5 text-accent" />
                                        <span className="font-semibold">Promotional Emails</span>
                                    </Label>
                                    <Switch id="promotional-emails" checked={settings.promotionalEmails} onCheckedChange={(v) => handleNotificationChange('promotionalEmails', v)} />
                                </div>
                            </>
                        )}
                    </CardContent>
                     <CardFooter className="justify-end">
                         <Button onClick={handleSaveChanges} disabled={isSaving || isLoading}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSaving ? "Saving..." : "Save Preferences"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
