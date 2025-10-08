import { NextRequest, NextResponse } from 'next/server';

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
 * Server-side API route to avoid CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude values' },
        { status: 400 }
      );
    }

    // Use OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'LocalPro-App/1.0', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.display_name) {
      return NextResponse.json(
        { error: 'No address found for the given coordinates' },
        { status: 404 }
      );
    }

    // Parse the address components
    const address = data.address || {};
    
    // Build a readable address
    const addressParts = [];
    
    // Add house number and street
    if (address.house_number && address.road) {
      addressParts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      addressParts.push(address.road);
    }
    
    // Add village, town, or city
    if (address.village) {
      addressParts.push(address.village);
    } else if (address.town) {
      addressParts.push(address.town);
    } else if (address.city) {
      addressParts.push(address.city);
    }
    
    // Add province/state
    if (address.state) {
      addressParts.push(address.state);
    }
    
    // Add postal code
    if (address.postcode) {
      addressParts.push(address.postcode);
    }
    
    // Add country
    if (address.country) {
      addressParts.push(address.country);
    }

    const readableAddress = addressParts.join(', ');

    const result: GeocodingResult = {
      address: readableAddress,
      city: address.city || address.town || address.village,
      province: address.state,
      country: address.country,
      postalCode: address.postcode,
      fullAddress: data.display_name,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to reverse geocode coordinates' },
      { status: 500 }
    );
  }
}
