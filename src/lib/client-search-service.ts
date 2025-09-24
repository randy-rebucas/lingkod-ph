'use server';

import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  startAfter,
  DocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { PremiumSearchFilters } from './client-subscription-types';
import { clientSubscriptionService } from './client-subscription-service';

export interface EnhancedProvider {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  bio: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  services: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    images: string[];
  }[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isPro: boolean;
  responseTime: number; // in minutes
  completionRate: number;
  languages: string[];
  certifications: string[];
  equipment: string[];
  availability: {
    immediate: boolean;
    nextAvailable?: Date;
    workingHours: {
      [key: string]: { start: string; end: string; available: boolean };
    };
  };
  subscriptionTier: 'free' | 'pro';
  featuredUntil?: Timestamp;
  lastActive: Timestamp;
  joinedDate: Timestamp;
}

export interface SearchResult {
  providers: EnhancedProvider[];
  totalCount: number;
  hasMore: boolean;
  lastDoc?: DocumentSnapshot;
  searchMetadata: {
    searchTime: number;
    filtersApplied: string[];
    premiumFeaturesUsed: string[];
  };
}

export class ClientSearchService {
  private static readonly PROVIDERS_COLLECTION = 'providers';
  private static readonly SERVICES_COLLECTION = 'services';
  private static readonly REVIEWS_COLLECTION = 'reviews';

  /**
   * Enhanced search for premium clients with advanced filters
   */
  static async searchProviders(
    clientId: string,
    searchTerm: string = '',
    filters: PremiumSearchFilters,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // Check if client has premium access
      const hasAdvancedSearch = await clientSubscriptionService.checkClientFeatureAccess(
        clientId, 
        'advanced_search'
      );

      if (!hasAdvancedSearch.hasAccess) {
        // Return basic search results
        return this.getBasicSearchResults(searchTerm, pageSize, lastDoc);
      }

      // Record usage for premium feature
      await clientSubscriptionService.recordClientFeatureUsage(
        clientId, 
        'advanced_search'
      );

      // Build advanced search query
      let searchQuery = query(collection(db, this.PROVIDERS_COLLECTION));

      // Apply premium filters
      const appliedFilters: string[] = [];
      const premiumFeaturesUsed: string[] = [];

      // Verified providers only filter
      if (filters.verifiedProvidersOnly) {
        searchQuery = query(searchQuery, where('isVerified', '==', true));
        appliedFilters.push('verified_providers_only');
        premiumFeaturesUsed.push('verified_provider_access');
      }

      // Pro providers priority (premium clients see Pro providers first)
      if (filters.verifiedProvidersOnly) {
        searchQuery = query(searchQuery, where('subscriptionTier', '==', 'pro'));
        appliedFilters.push('pro_providers_only');
        premiumFeaturesUsed.push('pro_provider_access');
      }

      // Location radius filter
      if (filters.location.radius > 0 && filters.location.specificAreas.length > 0) {
        // This would require geospatial queries - simplified for now
        appliedFilters.push('location_radius');
        premiumFeaturesUsed.push('advanced_location_filter');
      }

      // Rating filter
      if (filters.providerRating.minRating > 0) {
        searchQuery = query(searchQuery, where('rating', '>=', filters.providerRating.minRating));
        appliedFilters.push('min_rating');
        premiumFeaturesUsed.push('rating_filter');
      }

      // Order by premium criteria
      searchQuery = query(
        searchQuery,
        orderBy('subscriptionTier', 'desc'), // Pro providers first
        orderBy('rating', 'desc'),
        orderBy('reviewCount', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        searchQuery = query(searchQuery, startAfter(lastDoc));
      }

      const snapshot = await getDocs(searchQuery);
      const providers: EnhancedProvider[] = [];

      for (const doc of snapshot.docs) {
        const providerData = doc.data();
        
        // Apply additional filters
        if (this.matchesAdvancedFilters(providerData, filters)) {
          providers.push({
            id: doc.id,
            ...providerData,
            lastActive: providerData.lastActive as Timestamp,
            joinedDate: providerData.joinedDate as Timestamp,
            featuredUntil: providerData.featuredUntil as Timestamp
          } as EnhancedProvider);
        }
      }

      const searchTime = Date.now() - startTime;
      const lastDocument = snapshot.docs[snapshot.docs.length - 1];

      return {
        providers,
        totalCount: providers.length, // Simplified - would need count query for accurate total
        hasMore: snapshot.docs.length === pageSize,
        lastDoc: lastDocument,
        searchMetadata: {
          searchTime,
          filtersApplied: appliedFilters,
          premiumFeaturesUsed
        }
      };

    } catch (error) {
      console.error('Error in enhanced provider search:', error);
      // Fallback to basic search
      return this.getBasicSearchResults(searchTerm, pageSize, lastDoc);
    }
  }

