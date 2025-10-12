'use server';

import { getDb } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

const UpdateSettingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    bookingUpdates: z.boolean().optional(),
    paymentUpdates: z.boolean().optional(),
    marketing: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'contacts']).optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
    showLocation: z.boolean().optional(),
  }).optional(),
  appearance: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;

// Get user settings
export async function getUserSettings(userId: string) {
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
    const settings = {
      notifications: userData.notificationSettings || {
        email: true,
        push: true,
        sms: false,
        bookingUpdates: true,
        paymentUpdates: true,
        marketing: false,
      },
      privacy: userData.privacySettings || {
        profileVisibility: 'public' as const,
        showEmail: false,
        showPhone: false,
        showLocation: true,
      },
      appearance: userData.appearanceSettings || {
        theme: 'system' as const,
        language: 'en',
        timezone: 'UTC',
      },
    };

    return { success: true, data: settings };
  } catch (error) {
    console.error('Error getting user settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get user settings' 
    };
  }
}

// Update user settings
export async function updateUserSettings(userId: string, settings: UpdateSettingsInput) {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedSettings = UpdateSettingsSchema.parse(settings);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const userRef = doc(getDb(), 'users', validatedUserId);
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (validatedSettings.notifications) {
      updateData.notificationSettings = validatedSettings.notifications;
    }

    if (validatedSettings.privacy) {
      updateData.privacySettings = validatedSettings.privacy;
    }

    if (validatedSettings.appearance) {
      updateData.appearanceSettings = validatedSettings.appearance;
    }

    await updateDoc(userRef, updateData);

    return { success: true, message: 'Settings updated successfully' };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update settings' 
    };
  }
}

// Get account status
export async function getAccountStatus(userId: string) {
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
    const accountStatus = {
      isActive: userData.isActive !== false,
      isSuspended: userData.isSuspended === true,
      suspensionReason: userData.suspensionReason || null,
      suspensionDate: userData.suspensionDate || null,
      lastLogin: userData.lastLogin || null,
      accountCreated: userData.createdAt || null,
    };

    return { success: true, data: accountStatus };
  } catch (error) {
    console.error('Error getting account status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get account status' 
    };
  }
}
