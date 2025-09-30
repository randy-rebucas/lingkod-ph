
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Bell,
    AtSign,
    MessageSquare,
    Loader2,
    UserPlus,
    Briefcase,
    User,
    Shield,
    Palette,
    Eye,
    EyeOff,
    AlertTriangle
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { getDb  } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
// import { useRouter } from "next/navigation"

type NotificationSettings = {
    bookingUpdates: boolean;
    newMessages: boolean;
    promotionalEmails: boolean;
    agencyInvites: boolean;
    newJobAlerts: boolean;
}

type PrivacySettings = {
    profileVisibility: 'public' | 'private' | 'connections';
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    dataSharing: boolean;
}

type AccountSettings = {
    emailNotifications: boolean;
    smsNotifications: boolean;
    twoFactorAuth: boolean;
}

type UserSettings = {
    notificationSettings: NotificationSettings;
    privacySettings: PrivacySettings;
    accountSettings: AccountSettings;
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'tl';
}

export default function SettingsPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('Settings');
    const { setTheme } = useTheme();

    const [settings, setSettings] = useState<UserSettings>({
        notificationSettings: {
            bookingUpdates: true,
            newMessages: true,
            promotionalEmails: false,
            agencyInvites: true,
            newJobAlerts: true,
        },
        privacySettings: {
            profileVisibility: 'public',
            showOnlineStatus: true,
            allowDirectMessages: true,
            dataSharing: false,
        },
        accountSettings: {
            emailNotifications: true,
            smsNotifications: false,
            twoFactorAuth: false,
        },
        theme: 'system',
        language: 'en',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (user && getDb()) {
                const userDocRef = doc(getDb(), 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setSettings(prev => ({
                        ...prev,
                        notificationSettings: { ...prev.notificationSettings, ...userData.notificationSettings },
                        privacySettings: { ...prev.privacySettings, ...userData.privacySettings },
                        accountSettings: { ...prev.accountSettings, ...userData.accountSettings },
                        theme: userData.theme || 'system',
                        language: userData.language || 'en',
                    }));
                }
            }
            setIsLoading(false);
        };

        fetchSettings();
    }, [user]);

    // Get current language from cookie
    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
        };

        const locale = getCookie('locale') || 'en';
        setSettings(prev => ({ ...prev, language: locale as 'en' | 'tl' }));
    }, []);

    const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
        setSettings(prev => ({
            ...prev,
            notificationSettings: { ...prev.notificationSettings, [key]: value }
        }));
        setHasUnsavedChanges(true);
    };

    const handlePrivacyChange = (key: keyof PrivacySettings, value: string | boolean) => {
        setSettings(prev => ({
            ...prev,
            privacySettings: { ...prev.privacySettings, [key]: value }
        }));
        setHasUnsavedChanges(true);
    };

    const handleAccountChange = (key: keyof AccountSettings, value: boolean) => {
        setSettings(prev => ({
            ...prev,
            accountSettings: { ...prev.accountSettings, [key]: value }
        }));
        setHasUnsavedChanges(true);
    };

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setSettings(prev => ({ ...prev, theme: newTheme }));
        setTheme(newTheme);
        setHasUnsavedChanges(true);
    };

    const handleLanguageChange = async (newLanguage: 'en' | 'tl') => {
        setSettings(prev => ({ ...prev, language: newLanguage }));
        document.cookie = `locale=${newLanguage}; path=/; max-age=31536000`;
        setHasUnsavedChanges(true);
        // Reload page to apply language change
        window.location.reload();
    };

    const handleSaveChanges = async () => {
        if (!user || !getDb()) {
            toast({ variant: "destructive", title: t('error'), description: t('mustBeLoggedIn') });
            return;
        }
        setIsSaving(true);
        try {
            const userDocRef = doc(getDb(), 'users', user.uid);
            await updateDoc(userDocRef, {
                notificationSettings: settings.notificationSettings,
                privacySettings: settings.privacySettings,
                accountSettings: settings.accountSettings,
                theme: settings.theme,
                language: settings.language,
            });
            setHasUnsavedChanges(false);
            toast({ title: t('success'), description: t('preferencesSaved') });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            toast({ variant: "destructive", title: t('saveFailed'), description: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container space-y-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto">

                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                <p className="text-muted-foreground">
                    {t('subtitle')}
                </p>
                {hasUnsavedChanges && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">You have unsaved changes</span>
                    </div>
                )}

            </div>

            <div className="max-w-6xl mx-auto">
                <Tabs defaultValue="account" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-8">
                        <TabsTrigger value="account" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Account
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Privacy
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Appearance
                        </TabsTrigger>
                    </TabsList>

                    {/* Account Settings Tab */}
                    <TabsContent value="account" className="space-y-6">
                        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                                <CardTitle className="font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Account Settings
                                </CardTitle>
                                <CardDescription className="text-base">Manage your account preferences and security settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <AtSign className="h-5 w-5 text-primary" />
                                                <div>
                                                    <Label htmlFor="email-notifications" className="font-semibold text-base">Email Notifications</Label>
                                                    <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="email-notifications"
                                                checked={settings.accountSettings.emailNotifications}
                                                onCheckedChange={(v) => handleAccountChange('emailNotifications', v)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <MessageSquare className="h-5 w-5 text-primary" />
                                                <div>
                                                    <Label htmlFor="sms-notifications" className="font-semibold text-base">SMS Notifications</Label>
                                                    <p className="text-sm text-muted-foreground">Receive urgent updates via SMS</p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="sms-notifications"
                                                checked={settings.accountSettings.smsNotifications}
                                                onCheckedChange={(v) => handleAccountChange('smsNotifications', v)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <Shield className="h-5 w-5 text-primary" />
                                                <div>
                                                    <Label htmlFor="two-factor-auth" className="font-semibold text-base">Two-Factor Authentication</Label>
                                                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="two-factor-auth"
                                                checked={settings.accountSettings.twoFactorAuth}
                                                onCheckedChange={(v) => handleAccountChange('twoFactorAuth', v)}
                                            />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-6">
                        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                                <CardTitle className="font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-primary" />
                                    {t('notifications')}
                                </CardTitle>
                                <CardDescription className="text-base">{t('notificationsDescription')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <Bell className="h-5 w-5 text-primary" />
                                                <div>
                                                    <Label htmlFor="booking-updates" className="font-semibold text-base">{t('bookingUpdates')}</Label>
                                                    <p className="text-sm text-muted-foreground">Get notified about booking changes and updates</p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="booking-updates"
                                                checked={settings.notificationSettings.bookingUpdates}
                                                onCheckedChange={(v) => handleNotificationChange('bookingUpdates', v)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <MessageSquare className="h-5 w-5 text-primary" />
                                                <div>
                                                    <Label htmlFor="new-messages" className="font-semibold text-base">{t('newMessages')}</Label>
                                                    <p className="text-sm text-muted-foreground">Receive notifications for new messages</p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="new-messages"
                                                checked={settings.notificationSettings.newMessages}
                                                onCheckedChange={(v) => handleNotificationChange('newMessages', v)}
                                            />
                                        </div>
                                        {userRole === 'provider' && (
                                            <>
                                                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                                    <div className="flex items-center gap-3">
                                                        <UserPlus className="h-5 w-5 text-primary" />
                                                        <div>
                                                            <Label htmlFor="agency-invites" className="font-semibold text-base">{t('agencyInvites')}</Label>
                                                            <p className="text-sm text-muted-foreground">Get notified when agencies invite you to join</p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        id="agency-invites"
                                                        checked={settings.notificationSettings.agencyInvites}
                                                        onCheckedChange={(v) => handleNotificationChange('agencyInvites', v)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                                    <div className="flex items-center gap-3">
                                                        <Briefcase className="h-5 w-5 text-primary" />
                                                        <div>
                                                            <Label htmlFor="new-job-alerts" className="font-semibold text-base">{t('newJobAlerts')}</Label>
                                                            <p className="text-sm text-muted-foreground">Get notified about new job opportunities</p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        id="new-job-alerts"
                                                        checked={settings.notificationSettings.newJobAlerts}
                                                        onCheckedChange={(v) => handleNotificationChange('newJobAlerts', v)}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <AtSign className="h-5 w-5 text-primary" />
                                                <div>
                                                    <Label htmlFor="promotional-emails" className="font-semibold text-base">{t('promotionalEmails')}</Label>
                                                    <p className="text-sm text-muted-foreground">Receive promotional offers and updates</p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="promotional-emails"
                                                checked={settings.notificationSettings.promotionalEmails}
                                                onCheckedChange={(v) => handleNotificationChange('promotionalEmails', v)}
                                            />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Privacy Tab */}
                    <TabsContent value="privacy" className="space-y-6">
                        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                                <CardTitle className="font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Privacy Settings
                                </CardTitle>
                                <CardDescription className="text-base">Control your privacy and data sharing preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold">Profile Visibility</Label>
                                            <Select
                                                value={settings.privacySettings.profileVisibility}
                                                onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select profile visibility" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="public">
                                                        <div className="flex items-center gap-2">
                                                            <Eye className="h-4 w-4" />
                                                            Public - Everyone can see your profile
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="connections">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4" />
                                                            Connections - Only connected users can see your profile
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="private">
                                                        <div className="flex items-center gap-2">
                                                            <EyeOff className="h-4 w-4" />
                                                            Private - Only you can see your profile
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <Eye className="h-5 w-5 text-primary" />
                                                <div>
                                                    <Label htmlFor="show-online-status" className="font-semibold text-base">Show Online Status</Label>
                                                    <p className="text-sm text-muted-foreground">Let others see when you&apos;re online</p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="show-online-status"
                                                checked={settings.privacySettings.showOnlineStatus}
                                                onCheckedChange={(v) => handlePrivacyChange('showOnlineStatus', v)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <MessageSquare className="h-5 w-5 text-primary" />
                                                <div>
                                                    <Label htmlFor="allow-direct-messages" className="font-semibold text-base">Allow Direct Messages</Label>
                                                    <p className="text-sm text-muted-foreground">Let other users send you direct messages</p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="allow-direct-messages"
                                                checked={settings.privacySettings.allowDirectMessages}
                                                onCheckedChange={(v) => handlePrivacyChange('allowDirectMessages', v)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <Shield className="h-5 w-5 text-primary" />
                                                <div>
                                                    <Label htmlFor="data-sharing" className="font-semibold text-base">Data Sharing</Label>
                                                    <p className="text-sm text-muted-foreground">Allow sharing of anonymized data for platform improvement</p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="data-sharing"
                                                checked={settings.privacySettings.dataSharing}
                                                onCheckedChange={(v) => handlePrivacyChange('dataSharing', v)}
                                            />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Appearance Tab */}
                    <TabsContent value="appearance" className="space-y-6">
                        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                                <CardTitle className="font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-primary" />
                                    Appearance
                                </CardTitle>
                                <CardDescription className="text-base">Customize the look and feel of your experience.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold">Theme</Label>
                                            <Select
                                                value={settings.theme}
                                                onValueChange={(value) => handleThemeChange(value as 'light' | 'dark' | 'system')}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select theme" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="light">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                                                            Light
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="dark">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded-full bg-slate-600"></div>
                                                            Dark
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="system">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-slate-600"></div>
                                                            System
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold">Language</Label>
                                            <Select
                                                value={settings.language}
                                                onValueChange={(value) => handleLanguageChange(value as 'en' | 'tl')}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select language" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">
                                                        <div className="flex items-center gap-2">
                                                            <span>🇺🇸</span>
                                                            English
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="tl">
                                                        <div className="flex items-center gap-2">
                                                            <span>🇵🇭</span>
                                                            Filipino
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Save Button */}
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm mt-8">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-semibold">Save Changes</p>
                                <p className="text-sm text-muted-foreground">
                                    {hasUnsavedChanges ? "You have unsaved changes" : "All changes have been saved"}
                                </p>
                            </div>
                            <Button
                                onClick={handleSaveChanges}
                                disabled={isSaving || isLoading || !hasUnsavedChanges}
                                className="shadow-glow hover:shadow-glow/50 transition-all duration-300"
                            >
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? t('saving') : t('savePreferences')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
