'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { z } from 'zod';
import { startOfDay, endOfDay } from 'date-fns';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'joinedAt', 'lastActiveAt', 'birthdate', 'lastMessageAt', 'favoritedAt', 'timestamp', 'date'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');
const ProviderIdSchema = z.string().min(1, 'Provider ID is required');
const AgencyIdSchema = z.string().min(1, 'Agency ID is required');
const SearchQuerySchema = z.string().min(1, 'Search query is required');

// Types
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Get provider dashboard data
export async function getProviderDashboardData(providerId: string): Promise<ActionResult<any>> {
  try {
    const validatedId = ProviderIdSchema.parse(providerId);
    
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    
    // Get bookings
    const bookingsQuery = query(
      collection(getDb(), "bookings"),
      where("providerId", "==", validatedId),
      orderBy("date", "desc")
    );
    
    // Get today's jobs
    const todaysJobsQuery = query(
      collection(getDb(), "bookings"),
      where("providerId", "==", validatedId),
      where("date", ">=", todayStart),
      where("date", "<=", todayEnd),
      orderBy("date", "asc")
    );
    
    // Get recent reviews
    const reviewsQuery = query(
      collection(getDb(), "reviews"),
      where("providerId", "==", validatedId),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    
    // Get payouts
    const payoutsQuery = query(
      collection(getDb(), "payouts"), 
      where("providerId", "==", validatedId)
    );
    
    const [bookingsSnapshot, todaysJobsSnapshot, reviewsSnapshot, payoutsSnapshot] = await Promise.all([
      getDocs(bookingsQuery),
      getDocs(todaysJobsQuery),
      getDocs(reviewsQuery),
      getDocs(payoutsQuery)
    ]);
    
    const bookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );
    
    const todaysJobs = todaysJobsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );
    
    const reviews = reviewsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );
    
    const payouts = payoutsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );
    
    return {
      success: true,
      data: {
        bookings,
        todaysJobs,
        reviews,
        payouts
      },
      message: 'Provider dashboard data retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting provider dashboard data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider dashboard data',
      message: 'Could not retrieve provider dashboard data'
    };
  }
}

// Get agency dashboard data
export async function getAgencyDashboardData(agencyId: string): Promise<ActionResult<any>> {
  try {
    const validatedId = AgencyIdSchema.parse(agencyId);
    
    // 1. Get all providers managed by the agency
    const providersQuery = query(
      collection(getDb(), "users"), 
      where("agencyId", "==", validatedId)
    );
    const providersSnapshot = await getDocs(providersQuery);
    const providerIds = providersSnapshot.docs.map(doc => doc.id);
    const fetchedProviders = providersSnapshot.docs.map(doc => 
      serializeTimestamps({ uid: doc.id, ...doc.data() })
    );

    if (providerIds.length === 0) {
      return {
        success: true,
        data: {
          providers: [],
          bookings: [],
          payouts: []
        },
        message: 'Agency dashboard data retrieved successfully (no providers)'
      };
    }
    
    // 2. Get all bookings for these providers
    const bookingsQuery = query(
      collection(getDb(), "bookings"), 
      where("providerId", "in", providerIds)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const fetchedBookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );
    
    // 3. Get all reviews for these providers to calculate ratings and revenue
    const reviewsQuery = query(
      collection(getDb(), 'reviews'), 
      where('providerId', 'in', providerIds)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const allReviews = reviewsSnapshot.docs.map(doc => 
      serializeTimestamps(doc.data())
    );

    const providerStats = fetchedProviders.map(p => {
      const providerReviews = allReviews.filter(r => r.providerId === p.uid);
      const providerBookings = fetchedBookings.filter(b => b.providerId === p.uid && b.status === 'Completed');
      const rating = providerReviews.length > 0 ? providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length : 0;
      const totalRevenue = providerBookings.reduce((sum, b) => sum + b.price, 0);

      return { ...p, rating, reviewCount: providerReviews.length, totalRevenue };
    });
    
    // 4. Get all payout requests for the agency
    const payoutsQuery = query(
      collection(getDb(), 'payouts'), 
      where('agencyId', '==', validatedId)
    );
    const payoutsSnapshot = await getDocs(payoutsQuery);
    const fetchedPayouts = payoutsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );
    
    return {
      success: true,
      data: {
        providers: providerStats,
        bookings: fetchedBookings,
        payouts: fetchedPayouts
      },
      message: 'Agency dashboard data retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting agency dashboard data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agency dashboard data',
      message: 'Could not retrieve agency dashboard data'
    };
  }
}

