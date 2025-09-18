'use server';

import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

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

export async function verifySubscription(userId: string, requiredPlan?: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    const subscription = userData.subscription;
    
    if (!subscription || subscription.status !== 'active') return false;
    
    if (requiredPlan) {
      return subscription.planId === requiredPlan;
    }
    
    return subscription.planId !== 'free';
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return false;
  }
}
