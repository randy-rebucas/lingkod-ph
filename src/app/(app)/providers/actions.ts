'use server';

import { getDb } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'joinedAt', 'lastActiveAt', 'birthdate', 'lastMessageAt', 'favoritedAt', 'timestamp'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const ProviderIdSchema = z.string().min(1, 'Provider ID is required');
const UserIdSchema = z.string().min(1, 'User ID is required');
const ReportSchema = z.object({
  reportedBy: z.string().min(1, 'Reporter ID is required'),
  reportedItemType: z.string().min(1, 'Reported item type is required'),
  reportedItemId: z.string().min(1, 'Reported item ID is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  status: z.string().min(1, 'Status is required')
});

// Types
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Get provider details
export async function getProvider(providerId: string): Promise<ActionResult<any>> {
  try {
    const validatedId = ProviderIdSchema.parse(providerId);
    
    const providerRef = doc(getDb(), 'users', validatedId);
    const providerDoc = await getDoc(providerRef);
    
    if (!providerDoc.exists()) {
      return {
        success: false,
        error: 'Provider not found',
        message: 'The requested provider does not exist'
      };
    }
    
    const providerData = providerDoc.data();
    
    // Check if user is a provider
    if (providerData.role !== 'provider') {
      return {
        success: false,
        error: 'Invalid provider',
        message: 'The requested user is not a provider'
      };
    }
    
    // Convert Timestamp objects to plain objects for client serialization
    const serializedData = serializeTimestamps({
      uid: providerDoc.id,
      ...providerData,
    });

    return {
      success: true,
      data: serializedData,
      message: 'Provider retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider',
      message: 'Could not retrieve provider information'
    };
  }
}

// Get provider services
export async function getProviderServices(providerId: string): Promise<ActionResult<any[]>> {
  try {
    const validatedId = ProviderIdSchema.parse(providerId);
    
    const servicesQuery = query(
      collection(getDb(), 'services'),
      where('userId', '==', validatedId),
      where('status', '==', 'Active')
    );
    
    const servicesSnapshot = await getDocs(servicesQuery);
    const services = servicesSnapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    return {
      success: true,
      data: services,
      message: 'Provider services retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting provider services:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider services',
      message: 'Could not retrieve provider services'
    };
  }
}

// Get provider reviews
export async function getProviderReviews(providerId: string): Promise<ActionResult<any[]>> {
  try {
    const validatedId = ProviderIdSchema.parse(providerId);
    
    const reviewsQuery = query(
      collection(getDb(), 'reviews'),
      where('providerId', '==', validatedId),
      orderBy('createdAt', 'desc')
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    return {
      success: true,
      data: reviews,
      message: 'Provider reviews retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting provider reviews:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider reviews',
      message: 'Could not retrieve provider reviews'
    };
  }
}

// Add provider to favorites
export async function addProviderToFavorites(providerId: string, userId: string): Promise<ActionResult<any>> {
  try {
    const validatedProviderId = ProviderIdSchema.parse(providerId);
    const validatedUserId = UserIdSchema.parse(userId);
    
    // Check if already favorited
    const favoritesQuery = query(
      collection(getDb(), 'favorites'),
      where('userId', '==', validatedUserId),
      where('providerId', '==', validatedProviderId)
    );
    
    const existingFavorites = await getDocs(favoritesQuery);
    if (!existingFavorites.empty) {
      return {
        success: false,
        error: 'Already favorited',
        message: 'This provider is already in your favorites'
      };
    }
    
    // Add to favorites
    const favoritesRef = collection(getDb(), 'favorites');
    const newFavorite = await addDoc(favoritesRef, {
      userId: validatedUserId,
      providerId: validatedProviderId,
      favoritedAt: serverTimestamp()
    });
    
    return {
      success: true,
      data: { id: newFavorite.id },
      message: 'Provider added to favorites successfully'
    };
  } catch (error) {
    console.error('Error adding provider to favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add provider to favorites',
      message: 'Could not add provider to favorites'
    };
  }
}

// Remove provider from favorites
export async function removeProviderFromFavorites(providerId: string, userId: string): Promise<ActionResult<any>> {
  try {
    const validatedProviderId = ProviderIdSchema.parse(providerId);
    const validatedUserId = UserIdSchema.parse(userId);
    
    // Find the favorite to remove
    const favoritesQuery = query(
      collection(getDb(), 'favorites'),
      where('userId', '==', validatedUserId),
      where('providerId', '==', validatedProviderId)
    );
    
    const favoritesSnapshot = await getDocs(favoritesQuery);
    if (favoritesSnapshot.empty) {
      return {
        success: false,
        error: 'Not favorited',
        message: 'This provider is not in your favorites'
      };
    }
    
    // Remove the favorite
    await deleteDoc(favoritesSnapshot.docs[0].ref);
    
    return {
      success: true,
      message: 'Provider removed from favorites successfully'
    };
  } catch (error) {
    console.error('Error removing provider from favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove provider from favorites',
      message: 'Could not remove provider from favorites'
    };
  }
}

// Check if provider is favorited
export async function isProviderFavorited(providerId: string, userId: string): Promise<ActionResult<boolean>> {
  try {
    const validatedProviderId = ProviderIdSchema.parse(providerId);
    const validatedUserId = UserIdSchema.parse(userId);
    
    const favoritesQuery = query(
      collection(getDb(), 'favorites'),
      where('userId', '==', validatedUserId),
      where('providerId', '==', validatedProviderId)
    );
    
    const favoritesSnapshot = await getDocs(favoritesQuery);
    
    return {
      success: true,
      data: !favoritesSnapshot.empty,
      message: 'Favorite status checked successfully'
    };
  } catch (error) {
    console.error('Error checking provider favorite status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check favorite status',
      message: 'Could not check favorite status'
    };
  }
}

// Start conversation with provider
export async function startConversationWithProvider(providerId: string, userId: string, userDisplayName: string, userPhotoURL: string, providerDisplayName: string, providerPhotoURL: string): Promise<ActionResult<any>> {
  try {
    const validatedProviderId = ProviderIdSchema.parse(providerId);
    const validatedUserId = UserIdSchema.parse(userId);
    
    // Check if conversation already exists
    const conversationsRef = collection(getDb(), 'conversations');
    const q = query(conversationsRef, where('participants', 'array-contains', validatedUserId));
    const querySnapshot = await getDocs(q);
    
    let existingConvoId: string | null = null;
    querySnapshot.forEach(doc => {
      const convo = doc.data();
      if (convo.participants.includes(validatedProviderId)) {
        existingConvoId = doc.id;
      }
    });
    
    if (existingConvoId) {
      return {
        success: true,
        data: { id: existingConvoId },
        message: 'Conversation already exists'
      };
    }
    
    // Create new conversation
    const newConvoRef = await addDoc(conversationsRef, {
      participants: [validatedUserId, validatedProviderId],
      participantInfo: {
        [validatedUserId]: {
          displayName: userDisplayName,
          photoURL: userPhotoURL || '',
        },
        [validatedProviderId]: {
          displayName: providerDisplayName,
          photoURL: providerPhotoURL || '',
        }
      },
      lastMessage: 'Conversation started.',
      timestamp: serverTimestamp(),
    });
    
    return {
      success: true,
      data: { id: newConvoRef.id },
      message: 'Conversation started successfully'
    };
  } catch (error) {
    console.error('Error starting conversation with provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start conversation',
      message: 'Could not start conversation'
    };
  }
}

// Report provider
export async function reportProvider(reportData: {
  reportedBy: string;
  reportedItemType: string;
  reportedItemId: string;
  reason: string;
  status: string;
}): Promise<ActionResult<any>> {
  try {
    const validatedData = ReportSchema.parse(reportData);
    
    const reportsRef = collection(getDb(), 'reports');
    const newReport = await addDoc(reportsRef, {
      ...validatedData,
      createdAt: serverTimestamp()
    });
    
    return {
      success: true,
      data: { id: newReport.id },
      message: 'Report submitted successfully'
    };
  } catch (error) {
    console.error('Error reporting provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to report provider',
      message: 'Could not submit report'
    };
  }
}

// Get user's favorite providers
export async function getUserFavoriteProviders(userId: string): Promise<ActionResult<any[]>> {
  try {
    const validatedId = UserIdSchema.parse(userId);
    
    const favoritesQuery = query(
      collection(getDb(), 'favorites'),
      where('userId', '==', validatedId)
    );
    
    const favoritesSnapshot = await getDocs(favoritesQuery);
    const favoriteProviderIds = favoritesSnapshot.docs.map(doc => doc.data().providerId);
    
    if (favoriteProviderIds.length === 0) {
      return {
        success: true,
        data: [],
        message: 'No favorite providers found'
      };
    }
    
    // Get provider details for each favorite
    const providers: any[] = [];
    for (const providerId of favoriteProviderIds) {
      const providerResult = await getProvider(providerId);
      if (providerResult.success && providerResult.data) {
        providers.push(providerResult.data);
      }
    }
    
    return {
      success: true,
      data: providers,
      message: 'Favorite providers retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting user favorite providers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get favorite providers',
      message: 'Could not retrieve favorite providers'
    };
  }
}
