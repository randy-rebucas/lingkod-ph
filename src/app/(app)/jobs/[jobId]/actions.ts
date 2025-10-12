'use server';

import { getDb } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  collection,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'postedAt', 'deadline'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const JobIdSchema = z.string().min(1, 'Job ID is required');
const ApplicationSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  coverLetter: z.string().min(1, 'Cover letter is required'),
  proposedRate: z.number().min(0, 'Proposed rate must be positive')
});

// Get job details
export async function getJobDetails(jobId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const validatedJobId = JobIdSchema.parse(jobId);
    
    const jobRef = doc(getDb(), "jobs", validatedJobId);
    const jobSnap = await getDoc(jobRef);
    
    if (!jobSnap.exists()) {
      return {
        success: false,
        error: 'Job not found'
      };
    }

    const jobData = serializeTimestamps({ id: jobSnap.id, ...jobSnap.data() });

    return {
      success: true,
      data: jobData
    };
  } catch (error) {
    console.error('Error fetching job details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch job details'
    };
  }
}

// Apply to job
export async function applyToJob(jobId: string, applicationData: {
  providerId: string;
  coverLetter: string;
  proposedRate: number;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedJobId = JobIdSchema.parse(jobId);
    const validatedApplication = ApplicationSchema.parse(applicationData);
    
    // Add application to applications collection
    await addDoc(collection(getDb(), "applications"), {
      jobId: validatedJobId,
      providerId: validatedApplication.providerId,
      coverLetter: validatedApplication.coverLetter,
      proposedRate: validatedApplication.proposedRate,
      status: "pending",
      appliedAt: serverTimestamp()
    });

    // Update job with new application
    const jobRef = doc(getDb(), "jobs", validatedJobId);
    await updateDoc(jobRef, {
      applications: arrayUnion({
        providerId: validatedApplication.providerId,
        appliedAt: serverTimestamp()
      }),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error applying to job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply to job'
    };
  }
}
