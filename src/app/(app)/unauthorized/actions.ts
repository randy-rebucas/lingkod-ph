'use server';

import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'lastLogin'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

// Get user access information
export async function getUserAccessInfo(userId: string) {
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
    
    const accessInfo = {
      role: userData.role || 'user',
      isActive: userData.isActive !== false,
      isSuspended: userData.isSuspended === true,
      isVerified: userData.isVerified === true,
      hasAccess: userData.isActive !== false && userData.isSuspended !== true,
      suspensionReason: userData.suspensionReason || null,
      verificationStatus: userData.verificationStatus || 'pending',
      lastLogin: userData.lastLogin || null,
      accountCreated: userData.createdAt || null,
    };

    return { success: true, data: serializeTimestamps(accessInfo) };
  } catch (error) {
    console.error('Error getting user access info:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get user access info' 
    };
  }
}

// Get access requirements
export async function getAccessRequirements() {
  try {
    // This could be expanded to fetch from a configuration document
    const requirements = {
      minimumAge: 18,
      requiredDocuments: [
        'Valid government-issued ID',
        'Proof of address',
        'Professional certification (if applicable)',
      ],
      verificationSteps: [
        'Complete profile information',
        'Upload required documents',
        'Verify email address',
        'Complete identity verification',
      ],
      supportContact: {
        email: 'support@localpro.asia',
        phone: '+63 2 1234 5678',
        hours: 'Monday to Friday, 9:00 AM - 6:00 PM (PST)',
      },
    };

    return { success: true, data: serializeTimestamps(requirements) };
  } catch (error) {
    console.error('Error getting access requirements:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get access requirements' 
    };
  }
}

// Check if user needs verification
export async function checkVerificationStatus(userId: string) {
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
    
    const verificationStatus = {
      isVerified: userData.isVerified === true,
      verificationStatus: userData.verificationStatus || 'pending',
      documentsUploaded: userData.documentsUploaded || false,
      profileCompleted: userData.profileCompleted || false,
      emailVerified: userData.emailVerified || false,
      phoneVerified: userData.phoneVerified || false,
      needsVerification: !userData.isVerified,
      nextStep: getNextVerificationStep(userData),
    };

    return { success: true, data: serializeTimestamps(verificationStatus) };
  } catch (error) {
    console.error('Error checking verification status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check verification status' 
    };
  }
}

// Helper function to determine next verification step
function getNextVerificationStep(userData: any): string {
  if (!userData.profileCompleted) {
    return 'Complete your profile';
  }
  if (!userData.emailVerified) {
    return 'Verify your email address';
  }
  if (!userData.documentsUploaded) {
    return 'Upload required documents';
  }
  if (!userData.isVerified) {
    return 'Wait for identity verification';
  }
  return 'Verification complete';
}
