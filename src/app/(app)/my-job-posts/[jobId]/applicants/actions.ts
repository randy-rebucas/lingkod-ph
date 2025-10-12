'use server';

import { getDb } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  where, 
  query,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'appliedAt', 'joinedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const JobIdSchema = z.string().min(1, 'Job ID is required');
const ApplicationIdSchema = z.string().min(1, 'Application ID is required');

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

// Get job applicants
export async function getJobApplicants(jobId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedJobId = JobIdSchema.parse(jobId);
    
    // Get applications for this job
    const applicationsQuery = query(
      collection(getDb(), "applications"),
      where("jobId", "==", validatedJobId)
    );
    const applicationsSnapshot = await getDocs(applicationsQuery);
    
    const applications = [];
    for (const appDoc of applicationsSnapshot.docs) {
      const appData = serializeTimestamps({ id: appDoc.id, ...appDoc.data() });
      
      // Get provider details
      const providerRef = doc(getDb(), "users", appData.providerId);
      const providerSnap = await getDoc(providerRef);
      
      if (providerSnap.exists()) {
        const providerData = serializeTimestamps(providerSnap.data());
        applications.push({
          ...appData,
          provider: {
            uid: providerSnap.id,
            ...providerData
          }
        });
      }
    }

    return {
      success: true,
      data: applications
    };
  } catch (error) {
    console.error('Error fetching job applicants:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch job applicants'
    };
  }
}

// Update application status
export async function updateApplicationStatus(applicationId: string, status: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedApplicationId = ApplicationIdSchema.parse(applicationId);
    
    const applicationRef = doc(getDb(), "applications", validatedApplicationId);
    await updateDoc(applicationRef, {
      status: status,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating application status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update application status'
    };
  }
}
