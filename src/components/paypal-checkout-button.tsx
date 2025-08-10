
"use client";

import { useState } from "react";
import {
  PayPalButtons,
  type OnApproveData,
  type OnApproveActions,
  type CreateOrderData,
  type CreateOrderActions,
  type OnErrorActions,
} from "@paypal/react-paypal-js";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { type SubscriptionTier, type AgencySubscriptionTier } from "@/app/(app)/subscription/page";
import { Loader2, Wallet, QrCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { QRCode } from "./qrcode-svg";


type PayPalCheckoutButtonProps = {
  plan: SubscriptionTier | AgencySubscriptionTier;
  onPaymentStart?: () => void;
  onPaymentSuccess?: () => void;
};

type PaymentMethod = 'paypal' | 'gcash' | 'maya';

const localPaymentInstructions = {
  gcash: {
    name: "GCash",
    icon: Wallet,
    steps: [
      "Open your GCash app and tap 'Scan QR'.",
      "Scan the QR code shown on this screen.",
      "Enter the amount: ₱{amount} and complete the payment.",
      "Click the 'I Have Paid' button below.",
    ],
  },
  maya: {
    name: "Maya",
    icon: Wallet,
    steps: [
      "Open your Maya app and tap 'Scan to Pay'.",
      "Scan the QR code shown on this screen.",
      "Enter the amount: ₱{amount} and complete the payment.",
      "Click the 'I Have Paid' button below.",
    ],
  },
};


export function PayPalCheckoutButton({ plan, onPaymentStart, onPaymentSuccess }: PayPalCheckoutButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('paypal');

  const createOrder = (data: CreateOrderData, actions: CreateOrderActions) => {
    onPaymentStart?.();
    return actions.order.create({
      purchase_units: [
        {
          description: `LocalPro - ${plan.name} Plan`,
          amount: {
            value: String(plan.price),
            currency_code: "PHP",
          },
        },
      ],
    });
  };

  const onApprove = (data: OnApproveData, actions: OnApproveActions) => {
    setIsProcessing(true);
    onPaymentStart?.();
    return actions.order!.capture().then(async (details) => {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to subscribe.",
        });
        setIsProcessing(false);
        return;
      }
      try {
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1);

        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          subscription: {
            planId: plan.id,
            status: "active",
            renewsOn: Timestamp.fromDate(renewalDate),
            paypalOrderId: details.id,
          },
        });

        await addDoc(collection(db, "transactions"), {
          userId: user.uid,
          planId: plan.id,
          amount: Number(plan.price),
          paymentMethod: "PayPal",
          status: "completed",
          paypalOrderId: details.id,
          payerEmail: details.payer.email_address,
          createdAt: serverTimestamp(),
        });
        
        onPaymentSuccess?.();
        router.push("/subscription/success");

      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update your subscription.",
        });
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const handleLocalPayment = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to subscribe.",
      });
      return;
    }

    setIsProcessing(true);
    onPaymentStart?.();

    try {
        await addDoc(collection(db, "transactions"), {
          userId: user.uid,
          planId: plan.id,
          amount: Number(plan.price),
          paymentMethod: selectedMethod,
          status: "pending",
          createdAt: serverTimestamp(),
        });
        
        // Set user's subscription to pending
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          subscription: {
            planId: plan.id,
            status: "pending",
            renewsOn: null
          },
        });
        
        onPaymentSuccess?.();
        router.push("/subscription/success");
        
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create your pending subscription. Please try again.",
        });
    } finally {
      setIsProcessing(false);
    }
  }

  const onError = (err: any) => {
    console.error("PayPal Checkout Error", err);
    toast({
      variant: "destructive",
      title: "Payment Error",
      description: "An error occurred during the payment process. Please try again.",
    });
    setIsProcessing(false);
  };

  const onCancel = () => {
    toast({
      title: "Payment Cancelled",
      description: "You have cancelled the payment process.",
    });
    setIsProcessing(false);
  };
  
  const LocalPaymentView = ({ method }: { method: 'gcash' | 'maya' }) => {
    const details = localPaymentInstructions[method];
    return (
        <div className="text-center space-y-4">
            <h3 className="font-bold text-lg flex items-center justify-center gap-2">Pay with {details.name}</h3>
            <div className="mx-auto w-48 h-48 bg-white p-2 rounded-lg">
                <QRCode />
            </div>
            <ol className="text-left space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                {details.steps.map(step => (
                    <li key={step}>{step.replace('{amount}', Number(plan.price).toFixed(2))}</li>
                ))}
            </ol>
            <Button className="w-full" onClick={handleLocalPayment} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : null}
                I Have Paid
            </Button>
        </div>
    )
  }

  return (
    <>
      <Tabs value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as PaymentMethod)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
            <TabsTrigger value="gcash">GCash</TabsTrigger>
            <TabsTrigger value="maya">Maya</TabsTrigger>
        </TabsList>
        <TabsContent value="paypal" className="pt-4">
            {isProcessing && (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Processing your payment...</span>
                </div>
            )}
            <div className={isProcessing ? 'hidden' : ''}>
                <PayPalButtons
                    style={{ layout: "vertical" }}
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                    onCancel={onCancel}
                    forceReRender={[plan.id]}
                />
            </div>
        </TabsContent>
         <TabsContent value="gcash" className="pt-4">
            <LocalPaymentView method="gcash" />
         </TabsContent>
         <TabsContent value="maya" className="pt-4">
             <LocalPaymentView method="maya" />
         </TabsContent>
      </Tabs>
    </>
  );
}
