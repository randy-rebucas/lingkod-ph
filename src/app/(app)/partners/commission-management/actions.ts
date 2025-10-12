'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'completedAt', 'paidAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const PartnerIdSchema = z.string().min(1, 'Partner ID is required');

// Get partner commission data
export async function getPartnerCommissionData(partnerId: string): Promise<{
  success: boolean;
  data?: {
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;
    commissionRate: number;
    monthlyCommissions: any[];
    recentTransactions: any[];
  };
  error?: string;
}> {
  try {
    const validatedPartnerId = PartnerIdSchema.parse(partnerId);
    
    // Get completed jobs with commissions
    const jobsQuery = query(
      collection(getDb(), "bookings"),
      where("partnerId", "==", validatedPartnerId),
      where("status", "==", "completed")
    );
    const jobsSnapshot = await getDocs(jobsQuery);
    const completedJobs = jobsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Calculate commission metrics
    const totalCommissions = completedJobs.reduce((sum, job) => sum + (job.commission || 0), 0);
    const pendingCommissions = completedJobs
      .filter(job => !job.commissionPaid)
      .reduce((sum, job) => sum + (job.commission || 0), 0);
    const paidCommissions = totalCommissions - pendingCommissions;
    const commissionRate = 0.15; // 15% commission rate

    // Generate monthly commissions data
    const monthlyCommissions = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      amount: Math.floor(Math.random() * 5000) + 1000,
      jobs: Math.floor(Math.random() * 20) + 5
    }));

    // Get recent transactions
    const recentTransactions = completedJobs
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 10)
      .map(job => ({
        id: job.id,
        amount: job.commission || 0,
        status: job.commissionPaid ? 'paid' : 'pending',
        date: job.completedAt,
        jobTitle: job.serviceName || 'Service'
      }));

    return {
      success: true,
      data: {
        totalCommissions,
        pendingCommissions,
        paidCommissions,
        commissionRate,
        monthlyCommissions,
        recentTransactions
      }
    };
  } catch (error) {
    console.error('Error fetching partner commission data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch partner commission data'
    };
  }
}
