'use server';

import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NextRequest } from 'next/server';

export async function verifyAdminRole(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return userData.role === 'admin' && userData.accountStatus !== 'suspended';
  } catch (error) {
    console.error('Error verifying admin role:', error);
    return false;
  }
}

export async function verifyUserRole(userId: string, allowedRoles: string[]): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return allowedRoles.includes(userData.role) && userData.accountStatus !== 'suspended';
  } catch (error) {
    console.error('Error verifying user role:', error);
    return false;
  }
}

export async function verifyAuthToken(request: NextRequest): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No authorization header' };
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    // Verify the token with Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken.uid) {
      return { success: false, error: 'Invalid token' };
    }

    // Verify user exists and is not suspended
    const userDoc = await getDoc(doc(db, 'users', decodedToken.uid));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    if (userData.accountStatus === 'suspended') {
      return { success: false, error: 'Account suspended' };
    }

    return { success: true, userId: decodedToken.uid };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return { success: false, error: 'Token verification failed' };
  }
}

