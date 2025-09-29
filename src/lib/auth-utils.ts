'use server';

import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { adminAuth, adminDb } from './firebase-admin';
import { doc as adminDoc, getDoc as adminGetDoc } from 'firebase-admin/firestore';

export async function verifyAdminRole(userId: string): Promise<boolean> {
  try {
    const userDoc = await adminGetDoc(adminDoc(adminDb, 'users', userId));
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
    const userDoc = await adminGetDoc(adminDoc(adminDb, 'users', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return allowedRoles.includes(userData.role) && userData.accountStatus !== 'suspended';
  } catch (error) {
    console.error('Error verifying user role:', error);
    return false;
  }
}

export async function verifyTokenAndGetRole(token: string): Promise<{ uid: string; role: string } | null> {
  try {
    // For development, we'll use a simpler approach
    // In production, you should use Firebase Admin SDK
    if (process.env.NODE_ENV === 'development') {
      // In development, we'll decode the token manually
      // This is not secure for production!
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const uid = payload.uid;
      
      if (!uid) {
        return null;
      }
      
      // Get user data from Firestore using admin SDK
      const userDoc = await adminGetDoc(adminDoc(adminDb, 'users', uid));
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      return {
        uid: uid,
        role: userData.role
      };
    } else {
      // Production: Use Firebase Admin SDK
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Get user data from Firestore using admin SDK
      const userDoc = await adminGetDoc(adminDoc(adminDb, 'users', decodedToken.uid));
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      return {
        uid: decodedToken.uid,
        role: userData.role
      };
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Re-export for compatibility
export { verifyTokenAndGetRole as verifyToken };

