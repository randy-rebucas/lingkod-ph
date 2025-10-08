/**
 * Reverse geocoding service using OpenStreetMap Nominatim API
 * Converts latitude and longitude coordinates to readable addresses
 */

export interface GeocodingResult {
  address: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  fullAddress: string;
}

/**
 * Reverse geocode coordinates to get a readable address
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise with geocoding result or null
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  try {
    // Use our server-side API route to avoid CORS issues
    const response = await fetch(
      `/api/geocoding/reverse?lat=${lat}&lng=${lng}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.warn('Geocoding API error:', data.error);
      return null;
    }

    return data;
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
