'use server';

import { getDb } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

const AppearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string(),
  timezone: z.string(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  colorScheme: z.enum(['default', 'blue', 'green', 'purple']).optional(),
});

export type AppearanceSettingsInput = z.infer<typeof AppearanceSettingsSchema>;

// Update appearance settings
export async function updateAppearanceSettings(userId: string, settings: AppearanceSettingsInput) {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedSettings = AppearanceSettingsSchema.parse(settings);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const userRef = doc(getDb(), 'users', validatedUserId);
    await updateDoc(userRef, {
      appearanceSettings: validatedSettings,
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Appearance settings updated successfully' };
  } catch (error) {
    console.error('Error updating appearance settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update appearance settings' 
    };
  }
}

// Get appearance settings
export async function getAppearanceSettings(userId: string) {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const userRef = doc(getDb(), 'users', validatedUserId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userSnap.data();
    const defaultSettings = {
      theme: 'system' as const,
      language: 'en',
      timezone: 'UTC',
      fontSize: 'medium' as const,
      colorScheme: 'default' as const,
    };

    const settings = userData?.appearanceSettings || defaultSettings;

    return { success: true, data: settings };
  } catch (error) {
    console.error('Error getting appearance settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get appearance settings' 
    };
  }
}
