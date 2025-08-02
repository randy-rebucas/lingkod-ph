
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc, Timestamp, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, UploadCloud } from "lucide-react";
import { PaymentMethodIcon } from "./payment-method-icon";
import { QRCode } from "./qrcode-svg";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import Image from "next/image";

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

type PaymentStep = 'selection' | 'confirmation' | 'upload_proof';
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
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    useEffect(() => {
        if(isOpen) {
            setStep('selection');
            setIsProcessing(false);
            setProofFile(null);
            setProofPreview(null);
            setUploadProgress(null);
            setReferenceNumber(`LP${Date.now()}`);
        }
    }, [isOpen]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProofFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmitForVerification = async () => {
        if (!user || !proofFile || typeof plan.price !== 'number') {
            toast({ variant: 'destructive', title: 'Error', description: 'User or proof of payment is missing.' });
            return;
        }
        setIsProcessing(true);

        try {
            // 1. Upload Proof of Payment
            const storageRef = ref(storage, `payment-proofs/${user.uid}/${Date.now()}_${proofFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, proofFile);

            const proofOfPaymentUrl = await new Promise<string>((resolve, reject) => {
                 uploadTask.on('state_changed',
                    (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                    (error) => reject(error),
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    }
                );
            });
            
            // 2. Update User's Subscription Status to Pending
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                subscription: {
                    planId: plan.id,
                    status: 'pending',
                    renewsOn: null, // Will be set upon approval
                }
            });

            // 3. Create Transaction Record
            await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                planId: plan.id,
                amount: plan.price,
                paymentMethod: selectedPaymentMethod,
                isAutoRenew,
                status: 'pending_verification',
                referenceNumber,
                proofOfPaymentUrl,
                createdAt: serverTimestamp()
            });
            
            toast({ title: 'Submitted for Verification', description: `Your payment for the ${plan.name} plan is being reviewed.` });
            setIsOpen(false);

        } catch (error) {
             console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit payment for verification.' });
        } finally {
            setIsProcessing(false);
        }
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
                    <Button onClick={() => setStep('upload_proof')} className="w-full">
                        Next: Upload Proof of Payment
                    </Button>
                </DialogFooter>
            </div>
        )
    };

    const renderUploadScreen = () => (
         <div className="space-y-4">
            <DialogHeader>
                <DialogTitle>Upload Proof of Payment</DialogTitle>
                <DialogDescription>
                    Please upload a screenshot or photo of your transaction receipt.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                    {proofPreview ? (
                         <Image src={proofPreview} alt="Proof of payment preview" width={300} height={200} className="object-contain h-full w-full" />
                    ) : (
                        <div className="text-center text-muted-foreground p-4 flex flex-col items-center gap-2">
                             <UploadCloud className="h-10 w-10" />
                            <p>Click to select an image</p>
                        </div>
                    )}
                </div>
                 <Input id="proof-upload" type="file" accept="image/*" onChange={handleFileChange} />
                 {uploadProgress !== null && <Progress value={uploadProgress} />}
            </div>
            <DialogFooter className="pt-4">
                 <Button variant="outline" onClick={() => setStep('confirmation')}>Back</Button>
                 <Button onClick={handleSubmitForVerification} disabled={isProcessing || !proofFile}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isProcessing ? 'Submitting...' : 'Submit for Verification'}
                </Button>
            </DialogFooter>
        </div>
    );

    const renderContent = () => {
        switch(step) {
            case 'selection': return (
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
            );
            case 'confirmation': return renderConfirmationScreen();
            case 'upload_proof': return renderUploadScreen();
            default: return null;
        }
    }


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
              {renderContent()}
            </DialogContent>
        </Dialog>
    );
}
