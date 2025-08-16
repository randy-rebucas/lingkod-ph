
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, PlusCircle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { handleUpdatePlatformSettings, type PlatformSettings, handleUpdateSubscriptionPlan } from "./actions";
import { type SubscriptionTier, type AgencySubscriptionTier } from "@/app/(app)/subscription/page";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const SubscriptionPlanEditor = ({ plan, type }: { plan: (SubscriptionTier | AgencySubscriptionTier), type: 'provider' | 'agency' }) => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [editablePlan, setEditablePlan] = useState(plan);

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...editablePlan.features];
        newFeatures[index] = value;
        setEditablePlan(p => ({ ...p, features: newFeatures }));
    };

    const addFeature = () => {
        setEditablePlan(p => ({...p, features: [...p.features, '']}));
    };

    const removeFeature = (index: number) => {
        const newFeatures = editablePlan.features.filter((_, i) => i !== index);
        setEditablePlan(p => ({...p, features: newFeatures}));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const { id, ...planData } = editablePlan;
        const result = await handleUpdateSubscriptionPlan(id, planData);
         toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        setIsSaving(false);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="capitalize">{editablePlan.name} Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={editablePlan.name} onChange={e => setEditablePlan(p => ({...p, name: e.target.value}))}/>
                    </div>
                    {typeof editablePlan.price === 'number' && (
                        <div className="space-y-2">
                            <Label>Price (PHP)</Label>
                            <Input type="number" value={editablePlan.price} onChange={e => setEditablePlan(p => ({...p, price: Number(e.target.value)}))}/>
                        </div>
                    )}
                 </div>
                 <div className="space-y-2">
                    <Label>Ideal For</Label>
                    <Input value={editablePlan.idealFor} onChange={e => setEditablePlan(p => ({...p, idealFor: e.target.value}))}/>
                </div>
                 <div className="space-y-2">
                    <Label>Features</Label>
                    <div className="space-y-2">
                        {editablePlan.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input value={feature} onChange={e => handleFeatureChange(index, e.target.value)} />
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeFeature(index)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        ))}
                    </div>
                    <Button size="sm" variant="outline" onClick={addFeature} className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/> Add Feature</Button>
                </div>
                <div className="flex items-center justify-between">
                     <div className="space-y-2">
                        <Label>Badge Text (Optional)</Label>
                        <Input value={editablePlan.badge || ''} onChange={e => setEditablePlan(p => ({...p, badge: e.target.value || null}))} placeholder="e.g., Most Popular"/>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                        <Switch id={`featured-${plan.id}`} checked={editablePlan.isFeatured} onCheckedChange={checked => setEditablePlan(p => ({...p, isFeatured: checked}))}/>
                        <Label htmlFor={`featured-${plan.id}`}>Is Featured?</Label>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Plan
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function AdminSettingsPage() {
    const { userRole } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [subscriptions, setSubscriptions] = useState<(SubscriptionTier | AgencySubscriptionTier)[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const unsubscribes: (() => void)[] = [];

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
        };

        const subscribeToSubscriptions = () => {
            const subRef = collection(db, 'subscriptions');
            const unsubscribe = onSnapshot(subRef, (snapshot) => {
                const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as (SubscriptionTier | AgencySubscriptionTier)));
                setSubscriptions(plans);
                setLoading(false);
            });
            unsubscribes.push(unsubscribe);
        };
        
        fetchSettings();
        subscribeToSubscriptions();
        
        return () => unsubscribes.forEach(unsub => unsub());

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

    const providerPlans = subscriptions.filter(s => ['starter', 'pro', 'elite'].includes(s.id));
    const agencyPlans = subscriptions.filter(s => ['lite', 'pro-agency', 'custom'].includes(s.id));


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Platform Settings</h1>
                <p className="text-muted-foreground">Manage global settings for the application.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>Manage pricing and features for provider and agency plans.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div>
                        <h3 className="text-lg font-semibold mb-2">Provider Plans</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {providerPlans.map(plan => <SubscriptionPlanEditor key={plan.id} plan={plan} type="provider"/>)}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold mb-2">Agency Plans</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {agencyPlans.map(plan => <SubscriptionPlanEditor key={plan.id} plan={plan} type="agency"/>)}
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
