
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { AuditLogger } from '@/lib/audit-logger';

type Actor = {
    id: string;
    name: string | null;
}

export async function handleUpdateJobStatus(
  jobId: string,
  status: string,
  actor: Actor,
) {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, { status });

    await AuditLogger.getInstance().logAction(
        actor.id,
        'jobs',
        'JOB_STATUS_UPDATED',
        { jobId, newStatus: status, actorRole: 'admin' }
    );

    return {
      error: null,
      message: `Job status updated to ${status}.`,
    };
  } catch (e: any) {
    console.error('Error updating job status: ', e);
    return { error: e.message, message: 'Failed to update job status.' };
  }
}

export async function handleDeleteJob(jobId: string, actor: Actor) {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await deleteDoc(jobRef);

    await AuditLogger.getInstance().logAction(
        actor.id,
        'jobs',
        'JOB_DELETED',
        { jobId, actorRole: 'admin' }
    );

    return {
      error: null,
      message: 'Job has been deleted successfully.',
    };
  } catch (e: any) {
    console.error('Error deleting job: ', e);
    return { error: e.message, message: 'Failed to delete job.' };
  }
}
