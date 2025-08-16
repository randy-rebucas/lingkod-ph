
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
        role: 'admin' // Assuming this action is only performed by admins
    };
}


export async function handleUpdateAdCampaign(
  campaignId: string,
  data: any
) {
  try {
    const actor = await getActor();
    const campaignRef = doc(db, 'adCampaigns', campaignId);
    await updateDoc(campaignRef, data);

    await logAdminAction({
        actor,
        action: 'AD_CAMPAIGN_UPDATED',
        details: { campaignId, changes: data }
    });

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
        const actor = await getActor();
        const newDoc = await addDoc(collection(db, 'adCampaigns'), { ...data, createdAt: serverTimestamp() });
        
        await logAdminAction({
            actor,
            action: 'AD_CAMPAIGN_CREATED',
            details: { campaignId: newDoc.id, name: data.name }
        });

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
    const actor = await getActor();
    const campaignRef = doc(db, 'adCampaigns', campaignId);
    await deleteDoc(campaignRef);

    await logAdminAction({
        actor,
        action: 'AD_CAMPAIGN_DELETED',
        details: { campaignId }
    });
    
    return {
      error: null,
      message: 'Ad campaign has been deleted successfully.',
    };
  } catch (e: any) {
    console.error('Error deleting ad campaign: ', e);
    return { error: e.message, message: 'Failed to delete ad campaign.' };
  }
}
