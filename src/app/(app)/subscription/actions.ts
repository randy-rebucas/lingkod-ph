'use server';

import { getDb } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'startDate', 'endDate'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');
const SubscriptionPlanSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  planName: z.string().min(1, 'Plan name is required'),
  price: z.number().min(0, 'Price must be positive'),
  period: z.string().min(1, 'Period is required')
});

// Get user subscription
export async function getUserSubscription(userId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    const userRef = doc(getDb(), "users", validatedUserId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const userData = userSnap.data();
    const subscription = userData.subscription || {
      plan: 'free',
      status: 'active',
      startDate: null,
      endDate: null
    };

    return {
      success: true,
      data: serializeTimestamps(subscription)
    };
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user subscription'
    };
  }
}

// Update user subscription
export async function updateUserSubscription(userId: string, subscriptionData: {
  planId: string;
  planName: string;
  price: number;
  period: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedSubscription = SubscriptionPlanSchema.parse(subscriptionData);
    
    const userRef = doc(getDb(), "users", validatedUserId);
    await updateDoc(userRef, {
      subscription: {
        plan: validatedSubscription.planId,
        planName: validatedSubscription.planName,
        price: validatedSubscription.price,
        period: validatedSubscription.period,
        status: 'active',
        startDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    // Create subscription record
    await addDoc(collection(getDb(), "subscriptions"), {
      userId: validatedUserId,
      planId: validatedSubscription.planId,
      planName: validatedSubscription.planName,
      price: validatedSubscription.price,
      period: validatedSubscription.period,
      status: 'active',
      startDate: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user subscription'
    };
  }
}
