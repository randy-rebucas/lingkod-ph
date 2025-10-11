/**
 * Reverse geocoding service using OpenStreetMap Nominatim API
 * Converts latitude and longitude coordinates to readable addresses
 */

import type { GeocodingResult } from './geocoding-actions';

/**
 * Reverse geocode coordinates to get a readable address
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise with geocoding result or null
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  try {
    const { reverseGeocode: reverseGeocodeAction } = await import('./geocoding-actions');
    const result = await reverseGeocodeAction(lat, lng);
    
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('Reverse geocoding failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Format coordinates as a fallback address
 * @param lat Latitude
 * @param lng Longitude
 * @returns Formatted coordinate string
 */
export function formatCoordinatesAsAddress(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Get a readable address from coordinates with fallback
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise with readable address
 */
export async function getReadableAddress(lat: number, lng: number): Promise<string> {
  try {
    const result = await reverseGeocode(lat, lng);
    if (result && result.address) {
      return result.address;
    }
  } catch (error) {
    console.warn('Failed to get readable address:', error);
  }
  
  // Fallback to coordinate format
  return formatCoordinatesAsAddress(lat, lng);
}
