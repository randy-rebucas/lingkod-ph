
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, doc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2, MoreHorizontal, Edit, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { handleUpdateSubscriptionPlan, handleAddSubscriptionPlan, handleDeleteSubscriptionPlan } from "./actions";
import { type SubscriptionTier, type AgencySubscriptionTier } from "@/app/(app)/subscription/page";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";


const SubscriptionPlanEditor = ({ plan, onEdit, onDelete }: { plan: (SubscriptionTier | AgencySubscriptionTier), onEdit: (plan: any) => void, onDelete: (planId: string) => void }) => {
    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="capitalize">{plan.name} Plan</CardTitle>
                    <CardDescription>{plan.idealFor}</CardDescription>
                </div>
                 <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onEdit(plan)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete the "{plan.name}" plan. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive hover:bg-destructive/80" onClick={() => onDelete(plan.id)}>
                                Confirm Deletion
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                 <div className="flex items-baseline">
                     {typeof plan.price === 'number' ? (
                        <>
                            <span className="text-4xl font-bold">₱{plan.price.toLocaleString()}</span>
                            <span className="text-muted-foreground">/month</span>
                        </>
                        ) : (
                        <span className="text-2xl font-bold">{plan.price}</span>
                    )}
                 </div>
                 <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                           <CheckCircle className="h-4 w-4 text-green-500"/> {feature}
                        </li>
                    ))}
                 </ul>
            </CardContent>
             <CardFooter>
                {plan.isFeatured && <Badge>Featured</Badge>}
                {plan.badge && <Badge variant="outline">{plan.badge}</Badge>}
            </CardFooter>
        </Card>
    )
}

