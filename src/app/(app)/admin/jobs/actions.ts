
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

export async function handleUpdateJobStatus(
  jobId: string,
  status: string
) {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, { status });

    return {
      error: null,
      message: `Job status updated to ${status}.`,
    };
  } catch (e: any) {
    console.error('Error updating job status: ', e);
    return { error: e.message, message: 'Failed to update job status.' };
  }
}

export async function handleDeleteJob(jobId: string) {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await deleteDoc(jobRef);
    return {
      error: null,
      message: 'Job has been deleted successfully.',
    };
  } catch (e: any) {
    console.error('Error deleting job: ', e);
    return { error: e.message, message: 'Failed to delete job.' };
  }
}
