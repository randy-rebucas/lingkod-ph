'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion,
  orderBy
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'joinedAt', 'lastActiveAt', 'birthdate', 'lastMessageAt', 'timestamp'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const JobIdSchema = z.string().min(1, 'Job ID is required');
const ProviderIdSchema = z.string().min(1, 'Provider ID is required');
const ClientIdSchema = z.string().min(1, 'Client ID is required');

// Types
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  categoryName: string;
  budget: {
    amount: number;
    type: 'Fixed' | 'Daily' | 'Monthly';
    negotiable: boolean;
  };
  location: string;
  clientName: string;
  clientId: string;
  clientIsVerified?: boolean;
  createdAt: Date;
  applications?: string[]; // Array of provider IDs
  status?: string;
}

// Get all open jobs
export async function getOpenJobs(): Promise<ActionResult<Job[]>> {
  try {
    const jobsQuery = query(
      collection(getDb(), "jobs"), 
      where("status", "==", "Open"), 
      orderBy("createdAt", "desc")
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobs = jobsSnapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    return {
      success: true,
      data: jobs,
      message: 'Open jobs retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting open jobs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get open jobs',
      message: 'Could not retrieve open jobs'
    };
  }
}

// Get jobs by client ID
export async function getJobsByClient(clientId: string): Promise<ActionResult<Job[]>> {
  try {
    const validatedId = ClientIdSchema.parse(clientId);
    
    const jobsQuery = query(
      collection(getDb(), "jobs"), 
      where("clientId", "==", validatedId),
      orderBy("createdAt", "desc")
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobs = jobsSnapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    return {
      success: true,
      data: jobs,
      message: 'Client jobs retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting jobs by client:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get client jobs',
      message: 'Could not retrieve client jobs'
    };
  }
}

// Get jobs by provider applications
export async function getJobsByProvider(providerId: string): Promise<ActionResult<Job[]>> {
  try {
    const validatedId = ProviderIdSchema.parse(providerId);
    
    const jobsQuery = query(
      collection(getDb(), "jobs"), 
      where("applications", "array-contains", validatedId),
      orderBy("createdAt", "desc")
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobs = jobsSnapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    return {
      success: true,
      data: jobs,
      message: 'Provider jobs retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting jobs by provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider jobs',
      message: 'Could not retrieve provider jobs'
    };
  }
}

// Apply for a job
export async function applyForJob(jobId: string, providerId: string): Promise<ActionResult<any>> {
  try {
    const validatedJobId = JobIdSchema.parse(jobId);
    const validatedProviderId = ProviderIdSchema.parse(providerId);
    
    const jobRef = doc(getDb(), "jobs", validatedJobId);
    await updateDoc(jobRef, {
      applications: arrayUnion(validatedProviderId)
    });
    
    return {
      success: true,
      message: 'Successfully applied for job'
    };
  } catch (error) {
    console.error('Error applying for job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply for job',
      message: 'Could not apply for job'
    };
  }
}

// Get job by ID
export async function getJobById(jobId: string): Promise<ActionResult<Job>> {
  try {
    const validatedId = JobIdSchema.parse(jobId);
    
    const jobQuery = query(
      collection(getDb(), "jobs"), 
      where("__name__", "==", validatedId)
    );
    
    const jobSnapshot = await getDocs(jobQuery);
    
    if (jobSnapshot.empty) {
      return {
        success: false,
        error: 'Job not found',
        message: 'Could not find job'
      };
    }
    
    const job = serializeTimestamps({
      id: jobSnapshot.docs[0].id,
      ...jobSnapshot.docs[0].data(),
    });
    
    return {
      success: true,
      data: job,
      message: 'Job retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting job by ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job',
      message: 'Could not retrieve job'
    };
  }
}

// Update job status
export async function updateJobStatus(jobId: string, status: string): Promise<ActionResult<any>> {
  try {
    const validatedJobId = JobIdSchema.parse(jobId);
    const validatedStatus = z.string().min(1, 'Status is required').parse(status);
    
    const jobRef = doc(getDb(), "jobs", validatedJobId);
    await updateDoc(jobRef, {
      status: validatedStatus,
      updatedAt: new Date()
    });
    
    return {
      success: true,
      message: 'Job status updated successfully'
    };
  } catch (error) {
    console.error('Error updating job status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update job status',
      message: 'Could not update job status'
    };
  }
}

// Get jobs by category
export async function getJobsByCategory(categoryName: string): Promise<ActionResult<Job[]>> {
  try {
    const validatedCategory = z.string().min(1, 'Category name is required').parse(categoryName);
    
    const jobsQuery = query(
      collection(getDb(), "jobs"), 
      where("categoryName", "==", validatedCategory),
      where("status", "==", "Open"),
      orderBy("createdAt", "desc")
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobs = jobsSnapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    return {
      success: true,
      data: jobs,
      message: 'Jobs by category retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting jobs by category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get jobs by category',
      message: 'Could not retrieve jobs by category'
    };
  }
}

// Search jobs
export async function searchJobs(searchTerm: string): Promise<ActionResult<Job[]>> {
  try {
    const validatedSearchTerm = z.string().min(1, 'Search term is required').parse(searchTerm);
    
    // Get all open jobs first
    const jobsQuery = query(
      collection(getDb(), "jobs"), 
      where("status", "==", "Open"),
      orderBy("createdAt", "desc")
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    const allJobs = jobsSnapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    // Filter jobs based on search term
    const filteredJobs = allJobs.filter(job => 
      job.title?.toLowerCase().includes(validatedSearchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(validatedSearchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(validatedSearchTerm.toLowerCase()) ||
      job.categoryName?.toLowerCase().includes(validatedSearchTerm.toLowerCase())
    );
    
    return {
      success: true,
      data: filteredJobs,
      message: 'Job search completed successfully'
    };
  } catch (error) {
    console.error('Error searching jobs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search jobs',
      message: 'Could not search jobs'
    };
  }
}
