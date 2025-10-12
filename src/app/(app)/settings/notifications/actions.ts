'use server';

import { getDb } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

const NotificationSettingsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  sms: z.boolean(),
  bookingUpdates: z.boolean(),
  paymentUpdates: z.boolean(),
  marketing: z.boolean(),
  agencyInvites: z.boolean(),
  jobAlerts: z.boolean(),
  weeklyDigest: z.boolean(),
});

export type NotificationSettingsInput = z.infer<typeof NotificationSettingsSchema>;

// Update notification settings
export async function updateNotificationSettings(userId: string, settings: NotificationSettingsInput) {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedSettings = NotificationSettingsSchema.parse(settings);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const userRef = doc(getDb(), 'users', validatedUserId);
    await updateDoc(userRef, {
      notificationSettings: validatedSettings,
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Notification settings updated successfully' };
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update notification settings' 
    };
  }
}

// Get notification preferences
export async function getNotificationPreferences(userId: string) {
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
      email: true,
      push: true,
      sms: false,
      bookingUpdates: true,
      paymentUpdates: true,
      marketing: false,
      agencyInvites: true,
      jobAlerts: true,
      weeklyDigest: false,
    };

    const settings = userData?.notificationSettings || defaultSettings;

    return { success: true, data: settings };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get notification preferences' 
    };
  }
}
