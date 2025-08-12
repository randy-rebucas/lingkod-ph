
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function handleUpdateReportStatus(
  reportId: string,
  status: 'Dismissed' | 'Action Taken'
) {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status });
    
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
