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
  const timestampFields = ['createdAt', 'updatedAt', 'completedAt', 'joinedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const PartnerIdSchema = z.string().min(1, 'Partner ID is required');

// Get partner analytics data
export async function getPartnerAnalytics(partnerId: string): Promise<{
  success: boolean;
  data?: {
    totalReferrals: number;
    activeReferrals: number;
    completedJobs: number;
    totalRevenue: number;
    conversionRate: number;
    monthlyGrowth: number;
    topCategories: string[];
    referralTrends: any[];
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
    const conversionRate = totalReferrals > 0 ? (completedJobsCount / totalReferrals) * 100 : 0;
    const monthlyGrowth = 12.5; // This would be calculated from historical data

    // Get top categories
    const categoryCounts: { [key: string]: number } = {};
    completedJobs.forEach(job => {
      if (job.categoryName) {
        categoryCounts[job.categoryName] = (categoryCounts[job.categoryName] || 0) + 1;
      }
    });
    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    // Generate referral trends (simplified)
    const referralTrends = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      referrals: Math.floor(Math.random() * 20) + 5,
      conversions: Math.floor(Math.random() * 10) + 2
    }));

    return {
      success: true,
      data: {
        totalReferrals,
        activeReferrals,
        completedJobs: completedJobsCount,
        totalRevenue,
        conversionRate,
        monthlyGrowth,
        topCategories,
        referralTrends
      }
    };
  } catch (error) {
    console.error('Error fetching partner analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch partner analytics'
    };
  }
}
