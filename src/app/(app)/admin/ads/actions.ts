
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
import { AuditLogger } from '@/lib/audit-logger';

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


    await AuditLogger.getInstance().logAction(
      'AD_CAMPAIGN_UPDATED',
      actor.id,
      'broadcast',
      { campaignId, changes: data, actorRole: 'admin' }
  );

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
        
        await AuditLogger.getInstance().logAction(
            'AD_CAMPAIGN_CREATED',
            actor.id,
            'ad_campaign',
            { campaignId: newDoc.id, name: data.name, actorRole: 'admin' }
        );

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

    await AuditLogger.getInstance().logAction(
        'AD_CAMPAIGN_DELETED',
        actor.id,
        'ad_campaign',
        { campaignId, actorRole: 'admin' }
    );
    
    return {
      error: null,
      message: 'Ad campaign has been deleted successfully.',
    };
  } catch (e: any) {
    console.error('Error deleting ad campaign: ', e);
    return { error: e.message, message: 'Failed to delete ad campaign.' };
  }
}
