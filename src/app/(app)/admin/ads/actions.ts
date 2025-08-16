
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

type Actor = {
    id: string;
    name: string | null;
}

export async function handleUpdateAdCampaign(
  campaignId: string,
  data: any,
  actor: Actor
) {
  try {
    const campaignRef = doc(db, 'adCampaigns', campaignId);
    await updateDoc(campaignRef, data);

    await logAdminAction({
        actor: { ...actor, role: 'admin' },
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

export async function handleAddAdCampaign(data: any, actor: Actor) {
    if (!data.name || !data.price || !data.durationDays) {
        return { error: 'Invalid data provided.', message: 'Validation failed.' };
    }
    try {
        const newDoc = await addDoc(collection(db, 'adCampaigns'), { ...data, createdAt: serverTimestamp() });
        
        await logAdminAction({
            actor: { ...actor, role: 'admin' },
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

export async function handleDeleteAdCampaign(campaignId: string, actor: Actor) {
  try {
    const campaignRef = doc(db, 'adCampaigns', campaignId);
    await deleteDoc(campaignRef);

    await logAdminAction({
        actor: { ...actor, role: 'admin' },
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
