'use server';

import { getDb } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

const MessageSettingsSchema = z.object({
  allowDirectMessages: z.boolean(),
  allowGroupMessages: z.boolean(),
  allowMessageRequests: z.boolean(),
  autoReply: z.boolean(),
  autoReplyMessage: z.string().optional(),
  messageNotifications: z.boolean(),
  soundNotifications: z.boolean(),
  messageRetention: z.enum(['30days', '90days', '1year', 'forever']),
});

export type MessageSettingsInput = z.infer<typeof MessageSettingsSchema>;

// Update message settings
export async function updateMessageSettings(userId: string, settings: MessageSettingsInput) {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedSettings = MessageSettingsSchema.parse(settings);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const userRef = doc(getDb(), 'users', validatedUserId);
    await updateDoc(userRef, {
      messageSettings: validatedSettings,
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Message settings updated successfully' };
  } catch (error) {
    console.error('Error updating message settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update message settings' 
    };
  }
}

// Get message settings
export async function getMessageSettings(userId: string) {
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
      allowDirectMessages: true,
      allowGroupMessages: true,
      allowMessageRequests: true,
      autoReply: false,
      autoReplyMessage: '',
      messageNotifications: true,
      soundNotifications: true,
      messageRetention: '90days' as const,
    };

    const settings = userData?.messageSettings || defaultSettings;

    return { success: true, data: settings };
  } catch (error) {
    console.error('Error getting message settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get message settings' 
    };
  }
}
