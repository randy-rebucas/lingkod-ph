/**
 * Location-based provider service for finding nearby providers
 */

import { getDb } from './firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { 
  getCurrentLocation, 
  getNearbyProviders, 
  hasValidCoordinates,
  Coordinates,
  LocationData 
} from './geolocation-utils';

export interface ProviderWithLocation {
  uid: string;
  displayName: string;
  bio?: string;
  photoURL?: string;
  rating: number;
  reviewCount: number;
  availabilityStatus?: 'available' | 'limited' | 'unavailable';
  keyServices?: string[];
  address?: string;
  coordinates?: Coordinates;
  totalRevenue?: number;
  isVerified?: boolean;
  role?: 'provider' | 'agency';
  distance?: number;
  distanceFormatted?: string;
}

export interface LocationSearchOptions {
  maxDistance?: number; // in kilometers, default 50km
  limit?: number; // maximum number of results, default 20
  includeUnavailable?: boolean; // include unavailable providers, default false
  serviceFilter?: string[]; // filter by specific services
  minRating?: number; // minimum rating filter
}

export class LocationBasedProviderService {
  private static instance: LocationBasedProviderService;

  public static getInstance(): LocationBasedProviderService {
    if (!LocationBasedProviderService.instance) {
      LocationBasedProviderService.instance = new LocationBasedProviderService();
    }
    return LocationBasedProviderService.instance;
  }

  /**
   * Get nearby providers based on user's current location
   */
  async getNearbyProvidersFromCurrentLocation(
    options: LocationSearchOptions = {}
  ): Promise<ProviderWithLocation[]> {
    const userLocation = await getCurrentLocation();
    
    if (!userLocation) {
      throw new Error('Unable to get user location. Please enable location services.');
    }

    return this.getNearbyProvidersFromCoordinates(userLocation, options);
  }

