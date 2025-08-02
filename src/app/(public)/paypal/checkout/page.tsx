
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PaymentMethodIcon } from "@/components/payment-method-icon";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const paymentMethods = [
    { name: "GCash", category: "E-Wallet" },
    { name: "Maya", category: "E-Wallet" },
    { name: "BPI", category: "Bank" },
    { name: "UnionBank", category: "Bank" },
    { name: "7-Eleven", category: "OTC" },
];

function CheckoutPageContent() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = searchParams.get('planId');
    const planName = searchParams.get('planName');
    const price = searchParams.get('price');
    const successUrl = searchParams.get('success_url');

    const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0].name);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirmPayment = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to subscribe.' });
            return;
        }
        setIsProcessing(true);
        try {
            // This is where you would typically interact with a real payment gateway.
            // For this simulation, we'll directly update the user's subscription status
            // and create a transaction record.

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                subscription: {
                    planId: planId,
                    status: 'pending', // Set to pending until proof is uploaded/verified
                    renewsOn: null,
                }
            });

            await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                planId: planId,
                amount: Number(price),
                paymentMethod: selectedMethod,
                status: 'pending_verification', // This status indicates we need proof
                createdAt: serverTimestamp(),
            });

            if (successUrl) {
                router.push(successUrl);
            } else {
                router.push('/dashboard');
            }

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to process subscription.' });
        } finally {
            setIsProcessing(false);
        }
    }


    if (!planId || !planName || !price) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Invalid subscription details provided.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
                <CardTitle>Complete Your Payment</CardTitle>
                <CardDescription>You are subscribing to the <span className="font-bold text-primary">{planName}</span> plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between items-center bg-secondary p-4 rounded-lg">
                    <span className="text-lg font-medium">Total Due Today</span>
                    <span className="text-2xl font-bold">₱{Number(price).toFixed(2)}</span>
                </div>
                <div>
                    <Label className="font-semibold">Choose a Payment Method</Label>
                    <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="mt-2 space-y-2">
                        {paymentMethods.map(method => (
                            <Label key={method.name} htmlFor={method.name} className="flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-accent has-[:checked]:border-primary">
                                <div className="flex items-center gap-4">
                                    <PaymentMethodIcon method={method.name} />
                                    <span className="font-medium">{method.name}</span>
                                </div>
                                <RadioGroupItem value={method.name} id={method.name} />
                            </Label>
                        ))}
                    </RadioGroup>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" size="lg" onClick={handleConfirmPayment} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isProcessing ? 'Processing...' : `Pay ₱${Number(price).toFixed(2)}`}
                </Button>
            </CardFooter>
        </Card>
    )
}


export default function CheckoutPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CheckoutPageContent />
        </Suspense>
    )
}
