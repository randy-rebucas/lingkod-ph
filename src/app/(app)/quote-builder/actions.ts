'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const QuoteRequestSchema = z.object({
  serviceType: z.string().min(1, 'Service type is required'),
  description: z.string().min(1, 'Description is required'),
  budget: z.number().min(0, 'Budget must be positive'),
  timeline: z.string().min(1, 'Timeline is required'),
  location: z.string().min(1, 'Location is required'),
  contactInfo: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional()
  })
});

const UserIdSchema = z.string().min(1, 'User ID is required');

// Get service categories for quote builder
export async function getServiceCategories(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const categoriesQuery = query(
      collection(getDb(), "categories"),
      where("active", "==", true)
    );
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      data: categories
    };
  } catch (error) {
    console.error('Error fetching service categories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch service categories'
    };
  }
}

// Get providers for a specific service category
export async function getProvidersForCategory(categoryId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const providersQuery = query(
      collection(getDb(), "users"),
      where("role", "==", "provider"),
      where("categories", "array-contains", categoryId),
      where("active", "==", true)
    );
    const providersSnapshot = await getDocs(providersQuery);
    const providers = providersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      data: providers
    };
  } catch (error) {
    console.error('Error fetching providers for category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch providers'
    };
  }
}

// Submit quote request
export async function submitQuoteRequest(userId: string, quoteData: {
  serviceType: string;
  description: string;
  budget: number;
  timeline: string;
  location: string;
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
  };
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedQuote = QuoteRequestSchema.parse(quoteData);
    
    const quoteRef = await addDoc(collection(getDb(), "quoteRequests"), {
      ...validatedQuote,
      userId: validatedUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      data: { id: quoteRef.id }
    };
  } catch (error) {
    console.error('Error submitting quote request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit quote request'
    };
  }
}

// Calculate estimated quote based on service type and requirements
export async function calculateQuoteEstimate(serviceType: string, description: string, budget: number): Promise<{
  success: boolean;
  data?: {
    estimatedPrice: number;
    priceRange: {
      min: number;
      max: number;
    };
    factors: string[];
    recommendations: string[];
  };
  error?: string;
}> {
  try {
    // This would typically involve more complex logic based on service type
    // For now, we'll provide a simple estimation
    
    let basePrice = 0;
    let priceMultiplier = 1;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Base pricing by service type
    switch (serviceType.toLowerCase()) {
      case 'home services':
        basePrice = 2000;
        factors.push('Service complexity', 'Location accessibility', 'Materials needed');
        break;
      case 'professional services':
        basePrice = 5000;
        factors.push('Expertise level required', 'Project duration', 'Deliverables complexity');
        break;
      case 'health & wellness':
        basePrice = 1500;
        factors.push('Session duration', 'Specialist type', 'Location requirements');
        break;
      case 'education':
        basePrice = 3000;
        factors.push('Subject complexity', 'Student level', 'Session frequency');
        break;
      default:
        basePrice = 2500;
        factors.push('Service complexity', 'Time requirements', 'Specialized skills');
    }

    // Adjust based on description complexity
    if (description.length > 200) {
      priceMultiplier += 0.2;
      factors.push('Detailed requirements');
    }

    // Adjust based on budget indication
    if (budget > basePrice * 2) {
      priceMultiplier += 0.3;
      recommendations.push('Consider premium service providers');
    } else if (budget < basePrice * 0.5) {
      priceMultiplier -= 0.2;
      recommendations.push('Look for budget-friendly options');
    }

    const estimatedPrice = Math.round(basePrice * priceMultiplier);
    const priceRange = {
      min: Math.round(estimatedPrice * 0.7),
      max: Math.round(estimatedPrice * 1.5)
    };

    recommendations.push('Get quotes from multiple providers', 'Consider timeline flexibility for better pricing');

    return {
      success: true,
      data: {
        estimatedPrice,
        priceRange,
        factors,
        recommendations
      }
    };
  } catch (error) {
    console.error('Error calculating quote estimate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate quote estimate'
    };
  }
}
