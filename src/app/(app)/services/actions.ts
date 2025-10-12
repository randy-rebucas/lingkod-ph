'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');
const ServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  providerId: z.string().min(1, 'Provider ID is required'),
});

// Get services for a provider
export async function getProviderServices(providerId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedProviderId = UserIdSchema.parse(providerId);
    
    const servicesQuery = query(
      collection(getDb(), "services"), 
      where("providerId", "==", validatedProviderId)
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
      error: error instanceof Error ? error.message : 'Failed to fetch services'
    };
  }
}

// Create new service
export async function createService(data: {
  name: string;
  description: string;
  category: string;
  price: number;
  status?: 'Active' | 'Inactive';
  providerId: string;
}): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}> {
  try {
    const validatedData = ServiceSchema.parse(data);
    
    const serviceData = {
      ...validatedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(getDb(), "services"), serviceData);

    return {
      success: true,
      data: { id: docRef.id }
    };
  } catch (error) {
    console.error('Error creating service:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create service'
    };
  }
}

// Update service
export async function updateService(serviceId: string, data: {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  status?: 'Active' | 'Inactive';
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const serviceRef = doc(getDb(), "services", serviceId);
    await updateDoc(serviceRef, {
      ...data,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating service:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update service'
    };
  }
}

// Delete service
export async function deleteService(serviceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const serviceRef = doc(getDb(), "services", serviceId);
    await deleteDoc(serviceRef);

    return { success: true };
  } catch (error) {
    console.error('Error deleting service:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete service'
    };
  }
}

// Get services data (alias for getProviderServices)
export async function getServicesData(providerId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  return getProviderServices(providerId);
}