
'use server';

import { getDb  } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { AuditLogger } from '@/lib/audit-logger';

type Actor = {
    id: string;
    name: string | null;
}

export async function handleUpdateReward(
  rewardId: string,
  data: { title: string, description: string, pointsRequired: number, isActive: boolean },
  actor: Actor
) {
  try {
    const rewardRef = doc(getDb(), 'loyaltyRewards', rewardId);
    await updateDoc(rewardRef, data);

    await AuditLogger.getInstance().logAction(
        'REWARD_UPDATED',
        actor.id,
        'reward',
        { rewardId, changes: data, actorRole: 'admin' }
    );

    return {
      error: null,
      message: `Reward updated successfully.`,
    };
  } catch (e: any) {
    console.error('Error updating reward: ', e);
    return { error: e.message, message: 'Failed to update reward.' };
  }
}

export async function handleAddReward(data: { title: string, description: string, pointsRequired: number, isActive: boolean }, actor: Actor) {
    if (!data.title || !data.description || data.pointsRequired <= 0) {
        return { error: 'Invalid data provided.', message: 'Validation failed.' };
    }
    try {
        const newDoc = await addDoc(collection(getDb(), 'loyaltyRewards'), { ...data, createdAt: serverTimestamp() });
        
        await AuditLogger.getInstance().logAction(
            'REWARD_CREATED',
            actor.id,
            'reward',
            { rewardId: newDoc.id, title: data.title, actorRole: 'admin' }
        );

        return {
            error: null,
            message: `Reward "${data.title}" added successfully.`,
        };
    } catch (e: any) {
        console.error('Error adding reward: ', e);
        return { error: e.message, message: 'Failed to add reward.' };
    }
}

export async function handleDeleteReward(rewardId: string, actor: Actor) {
  try {
    const rewardRef = doc(getDb(), 'loyaltyRewards', rewardId);
    await deleteDoc(rewardRef);

     await AuditLogger.getInstance().logAction(
        'REWARD_DELETED',
        actor.id,
        'reward',
        { rewardId, actorRole: 'admin' }
    );

    return {
      error: null,
      message: 'Reward has been deleted successfully.',
    };
  } catch (e: any) {
    console.error('Error deleting reward: ', e);
    return { error: e.message, message: 'Failed to delete reward.' };
  }
}
