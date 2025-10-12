'use server';

import { getDb } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = [
    'createdAt', 'updatedAt', 'joinedAt', 'postedAt', 'submittedAt', 'endDate', 
    'date', 'favoritedAt', 'timestamp', 'establishedDate'
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
const ProviderIdSchema = z.string().min(1, 'Provider ID is required');

// Get provider details
export async function getProviderDetails(providerId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const validatedProviderId = ProviderIdSchema.parse(providerId);
    
    const providerRef = doc(getDb(), "users", validatedProviderId);
    const providerSnap = await getDoc(providerRef);
    
    if (!providerSnap.exists()) {
      return {
        success: false,
        error: 'Provider not found'
      };
    }

    const providerData = serializeTimestamps({ id: providerSnap.id, ...providerSnap.data() });

    return {
      success: true,
      data: providerData
    };
  } catch (error) {
    console.error('Error fetching provider details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch provider details'
    };
  }
}

// Get provider services
export async function getProviderServices(providerId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedProviderId = ProviderIdSchema.parse(providerId);
    
    const servicesQuery = query(
      collection(getDb(), "services"),
      where("providerId", "==", validatedProviderId),
      orderBy("createdAt", "desc")
    );
    const servicesSnapshot = await getDocs(servicesQuery);
    const services = servicesSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    return {
      success: true,
      data: services
    };
  } catch (error) {
    console.error('Error fetching provider services:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch provider services'
    };
  }
}

// Get provider reviews
export async function getProviderReviews(providerId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedProviderId = ProviderIdSchema.parse(providerId);
    
    const reviewsQuery = query(
      collection(getDb(), "reviews"),
      where("providerId", "==", validatedProviderId),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    return {
      success: true,
      data: reviews
    };
  } catch (error) {
    console.error('Error fetching provider reviews:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch provider reviews'
    };
  }
}

// Get provider portfolio
export async function getProviderPortfolio(providerId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedProviderId = ProviderIdSchema.parse(providerId);
    
    const portfolioQuery = query(
      collection(getDb(), "portfolio"),
      where("providerId", "==", validatedProviderId),
      orderBy("createdAt", "desc")
    );
    const portfolioSnapshot = await getDocs(portfolioQuery);
    const portfolio = portfolioSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    return {
      success: true,
      data: portfolio
    };
  } catch (error) {
    console.error('Error fetching provider portfolio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch provider portfolio'
    };
  }
}
