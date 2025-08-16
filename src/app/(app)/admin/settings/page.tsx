
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { handleUpdatePlatformSettings, type PlatformSettings } from "./actions";

export default function AdminSettingsPage() {
    const { userRole } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const fetchSettings = async () => {
            const settingsRef = doc(db, 'platform', 'settings');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                setSettings(docSnap.data() as PlatformSettings);
            } else {
                setSettings({
                    commissionRates: { low: 10, mid: 12, high: 15 },
                    referralBonus: 250
                });
            }
            setLoading(false);
        };
        
        fetchSettings();

    }, [userRole]);

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        const result = await handleUpdatePlatformSettings(settings);
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        setIsSaving(false);
    };

    if (userRole !== 'admin') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>This page is for administrators only.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Platform Settings</h1>
                    <p className="text-muted-foreground">Manage global settings for the application.</p>
                </div>
                <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
                 <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Platform Settings</h1>
                <p className="text-muted-foreground">Manage global settings for the application.</p>
            </div>
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
                    <CardTitle>Referral Program</CardTitle>
                    <CardDescription>Configure the rewards for user referrals.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-w-sm">
                        <Label htmlFor="referral-bonus">Referral Bonus (Points)</Label>
                        <Input 
                            id="referral-bonus" 
                            type="number" 
                            value={settings?.referralBonus || ''}
                            onChange={(e) => setSettings(s => s ? { ...s, referralBonus: Number(e.target.value) } : null)}
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