  /**
   * Get nearby providers based on specific coordinates
   */
  async getNearbyProvidersFromCoordinates(
    coordinates: Coordinates,
    options: LocationSearchOptions = {}
  ): Promise<ProviderWithLocation[]> {
    const {
      maxDistance = 50,
      limit: resultLimit = 20,
      includeUnavailable = false,
      serviceFilter = [],
      minRating = 0
    } = options;

    try {
      // Fetch all providers and agencies
      const providersQuery = query(
        collection(getDb(), "users"),
        where("role", "in", ["provider", "agency"])
      );
      
      const providersSnapshot = await getDocs(providersQuery);
      const allProviders = providersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          displayName: data.displayName || 'Unnamed Provider',
          bio: data.bio,
          photoURL: data.photoURL,
          rating: 0, // Will be calculated from reviews
          reviewCount: 0,
          availabilityStatus: data.availabilityStatus,
          keyServices: data.keyServices || [],
          address: data.address,
          coordinates: data.coordinates || (data.latitude && data.longitude ? {
            lat: data.latitude,
            lng: data.longitude
          } : undefined),
          isVerified: data.verification?.status === 'Verified',
          role: data.role,
        } as ProviderWithLocation;
      });

      // Filter providers with valid coordinates
      const providersWithLocation = allProviders.filter(provider => 
        hasValidCoordinates(provider)
      );

      // Get nearby providers
      const nearbyProviders = getNearbyProviders(
        providersWithLocation,
        coordinates,
        maxDistance
      );

      // Apply additional filters
      let filteredProviders = nearbyProviders;

      // Filter by availability
      if (!includeUnavailable) {
        filteredProviders = filteredProviders.filter(provider => 
          provider.availabilityStatus !== 'unavailable'
        );
      }

      // Filter by services
      if (serviceFilter.length > 0) {
        filteredProviders = filteredProviders.filter(provider =>
          provider.keyServices?.some(service =>
            serviceFilter.some(filter => 
              service.toLowerCase().includes(filter.toLowerCase())
            )
          )
        );
      }

      // Calculate ratings for filtered providers
      const providersWithRatings = await this.calculateProviderRatings(filteredProviders);

      // Filter by minimum rating
      const finalProviders = providersWithRatings.filter(provider =>
        provider.rating >= minRating
      );

      // Sort by distance and rating, limit results
      return finalProviders
        .sort((a, b) => {
          // First sort by distance, then by rating
          if (a.distance !== undefined && b.distance !== undefined) {
            const distanceDiff = a.distance - b.distance;
            if (Math.abs(distanceDiff) < 5) { // If distance is similar (within 5km), sort by rating
              return b.rating - a.rating;
            }
            return distanceDiff;
          }
          return b.rating - a.rating;
        })
        .slice(0, resultLimit);

    } catch (error) {
      console.error('Error fetching nearby providers:', error);
      throw new Error('Failed to fetch nearby providers');
    }
  }

  /**
   * Get nearby providers by city/province (fallback when coordinates not available)
   */
  async getNearbyProvidersByLocation(
    city: string,
    province: string,
    options: LocationSearchOptions = {}
  ): Promise<ProviderWithLocation[]> {
    const {
      limit: resultLimit = 20,
      includeUnavailable = false,
      serviceFilter = [],
      minRating = 0
    } = options;

    try {
      // Query providers by city and province
      const providersQuery = query(
        collection(getDb(), "users"),
        where("role", "in", ["provider", "agency"]),
        where("city", "==", city),
        where("province", "==", province)
      );

      const providersSnapshot = await getDocs(providersQuery);
      const providers = providersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          displayName: data.displayName || 'Unnamed Provider',
          bio: data.bio,
          photoURL: data.photoURL,
          rating: 0,
          reviewCount: 0,
          availabilityStatus: data.availabilityStatus,
          keyServices: data.keyServices || [],
          address: data.address,
          coordinates: data.coordinates || (data.latitude && data.longitude ? {
            lat: data.latitude,
            lng: data.longitude
          } : undefined),
          isVerified: data.verification?.status === 'Verified',
          role: data.role,
        } as ProviderWithLocation;
      });

      // Apply filters
      let filteredProviders = providers;

      if (!includeUnavailable) {
        filteredProviders = filteredProviders.filter(provider => 
          provider.availabilityStatus !== 'unavailable'
        );
      }

      if (serviceFilter.length > 0) {
        filteredProviders = filteredProviders.filter(provider =>
          provider.keyServices?.some(service =>
            serviceFilter.some(filter => 
              service.toLowerCase().includes(filter.toLowerCase())
            )
          )
        );
      }

      // Calculate ratings
      const providersWithRatings = await this.calculateProviderRatings(filteredProviders);

      // Filter by minimum rating and sort by rating
      return providersWithRatings
        .filter(provider => provider.rating >= minRating)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, resultLimit);

    } catch (error) {
      console.error('Error fetching providers by location:', error);
      throw new Error('Failed to fetch providers by location');
    }
  }

  /**
   * Calculate ratings for providers from reviews
   */
  private async calculateProviderRatings(
    providers: ProviderWithLocation[]
  ): Promise<ProviderWithLocation[]> {
    if (providers.length === 0) return providers;

    try {
      // Get all reviews for these providers
      const providerIds = providers.map(p => p.uid);
      const reviewsQuery = query(
        collection(getDb(), "reviews"),
        where("providerId", "in", providerIds)
      );

      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviews = reviewsSnapshot.docs.map(doc => doc.data());

      // Calculate ratings for each provider
      const providerRatings: { [key: string]: { totalRating: number, count: number } } = {};
      
      reviews.forEach(review => {
        if (!providerRatings[review.providerId]) {
          providerRatings[review.providerId] = { totalRating: 0, count: 0 };
        }
        providerRatings[review.providerId].totalRating += review.rating;
        providerRatings[review.providerId].count++;
      });

      // Update providers with calculated ratings
      return providers.map(provider => {
        const ratingInfo = providerRatings[provider.uid];
        return {
          ...provider,
          rating: ratingInfo ? ratingInfo.totalRating / ratingInfo.count : 0,
          reviewCount: ratingInfo ? ratingInfo.count : 0
        };
      });

    } catch (error) {
      console.error('Error calculating provider ratings:', error);
      return providers; // Return providers without ratings if calculation fails
    }
  }

  /**
   * Get user's location from their profile
   */
  async getUserLocation(userId: string): Promise<LocationData | null> {
    try {
      const userDoc = await getDocs(query(
        collection(getDb(), "users"),
        where("uid", "==", userId),
        limit(1)
      ));

      if (userDoc.empty) return null;

      const userData = userDoc.docs[0].data();
      
      return {
        address: userData.address,
        coordinates: userData.coordinates || (userData.latitude && userData.longitude ? {
          lat: userData.latitude,
          lng: userData.longitude
        } : undefined),
        city: userData.city,
        province: userData.province
      };

    } catch (error) {
      console.error('Error getting user location:', error);
      return null;
    }
  }
}
