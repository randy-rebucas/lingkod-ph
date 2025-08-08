
"use client";

import { useState } from "react";
import {
  PayPalScriptProvider,
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
import { Loader2 } from "lucide-react";

type PayPalCheckoutButtonProps = {
  plan: SubscriptionTier | AgencySubscriptionTier;
};

export function PayPalCheckoutButton({ plan }: PayPalCheckoutButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return (
      <div className="text-destructive">
        PayPal Client ID is not configured.
      </div>
    );
  }

  const createOrder = (data: CreateOrderData, actions: CreateOrderActions) => {
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

        toast({
            title: "Payment Successful!",
            description: `You are now subscribed to the ${plan.name} plan.`
        })

        router.push("/dashboard");

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

  const onError = (err: any) => {
    console.error("PayPal Checkout Error", err);
    toast({
      variant: "destructive",
      title: "Payment Error",
      description: "An error occurred during the payment process. Please try again.",
    });
    setIsProcessing(false);
  };

  const onCancel = (data: Record<string, unknown>, actions: any) => {
    toast({
      title: "Payment Cancelled",
      description: "You have cancelled the payment process.",
    });
    setIsProcessing(false);
  };
  

  return (
    <>
    {isProcessing && (
        <div className="flex items-center justify-center p-4">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Processing your payment...</span>
        </div>
    )}
    <div className={isProcessing ? 'hidden' : ''}>
        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
            currency: "PHP",
            intent: "capture",
          }}
        >
          <PayPalButtons
            style={{ layout: "vertical" }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onError}
            onCancel={onCancel}
            forceReRender={[plan.id]}
          />
        </PayPalScriptProvider>
    </div>
    </>
  );
}

