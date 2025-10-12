'use server';

import { getDb } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

const PrivacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'contacts']),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  showLocation: z.boolean(),
  showRating: z.boolean(),
  allowDirectMessages: z.boolean(),
  showOnlineStatus: z.boolean(),
  dataSharing: z.object({
    analytics: z.boolean(),
    marketing: z.boolean(),
    thirdParty: z.boolean(),
  }),
});

export type PrivacySettingsInput = z.infer<typeof PrivacySettingsSchema>;

// Update privacy settings
export async function updatePrivacySettings(userId: string, settings: PrivacySettingsInput) {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedSettings = PrivacySettingsSchema.parse(settings);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const userRef = doc(getDb(), 'users', validatedUserId);
    await updateDoc(userRef, {
      privacySettings: validatedSettings,
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Privacy settings updated successfully' };
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update privacy settings' 
    };
  }
}

// Get privacy settings
export async function getPrivacySettings(userId: string) {
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
      profileVisibility: 'public' as const,
      showEmail: false,
      showPhone: false,
      showLocation: true,
      showRating: true,
      allowDirectMessages: true,
      showOnlineStatus: true,
      dataSharing: {
        analytics: true,
        marketing: false,
        thirdParty: false,
      },
    };

    const settings = userData?.privacySettings || defaultSettings;

    return { success: true, data: settings };
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get privacy settings' 
    };
  }
}
