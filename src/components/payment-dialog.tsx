
"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { PaymentMethodIcon } from "./payment-method-icon";

export type SubscriptionTier = {
    id: 'starter' | 'pro' | 'elite';
    name: string;
    price: number;
    idealFor: string;
    features: string[];
    badge: string | null;
    isFeatured?: boolean;
};

export type AgencySubscriptionTier = {
    id: 'lite' | 'pro' | 'custom';
    name: string;
    price: number | string;
    idealFor: string;
    features: string[];
    badge: string | null;
    isFeatured?: boolean;
};

type PaymentDialogProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    plan: SubscriptionTier | AgencySubscriptionTier;
};

const eWallets = ["GCash", "Maya", "Coins.ph"];
const banks = ["BDO", "BPI", "UnionBank"];
const otc = ["7-Eleven", "Cebuana Lhuillier", "Palawan Express", "MLhuillier"];

export function PaymentDialog({ isOpen, setIsOpen, plan }: PaymentDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAutoRenew, setIsAutoRenew] = useState(true);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("GCash");

    const handleConfirmPayment = async () => {
        if (!user || typeof plan.price !== 'number') {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot process payment.' });
            return;
        }

        setIsProcessing(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const newRenewsOn = isAutoRenew 
                ? Timestamp.fromDate(new Date(new Date().setMonth(new Date().getMonth() + 1)))
                : null;

            await updateDoc(userDocRef, {
                subscription: {
                    planId: plan.id,
                    status: 'active',
                    renewsOn: newRenewsOn,
                }
            });

            await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                planId: plan.id,
                amount: plan.price,
                paymentMethod: selectedPaymentMethod,
                isAutoRenew,
                status: 'completed',
                createdAt: serverTimestamp()
            });
            
            toast({ title: 'Success!', description: `You have successfully subscribed to the ${plan.name} plan.` });
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update subscription.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const renderPaymentOptions = (methods: string[]) => (
        <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="space-y-2">
            {methods.map(method => (
                <Label key={method} htmlFor={method} className="flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-accent has-[:checked]:border-primary">
                    <div className="flex items-center gap-4">
                        <PaymentMethodIcon method={method} />
                        <span className="font-medium">{method}</span>
                    </div>
                    <RadioGroupItem value={method} id={method} />
                </Label>
            ))}
        </RadioGroup>
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Complete Your Subscription</DialogTitle>
                    <DialogDescription>
                        You are subscribing to the <span className="font-bold text-primary">{plan.name}</span> plan for 
                        <span className="font-bold text-primary"> ₱{typeof plan.price === 'number' ? plan.price.toFixed(2) : plan.price}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Tabs defaultValue="ewallet" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="ewallet">E-Wallets</TabsTrigger>
                            <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                            <TabsTrigger value="otc">Over-the-Counter</TabsTrigger>
                        </TabsList>
                        <TabsContent value="ewallet" className="mt-4">
                            {renderPaymentOptions(eWallets)}
                        </TabsContent>
                        <TabsContent value="bank" className="mt-4">
                            {renderPaymentOptions(banks)}
                            <p className="text-xs text-muted-foreground mt-2">A QR code for bank transfer will be shown on the next step (simulation).</p>
                        </TabsContent>
                        <TabsContent value="otc" className="mt-4">
                            {renderPaymentOptions(otc)}
                             <p className="text-xs text-muted-foreground mt-2">A reference number will be generated for cash payment (simulation).</p>
                        </TabsContent>
                    </Tabs>
                </div>
                 <div className="flex items-center space-x-2 my-4">
                    <Switch id="auto-renew" checked={isAutoRenew} onCheckedChange={setIsAutoRenew} />
                    <Label htmlFor="auto-renew">Auto-renew this subscription monthly</Label>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmPayment} disabled={isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isProcessing ? 'Processing...' : 'Confirm Payment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