  /**
   * Get verified providers only (premium feature)
   */
  static async getVerifiedProviders(
    clientId: string,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<SearchResult> {
    try {
      // Check premium access
      const hasAccess = await clientSubscriptionService.checkClientFeatureAccess(
        clientId, 
        'verified_provider_access'
      );

      if (!hasAccess.hasAccess) {
        throw new Error('Verified provider access requires Premium subscription');
      }

      // Record usage
      await clientSubscriptionService.recordClientFeatureUsage(
        clientId, 
        'verified_provider_access'
      );

      let searchQuery = query(
        collection(db, this.PROVIDERS_COLLECTION),
        where('isVerified', '==', true),
        orderBy('rating', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        searchQuery = query(searchQuery, startAfter(lastDoc));
      }

      const snapshot = await getDocs(searchQuery);
      const providers: EnhancedProvider[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastActive: doc.data().lastActive as Timestamp,
        joinedDate: doc.data().joinedDate as Timestamp,
        featuredUntil: doc.data().featuredUntil as Timestamp
      })) as EnhancedProvider[];

      return {
        providers,
        totalCount: providers.length,
        hasMore: snapshot.docs.length === pageSize,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        searchMetadata: {
          searchTime: 0,
          filtersApplied: ['verified_providers_only'],
          premiumFeaturesUsed: ['verified_provider_access']
        }
      };

    } catch (error) {
      console.error('Error getting verified providers:', error);
      throw error;
    }
  }

  /**
   * Get Pro providers (premium feature)
   */
  static async getProProviders(
    clientId: string,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<SearchResult> {
    try {
      // Check premium access
      const hasAccess = await clientSubscriptionService.checkClientFeatureAccess(
        clientId, 
        'verified_provider_access'
      );

      if (!hasAccess.hasAccess) {
        throw new Error('Pro provider access requires Premium subscription');
      }

      // Record usage
      await clientSubscriptionService.recordClientFeatureUsage(
        clientId, 
        'verified_provider_access'
      );

      let searchQuery = query(
        collection(db, this.PROVIDERS_COLLECTION),
        where('subscriptionTier', '==', 'pro'),
        orderBy('rating', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        searchQuery = query(searchQuery, startAfter(lastDoc));
      }

      const snapshot = await getDocs(searchQuery);
      const providers: EnhancedProvider[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastActive: doc.data().lastActive as Timestamp,
        joinedDate: doc.data().joinedDate as Timestamp,
        featuredUntil: doc.data().featuredUntil as Timestamp
      })) as EnhancedProvider[];

      return {
        providers,
        totalCount: providers.length,
        hasMore: snapshot.docs.length === pageSize,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        searchMetadata: {
          searchTime: 0,
          filtersApplied: ['pro_providers_only'],
          premiumFeaturesUsed: ['pro_provider_access']
        }
      };

    } catch (error) {
      console.error('Error getting Pro providers:', error);
      throw error;
    }
  }

