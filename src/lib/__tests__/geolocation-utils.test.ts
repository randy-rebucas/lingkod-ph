/**
 * Tests for geolocation utilities
 */

import { 
  calculateDistance, 
  formatDistance, 
  hasValidCoordinates,
  sortProvidersByDistance,
  getNearbyProviders
} from '../geolocation-utils';

describe('Geolocation Utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates correctly', () => {
      // Manila to Quezon City (approximately 10km)
      const manila = { lat: 14.5995, lng: 120.9842 };
      const quezonCity = { lat: 14.6760, lng: 121.0437 };
      
      const distance = calculateDistance(manila, quezonCity);
      
      // Should be approximately 10km (allowing for some variance)
      expect(distance).toBeGreaterThan(8);
      expect(distance).toBeLessThan(12);
    });

    it('should return 0 for identical coordinates', () => {
      const coord = { lat: 14.5995, lng: 120.9842 };
      const distance = calculateDistance(coord, coord);
      expect(distance).toBe(0);
    });
  });

  describe('formatDistance', () => {
    it('should format distances less than 1km in meters', () => {
      expect(formatDistance(0.5)).toBe('500m');
      expect(formatDistance(0.1)).toBe('100m');
    });

    it('should format distances less than 10km with one decimal', () => {
      expect(formatDistance(5.5)).toBe('5.5km');
      expect(formatDistance(9.9)).toBe('9.9km');
    });

    it('should format distances 10km and above as whole numbers', () => {
      expect(formatDistance(10)).toBe('10km');
      expect(formatDistance(25.7)).toBe('26km');
    });
  });

  describe('hasValidCoordinates', () => {
    it('should return true for valid coordinates', () => {
      const validLocation = {
        coordinates: { lat: 14.5995, lng: 120.9842 }
      };
      expect(hasValidCoordinates(validLocation)).toBe(true);
    });

    it('should return false for missing coordinates', () => {
      const invalidLocation = {
        address: 'Some address'
      };
      expect(hasValidCoordinates(invalidLocation)).toBe(false);
    });

    it('should return false for invalid latitude', () => {
      const invalidLocation = {
        coordinates: { lat: 91, lng: 120.9842 } // Invalid latitude
      };
      expect(hasValidCoordinates(invalidLocation)).toBe(false);
    });

    it('should return false for invalid longitude', () => {
      const invalidLocation = {
        coordinates: { lat: 14.5995, lng: 181 } // Invalid longitude
      };
      expect(hasValidCoordinates(invalidLocation)).toBe(false);
    });

    it('should return false for NaN coordinates', () => {
      const invalidLocation = {
        coordinates: { lat: NaN, lng: 120.9842 }
      };
      expect(hasValidCoordinates(invalidLocation)).toBe(false);
    });
  });

  describe('sortProvidersByDistance', () => {
    const userLocation = { lat: 14.5995, lng: 120.9842 };
    
    const providers = [
      {
        uid: '1',
        displayName: 'Provider 1',
        coordinates: { lat: 14.6000, lng: 120.9850 }, // ~1km away
        address: 'Address 1'
      },
      {
        uid: '2',
        displayName: 'Provider 2',
        coordinates: { lat: 14.6100, lng: 120.9950 }, // ~2km away
        address: 'Address 2'
      },
      {
        uid: '3',
        displayName: 'Provider 3',
        address: 'Address 3' // No coordinates
      }
    ];

    it('should sort providers by distance', () => {
      const sorted = sortProvidersByDistance(providers, userLocation);
      
      expect(sorted[0].uid).toBe('1'); // Closest
      expect(sorted[1].uid).toBe('2'); // Farthest with coordinates
      expect(sorted[2].uid).toBe('3'); // No coordinates (last)
    });

    it('should add distance information to providers with coordinates', () => {
      const sorted = sortProvidersByDistance(providers, userLocation);
      
      expect(sorted[0].distance).toBeDefined();
      expect(sorted[0].distanceFormatted).toBeDefined();
      expect(sorted[1].distance).toBeDefined();
      expect(sorted[1].distanceFormatted).toBeDefined();
      expect(sorted[2].distance).toBeUndefined();
    });
  });

  describe('getNearbyProviders', () => {
    const userLocation = { lat: 14.5995, lng: 120.9842 };
    
    const providers = [
      {
        uid: '1',
        displayName: 'Provider 1',
        coordinates: { lat: 14.6000, lng: 120.9850 }, // ~1km away
        address: 'Address 1'
      },
      {
        uid: '2',
        displayName: 'Provider 2',
        coordinates: { lat: 14.7000, lng: 121.1000 }, // ~15km away
        address: 'Address 2'
      },
      {
        uid: '3',
        displayName: 'Provider 3',
        coordinates: { lat: 14.8000, lng: 121.2000 }, // ~30km away
        address: 'Address 3'
      }
    ];

    it('should filter providers within specified radius', () => {
      const nearby = getNearbyProviders(providers, userLocation, 10); // 10km radius
      
      expect(nearby).toHaveLength(1);
      expect(nearby[0].uid).toBe('1');
    });

    it('should return all providers within larger radius', () => {
      const nearby = getNearbyProviders(providers, userLocation, 50); // 50km radius
      
      expect(nearby).toHaveLength(3);
    });

    it('should return empty array for very small radius', () => {
      const nearby = getNearbyProviders(providers, userLocation, 0.05); // 0.05km (50m) radius
      
      expect(nearby).toHaveLength(0);
    });
  });
});
