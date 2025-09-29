
'use server';

import { getDb  } from '@/lib/firebase';
import {
  doc,
  updateDoc,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { AuditLogger } from '@/lib/audit-logger';

type Actor = {
    id: string;
    name: string | null;
}

export async function handleUpdateReportStatus(
  reportId: string,
  status: 'Dismissed' | 'Action Taken',
  actor: Actor,
) {
  try {
    const reportRef = doc(getDb(), 'reports', reportId);
    await updateDoc(reportRef, { status });
    
    await AuditLogger.getInstance().logAction(
        actor.id,
        'reports',
        'REPORT_STATUS_UPDATED',
        { reportId, newStatus: status, actorRole: 'admin' }
    );

    // Revalidate the path to update the UI
    revalidatePath('/admin/moderation');

    return {
      error: null,
      message: `Report status updated to ${status}.`,
    };
  } catch (e: any) {
    console.error('Error updating report status: ', e);
    return { error: e.message, message: 'Failed to update report status.' };
  }
}