  /**
   * Search by availability (premium feature)
   */
  static async searchByAvailability(
    clientId: string,
    requestedDate: Date,
    timeSlot: string,
    location: string,
    pageSize: number = 20
  ): Promise<SearchResult> {
    try {
      // Check premium access
      const hasAccess = await clientSubscriptionService.checkClientFeatureAccess(
        clientId, 
        'advanced_search'
      );

      if (!hasAccess.hasAccess) {
        throw new Error('Availability search requires Premium subscription');
      }

      // Record usage
      await clientSubscriptionService.recordClientFeatureUsage(
        clientId, 
        'advanced_search'
      );

      // This would require complex availability checking
      // Simplified implementation for now
      const searchQuery = query(
        collection(db, this.PROVIDERS_COLLECTION),
        where('availability.immediate', '==', true),
        orderBy('rating', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(searchQuery);
      const providers: EnhancedProvider[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastActive: doc.data().lastActive as Timestamp,
        joinedDate: doc.data().joinedDate as Timestamp,
        featuredUntil: doc.data().featuredUntil as Timestamp
      })) as EnhancedProvider[];

      return {
        providers,
        totalCount: providers.length,
        hasMore: snapshot.docs.length === pageSize,
        searchMetadata: {
          searchTime: 0,
          filtersApplied: ['availability_filter'],
          premiumFeaturesUsed: ['availability_search']
        }
      };

    } catch (error) {
      console.error('Error searching by availability:', error);
      throw error;
    }
  }

  /**
   * Get basic search results for free users
   */
  private static async getBasicSearchResults(
    searchTerm: string,
    pageSize: number,
    lastDoc?: DocumentSnapshot
  ): Promise<SearchResult> {
    let searchQuery = query(
      collection(db, this.PROVIDERS_COLLECTION),
      orderBy('rating', 'desc'),
      limit(pageSize)
    );

    if (lastDoc) {
      searchQuery = query(searchQuery, startAfter(lastDoc));
    }

    const snapshot = await getDocs(searchQuery);
    const providers: EnhancedProvider[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastActive: doc.data().lastActive as Timestamp,
      joinedDate: doc.data().joinedDate as Timestamp,
      featuredUntil: doc.data().featuredUntil as Timestamp
    })) as EnhancedProvider[];

    return {
      providers,
      totalCount: providers.length,
      hasMore: snapshot.docs.length === pageSize,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      searchMetadata: {
        searchTime: 0,
        filtersApplied: ['basic_search'],
        premiumFeaturesUsed: []
      }
    };
  }

  /**
   * Check if provider matches advanced filters
   */
  private static matchesAdvancedFilters(providerData: any, filters: PremiumSearchFilters): boolean {
    // Price range filter
    if (filters.priceRange.min > 0 || filters.priceRange.max < Infinity) {
      // This would require checking service prices
      // Simplified for now
    }

    // Specializations filter
    if (filters.specializations.length > 0) {
      const providerServices = providerData.services || [];
      const hasMatchingSpecialization = filters.specializations.some(spec =>
        providerServices.some((service: any) => 
          service.category.toLowerCase().includes(spec.toLowerCase())
        )
      );
      if (!hasMatchingSpecialization) return false;
    }

    // Languages filter
    if (filters.languages.length > 0) {
      const providerLanguages = providerData.languages || [];
      const hasMatchingLanguage = filters.languages.some(lang =>
        providerLanguages.includes(lang)
      );
      if (!hasMatchingLanguage) return false;
    }

    // Equipment filter
    if (filters.equipment.length > 0) {
      const providerEquipment = providerData.equipment || [];
      const hasMatchingEquipment = filters.equipment.some(eq =>
        providerEquipment.includes(eq)
      );
      if (!hasMatchingEquipment) return false;
    }

    // Certifications filter
    if (filters.certifications.length > 0) {
      const providerCertifications = providerData.certifications || [];
      const hasMatchingCertification = filters.certifications.some(cert =>
        providerCertifications.includes(cert)
      );
      if (!hasMatchingCertification) return false;
    }

    return true;
  }

  /**
   * Get search suggestions for premium clients
   */
  static async getSearchSuggestions(clientId: string, query: string): Promise<string[]> {
    try {
      // Check premium access
      const hasAccess = await clientSubscriptionService.checkClientFeatureAccess(
        clientId, 
        'advanced_search'
      );

      if (!hasAccess.hasAccess) {
        return []; // No suggestions for free users
      }

      // This would typically use a search index or AI service
      // Simplified implementation
      const commonSearches = [
        'house cleaning',
        'plumbing repair',
        'electrical work',
        'gardening',
        'pet care',
        'home maintenance',
        'deep cleaning',
        'emergency repair'
      ];

      return commonSearches.filter(search =>
        search.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);

    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const clientSearchService = new ClientSearchService();
