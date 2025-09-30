# Location-Based Provider Suggestions

This document describes the implementation of location-based provider suggestions in the Lingkod platform.

## Overview

The location-based provider feature allows clients to find service providers based on their geographic proximity. This feature uses the browser's geolocation API to get the user's current location and calculates distances to providers using the Haversine formula.

## Features

### 1. Geolocation Utilities (`src/lib/geolocation-utils.ts`)

- **Distance Calculation**: Uses the Haversine formula to calculate distances between coordinates
- **Location Validation**: Validates coordinate data for accuracy
- **Distance Formatting**: Formats distances for display (meters for <1km, kilometers for >=1km)
- **Provider Sorting**: Sorts providers by distance from user location
- **Radius Filtering**: Filters providers within a specified radius

### 2. Location-Based Provider Service (`src/lib/location-based-provider-service.ts`)

- **Current Location Search**: Finds providers near user's current location
- **Coordinate-Based Search**: Finds providers near specific coordinates
- **Location-Based Search**: Falls back to city/province search when coordinates unavailable
- **Advanced Filtering**: Supports filtering by distance, availability, services, and rating
- **Rating Calculation**: Calculates provider ratings from reviews

### 3. Dashboard Integration

- **"Find Nearby Providers" Button**: Prominent button to trigger location-based search
- **Distance Display**: Shows distance from user to each provider
- **Location Status**: Indicates when location-based search is active
- **Clear Functionality**: Easy way to clear location search and return to all providers

## Usage

### For Clients

1. **Access the Feature**: 
   - Go to the dashboard (client view)
   - Click the "📍 Find Nearby Providers" button

2. **Location Permission**:
   - Browser will request location permission
   - Allow location access to use the feature

3. **View Results**:
   - Providers are sorted by distance (closest first)
   - Distance is displayed on each provider card
   - Results show providers within 50km radius

4. **Clear Search**:
   - Click "Clear location search" to return to all providers

### For Developers

#### Using Geolocation Utilities

```typescript
import { 
  calculateDistance, 
  getCurrentLocation, 
  getNearbyProviders 
} from '@/lib/geolocation-utils';

// Get user's current location
const location = await getCurrentLocation();

// Calculate distance between two points
const distance = calculateDistance(
  { lat: 14.5995, lng: 120.9842 },
  { lat: 14.6760, lng: 121.0437 }
);

// Get nearby providers
const nearbyProviders = getNearbyProviders(
  providers,
  userLocation,
  50 // 50km radius
);
```

#### Using Location-Based Provider Service

```typescript
import { LocationBasedProviderService } from '@/lib/location-based-provider-service';

const service = LocationBasedProviderService.getInstance();

// Get nearby providers from current location
const nearbyProviders = await service.getNearbyProvidersFromCurrentLocation({
  maxDistance: 50,
  limit: 20,
  includeUnavailable: false,
  minRating: 4.0
});

// Get nearby providers from specific coordinates
const nearbyProviders = await service.getNearbyProvidersFromCoordinates(
  { lat: 14.5995, lng: 120.9842 },
  { maxDistance: 25, limit: 10 }
);
```

## Data Structure

### Provider Location Data

Providers can have location data in multiple formats:

```typescript
// Preferred format (coordinates)
{
  coordinates: {
    lat: 14.5995,
    lng: 120.9842
  }
}

// Legacy format (separate fields)
{
  latitude: 14.5995,
  longitude: 120.9842
}

// Fallback format (address only)
{
  address: "123 Main St, Quezon City, Metro Manila",
  city: "Quezon City",
  province: "Metro Manila"
}
```

### Provider with Distance

```typescript
interface ProviderWithLocation {
  uid: string;
  displayName: string;
  // ... other provider fields
  coordinates?: Coordinates;
  distance?: number; // in kilometers
  distanceFormatted?: string; // "1.2km" or "500m"
}
```

## Configuration

### Search Options

```typescript
interface LocationSearchOptions {
  maxDistance?: number; // Default: 50km
  limit?: number; // Default: 20
  includeUnavailable?: boolean; // Default: false
  serviceFilter?: string[]; // Filter by services
  minRating?: number; // Default: 0
}
```

### Default Settings

- **Search Radius**: 50km
- **Result Limit**: 20 providers
- **Availability**: Excludes unavailable providers
- **Rating Filter**: No minimum rating requirement

## Error Handling

The feature includes comprehensive error handling:

1. **Location Access Denied**: Shows user-friendly message to enable location services
2. **Geolocation Not Supported**: Graceful fallback for unsupported browsers
3. **Network Errors**: Handles API failures gracefully
4. **Invalid Coordinates**: Validates coordinate data before processing

## Privacy Considerations

- Location data is only used for finding nearby providers
- No location data is stored or transmitted to external services
- Users can clear location search at any time
- Location permission is requested only when needed

## Testing

The feature includes comprehensive tests:

```bash
# Run geolocation utility tests
npm test -- src/lib/__tests__/geolocation-utils.test.ts
```

Tests cover:
- Distance calculations
- Coordinate validation
- Provider sorting and filtering
- Distance formatting
- Edge cases and error conditions

## Future Enhancements

Potential improvements for the future:

1. **Map Integration**: Display providers on an interactive map
2. **Custom Radius**: Allow users to set custom search radius
3. **Location History**: Remember user's preferred locations
4. **Offline Support**: Cache nearby providers for offline viewing
5. **Advanced Filters**: Filter by service area, working hours, etc.
6. **Route Planning**: Show travel time and directions to providers

## Troubleshooting

### Common Issues

1. **"Location Access Required" Error**:
   - Ensure location services are enabled in browser
   - Check browser permissions for the site
   - Try refreshing the page

2. **No Nearby Providers Found**:
   - Increase search radius
   - Check if providers have valid location data
   - Verify provider availability status

3. **Inaccurate Distances**:
   - Ensure provider coordinates are accurate
   - Check for coordinate format issues
   - Verify coordinate system (should be WGS84)

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('debug-location', 'true');
```

This will log detailed information about location calculations and provider filtering.
