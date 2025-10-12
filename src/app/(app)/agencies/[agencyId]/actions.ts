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
const AgencyIdSchema = z.string().min(1, 'Agency ID is required');

// Get agency details
export async function getAgencyDetails(agencyId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const validatedAgencyId = AgencyIdSchema.parse(agencyId);
    
    const agencyRef = doc(getDb(), "users", validatedAgencyId);
    const agencySnap = await getDoc(agencyRef);
    
    if (!agencySnap.exists()) {
      return {
        success: false,
        error: 'Agency not found'
      };
    }

    const agencyData = serializeTimestamps({ id: agencySnap.id, ...agencySnap.data() });

    return {
      success: true,
      data: agencyData
    };
  } catch (error) {
    console.error('Error fetching agency details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agency details'
    };
  }
}

// Get agency services
export async function getAgencyServices(agencyId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedAgencyId = AgencyIdSchema.parse(agencyId);
    
    const servicesQuery = query(
      collection(getDb(), "services"),
      where("agencyId", "==", validatedAgencyId),
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
    console.error('Error fetching agency services:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agency services'
    };
  }
}

// Get agency providers
export async function getAgencyProviders(agencyId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedAgencyId = AgencyIdSchema.parse(agencyId);
    
    const providersQuery = query(
      collection(getDb(), "users"),
      where("agencyId", "==", validatedAgencyId),
      where("role", "==", "provider"),
      orderBy("joinedAt", "desc")
    );
    const providersSnapshot = await getDocs(providersQuery);
    const providers = providersSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    return {
      success: true,
      data: providers
    };
  } catch (error) {
    console.error('Error fetching agency providers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agency providers'
    };
  }
}

// Get agency reviews
export async function getAgencyReviews(agencyId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedAgencyId = AgencyIdSchema.parse(agencyId);
    
    const reviewsQuery = query(
      collection(getDb(), "reviews"),
      where("agencyId", "==", validatedAgencyId),
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
    console.error('Error fetching agency reviews:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agency reviews'
    };
  }
}
