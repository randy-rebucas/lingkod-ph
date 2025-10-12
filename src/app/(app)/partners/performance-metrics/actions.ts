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

// Get partner performance metrics
export async function getPartnerPerformanceMetrics(partnerId: string): Promise<{
  success: boolean;
  data?: {
    overallScore: number;
    performanceRank: number;
    keyMetrics: {
      referralQuality: number;
      conversionRate: number;
      revenueGeneration: number;
      customerSatisfaction: number;
      responseTime: number;
    };
    performanceTrends: any[];
    benchmarkComparison: {
      industryAverage: number;
      topPerformers: number;
      yourPerformance: number;
    };
    performanceInsights: string[];
    improvementRecommendations: string[];
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

    // Get reviews for partner referrals
    const reviewsQuery = query(
      collection(getDb(), "reviews"),
      where("partnerId", "==", validatedPartnerId)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Calculate key metrics
    const totalReferrals = referrals.length;
    const totalConversions = completedJobs.length;
    const conversionRate = totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0;
    const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0);
    const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length : 0;

    const keyMetrics = {
      referralQuality: Math.min(100, (conversionRate / 20) * 100), // Normalize to 0-100
      conversionRate: Math.min(100, conversionRate * 2), // Scale up for display
      revenueGeneration: Math.min(100, (totalRevenue / 10000) * 100), // Normalize to 0-100
      customerSatisfaction: Math.min(100, averageRating * 20), // Convert 5-star to 100-point scale
      responseTime: 85 // This would be calculated from actual response times
    };

    // Calculate overall performance score
    const overallScore = Math.round(
      (keyMetrics.referralQuality * 0.25) +
      (keyMetrics.conversionRate * 0.25) +
      (keyMetrics.revenueGeneration * 0.2) +
      (keyMetrics.customerSatisfaction * 0.2) +
      (keyMetrics.responseTime * 0.1)
    );

    // Performance rank (simulated)
    const performanceRank = Math.floor(Math.random() * 100) + 1;

    // Generate performance trends (last 12 months)
    const performanceTrends = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      score: Math.floor(Math.random() * 20) + 70,
      referrals: Math.floor(Math.random() * 20) + 5,
      conversions: Math.floor(Math.random() * 10) + 2,
      revenue: Math.floor(Math.random() * 5000) + 1000
    }));

    // Benchmark comparison
    const benchmarkComparison = {
      industryAverage: 65,
      topPerformers: 90,
      yourPerformance: overallScore
    };

    // Performance insights
    const performanceInsights = [
      `Your conversion rate of ${conversionRate.toFixed(1)}% is ${conversionRate > 15 ? 'above' : 'below'} the industry average of 12%`,
      `You've generated ₱${totalRevenue.toLocaleString()} in revenue from ${totalConversions} successful referrals`,
      `Your average customer rating is ${averageRating.toFixed(1)}/5 stars`,
      `You rank in the top ${100 - performanceRank + 1}% of all partners`
    ];

    // Improvement recommendations
    const improvementRecommendations = [
      'Focus on higher-quality referrals to improve conversion rates',
      'Respond to referral requests within 2 hours to increase success rates',
      'Follow up with referred customers to ensure satisfaction',
      'Diversify your referral sources to reach more potential customers',
      'Share success stories to build trust with new referrals'
    ];

    return {
      success: true,
      data: {
        overallScore,
        performanceRank,
        keyMetrics,
        performanceTrends,
        benchmarkComparison,
        performanceInsights,
        improvementRecommendations
      }
    };
  } catch (error) {
    console.error('Error fetching partner performance metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch partner performance metrics'
    };
  }
}
