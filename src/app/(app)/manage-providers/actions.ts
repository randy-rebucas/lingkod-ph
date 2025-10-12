'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'joinedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const AgencyIdSchema = z.string().min(1, 'Agency ID is required');
const ProviderIdSchema = z.string().min(1, 'Provider ID is required');

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

// Add provider to agency
export async function addProviderToAgency(agencyId: string, providerId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedAgencyId = AgencyIdSchema.parse(agencyId);
    const validatedProviderId = ProviderIdSchema.parse(providerId);
    
    const providerRef = doc(getDb(), "users", validatedProviderId);
    await updateDoc(providerRef, {
      agencyId: validatedAgencyId,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding provider to agency:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add provider to agency'
    };
  }
}

// Remove provider from agency
export async function removeProviderFromAgency(providerId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedProviderId = ProviderIdSchema.parse(providerId);
    
    const providerRef = doc(getDb(), "users", validatedProviderId);
    await updateDoc(providerRef, {
      agencyId: null,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing provider from agency:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove provider from agency'
    };
  }
}
