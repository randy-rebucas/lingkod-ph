
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

export async function handleUpdateAdCampaign(
  campaignId: string,
  data: any
) {
  try {
    const campaignRef = doc(db, 'adCampaigns', campaignId);
    await updateDoc(campaignRef, data);

    return {
      error: null,
      message: `Ad campaign updated successfully.`,
    };
  } catch (e: any) {
    console.error('Error updating ad campaign: ', e);
    return { error: e.message, message: 'Failed to update ad campaign.' };
  }
}

export async function handleAddAdCampaign(data: any) {
    if (!data.name || !data.price || !data.durationDays) {
        return { error: 'Invalid data provided.', message: 'Validation failed.' };
    }
    try {
        await addDoc(collection(db, 'adCampaigns'), { ...data, createdAt: serverTimestamp() });
        return {
            error: null,
            message: `Ad campaign "${data.name}" added successfully.`,
        };
    } catch (e: any) {
        console.error('Error adding ad campaign: ', e);
        return { error: e.message, message: 'Failed to add ad campaign.' };
    }
}

export async function handleDeleteAdCampaign(campaignId: string) {
  try {
    const campaignRef = doc(db, 'adCampaigns', campaignId);
    await deleteDoc(campaignRef);
    return {
      error: null,
      message: 'Ad campaign has been deleted successfully.',
    };
  } catch (e: any) {
    console.error('Error deleting ad campaign: ', e);
    return { error: e.message, message: 'Failed to delete ad campaign.' };
  }
}
