'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = [
    'createdAt', 'updatedAt', 'joinedAt', 'lastActiveAt', 'birthdate', 'lastMessageAt', 
    'timestamp', 'deadline', 'submittedAt', 'endDate', 'date', 'favoritedAt', 'establishedDate'
  ];
  
  // Handle top-level timestamp fields
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  // Handle nested timestamp fields in verification object
  if (serialized.verification && typeof serialized.verification === 'object') {
    const verification = { ...serialized.verification };
    timestampFields.forEach(field => {
      if (verification[field] && typeof verification[field].toDate === 'function') {
        verification[field] = verification[field].toDate();
      }
    });
    serialized.verification = verification;
  }
  
  // Handle nested timestamp fields in other common nested objects
  const nestedObjects = ['payoutDetails', 'documents', 'metadata'];
  nestedObjects.forEach(objKey => {
    if (serialized[objKey] && typeof serialized[objKey] === 'object') {
      if (Array.isArray(serialized[objKey])) {
        serialized[objKey] = serialized[objKey].map((item: any) => 
          typeof item === 'object' ? serializeTimestamps(item) : item
        );
      } else {
        serialized[objKey] = serializeTimestamps(serialized[objKey]);
      }
    }
  });
  
  return serialized;
};

// Validation schemas
const ClientIdSchema = z.string().min(1, 'Client ID is required');
const JobIdSchema = z.string().min(1, 'Job ID is required');
const JobStatusSchema = z.enum(['Open', 'In Progress', 'Completed', 'Closed']);

// Types
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type JobStatus = "Open" | "In Progress" | "Completed" | "Closed";

export interface Job {
  id: string;
  title: string;
  status: JobStatus;
  budget: {
    amount: number;
    type: 'Fixed' | 'Daily' | 'Monthly';
    negotiable: boolean;
  };
  applications: string[]; // Array of provider IDs
  description?: string;
  category?: string;
  location?: string;
  clientId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Get jobs by client ID
export async function getClientJobs(clientId: string): Promise<ActionResult<Job[]>> {
  try {
    const validatedClientId = ClientIdSchema.parse(clientId);
    
    const jobsQuery = query(
      collection(getDb(), "jobs"), 
      where("clientId", "==", validatedClientId),
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
    console.error('Error getting client jobs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get client jobs',
      message: 'Could not retrieve client jobs'
    };
  }
}

// Update job status
export async function updateJobStatus(jobId: string, status: JobStatus): Promise<ActionResult<any>> {
  try {
    const validatedJobId = JobIdSchema.parse(jobId);
    const validatedStatus = JobStatusSchema.parse(status);
    
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

// Delete job
export async function deleteJob(jobId: string): Promise<ActionResult<any>> {
  try {
    const validatedJobId = JobIdSchema.parse(jobId);
    
    const jobRef = doc(getDb(), "jobs", validatedJobId);
    await deleteDoc(jobRef);
    
    return {
      success: true,
      message: 'Job deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete job',
      message: 'Could not delete job'
    };
  }
}

// Get job by ID
export async function getJobById(jobId: string): Promise<ActionResult<Job>> {
  try {
    const validatedJobId = JobIdSchema.parse(jobId);
    
    const jobQuery = query(
      collection(getDb(), "jobs"), 
      where("__name__", "==", validatedJobId)
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

// Search jobs by client
export async function searchClientJobs(clientId: string, searchTerm: string): Promise<ActionResult<Job[]>> {
  try {
    const validatedClientId = ClientIdSchema.parse(clientId);
    const validatedSearchTerm = z.string().min(1, 'Search term is required').parse(searchTerm);
    
    // Get all client jobs first
    const result = await getClientJobs(validatedClientId);
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to get client jobs',
        message: 'Could not retrieve client jobs'
      };
    }
    
    // Filter jobs based on search term
    const filteredJobs = result.data.filter(job => 
      job.title?.toLowerCase().includes(validatedSearchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(validatedSearchTerm.toLowerCase()) ||
      job.category?.toLowerCase().includes(validatedSearchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(validatedSearchTerm.toLowerCase())
    );
    
    return {
      success: true,
      data: filteredJobs,
      message: 'Job search completed successfully'
    };
  } catch (error) {
    console.error('Error searching client jobs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search client jobs',
      message: 'Could not search client jobs'
    };
  }
}

// Get jobs by status
export async function getClientJobsByStatus(clientId: string, status: JobStatus): Promise<ActionResult<Job[]>> {
  try {
    const validatedClientId = ClientIdSchema.parse(clientId);
    const validatedStatus = JobStatusSchema.parse(status);
    
    // Get all client jobs first
    const result = await getClientJobs(validatedClientId);
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to get client jobs',
        message: 'Could not retrieve client jobs'
      };
    }
    
    // Filter jobs by status
    const filteredJobs = result.data.filter(job => job.status === validatedStatus);
    
    return {
      success: true,
      data: filteredJobs,
      message: 'Jobs by status retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting client jobs by status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get client jobs by status',
      message: 'Could not retrieve client jobs by status'
    };
  }
}

// Get job statistics
export async function getClientJobStats(clientId: string): Promise<ActionResult<{
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  closed: number;
  totalApplications: number;
}>> {
  try {
    const validatedClientId = ClientIdSchema.parse(clientId);
    
    // Get all client jobs
    const result = await getClientJobs(validatedClientId);
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to get client jobs',
        message: 'Could not retrieve client jobs'
      };
    }
    
    const jobs = result.data;
    const stats = {
      total: jobs.length,
      open: jobs.filter(job => job.status === 'Open').length,
      inProgress: jobs.filter(job => job.status === 'In Progress').length,
      completed: jobs.filter(job => job.status === 'Completed').length,
      closed: jobs.filter(job => job.status === 'Closed').length,
      totalApplications: jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0)
    };
    
    return {
      success: true,
      data: stats,
      message: 'Job statistics retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting client job stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get client job stats',
      message: 'Could not retrieve client job statistics'
    };
  }
}
