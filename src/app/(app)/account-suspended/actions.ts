'use server';

import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

const AppealSchema = z.object({
  reason: z.string().min(10, 'Appeal reason must be at least 10 characters'),
  additionalInfo: z.string().optional(),
});

export type AppealInput = z.infer<typeof AppealSchema>;

// Get account suspension details
export async function getAccountSuspensionDetails(userId: string) {
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
    
    if (!userData.isSuspended) {
      return { success: false, error: 'Account is not suspended' };
    }

    const suspensionDetails = {
      isSuspended: userData.isSuspended,
      suspensionReason: userData.suspensionReason || 'Account suspended',
      suspensionDate: userData.suspensionDate,
      suspensionExpiry: userData.suspensionExpiry,
      hasAppeal: userData.hasAppeal || false,
      appealStatus: userData.appealStatus || 'none',
      appealDate: userData.appealDate,
      contactEmail: 'support@lingkod.ph',
      supportPhone: '+63 2 1234 5678',
    };

    return { success: true, data: suspensionDetails };
  } catch (error) {
    console.error('Error getting account suspension details:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get suspension details' 
    };
  }
}

// Submit appeal
export async function submitAppeal(userId: string, appeal: AppealInput) {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedAppeal = AppealSchema.parse(appeal);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const userRef = doc(getDb(), 'users', validatedUserId);
    await updateDoc(userRef, {
      hasAppeal: true,
      appealStatus: 'pending',
      appealDate: serverTimestamp(),
      appealReason: validatedAppeal.reason,
      appealAdditionalInfo: validatedAppeal.additionalInfo || '',
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Appeal submitted successfully. We will review your case within 3-5 business days.' };
  } catch (error) {
    console.error('Error submitting appeal:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit appeal' 
    };
  }
}

// Check if user can submit appeal
export async function canSubmitAppeal(userId: string) {
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
    
    // Check if user is suspended
    if (!userData.isSuspended) {
      return { success: false, error: 'Account is not suspended' };
    }

    // Check if appeal already exists
    if (userData.hasAppeal) {
      return { 
        success: false, 
        error: 'Appeal already submitted',
        data: { canSubmit: false, appealStatus: userData.appealStatus }
      };
    }

    return { 
      success: true, 
      data: { canSubmit: true, appealStatus: 'none' }
    };
  } catch (error) {
    console.error('Error checking appeal eligibility:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check appeal eligibility' 
    };
  }
}
