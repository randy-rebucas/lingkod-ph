
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
} from 'firebase/firestore';

type UserStatus = 'active' | 'pending_approval' | 'suspended';

export async function handleUserStatusUpdate(
  userId: string,
  status: UserStatus
) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { accountStatus: status });

    return {
      error: null,
      message: `User status updated to ${status.replace('_', ' ')}.`,
    };
  } catch (e: any) {
    console.error('Error updating user status: ', e);
    return { error: e.message, message: 'Failed to update user status.' };
  }
}
