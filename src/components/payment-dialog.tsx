
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { PaymentMethodIcon } from "./payment-method-icon";
import { QRCode } from "./qrcode-svg";

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

type PaymentStep = 'selection' | 'confirmation';
type PaymentCategory = 'ewallet' | 'bank' | 'otc';

const eWallets = ["GCash", "Maya", "Coins.ph"];
const banks = ["BDO", "BPI", "UnionBank"];
const otc = ["7-Eleven", "Cebuana Lhuillier", "Palawan Express"];

export function PaymentDialog({ isOpen, setIsOpen, plan }: PaymentDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAutoRenew, setIsAutoRenew] = useState(true);
    const [paymentCategory, setPaymentCategory] = useState<PaymentCategory>("ewallet");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("GCash");
    const [step, setStep] = useState<PaymentStep>('selection');
    const [referenceNumber, setReferenceNumber] = useState('');

    useEffect(() => {
        if(isOpen) {
            setStep('selection');
            setIsProcessing(false);
            setReferenceNumber(`LP${Date.now()}`);
        }
    }, [isOpen]);

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        // In a real app, you'd wait for a webhook from the payment provider.
        // Here, we simulate it with a timeout.
        setTimeout(async () => {
             if (!user || typeof plan.price !== 'number') {
                toast({ variant: 'destructive', title: 'Error', description: 'Cannot process payment.' });
                setIsProcessing(false);
                return;
            }
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
        }, 2000); // 2-second delay to simulate processing
    };

    const renderPaymentOptions = (methods: string[], category: PaymentCategory) => (
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
    
    const renderConfirmationScreen = () => {
        const needsQrCode = paymentCategory === 'ewallet' || paymentCategory === 'bank';
        return (
            <div className="text-center space-y-4">
                 <DialogHeader>
                    <DialogTitle>Complete Your Payment</DialogTitle>
                     <DialogDescription>
                        {needsQrCode
                            ? `Scan the QR code with your ${selectedPaymentMethod} app to pay.`
                            : `Present the reference number at any ${selectedPaymentMethod} branch.`
                        }
                    </DialogDescription>
                </DialogHeader>

                {needsQrCode ? (
                    <div className="p-4 bg-white rounded-lg inline-block">
                        <QRCode />
                    </div>
                ) : (
                    <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground">Reference Number</p>
                        <p className="text-2xl font-bold font-mono tracking-widest">{referenceNumber}</p>
                    </div>
                )}
                
                <div>
                    <p className="font-semibold text-lg">Total Amount: ₱{typeof plan.price === 'number' ? plan.price.toFixed(2) : plan.price}</p>
                </div>

                <DialogFooter className="pt-4">
                    <Button onClick={handleConfirmPayment} disabled={isProcessing} className="w-full">
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isProcessing ? 'Verifying Payment...' : 'I have made the payment'}
                    </Button>
                </DialogFooter>
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                {step === 'selection' ? (
                <>
                    <DialogHeader>
                        <DialogTitle>Complete Your Subscription</DialogTitle>
                        <DialogDescription>
                            You are subscribing to the <span className="font-bold text-primary">{plan.name}</span> plan for 
                            <span className="font-bold text-primary"> ₱{typeof plan.price === 'number' ? plan.price.toFixed(2) : plan.price}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Tabs defaultValue="ewallet" className="w-full" onValueChange={(v) => setPaymentCategory(v as PaymentCategory)}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="ewallet">E-Wallets</TabsTrigger>
                                <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                                <TabsTrigger value="otc">Over-the-Counter</TabsTrigger>
                            </TabsList>
                            <TabsContent value="ewallet" className="mt-4">
                                {renderPaymentOptions(eWallets, "ewallet")}
                            </TabsContent>
                            <TabsContent value="bank" className="mt-4">
                                {renderPaymentOptions(banks, "bank")}
                            </TabsContent>
                            <TabsContent value="otc" className="mt-4">
                                {renderPaymentOptions(otc, "otc")}
                            </TabsContent>
                        </Tabs>
                    </div>
                    <div className="flex items-center space-x-2 my-4">
                        <Switch id="auto-renew" checked={isAutoRenew} onCheckedChange={setIsAutoRenew} />
                        <Label htmlFor="auto-renew">Auto-renew this subscription monthly</Label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button onClick={() => setStep('confirmation')}>Proceed to Payment</Button>
                    </DialogFooter>
                </>
                ) : (
                   renderConfirmationScreen()
                )}
            </DialogContent>
        </Dialog>
    );
}
