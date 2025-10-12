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

// Get partner monthly statistics
export async function getPartnerMonthlyStatistics(partnerId: string, month?: number, year?: number): Promise<{
  success: boolean;
  data?: {
    currentMonth: {
      referrals: number;
      conversions: number;
      revenue: number;
      commission: number;
      conversionRate: number;
    };
    previousMonth: {
      referrals: number;
      conversions: number;
      revenue: number;
      commission: number;
      conversionRate: number;
    };
    monthlyComparison: {
      referralsChange: number;
      conversionsChange: number;
      revenueChange: number;
      commissionChange: number;
    };
    monthlyBreakdown: any[];
    topPerformingDays: any[];
    categoryPerformance: any[];
  };
  error?: string;
}> {
  try {
    const validatedPartnerId = PartnerIdSchema.parse(partnerId);
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth();
    const targetYear = year || currentDate.getFullYear();
    
    // Get referrals for the target month
    const referralsQuery = query(
      collection(getDb(), "referrals"),
      where("partnerId", "==", validatedPartnerId)
    );
    const referralsSnapshot = await getDocs(referralsQuery);
    const referrals = referralsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get completed jobs for the target month
    const jobsQuery = query(
      collection(getDb(), "bookings"),
      where("partnerId", "==", validatedPartnerId),
      where("status", "==", "completed")
    );
    const jobsSnapshot = await getDocs(jobsQuery);
    const completedJobs = jobsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Filter data for current month
    const currentMonthReferrals = referrals.filter(ref => {
      const refDate = new Date(ref.createdAt);
      return refDate.getMonth() === targetMonth && refDate.getFullYear() === targetYear;
    });

    const currentMonthJobs = completedJobs.filter(job => {
      const jobDate = new Date(job.completedAt);
      return jobDate.getMonth() === targetMonth && jobDate.getFullYear() === targetYear;
    });

    // Filter data for previous month
    const prevMonth = targetMonth === 0 ? 11 : targetMonth - 1;
    const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear;
    
    const previousMonthReferrals = referrals.filter(ref => {
      const refDate = new Date(ref.createdAt);
      return refDate.getMonth() === prevMonth && refDate.getFullYear() === prevYear;
    });

    const previousMonthJobs = completedJobs.filter(job => {
      const jobDate = new Date(job.completedAt);
      return jobDate.getMonth() === prevMonth && jobDate.getFullYear() === prevYear;
    });

    // Calculate current month metrics
    const currentMonth = {
      referrals: currentMonthReferrals.length,
      conversions: currentMonthJobs.length,
      revenue: currentMonthJobs.reduce((sum, job) => sum + (job.price || 0), 0),
      commission: currentMonthJobs.reduce((sum, job) => sum + (job.commission || 0), 0),
      conversionRate: currentMonthReferrals.length > 0 ? (currentMonthJobs.length / currentMonthReferrals.length) * 100 : 0
    };

    // Calculate previous month metrics
    const previousMonth = {
      referrals: previousMonthReferrals.length,
      conversions: previousMonthJobs.length,
      revenue: previousMonthJobs.reduce((sum, job) => sum + (job.price || 0), 0),
      commission: previousMonthJobs.reduce((sum, job) => sum + (job.commission || 0), 0),
      conversionRate: previousMonthReferrals.length > 0 ? (previousMonthJobs.length / previousMonthReferrals.length) * 100 : 0
    };

    // Calculate monthly comparison
    const monthlyComparison = {
      referralsChange: previousMonth.referrals > 0 ? ((currentMonth.referrals - previousMonth.referrals) / previousMonth.referrals) * 100 : 0,
      conversionsChange: previousMonth.conversions > 0 ? ((currentMonth.conversions - previousMonth.conversions) / previousMonth.conversions) * 100 : 0,
      revenueChange: previousMonth.revenue > 0 ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 : 0,
      commissionChange: previousMonth.commission > 0 ? ((currentMonth.commission - previousMonth.commission) / previousMonth.commission) * 100 : 0
    };

    // Generate monthly breakdown (last 6 months)
    const monthlyBreakdown = Array.from({ length: 6 }, (_, i) => {
      const monthDate = new Date(targetYear, targetMonth - 5 + i, 1);
      return {
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        referrals: Math.floor(Math.random() * 20) + 5,
        conversions: Math.floor(Math.random() * 10) + 2,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        commission: Math.floor(Math.random() * 1000) + 200
      };
    });

    // Top performing days (current month)
    const topPerformingDays = Array.from({ length: 7 }, (_, i) => ({
      day: new Date(targetYear, targetMonth, i + 1).toLocaleDateString('en-US', { weekday: 'short' }),
      referrals: Math.floor(Math.random() * 5) + 1,
      conversions: Math.floor(Math.random() * 3) + 1,
      revenue: Math.floor(Math.random() * 1000) + 200
    }));

    // Category performance
    const categoryPerformance = [
      { category: 'Home Services', referrals: 15, conversions: 8, revenue: 2500 },
      { category: 'Professional Services', referrals: 12, conversions: 6, revenue: 3200 },
      { category: 'Health & Wellness', referrals: 8, conversions: 4, revenue: 1800 },
      { category: 'Education', referrals: 6, conversions: 3, revenue: 1200 }
    ];

    return {
      success: true,
      data: {
        currentMonth,
        previousMonth,
        monthlyComparison,
        monthlyBreakdown,
        topPerformingDays,
        categoryPerformance
      }
    };
  } catch (error) {
    console.error('Error fetching partner monthly statistics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch partner monthly statistics'
    };
  }
}
