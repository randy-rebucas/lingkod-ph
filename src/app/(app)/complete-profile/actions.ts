'use server';

import { getDb } from '@/lib/firebase';
import { 
  doc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');
const ProfileDataSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email('Invalid email address')
});

// Complete user profile
export async function completeUserProfile(userId: string, profileData: {
  displayName: string;
  email: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedProfile = ProfileDataSchema.parse(profileData);
    
    const userRef = doc(getDb(), "users", validatedUserId);
    await updateDoc(userRef, {
      displayName: validatedProfile.displayName,
      email: validatedProfile.email,
      profileCompleted: true,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error completing user profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete user profile'
    };
  }
}