const AddEditPlanDialog = ({ 
    isOpen, 
    setIsOpen, 
    plan: initialPlan,
    planType,
    onSave
}: { 
    isOpen: boolean, 
    setIsOpen: (open: boolean) => void, 
    plan: (SubscriptionTier | AgencySubscriptionTier) | null,
    planType: 'provider' | 'agency',
    onSave: () => void
}) => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [editablePlan, setEditablePlan] = useState(initialPlan);

     useEffect(() => {
        if (isOpen) {
            setEditablePlan(initialPlan);
        }
    }, [initialPlan, isOpen]);
    
    if (!isOpen || !editablePlan) return null;

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...editablePlan.features];
        newFeatures[index] = value;
        setEditablePlan(p => p ? ({ ...p, features: newFeatures }) : null);
    };

    const addFeature = () => {
        setEditablePlan(p => p ? ({...p, features: [...p.features, '']}) : null);
    };

    const removeFeature = (index: number) => {
        const newFeatures = editablePlan.features.filter((_, i) => i !== index);
        setEditablePlan(p => p ? ({...p, features: newFeatures}) : null);
    };

    const handleSave = async () => {
        if (!editablePlan) return;
        setIsSaving(true);
        
        const { id, ...planData } = editablePlan;
        let result;

        if (id) {
            result = await handleUpdateSubscriptionPlan(id, planData);
        } else {
            result = await handleAddSubscriptionPlan({...planData, type: planType});
        }
        
         toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        if (!result.error) {
            onSave();
            setIsOpen(false);
        }
        setIsSaving(false);
    }
    
    return (
         <DialogContent>
            <DialogHeader>
                <DialogTitle>{initialPlan?.id ? `Edit ${initialPlan.name} Plan` : `Add New ${planType} Plan`}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={editablePlan.name} onChange={e => setEditablePlan(p => p ? ({...p, name: e.target.value}) : null)}/>
                    </div>
                     <div className="space-y-2">
                        <Label>Price (PHP or text)</Label>
                        <Input value={editablePlan.price || ''} onChange={e => setEditablePlan(p => p ? ({...p, price: e.target.value.match(/^[0-9]+$/) ? Number(e.target.value) : e.target.value}) : null)}/>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label>Ideal For</Label>
                    <Input value={editablePlan.idealFor} onChange={e => setEditablePlan(p => p ? ({...p, idealFor: e.target.value}) : null)}/>
                </div>
                 <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input type="number" value={editablePlan.sortOrder} onChange={e => setEditablePlan(p => p ? ({...p, sortOrder: Number(e.target.value)}) : null)} />
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
                        <Input value={editablePlan.badge || ''} onChange={e => setEditablePlan(p => p ? ({...p, badge: e.target.value || null}) : null)} placeholder="e.g., Most Popular"/>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                        <Switch id={`featured-${editablePlan.id}`} checked={editablePlan.isFeatured} onCheckedChange={checked => setEditablePlan(p => p ? ({...p, isFeatured: checked}) : null)}/>
                        <Label htmlFor={`featured-${editablePlan.id}`}>Is Featured?</Label>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Plan
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default function AdminSubscriptionsPage() {
    const { userRole } = useAuth();
    const { toast } = useToast();
    const [providerPlans, setProviderPlans] = useState<(SubscriptionTier)[]>([]);
    const [agencyPlans, setAgencyPlans] = useState<(AgencySubscriptionTier)[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<(SubscriptionTier | AgencySubscriptionTier) | null>(null);
    const [editingPlanType, setEditingPlanType] = useState<'provider' | 'agency'>('provider');
    

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
            setProviderPlans(plans.sort((a, b) => a.sortOrder - b.sortOrder));
            setLoading(false);
        });

        const unsubAgency = onSnapshot(agencyQuery, (snapshot) => {
            const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgencySubscriptionTier));
            setAgencyPlans(plans.sort((a,b) => a.sortOrder - b.sortOrder));
            setLoading(false);
        });
        
        return () => {
            unsubProvider();
            unsubAgency();
        };

    }, [userRole]);
    
    const handleEditPlan = (plan: SubscriptionTier | AgencySubscriptionTier) => {
        setEditingPlan(plan);
        setEditingPlanType(plan.type);
        setIsDialogOpen(true);
    };

    const handleAddPlan = (type: 'provider' | 'agency') => {
        const nextSortOrder = type === 'provider' 
            ? Math.max(0, ...providerPlans.map(p => p.sortOrder)) + 1
            : Math.max(0, ...agencyPlans.map(p => p.sortOrder)) + 1;
            
        setEditingPlan({
            id: '',
            name: '',
            price: 0,
            idealFor: '',
            features: [''],
            badge: null,
            isFeatured: false,
            type: type,
            sortOrder: nextSortOrder,
        });
        setEditingPlanType(type);
        setIsDialogOpen(true);
    };
    
    const handleDeletePlan = async (planId: string) => {
        const result = await handleDeleteSubscriptionPlan(planId);
         toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    }

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Subscription Management</h1>
                    <p className="text-muted-foreground">Manage pricing and features for provider and agency plans.</p>
                </div>

                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>Provider Plans</CardTitle>
                        <Button size="sm" onClick={() => handleAddPlan('provider')}><PlusCircle className="mr-2"/> Add Plan</Button>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-4">
                        {providerPlans.map(plan => <SubscriptionPlanEditor key={plan.id} plan={plan} onEdit={handleEditPlan} onDelete={handleDeletePlan} />)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>Agency Plans</CardTitle>
                        <Button size="sm" onClick={() => handleAddPlan('agency')}><PlusCircle className="mr-2"/> Add Plan</Button>
                    </CardHeader>
                     <CardContent className="grid md:grid-cols-3 gap-4">
                        {agencyPlans.map(plan => <SubscriptionPlanEditor key={plan.id} plan={plan} onEdit={handleEditPlan} onDelete={handleDeletePlan} />)}
                    </CardContent>
                </Card>
            </div>
            
            <AddEditPlanDialog 
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                plan={editingPlan}
                planType={editingPlanType}
                onSave={() => setIsDialogOpen(false)}
            />
        </Dialog>
    )
}
