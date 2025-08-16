
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, addDoc, deleteDoc, collection } from 'firebase/firestore';
import type { SubscriptionTier, AgencySubscriptionTier } from '@/app/(app)/subscription/page';
import { logAdminAction } from '@/lib/audit-logger';
import { auth } from '@/lib/firebase';

async function getActor() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    return {
        id: currentUser.uid,
        name: currentUser.displayName,
        role: 'admin'
    };
}

export async function handleUpdateSubscriptionPlan(
  planId: string,
  planData: Partial<SubscriptionTier | AgencySubscriptionTier>
) {
    try {
        const actor = await getActor();
        const planRef = doc(db, 'subscriptions', planId);
        await updateDoc(planRef, planData);

         await logAdminAction({
            actor,
            action: 'SUBSCRIPTION_PLAN_UPDATED',
            details: { planId, changes: planData }
        });

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
        const actor = await getActor();
        const newDoc = await addDoc(collection(db, 'subscriptions'), planData);

        await logAdminAction({
            actor,
            action: 'SUBSCRIPTION_PLAN_CREATED',
            details: { planId: newDoc.id, name: planData.name }
        });

        return { error: null, message: `Plan "${planData.name}" created successfully.` };
    } catch(e: any) {
        console.error('Error adding subscription plan: ', e);
        return { error: e.message, message: 'Failed to add plan.' };
    }
}

export async function handleDeleteSubscriptionPlan(planId: string) {
    try {
        const actor = await getActor();
        await deleteDoc(doc(db, 'subscriptions', planId));

        await logAdminAction({
            actor,
            action: 'SUBSCRIPTION_PLAN_DELETED',
            details: { planId }
        });

        return { error: null, message: 'Plan deleted successfully.' };
    } catch(e: any) {
        console.error('Error deleting subscription plan: ', e);
        return { error: e.message, message: 'Failed to delete plan.' };
    }
}