// Get client dashboard data
export async function getClientDashboardData(clientId: string): Promise<ActionResult<any>> {
  try {
    const validatedId = UserIdSchema.parse(clientId);
    
    // Get user's bookings
    const bookingsQuery = query(
      collection(getDb(), "bookings"),
      where("clientId", "==", validatedId),
      orderBy("date", "desc")
    );
    
    // Get user's favorites
    const favoritesQuery = query(
      collection(getDb(), 'favorites'),
      where('userId', '==', validatedId)
    );
    
    const [bookingsSnapshot, favoritesSnapshot] = await Promise.all([
      getDocs(bookingsQuery),
      getDocs(favoritesQuery)
    ]);
    
    const bookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );
    
    const favorites = favoritesSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );
    
    return {
      success: true,
      data: {
        bookings,
        favorites
      },
      message: 'Client dashboard data retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting client dashboard data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get client dashboard data',
      message: 'Could not retrieve client dashboard data'
    };
  }
}

// Get all providers for client search
export async function getAllProviders(): Promise<ActionResult<any[]>> {
  try {
    const q = query(
      collection(getDb(), "users"), 
      where("role", "in", ["provider", "agency"])
    );
    const querySnapshot = await getDocs(q);
    const providersData = querySnapshot.docs.map(doc => 
      serializeTimestamps({
        uid: doc.id,
        ...doc.data(),
      })
    );
    
    return {
      success: true,
      data: providersData,
      message: 'All providers retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting all providers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get all providers',
      message: 'Could not retrieve providers'
    };
  }
}

// Get all reviews for client dashboard
export async function getAllReviews(): Promise<ActionResult<any[]>> {
  try {
    const reviewsSnapshot = await getDocs(collection(getDb(), "reviews"));
    const reviewsData = reviewsSnapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    return {
      success: true,
      data: reviewsData,
      message: 'All reviews retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting all reviews:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get all reviews',
      message: 'Could not retrieve reviews'
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

// Search providers (for smart search functionality)
export async function searchProviders(searchQuery: string): Promise<ActionResult<any[]>> {
  try {
    const validatedQuery = SearchQuerySchema.parse(searchQuery);
    
    // This would typically integrate with the AI search functionality
    // For now, we'll do a simple text search on provider names and services
    const providersQuery = query(
      collection(getDb(), "users"),
      where("role", "in", ["provider", "agency"])
    );
    
    const providersSnapshot = await getDocs(providersQuery);
    const allProviders = providersSnapshot.docs.map(doc => 
      serializeTimestamps({
        uid: doc.id,
        ...doc.data(),
      })
    );
    
    // Simple text search (in a real implementation, this would use the AI search)
    const filteredProviders = allProviders.filter(provider => 
      provider.displayName?.toLowerCase().includes(validatedQuery.toLowerCase()) ||
      provider.bio?.toLowerCase().includes(validatedQuery.toLowerCase()) ||
      provider.keyServices?.some((service: string) => 
        service.toLowerCase().includes(validatedQuery.toLowerCase())
      )
    );
    
    return {
      success: true,
      data: filteredProviders,
      message: 'Provider search completed successfully'
    };
  } catch (error) {
    console.error('Error searching providers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search providers',
      message: 'Could not search providers'
    };
  }
}
