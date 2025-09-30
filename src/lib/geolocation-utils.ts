/**
 * Geolocation utilities for distance calculation and location-based features
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  address?: string;
  coordinates?: Coordinates;
  city?: string;
  province?: string;
}

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's current location using browser geolocation API
 * @returns Promise with coordinates or null if not available
 */
export function getCurrentLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.warn('Error getting location:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

/**
 * Check if a location has valid coordinates
 * @param location Location data to check
 * @returns True if coordinates are valid
 */
export function hasValidCoordinates(location: LocationData): boolean {
  return !!(
    location.coordinates &&
    typeof location.coordinates.lat === 'number' &&
    typeof location.coordinates.lng === 'number' &&
    !isNaN(location.coordinates.lat) &&
    !isNaN(location.coordinates.lng) &&
    location.coordinates.lat >= -90 &&
    location.coordinates.lat <= 90 &&
    location.coordinates.lng >= -180 &&
    location.coordinates.lng <= 180
  );
}

/**
 * Get location from address using Google Maps Geocoding API
 * @param address Address to geocode
 * @returns Promise with coordinates or null
 */
export function geocodeAddress(address: string): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.Geocoder) {
      console.warn('Google Maps API not available');
      resolve(null);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng()
        });
      } else {
        console.warn('Geocoding failed:', status);
        resolve(null);
      }
    });
  });
}

/**
 * Sort providers by distance from user location
 * @param providers Array of providers with location data
 * @param userLocation User's current location
 * @returns Sorted array of providers with distance information
 */
export function sortProvidersByDistance<T extends { address?: string; coordinates?: Coordinates }>(
  providers: T[],
  userLocation: Coordinates
): (T & { distance?: number; distanceFormatted?: string })[] {
  return providers
    .map(provider => {
      let distance: number | undefined;
      let distanceFormatted: string | undefined;

      // Try to get coordinates from provider data
      if (provider.coordinates) {
        distance = calculateDistance(userLocation, provider.coordinates);
        distanceFormatted = formatDistance(distance);
      } else if (provider.address) {
        // If no coordinates but has address, we could geocode it
        // For now, we'll skip distance calculation for address-only providers
        distance = undefined;
        distanceFormatted = undefined;
      }

      return {
        ...provider,
        distance,
        distanceFormatted
      };
    })
    .sort((a, b) => {
      // Providers with coordinates come first, sorted by distance
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (a.distance !== undefined && b.distance === undefined) {
        return -1;
      }
      if (a.distance === undefined && b.distance !== undefined) {
        return 1;
      }
      // If neither has distance, maintain original order
      return 0;
    });
}

/**
 * Filter providers within a certain radius
 * @param providers Array of providers with distance information
 * @param maxDistance Maximum distance in kilometers
 * @returns Filtered array of providers within radius
 */
export function filterProvidersByRadius<T extends { distance?: number }>(
  providers: T[],
  maxDistance: number
): T[] {
  return providers.filter(provider => 
    provider.distance !== undefined && provider.distance <= maxDistance
  );
}

/**
 * Get nearby providers based on user location
 * @param providers Array of providers
 * @param userLocation User's current location
 * @param maxDistance Maximum distance in kilometers (default: 50km)
 * @returns Nearby providers sorted by distance
 */
export function getNearbyProviders<T extends { address?: string; coordinates?: Coordinates }>(
  providers: T[],
  userLocation: Coordinates,
  maxDistance: number = 50
): (T & { distance?: number; distanceFormatted?: string })[] {
  const sortedProviders = sortProvidersByDistance(providers, userLocation);
  return filterProvidersByRadius(sortedProviders, maxDistance);
}
