'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  deleteDoc
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'favoritedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

// Get user's favorite providers
export async function getFavoriteProviders(userId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    // Get favorite providers for this user (without orderBy to avoid index issues)
    const favoritesQuery = query(
      collection(getDb(), "favorites"), 
      where("userId", "==", validatedUserId),
      where("type", "==", "provider")
    );
    const favoritesSnapshot = await getDocs(favoritesQuery);
    const favorites = favoritesSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get provider details for each favorite
    const providerIds = favorites.map(fav => fav.providerId);
    if (providerIds.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // Use document references instead of __name__ query
    const providers: any[] = [];
    for (const providerId of providerIds) {
      try {
        const providerDoc = await getDocs(query(
          collection(getDb(), "users"),
          where("uid", "==", providerId),
          where("role", "==", "provider")
        ));
        if (!providerDoc.empty) {
          const providerData = providerDoc.docs[0].data();
          providers.push(serializeTimestamps({ 
            id: providerDoc.docs[0].id, 
            ...providerData 
          }));
        }
      } catch (providerError) {
        console.warn(`Failed to fetch provider ${providerId}:`, providerError);
      }
    }

    // Combine favorites with provider details
    const favoriteProviders = favorites.map(favorite => {
      const provider = providers.find(p => p.uid === favorite.providerId);
      return {
        ...favorite,
        provider: provider || null
      };
    }).filter(item => item.provider !== null);

    return {
      success: true,
      data: favoriteProviders
    };
  } catch (error) {
    console.error('Error fetching favorite providers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch favorite providers'
    };
  }
}

// Get user's favorite agencies
export async function getFavoriteAgencies(userId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    // Get favorite agencies for this user (without orderBy to avoid index issues)
    const favoritesQuery = query(
      collection(getDb(), "favorites"), 
      where("userId", "==", validatedUserId),
      where("type", "==", "agency")
    );
    const favoritesSnapshot = await getDocs(favoritesQuery);
    const favorites = favoritesSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get agency details for each favorite
    const agencyIds = favorites.map(fav => fav.agencyId);
    if (agencyIds.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // Use document references instead of __name__ query
    const agencies: any[] = [];
    for (const agencyId of agencyIds) {
      try {
        const agencyDoc = await getDocs(query(
          collection(getDb(), "users"),
          where("uid", "==", agencyId),
          where("role", "==", "agency")
        ));
        if (!agencyDoc.empty) {
          const agencyData = agencyDoc.docs[0].data();
          agencies.push(serializeTimestamps({ 
            id: agencyDoc.docs[0].id, 
            ...agencyData 
          }));
        }
      } catch (agencyError) {
        console.warn(`Failed to fetch agency ${agencyId}:`, agencyError);
      }
    }

    // Combine favorites with agency details
    const favoriteAgencies = favorites.map(favorite => {
      const agency = agencies.find(a => a.uid === favorite.agencyId);
      return {
        ...favorite,
        agency: agency || null
      };
    }).filter(item => item.agency !== null);

    return {
      success: true,
      data: favoriteAgencies
    };
  } catch (error) {
    console.error('Error fetching favorite agencies:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch favorite agencies'
    };
  }
}

// Get all favorites (providers and agencies combined) for a user
export async function getMyFavorites(userId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    console.log('Fetching favorites for user:', validatedUserId);
    
    // Get both favorite providers and agencies
    const [providersResult, agenciesResult] = await Promise.all([
      getFavoriteProviders(validatedUserId),
      getFavoriteAgencies(validatedUserId)
    ]);
    
    console.log('Providers result:', providersResult.success, providersResult.data?.length || 0);
    console.log('Agencies result:', agenciesResult.success, agenciesResult.data?.length || 0);
    
    // Handle individual failures gracefully
    if (!providersResult.success) {
      console.error('Failed to fetch favorite providers:', providersResult.error);
    }
    if (!agenciesResult.success) {
      console.error('Failed to fetch favorite agencies:', agenciesResult.error);
    }
    
    // If both fail, return error
    if (!providersResult.success && !agenciesResult.success) {
      return {
        success: false,
        error: 'Failed to fetch favorites'
      };
    }
    
    // Combine and format the data (handle partial failures)
    const allFavorites = [
      ...(providersResult.success && providersResult.data ? providersResult.data.map(item => ({
        uid: item.provider.uid || item.provider.id,
        displayName: item.provider.displayName,
        photoURL: item.provider.photoURL,
        rating: item.provider.rating || 0,
        reviewCount: item.provider.reviewCount || 0,
        keyServices: item.provider.keyServices || [],
        bio: item.provider.bio,
        availabilityStatus: item.provider.availabilityStatus,
        type: 'provider'
      })) : []),
      ...(agenciesResult.success && agenciesResult.data ? agenciesResult.data.map(item => ({
        uid: item.agency.uid || item.agency.id,
        displayName: item.agency.displayName,
        photoURL: item.agency.photoURL,
        rating: item.agency.rating || 0,
        reviewCount: item.agency.reviewCount || 0,
        keyServices: item.agency.services || [],
        bio: item.agency.description,
        availabilityStatus: item.agency.availabilityStatus,
        type: 'agency'
      })) : [])
    ];
    
    console.log('Total favorites found:', allFavorites.length);
    
    return {
      success: true,
      data: allFavorites
    };
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch favorites'
    };
  }
}

// Remove item from favorites
export async function removeFromFavorites(itemId: string, userId: string, type: 'provider' | 'agency'): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedItemId = z.string().min(1).parse(itemId);
    
    // Find the favorite document
    const favoritesQuery = query(
      collection(getDb(), "favorites"),
      where("userId", "==", validatedUserId),
      where("type", "==", type),
      where(type === 'provider' ? "providerId" : "agencyId", "==", validatedItemId)
    );
    
    const favoritesSnapshot = await getDocs(favoritesQuery);
    
    if (favoritesSnapshot.empty) {
      return {
        success: false,
        error: 'Favorite not found'
      };
    }
    
    // Delete the favorite document
    const favoriteDoc = favoritesSnapshot.docs[0];
    await deleteDoc(doc(getDb(), "favorites", favoriteDoc.id));
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove from favorites'
    };
  }
}
