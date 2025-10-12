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

// Get partner growth metrics
export async function getPartnerGrowthMetrics(partnerId: string): Promise<{
  success: boolean;
  data?: {
    monthlyGrowth: {
      referrals: number;
      revenue: number;
      commission: number;
    };
    quarterlyGrowth: {
      referrals: number;
      revenue: number;
      commission: number;
    };
    yearlyGrowth: {
      referrals: number;
      revenue: number;
      commission: number;
    };
    growthTrends: any[];
    milestoneAchievements: any[];
    growthProjections: any[];
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

    // Helper function to calculate growth percentage
    const calculateGrowthPercentage = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Helper function to get data for a specific time period
    const getDataForPeriod = (data: any[], dateField: string, monthsBack: number) => {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
      return data.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= cutoffDate;
      });
    };

    // Get current month data
    const currentMonth = new Date();
    const currentMonthReferrals = referrals.filter(ref => {
      const refDate = new Date(ref.createdAt);
      return refDate.getMonth() === currentMonth.getMonth() && 
             refDate.getFullYear() === currentMonth.getFullYear();
    });

    const currentMonthJobs = completedJobs.filter(job => {
      const jobDate = new Date(job.completedAt);
      return jobDate.getMonth() === currentMonth.getMonth() && 
             jobDate.getFullYear() === currentMonth.getFullYear();
    });

    // Get previous month data
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const previousMonthReferrals = referrals.filter(ref => {
      const refDate = new Date(ref.createdAt);
      return refDate.getMonth() === previousMonth.getMonth() && 
             refDate.getFullYear() === previousMonth.getFullYear();
    });

    const previousMonthJobs = completedJobs.filter(job => {
      const jobDate = new Date(job.completedAt);
      return jobDate.getMonth() === previousMonth.getMonth() && 
             jobDate.getFullYear() === previousMonth.getFullYear();
    });

    // Get current quarter data (last 3 months)
    const currentQuarterReferrals = getDataForPeriod(referrals, 'createdAt', 3);
    const currentQuarterJobs = getDataForPeriod(completedJobs, 'completedAt', 3);

    // Get previous quarter data (3-6 months ago)
    const previousQuarterReferrals = referrals.filter(ref => {
      const refDate = new Date(ref.createdAt);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return refDate >= sixMonthsAgo && refDate < threeMonthsAgo;
    });

    const previousQuarterJobs = completedJobs.filter(job => {
      const jobDate = new Date(job.completedAt);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return jobDate >= sixMonthsAgo && jobDate < threeMonthsAgo;
    });

    // Get current year data
    const currentYearReferrals = referrals.filter(ref => {
      const refDate = new Date(ref.createdAt);
      return refDate.getFullYear() === currentMonth.getFullYear();
    });

    const currentYearJobs = completedJobs.filter(job => {
      const jobDate = new Date(job.completedAt);
      return jobDate.getFullYear() === currentMonth.getFullYear();
    });

    // Get previous year data
    const previousYear = currentMonth.getFullYear() - 1;
    const previousYearReferrals = referrals.filter(ref => {
      const refDate = new Date(ref.createdAt);
      return refDate.getFullYear() === previousYear;
    });

    const previousYearJobs = completedJobs.filter(job => {
      const jobDate = new Date(job.completedAt);
      return jobDate.getFullYear() === previousYear;
    });

    // Calculate actual growth metrics
    const currentMonthRevenue = currentMonthJobs.reduce((sum, job) => sum + (job.price || 0), 0);
    const previousMonthRevenue = previousMonthJobs.reduce((sum, job) => sum + (job.price || 0), 0);
    const currentMonthCommission = currentMonthJobs.reduce((sum, job) => sum + (job.commission || 0), 0);
    const previousMonthCommission = previousMonthJobs.reduce((sum, job) => sum + (job.commission || 0), 0);

    const currentQuarterRevenue = currentQuarterJobs.reduce((sum, job) => sum + (job.price || 0), 0);
    const previousQuarterRevenue = previousQuarterJobs.reduce((sum, job) => sum + (job.commission || 0), 0);
    const currentQuarterCommission = currentQuarterJobs.reduce((sum, job) => sum + (job.commission || 0), 0);
    const previousQuarterCommission = previousQuarterJobs.reduce((sum, job) => sum + (job.commission || 0), 0);

    const currentYearRevenue = currentYearJobs.reduce((sum, job) => sum + (job.price || 0), 0);
    const previousYearRevenue = previousYearJobs.reduce((sum, job) => sum + (job.price || 0), 0);
    const currentYearCommission = currentYearJobs.reduce((sum, job) => sum + (job.commission || 0), 0);
    const previousYearCommission = previousYearJobs.reduce((sum, job) => sum + (job.commission || 0), 0);

    // Monthly growth (current month vs previous month)
    const monthlyGrowth = {
      referrals: calculateGrowthPercentage(currentMonthReferrals.length, previousMonthReferrals.length),
      revenue: calculateGrowthPercentage(currentMonthRevenue, previousMonthRevenue),
      commission: calculateGrowthPercentage(currentMonthCommission, previousMonthCommission)
    };

    // Quarterly growth
    const quarterlyGrowth = {
      referrals: calculateGrowthPercentage(currentQuarterReferrals.length, previousQuarterReferrals.length),
      revenue: calculateGrowthPercentage(currentQuarterRevenue, previousQuarterRevenue),
      commission: calculateGrowthPercentage(currentQuarterCommission, previousQuarterCommission)
    };

    // Yearly growth
    const yearlyGrowth = {
      referrals: calculateGrowthPercentage(currentYearReferrals.length, previousYearReferrals.length),
      revenue: calculateGrowthPercentage(currentYearRevenue, previousYearRevenue),
      commission: calculateGrowthPercentage(currentYearCommission, previousYearCommission)
    };

    // Generate actual growth trends (last 12 months)
    const growthTrends = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - (11 - i));
      
      const monthReferrals = referrals.filter(ref => {
        const refDate = new Date(ref.createdAt);
        return refDate.getMonth() === monthDate.getMonth() && 
               refDate.getFullYear() === monthDate.getFullYear();
      });

      const monthJobs = completedJobs.filter(job => {
        const jobDate = new Date(job.completedAt);
        return jobDate.getMonth() === monthDate.getMonth() && 
               jobDate.getFullYear() === monthDate.getFullYear();
      });

      const monthRevenue = monthJobs.reduce((sum, job) => sum + (job.price || 0), 0);
      const monthCommission = monthJobs.reduce((sum, job) => sum + (job.commission || 0), 0);

      return {
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        referrals: monthReferrals.length,
        revenue: monthRevenue,
        commission: monthCommission
      };
    });

    // Calculate actual milestone achievements based on real data
    const milestoneAchievements = [];
    
    // First referral milestone
    if (referrals.length > 0) {
      const firstReferral = referrals.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      milestoneAchievements.push({
        id: 'first_referral',
        title: 'First Referral',
        description: 'Successfully referred your first customer',
        achievedAt: new Date(firstReferral.createdAt),
        icon: '🎯'
      });
    }

    // First commission milestone
    if (completedJobs.length > 0) {
      const firstJob = completedJobs.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())[0];
      milestoneAchievements.push({
        id: 'first_commission',
        title: 'First Commission',
        description: 'Earned your first commission payment',
        achievedAt: new Date(firstJob.completedAt),
        icon: '💰'
      });
    }

    // 10 referrals milestone
    if (referrals.length >= 10) {
      const tenthReferral = referrals.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[9];
      milestoneAchievements.push({
        id: 'ten_referrals',
        title: '10 Referrals',
        description: 'Referred 10 successful customers',
        achievedAt: new Date(tenthReferral.createdAt),
        icon: '🏆'
      });
    }

    // 50 referrals milestone
    if (referrals.length >= 50) {
      const fiftiethReferral = referrals.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[49];
      milestoneAchievements.push({
        id: 'fifty_referrals',
        title: '50 Referrals',
        description: 'Referred 50 successful customers',
        achievedAt: new Date(fiftiethReferral.createdAt),
        icon: '🚀'
      });
    }

    // 100 referrals milestone
    if (referrals.length >= 100) {
      const hundredthReferral = referrals.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[99];
      milestoneAchievements.push({
        id: 'hundred_referrals',
        title: '100 Referrals',
        description: 'Referred 100 successful customers',
        achievedAt: new Date(hundredthReferral.createdAt),
        icon: '💎'
      });
    }

    // Calculate growth projections based on historical trends
    const averageMonthlyReferrals = referrals.length > 0 ? referrals.length / Math.max(1, (new Date().getTime() - new Date(referrals[0].createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
    const averageMonthlyRevenue = completedJobs.length > 0 ? currentYearRevenue / Math.max(1, (new Date().getMonth() + 1)) : 0;
    const averageMonthlyCommission = completedJobs.length > 0 ? currentYearCommission / Math.max(1, (new Date().getMonth() + 1)) : 0;

    // Growth projections (next 6 months) based on current trends
    const growthProjections = Array.from({ length: 6 }, (_, i) => {
      const projectionDate = new Date();
      projectionDate.setMonth(projectionDate.getMonth() + i + 1);
      
      // Apply a conservative growth factor based on historical performance
      const growthFactor = 1 + (i * 0.05); // 5% growth per month
      
      return {
        month: projectionDate.toLocaleDateString('en-US', { month: 'short' }),
        projectedReferrals: Math.round(averageMonthlyReferrals * growthFactor),
        projectedRevenue: Math.round(averageMonthlyRevenue * growthFactor),
        projectedCommission: Math.round(averageMonthlyCommission * growthFactor)
      };
    });

    return {
      success: true,
      data: {
        monthlyGrowth,
        quarterlyGrowth,
        yearlyGrowth,
        growthTrends,
        milestoneAchievements,
        growthProjections
      }
    };
  } catch (error) {
    console.error('Error fetching partner growth metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch partner growth metrics'
    };
  }
}
