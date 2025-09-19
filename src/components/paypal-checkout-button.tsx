"use client";

import { useState, Suspense } from "react";
import {
  PayPalButtons,
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
import { PaymentConfig } from "@/lib/payment-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import Image from "next/image";
import { QRCode } from "./qrcode-svg";
import { useTranslations } from 'next-intl';

// Define PayPal types locally since they're not exported from the package
type OnApproveData = any;
type OnApproveActions = any;
type CreateOrderData = any;
type CreateOrderActions = any;
type OnErrorActions = any;

type PayPalCheckoutButtonProps = {
  plan: SubscriptionTier | AgencySubscriptionTier;
  onPaymentStart?: () => void;
  onPaymentSuccess?: () => void;
};

type PaymentMethod = 'paypal' | 'gcash' | 'maya';

export function PayPalCheckoutButton({ plan, onPaymentStart, onPaymentSuccess }: PayPalCheckoutButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations('PayPalCheckout');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('paypal');

  const localPaymentInstructions = {
    gcash: {
      name: "GCash",
      icon: Wallet,
      accountName: PaymentConfig.GCASH.accountName,
      accountNumber: PaymentConfig.GCASH.accountNumber,
      steps: [
        t('gcashStep1'),
        t('gcashStep2'),
        t('gcashStep3', { amount: Number(plan.price).toFixed(2) }),
        t('gcashStep4'),
      ],
    },
    maya: {
      name: "Maya",
      icon: Wallet,
      accountName: PaymentConfig.MAYA.accountName,
      accountNumber: PaymentConfig.MAYA.accountNumber,
      steps: [
        t('mayaStep1'),
        t('mayaStep2'),
        t('mayaStep3', { amount: Number(plan.price).toFixed(2) }),
        t('mayaStep4'),
      ],
    },
  };

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
    return actions.order!.capture().then(async (details: any) => {
              if (!user) {
          toast({
            variant: "destructive",
            title: t('error'),
            description: t('mustBeLoggedInToSubscribe'),
          });
          setIsProcessing(false);
          return;
        }
      try {
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1);
        
        const userDocRef = doc(db, "users", user.uid);
        const updates: any = {
          subscription: {
            planId: plan.id,
            status: "active",
            renewsOn: Timestamp.fromDate(renewalDate),
            paypalOrderId: details.id,
          },
        };
        // Upgrade role if it's a new subscription type
        if (plan.type === 'provider' || plan.type === 'agency') {
          updates.role = plan.type;
        }

        await updateDoc(userDocRef, updates);

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
          title: t('error'),
          description: t('failedToUpdateSubscription'),
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
        title: t('error'),
        description: t('mustBeLoggedInToSubscribe'),
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
        
        const updates: any = {
            subscription: {
                planId: plan.id,
                status: "pending",
                renewsOn: null
            },
        };

        if (plan.type === 'provider' || plan.type === 'agency') {
          updates.role = plan.type;
        }
        
        // Set user's subscription to pending
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, updates);
        
        onPaymentSuccess?.();
        router.push("/subscription/success?status=pending");
        
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: t('error'),
            description: t('failedToCreatePendingSubscription'),
        });
    } finally {
      setIsProcessing(false);
    }
  }

  const onError = (err: any) => {
    console.error("PayPal Checkout Error", err);
    toast({
      variant: "destructive",
      title: t('paymentError'),
      description: t('paymentProcessError'),
    });
    setIsProcessing(false);
  };

  const onCancel = () => {
    toast({
      title: t('paymentCancelled'),
      description: t('paymentCancelledDescription'),
    });
    setIsProcessing(false);
  };
  
  const LocalPaymentView = ({ method }: { method: 'gcash' | 'maya' }) => {
    const details = localPaymentInstructions[method];
    return (
        <div className="text-center space-y-4">
            <h3 className="font-bold text-lg flex items-center justify-center gap-2">{t('payWith')} {details.name}</h3>
            
            <div className="mx-auto w-48 h-48 bg-white p-2 rounded-lg">
                <QRCode />
            </div>
             <div className="text-sm bg-muted p-3 rounded-lg">
                <p><strong>{t('accountName')}:</strong> {details.accountName}</p>
                <p><strong>{t('accountNumber')}:</strong> {details.accountNumber}</p>
             </div>
            <ol className="text-left space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                {details.steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                ))}
            </ol>
            <Button className="w-full" onClick={handleLocalPayment} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : null}
                {t('iHavePaid')}
            </Button>
        </div>
    )
  }

  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>}>
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
                    <span>{t('processingPayment')}</span>
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
    </Suspense>
  );
}
