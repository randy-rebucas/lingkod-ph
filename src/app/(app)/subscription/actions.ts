
"use server";

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const plans = {
    starter: { price: 299, name: "Starter" },
    pro: { price: 499, name: "Pro" },
    elite: { price: 899, name: "Elite" },
    lite: { price: 2500, name: "Lite" },
    custom: { price: 10000, name: "Custom" },
};

export async function createPaypalOrder(planId: keyof typeof plans, userId: string) {
    if (!userId) {
        return { error: 'You must be logged in to subscribe.' };
    }

    // In a real application, you would make an API call to PayPal here.
    // For this simulation, we'll redirect to a mock PayPal checkout page.
    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/paypal/checkout?planId=${planId}&userId=${userId}`;

    return { approvalUrl: checkoutUrl, error: null };
}


export async function finalizeSubscription(planId: keyof typeof plans, userId: string) {
    if (!userId) {
        return { error: 'User not found.' };
    }
    
    try {
        const userDocRef = doc(db, 'users', userId);
        const plan = plans[planId];
        
        const newRenewsOn = Timestamp.fromDate(new Date(new Date().setMonth(new Date().getMonth() + 1)));

        // Update user's subscription
        await updateDoc(userDocRef, {
            subscription: {
                planId: planId,
                status: 'active',
                renewsOn: newRenewsOn,
            }
        });

        // Create a transaction record
        await addDoc(collection(db, 'transactions'), {
            userId: userId,
            planId: planId,
            amount: plan.price,
            paymentMethod: 'paypal',
            status: 'completed',
            createdAt: serverTimestamp()
        });
        
        revalidatePath('/subscription');
        return { success: true, error: null };

    } catch (e: any) {
        console.error('Error finalizing subscription:', e);
        return { success: false, error: 'Failed to update subscription.' };
    }
}
