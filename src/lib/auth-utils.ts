'use server';

import { auth, getDb } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function verifyAdminRole(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(getDb(), 'users', userId));
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
    const userDoc = await getDoc(doc(getDb(), 'users', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return allowedRoles.includes(userData.role) && userData.accountStatus !== 'suspended';
  } catch (error) {
    console.error('Error verifying user role:', error);
    return false;
  }
}

