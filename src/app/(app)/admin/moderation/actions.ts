
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
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

export async function handleUpdateReportStatus(
  reportId: string,
  status: 'Dismissed' | 'Action Taken'
) {
  try {
    const actor = await getActor();
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status });
    
    await logAdminAction({
        actor,
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
