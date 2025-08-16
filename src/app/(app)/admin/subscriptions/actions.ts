
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, addDoc, deleteDoc, collection } from 'firebase/firestore';
import type { SubscriptionTier, AgencySubscriptionTier } from '@/app/(app)/subscription/page';

export async function handleUpdateSubscriptionPlan(
  planId: string,
  planData: Partial<SubscriptionTier | AgencySubscriptionTier>
) {
    try {
        const planRef = doc(db, 'subscriptions', planId);
        await updateDoc(planRef, planData);
        return { error: null, message: `Plan "${planData.name}" updated successfully.` };
    } catch(e: any) {
        console.error('Error updating subscription plan: ', e);
        return { error: e.message, message: 'Failed to update plan.' };
    }
}


export async function handleAddSubscriptionPlan(
  planData: Omit<SubscriptionTier, 'id'> | Omit<AgencySubscriptionTier, 'id'>
) {
    if (!planData.name) return { error: "Plan name is required.", message: "Validation Failed" };
    try {
        await addDoc(collection(db, 'subscriptions'), planData);
        return { error: null, message: `Plan "${planData.name}" created successfully.` };
    } catch(e: any) {
        console.error('Error adding subscription plan: ', e);
        return { error: e.message, message: 'Failed to add plan.' };
    }
}

export async function handleDeleteSubscriptionPlan(planId: string) {
    try {
        await deleteDoc(doc(db, 'subscriptions', planId));
        return { error: null, message: 'Plan deleted successfully.' };
    } catch(e: any) {
        console.error('Error deleting subscription plan: ', e);
        return { error: e.message, message: 'Failed to delete plan.' };
    }
}
