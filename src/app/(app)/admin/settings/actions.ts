
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { AuditLogger } from '@/lib/audit-logger';

type Actor = {
    id: string;
    name: string | null;
}

const platformSettingsSchema = z.object({
    appName: z.string().min(1, "App name is required."),
    supportEmail: z.string().email("A valid support email is required."),
    logoUrl: z.string().url().or(z.literal("")).optional(),
    commissionRates: z.object({
        low: z.number().min(0).max(100),
        mid: z.number().min(0).max(100),
        high: z.number().min(0).max(100),
    }),
    referralBonus: z.number().min(0),
    welcomeBonus: z.number().min(0),
});

export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

export async function handleUpdatePlatformSettings(
  settings: PlatformSettings,
  actor: Actor
) {
  try {
    const validatedSettings = platformSettingsSchema.safeParse(settings);
    if (!validatedSettings.success) {
        return { error: 'Invalid settings format.', message: 'Validation failed.' };
    }

    const settingsRef = doc(db, 'platform', 'settings');
    await setDoc(settingsRef, validatedSettings.data, { merge: true });

    await AuditLogger.getInstance().logAction(
        'PLATFORM_SETTINGS_UPDATED',
        actor.id,
        'platform',
        { settings: validatedSettings.data, actorRole: 'admin' }
    );

    return {
      error: null,
      message: `Platform settings updated successfully.`,
    };
  } catch (e: any) {
    console.error('Error updating platform settings: ', e);
    return { error: e.message, message: 'Failed to update settings.' };
  }
}
