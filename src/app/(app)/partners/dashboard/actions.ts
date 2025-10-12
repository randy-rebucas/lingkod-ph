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
  const timestampFields = ['createdAt', 'updatedAt', 'joinedAt', 'completedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const PartnerIdSchema = z.string().min(1, 'Partner ID is required');

// Get partner dashboard data
export async function getPartnerDashboardData(partnerId: string): Promise<{
  success: boolean;
  data?: {
    totalReferrals: number;
    activeReferrals: number;
    completedJobs: number;
    totalRevenue: number;
    totalCommission: number;
    conversionRate: number;
    averageJobValue: number;
    topCategories: string[];
    monthlyGrowth: number;
  };
  error?: string;
}> {
  try {
    const validatedPartnerId = PartnerIdSchema.parse(partnerId);
    
    // Get referrals
    const referralsQuery = query(
      collection(getDb(), "referrals"),
      where("partnerId", "==", validatedPartnerId)
    );
    const referralsSnapshot = await getDocs(referralsQuery);
    const referrals = referralsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get completed jobs
    const jobsQuery = query(
      collection(getDb(), "bookings"),
      where("partnerId", "==", validatedPartnerId),
      where("status", "==", "completed")
    );
    const jobsSnapshot = await getDocs(jobsQuery);
    const completedJobs = jobsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Calculate metrics
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(r => r.status === 'active').length;
    const completedJobsCount = completedJobs.length;
    const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0);
    const totalCommission = completedJobs.reduce((sum, job) => sum + (job.commission || 0), 0);
    const conversionRate = totalReferrals > 0 ? (completedJobsCount / totalReferrals) * 100 : 0;
    const averageJobValue = completedJobsCount > 0 ? totalRevenue / completedJobsCount : 0;

    // Get top categories
    const categoryCounts: { [key: string]: number } = {};
    completedJobs.forEach(job => {
      if (job.categoryName) {
        categoryCounts[job.categoryName] = (categoryCounts[job.categoryName] || 0) + 1;
      }
    });
    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Calculate monthly growth (simplified)
    const monthlyGrowth = 15.2; // This would be calculated from historical data

    return {
      success: true,
      data: {
        totalReferrals,
        activeReferrals,
        completedJobs: completedJobsCount,
        totalRevenue,
        totalCommission,
        conversionRate,
        averageJobValue,
        topCategories,
        monthlyGrowth
      }
    };
  } catch (error) {
    console.error('Error fetching partner dashboard data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch partner dashboard data'
    };
  }
}
