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
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = [
    'createdAt', 'updatedAt', 'joinedAt', 'lastActiveAt', 'birthdate', 'lastMessageAt',
    'submittedAt', 'endDate', 'date', 'favoritedAt', 'timestamp', 'establishedDate'
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
const UserIdSchema = z.string().min(1, 'User ID is required');
const ReportSchema = z.object({
  agencyId: z.string().min(1, 'Agency ID is required'),
  reporterId: z.string().min(1, 'Reporter ID is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['inappropriate_behavior', 'fake_profile', 'spam', 'other']),
});

const FavoriteSchema = z.object({
  agencyId: z.string().min(1, 'Agency ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

const ConversationSchema = z.object({
  agencyId: z.string().min(1, 'Agency ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  message: z.string().min(1, 'Message is required'),
});

// Types
export interface Agency {
  uid: string;
  displayName: string;
  email: string;
  bio?: string;
  photoURL?: string;
  role: 'agency';
  availabilitySchedule?: Availability[];
  availabilityStatus?: 'available' | 'limited' | 'unavailable';
  keyServices?: string[];
  isVerified?: boolean;
  documents?: { name: string; url: string }[];
  businessAddress?: string;
  phoneNumber?: string;
  website?: string;
  businessLicense?: string;
  totalProviders?: number;
  totalBookings?: number;
  averageRating?: number;
  totalReviews?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Availability {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface AgencyReport {
  id: string;
  agencyId: string;
  reporterId: string;
  reason: string;
  description: string;
  category: 'inappropriate_behavior' | 'fake_profile' | 'spam' | 'other';
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AgencyFavorite {
  id: string;
  agencyId: string;
  userId: string;
  createdAt: Timestamp;
}

export interface AgencyConversation {
  id: string;
  agencyId: string;
  userId: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  participants: string[];
  createdAt: Timestamp;
}

// Result types
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Get agency by ID
export async function getAgency(agencyId: string): Promise<ActionResult<Agency>> {
  try {
    const validatedId = AgencyIdSchema.parse(agencyId);
    
    const agencyRef = doc(getDb(), 'users', validatedId);
    const agencyDoc = await getDoc(agencyRef);
    
    if (!agencyDoc.exists()) {
      return {
        success: false,
        error: 'Agency not found',
        message: 'The requested agency does not exist'
      };
    }
    
    const agencyData = agencyDoc.data();
    
    if (agencyData.role !== 'agency') {
      return {
        success: false,
        error: 'Invalid agency',
        message: 'The requested user is not an agency'
      };
    }
    
    // Convert Timestamp objects to plain objects for client serialization
    const serializedData = serializeTimestamps({
      id: agencyDoc.id,
      ...agencyData,
    });

    return {
      success: true,
      data: serializedData as unknown as Agency,
      message: 'Agency retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting agency:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agency',
      message: 'Could not retrieve agency information'
    };
  }
}

// Get agency providers
export async function getAgencyProviders(agencyId: string): Promise<ActionResult<any[]>> {
  try {
    const validatedId = AgencyIdSchema.parse(agencyId);
    
    const providersQuery = query(
      collection(getDb(), 'users'),
      where('role', '==', 'provider'),
      where('agencyId', '==', validatedId)
    );
    
    const providersSnapshot = await getDocs(providersQuery);
    const providers = providersSnapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    return {
      success: true,
      data: providers,
      message: 'Agency providers retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting agency providers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agency providers',
      message: 'Could not retrieve agency providers'
    };
  }
}

// Get agency services
export async function getAgencyServices(agencyId: string): Promise<ActionResult<any[]>> {
  try {
    const validatedId = AgencyIdSchema.parse(agencyId);
    
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
      message: 'Agency services retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting agency services:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agency services',
      message: 'Could not retrieve agency services'
    };
  }
}

// Get agency reviews
export async function getAgencyReviews(agencyId: string): Promise<ActionResult<any[]>> {
  try {
    const validatedId = AgencyIdSchema.parse(agencyId);
    
    const reviewsQuery = query(
      collection(getDb(), 'reviews'),
      where('agencyId', '==', validatedId)
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
      message: 'Agency reviews retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting agency reviews:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agency reviews',
      message: 'Could not retrieve agency reviews'
    };
  }
}

// Add agency to favorites
export async function addAgencyToFavorites(agencyId: string, userId: string): Promise<ActionResult<AgencyFavorite>> {
  try {
    const validatedData = FavoriteSchema.parse({ agencyId, userId });
    
    // Check if already favorited
    const favoritesQuery = query(
      collection(getDb(), 'favorites'),
      where('agencyId', '==', validatedData.agencyId),
      where('userId', '==', validatedData.userId)
    );
    
    const existingFavorites = await getDocs(favoritesQuery);
    
    if (!existingFavorites.empty) {
      return {
        success: false,
        error: 'Already favorited',
        message: 'This agency is already in your favorites'
      };
    }
    
    // Add to favorites
    const favoritesRef = collection(getDb(), 'favorites');
    const newFavorite = await addDoc(favoritesRef, {
      agencyId: validatedData.agencyId,
      userId: validatedData.userId,
      createdAt: serverTimestamp(),
    });
    
    return {
      success: true,
      data: {
        id: newFavorite.id,
        agencyId: validatedData.agencyId,
        userId: validatedData.userId,
        createdAt: serverTimestamp() as Timestamp
      } as AgencyFavorite,
      message: 'Agency added to favorites successfully'
    };
  } catch (error) {
    console.error('Error adding agency to favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add agency to favorites',
      message: 'Could not add agency to favorites'
    };
  }
}

// Remove agency from favorites
export async function removeAgencyFromFavorites(agencyId: string, userId: string): Promise<ActionResult> {
  try {
    const validatedData = FavoriteSchema.parse({ agencyId, userId });
    
    // Find the favorite document
    const favoritesQuery = query(
      collection(getDb(), 'favorites'),
      where('agencyId', '==', validatedData.agencyId),
      where('userId', '==', validatedData.userId)
    );
    
    const favoritesSnapshot = await getDocs(favoritesQuery);
    
    if (favoritesSnapshot.empty) {
      return {
        success: false,
        error: 'Not favorited',
        message: 'This agency is not in your favorites'
      };
    }
    
    // Remove the favorite
    await deleteDoc(favoritesSnapshot.docs[0].ref);
    
    return {
      success: true,
      message: 'Agency removed from favorites successfully'
    };
  } catch (error) {
    console.error('Error removing agency from favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove agency from favorites',
      message: 'Could not remove agency from favorites'
    };
  }
}

// Check if agency is favorited
export async function isAgencyFavorited(agencyId: string, userId: string): Promise<ActionResult<boolean>> {
  try {
    const validatedData = FavoriteSchema.parse({ agencyId, userId });
    
    const favoritesQuery = query(
      collection(getDb(), 'favorites'),
      where('agencyId', '==', validatedData.agencyId),
      where('userId', '==', validatedData.userId)
    );
    
    const favoritesSnapshot = await getDocs(favoritesQuery);
    
    return {
      success: true,
      data: !favoritesSnapshot.empty,
      message: 'Favorite status checked successfully'
    };
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check favorite status',
      message: 'Could not check favorite status'
    };
  }
}

// Start conversation with agency
export async function startConversationWithAgency(agencyId: string, userId: string, message: string): Promise<ActionResult<AgencyConversation>> {
  try {
    const validatedData = ConversationSchema.parse({ agencyId, userId, message });
    
    // Check if conversation already exists
    const conversationsQuery = query(
      collection(getDb(), 'conversations'),
      where('participants', 'array-contains', validatedData.userId)
    );
    
    const existingConversations = await getDocs(conversationsQuery);
    const existingConvo = existingConversations.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(validatedData.agencyId);
    });
    
    if (existingConvo) {
      return {
        success: false,
        error: 'Conversation exists',
        message: 'A conversation with this agency already exists',
        data: {
          id: existingConvo.id,
          ...existingConvo.data()
        } as AgencyConversation
      };
    }
    
    // Create new conversation
    const conversationsRef = collection(getDb(), 'conversations');
    const newConvoRef = await addDoc(conversationsRef, {
      participants: [validatedData.userId, validatedData.agencyId],
      lastMessage: validatedData.message,
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    
    // Add initial message
    const messagesRef = collection(getDb(), 'messages');
    await addDoc(messagesRef, {
      conversationId: newConvoRef.id,
      senderId: validatedData.userId,
      content: validatedData.message,
      timestamp: serverTimestamp(),
    });
    
    return {
      success: true,
      data: {
        id: newConvoRef.id,
        agencyId: validatedData.agencyId,
        userId: validatedData.userId,
        lastMessage: validatedData.message,
        lastMessageAt: serverTimestamp() as Timestamp,
        participants: [validatedData.userId, validatedData.agencyId],
        createdAt: serverTimestamp() as Timestamp
      } as AgencyConversation,
      message: 'Conversation started successfully'
    };
  } catch (error) {
    console.error('Error starting conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start conversation',
      message: 'Could not start conversation with agency'
    };
  }
}

// Report agency
export async function reportAgency(reportData: {
  agencyId: string;
  reporterId: string;
  reason: string;
  description: string;
  category: 'inappropriate_behavior' | 'fake_profile' | 'spam' | 'other';
}): Promise<ActionResult<AgencyReport>> {
  try {
    const validatedData = ReportSchema.parse(reportData);
    
    // Check if agency exists
    const agencyRef = doc(getDb(), 'users', validatedData.agencyId);
    const agencyDoc = await getDoc(agencyRef);
    
    if (!agencyDoc.exists()) {
      return {
        success: false,
        error: 'Agency not found',
        message: 'The agency you are trying to report does not exist'
      };
    }
    
    // Create report
    const reportsRef = collection(getDb(), 'reports');
    const newReportRef = await addDoc(reportsRef, {
      agencyId: validatedData.agencyId,
      reporterId: validatedData.reporterId,
      reason: validatedData.reason,
      description: validatedData.description,
      category: validatedData.category,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return {
      success: true,
      data: {
        id: newReportRef.id,
        agencyId: validatedData.agencyId,
        reporterId: validatedData.reporterId,
        reason: validatedData.reason,
        description: validatedData.description,
        category: validatedData.category,
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      } as AgencyReport,
      message: 'Agency reported successfully'
    };
  } catch (error) {
    console.error('Error reporting agency:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to report agency',
      message: 'Could not report agency'
    };
  }
}

// Get agency analytics
export async function getAgencyAnalytics(agencyId: string): Promise<ActionResult<any>> {
  try {
    const validatedId = AgencyIdSchema.parse(agencyId);
    
    // Get agency data
    const agencyResult = await getAgency(validatedId);
    if (!agencyResult.success) {
      return agencyResult;
    }
    
    // Get providers count
    const providersResult = await getAgencyProviders(validatedId);
    const providersCount = providersResult.success ? providersResult.data?.length || 0 : 0;
    
    // Get reviews count and average rating
    const reviewsResult = await getAgencyReviews(validatedId);
    const reviews = reviewsResult.success ? reviewsResult.data || [] : [];
    const reviewsCount = reviews.length;
    const averageRating = reviewsCount > 0 
      ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviewsCount 
      : 0;
    
    // Get bookings count (mock data for now)
    const bookingsCount = 0; // This would be calculated from actual bookings
    
    const analytics = {
      agencyId: validatedId,
      totalProviders: providersCount,
      totalReviews: reviewsCount,
      averageRating: Math.round(averageRating * 10) / 10,
      totalBookings: bookingsCount,
      isVerified: agencyResult.data?.isVerified || false,
      createdAt: agencyResult.data?.createdAt,
    };
    
    return {
      success: true,
      data: analytics,
      message: 'Agency analytics retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting agency analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agency analytics',
      message: 'Could not retrieve agency analytics'
    };
  }
}

// Update agency profile
export async function updateAgencyProfile(agencyId: string, updateData: Partial<Agency>): Promise<ActionResult<Agency>> {
  try {
    const validatedId = AgencyIdSchema.parse(agencyId);
    
    // Check if agency exists
    const agencyRef = doc(getDb(), 'users', validatedId);
    const agencyDoc = await getDoc(agencyRef);
    
    if (!agencyDoc.exists()) {
      return {
        success: false,
        error: 'Agency not found',
        message: 'The agency does not exist'
      };
    }
    
    // Update agency data
    const updatePayload = {
      ...updateData,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(agencyRef, updatePayload);
    
    // Get updated agency data
    const updatedAgencyDoc = await getDoc(agencyRef);
    const updatedAgencyData = updatedAgencyDoc.data();
    
    // Convert Timestamp objects to plain objects for client serialization
    const serializedData = serializeTimestamps({
      id: updatedAgencyDoc.id,
      ...updatedAgencyData,
    });

    return {
      success: true,
      data: serializedData as unknown as Agency,
      message: 'Agency profile updated successfully'
    };
  } catch (error) {
    console.error('Error updating agency profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update agency profile',
      message: 'Could not update agency profile'
    };
  }
}

// Get user's favorite agencies
export async function getUserFavoriteAgencies(userId: string): Promise<ActionResult<Agency[]>> {
  try {
    const validatedId = UserIdSchema.parse(userId);
    
    const favoritesQuery = query(
      collection(getDb(), 'favorites'),
      where('userId', '==', validatedId)
    );
    
    const favoritesSnapshot = await getDocs(favoritesQuery);
    const favoriteAgencyIds = favoritesSnapshot.docs.map(doc => doc.data().agencyId);
    
    if (favoriteAgencyIds.length === 0) {
      return {
        success: true,
        data: [],
        message: 'No favorite agencies found'
      };
    }
    
    // Get agency details for each favorite
    const agencies: Agency[] = [];
    for (const agencyId of favoriteAgencyIds) {
      const agencyResult = await getAgency(agencyId);
      if (agencyResult.success && agencyResult.data) {
        agencies.push(agencyResult.data);
      }
    }
    
    return {
      success: true,
      data: agencies,
      message: 'Favorite agencies retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting user favorite agencies:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get favorite agencies',
      message: 'Could not retrieve favorite agencies'
    };
  }
}
