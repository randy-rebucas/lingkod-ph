
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { logAdminAction } from '@/lib/audit-logger';
import { auth } from '@/lib/firebase';

async function getActor() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    return {
        id: currentUser.uid,
        name: currentUser.displayName,
        role: 'admin'
    };
}

export async function handleUpdateReward(
  rewardId: string,
  data: { title: string, description: string, pointsRequired: number, isActive: boolean }
) {
  try {
    const actor = await getActor();
    const rewardRef = doc(db, 'loyaltyRewards', rewardId);
    await updateDoc(rewardRef, data);

    await logAdminAction({
        actor,
        action: 'REWARD_UPDATED',
        details: { rewardId, changes: data }
    });

    return {
      error: null,
      message: `Reward updated successfully.`,
    };
  } catch (e: any) {
    console.error('Error updating reward: ', e);
    return { error: e.message, message: 'Failed to update reward.' };
  }
}

export async function handleAddReward(data: { title: string, description: string, pointsRequired: number, isActive: boolean }) {
    if (!data.title || !data.description || data.pointsRequired <= 0) {
        return { error: 'Invalid data provided.', message: 'Validation failed.' };
    }
    try {
        const actor = await getActor();
        const newDoc = await addDoc(collection(db, 'loyaltyRewards'), { ...data, createdAt: serverTimestamp() });
        
        await logAdminAction({
            actor,
            action: 'REWARD_CREATED',
            details: { rewardId: newDoc.id, title: data.title }
        });

        return {
            error: null,
            message: `Reward "${data.title}" added successfully.`,
        };
    } catch (e: any) {
        console.error('Error adding reward: ', e);
        return { error: e.message, message: 'Failed to add reward.' };
    }
}

export async function handleDeleteReward(rewardId: string) {
  try {
    const actor = await getActor();
    const rewardRef = doc(db, 'loyaltyRewards', rewardId);
    await deleteDoc(rewardRef);

     await logAdminAction({
        actor,
        action: 'REWARD_DELETED',
        details: { rewardId }
    });

    return {
      error: null,
      message: 'Reward has been deleted successfully.',
    };
  } catch (e: any) {
    console.error('Error deleting reward: ', e);
    return { error: e.message, message: 'Failed to delete reward.' };
  }
}
