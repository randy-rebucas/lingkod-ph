'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'appliedAt', 'deadline'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

// Get applied jobs for a user
export async function getAppliedJobs(userId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    // Get job applications for this user
    const applicationsQuery = query(
      collection(getDb(), "jobApplications"), 
      where("applicantId", "==", validatedUserId),
      orderBy("appliedAt", "desc")
    );
    const applicationsSnapshot = await getDocs(applicationsQuery);
    const applications = applicationsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get job details for each application
    const jobIds = applications.map(app => app.jobId);
    if (jobIds.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    const jobsQuery = query(
      collection(getDb(), "jobs"), 
      where("__name__", "in", jobIds)
    );
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobs = jobsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Combine applications with job details
    const appliedJobs = applications.map(application => {
      const job = jobs.find(j => j.id === application.jobId);
      return {
        ...application,
        job: job || null
      };
    });

    return {
      success: true,
      data: appliedJobs
    };
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch applied jobs'
    };
  }
}
