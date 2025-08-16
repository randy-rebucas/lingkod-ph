
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { handleUpdateSubscriptionPlan } from "./actions";
import { type SubscriptionTier, type AgencySubscriptionTier } from "@/app/(app)/subscription/page";
import { Switch } from "@/components/ui/switch";

const SubscriptionPlanEditor = ({ plan }: { plan: (SubscriptionTier | AgencySubscriptionTier) }) => {
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
                    {typeof editablePlan.price === 'number' ? (
                        <div className="space-y-2">
                            <Label>Price (PHP)</Label>
                            <Input type="number" value={editablePlan.price} onChange={e => setEditablePlan(p => ({...p, price: Number(e.target.value)}))}/>
                        </div>
                     ) : (
                         <div className="space-y-2">
                            <Label>Price</Label>
                            <Input value={editablePlan.price} onChange={e => setEditablePlan(p => ({...p, price: e.target.value}))}/>
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

export default function AdminSubscriptionsPage() {
    const { userRole } = useAuth();
    const [providerPlans, setProviderPlans] = useState<SubscriptionTier[]>([]);
    const [agencyPlans, setAgencyPlans] = useState<AgencySubscriptionTier[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const subRef = collection(db, 'subscriptions');

        const providerQuery = query(subRef, where("type", "==", "provider"));
        const agencyQuery = query(subRef, where("type", "==", "agency"));

        const unsubProvider = onSnapshot(providerQuery, (snapshot) => {
            const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionTier));
            setProviderPlans(plans.sort((a, b) => a.price - b.price));
            if(agencyPlans.length > 0) setLoading(false);
        });

        const unsubAgency = onSnapshot(agencyQuery, (snapshot) => {
            const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgencySubscriptionTier));
            setAgencyPlans(plans.sort((a,b) => (a.price as number) - (b.price as number)));
            if(providerPlans.length > 0) setLoading(false);
        });
        
        return () => {
            unsubProvider();
            unsubAgency();
        };

    }, [userRole, providerPlans.length, agencyPlans.length]);


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
                    <h1 className="text-3xl font-bold font-headline">Subscription Management</h1>
                    <p className="text-muted-foreground">Manage pricing and features for provider and agency plans.</p>
                </div>
                <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
                 <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Subscription Management</h1>
                <p className="text-muted-foreground">Manage pricing and features for provider and agency plans.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Provider Plans</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        {providerPlans.map(plan => <SubscriptionPlanEditor key={plan.id} plan={plan} />)}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Agency Plans</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-6">
                     <div className="grid md:grid-cols-3 gap-4">
                        {agencyPlans.map(plan => <SubscriptionPlanEditor key={plan.id} plan={plan} />)}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
