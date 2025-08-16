
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
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
