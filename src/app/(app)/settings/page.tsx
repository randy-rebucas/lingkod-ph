
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, AtSign, MessageSquare, Loader2, UserPlus, Briefcase } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"
import { PageLayout } from "@/components/app/page-layout"
import { StandardCard } from "@/components/app/standard-card"
import { LoadingState } from "@/components/app/loading-state"
import { designTokens } from "@/lib/design-tokens"

type NotificationSettings = {
    bookingUpdates: boolean;
    newMessages: boolean;
    promotionalEmails: boolean;
    agencyInvites: boolean;
    newJobAlerts: boolean;
}

export default function SettingsPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('Settings');

    const [settings, setSettings] = useState<NotificationSettings>({
        bookingUpdates: true,
        newMessages: true,
        promotionalEmails: false,
        agencyInvites: true,
        newJobAlerts: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().notificationSettings) {
                    setSettings(prev => ({ ...prev, ...userDoc.data().notificationSettings}));
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
            toast({ variant: "destructive", title: t('error'), description: t('mustBeLoggedIn') });
            return;
        }
        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { notificationSettings: settings });
            toast({ title: "Success", description: t('preferencesSaved') });
        } catch (error: any) {
            toast({ variant: "destructive", title: t('saveFailed'), description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PageLayout 
            title={t('settings')} 
            description={t('settingsDescription')}
        >
            <div className="grid gap-8">
                <StandardCard 
                    title={t('notifications')} 
                    description={t('notificationsDescription')}
                    variant="elevated"
                >
                    {isLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                <Label htmlFor="booking-updates" className="flex items-center gap-3">
                                    <Bell className="h-5 w-5 text-primary" />
                                    <span className="font-semibold text-base">{t('bookingUpdates')}</span>
                                </Label>
                                <Switch id="booking-updates" checked={settings.bookingUpdates} onCheckedChange={(v) => handleNotificationChange('bookingUpdates', v)} />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                <Label htmlFor="new-messages" className="flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    <span className="font-semibold text-base">{t('newMessages')}</span>
                                </Label>
                                <Switch id="new-messages" checked={settings.newMessages} onCheckedChange={(v) => handleNotificationChange('newMessages', v)} />
                            </div>
                            {userRole === 'provider' && (
                                <>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                    <Label htmlFor="agency-invites" className="flex items-center gap-3">
                                        <UserPlus className="h-5 w-5 text-primary" />
                                        <span className="font-semibold text-base">{t('agencyInvites')}</span>
                                    </Label>
                                    <Switch id="agency-invites" checked={settings.agencyInvites} onCheckedChange={(v) => handleNotificationChange('agencyInvites', v)} />
                                </div>
                                 <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                    <Label htmlFor="new-job-alerts" className="flex items-center gap-3">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                        <span className="font-semibold text-base">{t('newJobAlerts')}</span>
                                    </Label>
                                    <Switch id="new-job-alerts" checked={settings.newJobAlerts} onCheckedChange={(v) => handleNotificationChange('newJobAlerts', v)} />
                                </div>
                                </>
                            )}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                <Label htmlFor="promotional-emails" className="flex items-center gap-3">
                                    <AtSign className="h-5 w-5 text-primary" />
                                    <span className="font-semibold text-base">{t('promotionalEmails')}</span>
                                </Label>
                                <Switch id="promotional-emails" checked={settings.promotionalEmails} onCheckedChange={(v) => handleNotificationChange('promotionalEmails', v)} />
                            </div>
                        </>
                    )}
                    <div className="flex justify-end pt-6">
                        <Button onClick={handleSaveChanges} disabled={isSaving || isLoading} className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                           {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           {isSaving ? t('saving') : t('savePreferences')}
                       </Button>
                    </div>
                </StandardCard>
            </div>
        </PageLayout>
    );
}
