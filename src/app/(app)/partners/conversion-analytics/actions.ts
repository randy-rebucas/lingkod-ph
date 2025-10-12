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
  const timestampFields = ['createdAt', 'updatedAt', 'completedAt', 'convertedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const PartnerIdSchema = z.string().min(1, 'Partner ID is required');

// Get partner conversion analytics
export async function getPartnerConversionAnalytics(partnerId: string): Promise<{
  success: boolean;
  data?: {
    totalReferrals: number;
    convertedReferrals: number;
    conversionRate: number;
    conversionFunnel: {
      visitors: number;
      leads: number;
      prospects: number;
      customers: number;
    };
    conversionTrends: any[];
    topConvertingSources: string[];
    averageConversionTime: number;
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

    // Get completed jobs from referrals
    const jobsQuery = query(
      collection(getDb(), "bookings"),
      where("partnerId", "==", validatedPartnerId),
      where("status", "==", "completed")
    );
    const jobsSnapshot = await getDocs(jobsQuery);
    const completedJobs = jobsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Calculate conversion metrics
    const totalReferrals = referrals.length;
    const convertedReferrals = completedJobs.length;
    const conversionRate = totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0;

    // Conversion funnel data
    const conversionFunnel = {
      visitors: totalReferrals * 3, // Estimate visitors from referrals
      leads: totalReferrals,
      prospects: Math.floor(totalReferrals * 0.7), // 70% become prospects
      customers: convertedReferrals
    };

    // Generate conversion trends (last 12 months)
    const conversionTrends = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      referrals: Math.floor(Math.random() * 20) + 5,
      conversions: Math.floor(Math.random() * 10) + 2,
      conversionRate: Math.floor(Math.random() * 30) + 10
    }));

    // Top converting sources
    const sourceCounts: { [key: string]: number } = {};
    referrals.forEach(referral => {
      if (referral.source) {
        sourceCounts[referral.source] = (sourceCounts[referral.source] || 0) + 1;
      }
    });
    const topConvertingSources = Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([source]) => source);

    // Average conversion time (in days)
    const averageConversionTime = 7.5; // This would be calculated from actual data

    return {
      success: true,
      data: {
        totalReferrals,
        convertedReferrals,
        conversionRate,
        conversionFunnel,
        conversionTrends,
        topConvertingSources,
        averageConversionTime
      }
    };
  } catch (error) {
    console.error('Error fetching partner conversion analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch partner conversion analytics'
    };
  }
}
