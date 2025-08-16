
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/audit-logger';

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
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status });
    
    await logAdminAction({
        actor: { ...actor, role: 'admin' },
        action: 'REPORT_STATUS_UPDATED',
        details: { reportId, newStatus: status }
    });

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
