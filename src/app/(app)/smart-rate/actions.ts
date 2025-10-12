'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit
} from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const RateCalculationSchema = z.object({
  serviceType: z.string().min(1, 'Service type is required'),
  location: z.string().min(1, 'Location is required'),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  duration: z.number().min(1, 'Duration must be positive'),
  complexity: z.enum(['simple', 'moderate', 'complex', 'expert']),
  marketDemand: z.enum(['low', 'medium', 'high'])
});

// Get market rates for a specific service and location
export async function getMarketRates(serviceType: string, location: string): Promise<{
  success: boolean;
  data?: {
    averageRate: number;
    rateRange: {
      min: number;
      max: number;
    };
    marketData: any[];
    locationFactors: any[];
  };
  error?: string;
}> {
  try {
    // Get completed bookings for similar services in the area
    const bookingsQuery = query(
      collection(getDb(), "bookings"),
      where("status", "==", "completed"),
      where("serviceType", "==", serviceType),
      where("location", "==", location),
      orderBy("completedAt", "desc"),
      limit(100)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map(doc => doc.data());

    if (bookings.length === 0) {
      // Fallback to general market data
      return {
        success: true,
        data: {
          averageRate: 2500,
          rateRange: { min: 1500, max: 4000 },
          marketData: [],
          locationFactors: [
            { factor: 'Cost of Living', impact: 'Medium', description: 'Higher cost areas typically have higher rates' },
            { factor: 'Competition Level', impact: 'High', description: 'More providers usually means competitive pricing' },
            { factor: 'Service Demand', impact: 'High', description: 'High demand areas can command premium rates' }
          ]
        }
      };
    }

    // Calculate market rates from actual data
    const rates = bookings.map(booking => booking.price || 0).filter(rate => rate > 0);
    const averageRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const sortedRates = rates.sort((a, b) => a - b);
    const rateRange = {
      min: sortedRates[0] || averageRate * 0.7,
      max: sortedRates[sortedRates.length - 1] || averageRate * 1.3
    };

    // Generate market data insights
    const marketData = [
      { metric: 'Average Rate', value: averageRate, trend: 'stable' },
      { metric: 'Rate Range', value: `${rateRange.min} - ${rateRange.max}`, trend: 'normal' },
      { metric: 'Sample Size', value: rates.length, trend: 'sufficient' }
    ];

    const locationFactors = [
      { factor: 'Local Economy', impact: 'High', description: 'Economic conditions affect service pricing' },
      { factor: 'Provider Density', impact: 'Medium', description: 'Number of providers in the area' },
      { factor: 'Service Demand', impact: 'High', description: 'How often this service is requested' }
    ];

    return {
      success: true,
      data: {
        averageRate: Math.round(averageRate),
        rateRange: {
          min: Math.round(rateRange.min),
          max: Math.round(rateRange.max)
        },
        marketData,
        locationFactors
      }
    };
  } catch (error) {
    console.error('Error fetching market rates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch market rates'
    };
  }
}

// Calculate smart rate based on multiple factors
export async function calculateSmartRate(rateData: {
  serviceType: string;
  location: string;
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  marketDemand: 'low' | 'medium' | 'high';
}): Promise<{
  success: boolean;
  data?: {
    recommendedRate: number;
    rateBreakdown: {
      baseRate: number;
      experienceMultiplier: number;
      complexityMultiplier: number;
      demandMultiplier: number;
      locationMultiplier: number;
    };
    confidence: number;
    recommendations: string[];
    alternativeRates: {
      conservative: number;
      aggressive: number;
      premium: number;
    };
  };
  error?: string;
}> {
  try {
    const validatedData = RateCalculationSchema.parse(rateData);
    
    // Get market rates first
    const marketRatesResult = await getMarketRates(validatedData.serviceType, validatedData.location);
    if (!marketRatesResult.success || !marketRatesResult.data) {
      throw new Error('Failed to get market rates');
    }

    const baseRate = marketRatesResult.data.averageRate;
    
    // Experience multipliers
    const experienceMultipliers = {
      beginner: 0.7,
      intermediate: 1.0,
      advanced: 1.3,
      expert: 1.6
    };

    // Complexity multipliers
    const complexityMultipliers = {
      simple: 0.8,
      moderate: 1.0,
      complex: 1.4,
      expert: 1.8
    };

    // Demand multipliers
    const demandMultipliers = {
      low: 0.9,
      medium: 1.0,
      high: 1.2
    };

    // Location multipliers (simplified)
    const locationMultiplier = 1.0; // This would be calculated based on location data

    // Calculate rate breakdown
    const experienceMultiplier = experienceMultipliers[validatedData.experience];
    const complexityMultiplier = complexityMultipliers[validatedData.complexity];
    const demandMultiplier = demandMultipliers[validatedData.marketDemand];

    const recommendedRate = Math.round(
      baseRate * 
      experienceMultiplier * 
      complexityMultiplier * 
      demandMultiplier * 
      locationMultiplier
    );

    const rateBreakdown = {
      baseRate,
      experienceMultiplier,
      complexityMultiplier,
      demandMultiplier,
      locationMultiplier
    };

    // Calculate confidence based on data availability
    const confidence = Math.min(95, 60 + (marketRatesResult.data.marketData[2]?.value || 0) * 2);

    // Generate recommendations
    const recommendations = [
      `Based on your ${validatedData.experience} experience level, you can command ${Math.round((experienceMultiplier - 1) * 100)}% above base rates`,
      `The ${validatedData.complexity} complexity of your service justifies a ${Math.round((complexityMultiplier - 1) * 100)}% premium`,
      `Market demand is ${validatedData.marketDemand}, which affects pricing by ${Math.round((demandMultiplier - 1) * 100)}%`,
      'Consider offering package deals for better value perception',
      'Monitor competitor rates regularly to stay competitive'
    ];

    // Alternative rate strategies
    const alternativeRates = {
      conservative: Math.round(recommendedRate * 0.9),
      aggressive: Math.round(recommendedRate * 1.1),
      premium: Math.round(recommendedRate * 1.3)
    };

    return {
      success: true,
      data: {
        recommendedRate,
        rateBreakdown,
        confidence,
        recommendations,
        alternativeRates
      }
    };
  } catch (error) {
    console.error('Error calculating smart rate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate smart rate'
    };
  }
}
