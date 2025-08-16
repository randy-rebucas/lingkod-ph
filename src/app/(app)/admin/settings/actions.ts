
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import type { SubscriptionTier, AgencySubscriptionTier } from '@/app/(app)/subscription/page';

const platformSettingsSchema = z.object({
    commissionRates: z.object({
        low: z.number().min(0).max(100),
        mid: z.number().min(0).max(100),
        high: z.number().min(0).max(100),
    }),
    referralBonus: z.number().min(0),
});

export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

export async function handleUpdatePlatformSettings(
  settings: PlatformSettings
) {
  try {
    const validatedSettings = platformSettingsSchema.safeParse(settings);
    if (!validatedSettings.success) {
        return { error: 'Invalid settings format.', message: 'Validation failed.' };
    }

    const settingsRef = doc(db, 'platform', 'settings');
    await setDoc(settingsRef, validatedSettings.data, { merge: true });

    return {
      error: null,
      message: `Platform settings updated successfully.`,
    };
  } catch (e: any) {
    console.error('Error updating platform settings: ', e);
    return { error: e.message, message: 'Failed to update settings.' };
  }
}


const subscriptionTierSchema = z.object({
    name: z.string().min(1),
    price: z.number().min(0),
    idealFor: z.string(),
    features: z.array(z.string()),
    badge: z.string().nullable(),
    isFeatured: z.boolean(),
});

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
