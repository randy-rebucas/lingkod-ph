'use server';

import { getDb } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { verifyUserRole } from '@/lib/auth-utils';
import { auditLogger } from '@/lib/audit-logger';

export interface Job {
  id: string;
  title: string;
  description: string;
  clientId: string;
  status: 'Open' | 'Closed' | 'In Progress' | 'Completed';
  applications: string[];
  createdAt: Date;
  updatedAt: Date;
  budget?: number;
  location?: string;
  category?: string;
  requirements?: string[];
}

// Apply to job action
export async function applyToJob(data: {
  jobId: string;
  providerId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { jobId, providerId } = data;
    
    // Verify user role
    const isProvider = await verifyUserRole(providerId, ['provider']);
    if (!isProvider) {
      await auditLogger.logSecurityEvent(
        providerId,
        'provider',
        'unauthorized_job_application_attempt',
        { jobId, reason: 'Invalid role' }
      );
      return { success: false, error: 'Forbidden' };
    }

    const db = getDb();
    
    // Check if job exists and is open
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (!jobDoc.exists()) {
      await auditLogger.logSecurityEvent(
        providerId,
        'provider',
        'job_application_failed',
        { jobId, reason: 'Job not found' }
      );
      return { success: false, error: 'Job not found' };
    }

    const jobData = jobDoc.data();
    if (jobData.status !== 'Open') {
      await auditLogger.logSecurityEvent(
        providerId,
        'provider',
        'job_application_failed',
        { jobId, reason: 'Job not open' }
      );
      return { success: false, error: 'Job is not open for applications' };
    }

    // Check if provider already applied
    if (jobData.applications?.includes(providerId)) {
      await auditLogger.logSecurityEvent(
        providerId,
        'provider',
        'duplicate_job_application_attempt',
        { jobId }
      );
      return { success: false, error: 'Already applied to this job' };
    }

    // Apply to job
    await updateDoc(jobRef, {
      applications: arrayUnion(providerId)
    });

    // Log successful application
    await auditLogger.logAction(
      'job_application_successful',
      providerId,
      'jobs',
      { jobTitle: jobData.title, clientId: jobData.clientId, userRole: 'provider', jobId }
    );

    return { success: true };
  } catch (error) {
    console.error('Job application error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Get jobs with filters
export async function getJobs(params: {
  status?: string;
  category?: string;
  location?: string;
  limit?: number;
}): Promise<{ success: boolean; data?: Job[]; error?: string }> {
  try {
    const db = getDb();
    const jobsRef = collection(db, 'jobs');
    
    let q = query(jobsRef, orderBy('createdAt', 'desc'));
    
    // Apply filters
    if (params.status) {
      q = query(q, where('status', '==', params.status));
    }
    
    if (params.category) {
      q = query(q, where('category', '==', params.category));
    }
    
    if (params.location) {
      q = query(q, where('location', '==', params.location));
    }
    
    // Apply limit
    if (params.limit) {
      q = query(q, limit(params.limit));
    }
    
    const snapshot = await getDocs(q);
    const jobs: Job[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      } as Job);
    });
    
    return { success: true, data: jobs };
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return { success: false, error: 'Failed to fetch jobs' };
  }
}

// Get job by ID
export async function getJob(jobId: string): Promise<{ success: boolean; data?: Job; error?: string }> {
  try {
    const db = getDb();
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (!jobDoc.exists()) {
      return { success: false, error: 'Job not found' };
    }
    
    const jobData = jobDoc.data();
    const job: Job = {
      id: jobDoc.id,
      ...jobData,
      createdAt: jobData.createdAt?.toDate?.() || new Date(jobData.createdAt),
      updatedAt: jobData.updatedAt?.toDate?.() || new Date(jobData.updatedAt),
    } as Job;
    
    return { success: true, data: job };
  } catch (error) {
    console.error('Error fetching job:', error);
    return { success: false, error: 'Failed to fetch job' };
  }
}
