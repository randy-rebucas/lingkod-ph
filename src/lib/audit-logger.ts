
'use server';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

type Actor = {
    id: string;
    name: string | null;
    role: string;
};

type Action = 
    | 'USER_STATUS_UPDATED' | 'USER_DELETED' | 'USER_CREATED' | 'USER_UPDATED'
    | 'PAYOUT_PROCESSED'
    | 'REPORT_STATUS_UPDATED'
    | 'TICKET_STATUS_UPDATED' | 'TICKET_NOTE_ADDED'
    | 'JOB_STATUS_UPDATED' | 'JOB_DELETED'
    | 'AD_CAMPAIGN_CREATED' | 'AD_CAMPAIGN_UPDATED' | 'AD_CAMPAIGN_DELETED'
    | 'CATEGORY_CREATED' | 'CATEGORY_UPDATED' | 'CATEGORY_DELETED'
    | 'REWARD_CREATED' | 'REWARD_UPDATED' | 'REWARD_DELETED'
    | 'SUBSCRIPTION_PLAN_CREATED' | 'SUBSCRIPTION_PLAN_UPDATED' | 'SUBSCRIPTION_PLAN_DELETED'
    | 'PLATFORM_SETTINGS_UPDATED'
    | 'BROADCAST_SENT';

interface LogEntry {
    actor: Actor;
    action: Action;
    details: Record<string, any>;
    timestamp?: any;
}

export async function logAdminAction(entry: Omit<LogEntry, 'timestamp'>) {
    try {
        const auditLogsRef = collection(db, 'auditLogs');
        await addDoc(auditLogsRef, {
            ...entry,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to write to audit log:", error);
    }
}
