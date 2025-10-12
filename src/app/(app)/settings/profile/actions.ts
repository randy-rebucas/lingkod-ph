'use server';

import { getDb } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

const ProfileSettingsSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  bio: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  socialLinks: z.object({
    linkedin: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

export type ProfileSettingsInput = z.infer<typeof ProfileSettingsSchema>;

// Update profile settings
export async function updateProfileSettings(userId: string, settings: ProfileSettingsInput) {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedSettings = ProfileSettingsSchema.parse(settings);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const userRef = doc(getDb(), 'users', validatedUserId);
    await updateDoc(userRef, {
      ...validatedSettings,
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Profile settings updated successfully' };
  } catch (error) {
    console.error('Error updating profile settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile settings' 
    };
  }
}

// Get profile settings
export async function getProfileSettings(userId: string) {
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
    const profileSettings = {
      displayName: userData.displayName || '',
      bio: userData.bio || '',
      phone: userData.phone || '',
      location: userData.location || '',
      website: userData.website || '',
      socialLinks: userData.socialLinks || {
        linkedin: '',
        twitter: '',
        instagram: '',
      },
    };

    return { success: true, data: profileSettings };
  } catch (error) {
    console.error('Error getting profile settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get profile settings' 
    };
  }
}
