'use server';

import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { subscriptionService } from './subscription-service';
import { SUBSCRIPTION_FEATURES } from './subscription-types';

export interface ProviderRankingData {
  providerId: string;
  displayName: string;
  email: string;
  location: {
    city: string;
    province: string;
  };
  services: string[];
  categories: string[];
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  isVerified: boolean;
  subscriptionTier: 'free' | 'pro';
  hasFeaturedPlacement: boolean;
  lastActiveAt: Timestamp;
  joinedAt: Timestamp;
}

export interface SearchRankingResult {
  providerId: string;
  rank: number;
  score: number;
  reasoning: string;
  isFeatured: boolean;
  subscriptionTier: 'free' | 'pro';
}

export class ProviderRankingService {
  /**
   * Get providers with subscription-based ranking
   */
  static async getRankedProviders(
    category?: string,
    location?: string,
    limitCount: number = 20
  ): Promise<ProviderRankingData[]> {
    try {
      // Build base query
      let providersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'provider'),
        where('accountStatus', '==', 'active'),
        orderBy('averageRating', 'desc'),
        limit(limitCount * 2) // Get more to filter and rank
      );

      // Add category filter if provided
      if (category) {
        providersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'provider'),
          where('accountStatus', '==', 'active'),
          where('categories', 'array-contains', category),
          orderBy('averageRating', 'desc'),
          limit(limitCount * 2)
        );
      }

      const snapshot = await getDocs(providersQuery);
      const providers: ProviderRankingData[] = [];

      // Process each provider and add subscription data
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get subscription info
        const subscription = await subscriptionService.getProviderSubscription(doc.id);
        const hasFeaturedPlacement = subscription?.tier === 'pro' && 
          subscription?.features.some(f => f.id === 'featured_placement' && f.isEnabled);

        providers.push({
          providerId: doc.id,
          displayName: data.displayName || data.email,
          email: data.email,
          location: data.location || { city: '', province: '' },
          services: data.services || [],
          categories: data.categories || [],
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
          totalBookings: data.totalBookings || 0,
          isVerified: data.isVerified || false,
          subscriptionTier: subscription?.tier || 'free',
          hasFeaturedPlacement: hasFeaturedPlacement || false,
          lastActiveAt: data.lastActiveAt || Timestamp.now(),
          joinedAt: data.joinedAt || Timestamp.now()
        });
      }

      // Apply subscription-based ranking
      return this.applySubscriptionRanking(providers, limitCount);
    } catch (error) {
      console.error('Error getting ranked providers:', error);
      return [];
    }
  }

  /**
   * Apply subscription-based ranking to providers
   */
  private static applySubscriptionRanking(
    providers: ProviderRankingData[], 
    limitCount: number
  ): ProviderRankingData[] {
    // Separate Pro and Free providers
    const proProviders = providers.filter(p => p.subscriptionTier === 'pro' && p.hasFeaturedPlacement);
    const freeProviders = providers.filter(p => p.subscriptionTier === 'free' || !p.hasFeaturedPlacement);

    // Sort Pro providers by rating and activity
    const sortedProProviders = proProviders.sort((a, b) => {
      // Primary: Featured placement (Pro subscribers first)
      if (a.hasFeaturedPlacement && !b.hasFeaturedPlacement) return -1;
      if (!a.hasFeaturedPlacement && b.hasFeaturedPlacement) return 1;

      // Secondary: Rating
      if (a.averageRating !== b.averageRating) {
        return b.averageRating - a.averageRating;
      }

      // Tertiary: Number of reviews
      if (a.totalReviews !== b.totalReviews) {
        return b.totalReviews - a.totalReviews;
      }

      // Quaternary: Recent activity
      return b.lastActiveAt.toMillis() - a.lastActiveAt.toMillis();
    });

    // Sort Free providers by rating and activity
    const sortedFreeProviders = freeProviders.sort((a, b) => {
      // Primary: Rating
      if (a.averageRating !== b.averageRating) {
        return b.averageRating - a.averageRating;
      }

      // Secondary: Number of reviews
      if (a.totalReviews !== b.totalReviews) {
        return b.totalReviews - a.totalReviews;
      }

      // Tertiary: Recent activity
      return b.lastActiveAt.toMillis() - a.lastActiveAt.toMillis();
    });

    // Combine: Pro providers first, then Free providers
    const rankedProviders = [...sortedProProviders, ...sortedFreeProviders];
    
    return rankedProviders.slice(0, limitCount);
  }

  /**
   * Search providers with subscription-based ranking
   */
  static async searchProviders(
    searchTerm: string,
    category?: string,
    location?: string,
    limitCount: number = 20
  ): Promise<SearchRankingResult[]> {
    try {
      // Get ranked providers
      const providers = await this.getRankedProviders(category, location, limitCount * 2);
      
      // Filter by search term
      const filteredProviders = providers.filter(provider => {
        const searchLower = searchTerm.toLowerCase();
        return (
          provider.displayName.toLowerCase().includes(searchLower) ||
          provider.services.some(service => service.toLowerCase().includes(searchLower)) ||
          provider.categories.some(cat => cat.toLowerCase().includes(searchLower)) ||
          provider.location.city.toLowerCase().includes(searchLower) ||
          provider.location.province.toLowerCase().includes(searchLower)
        );
      });

      // Apply search ranking with subscription boost
      const rankedResults: SearchRankingResult[] = filteredProviders.map((provider, index) => {
        let score = 100 - index; // Base score from ranking position
        
        // Boost for Pro subscription
        if (provider.subscriptionTier === 'pro') {
          score += 50; // Significant boost for Pro subscribers
        }
        
        // Boost for featured placement
        if (provider.hasFeaturedPlacement) {
          score += 30; // Additional boost for featured placement
        }
        
        // Boost for verification
        if (provider.isVerified) {
          score += 20;
        }
        
        // Boost for high ratings
        if (provider.averageRating >= 4.5) {
          score += 25;
        } else if (provider.averageRating >= 4.0) {
          score += 15;
        }
        
        // Boost for many reviews
        if (provider.totalReviews >= 50) {
          score += 20;
        } else if (provider.totalReviews >= 20) {
          score += 10;
        }

        const reasoning = this.generateRankingReasoning(provider, score);
        
        return {
          providerId: provider.providerId,
          rank: index + 1,
          score,
          reasoning,
          isFeatured: provider.hasFeaturedPlacement,
          subscriptionTier: provider.subscriptionTier
        };
      });

      // Sort by final score
      rankedResults.sort((a, b) => b.score - a.score);
      
      // Update ranks
      rankedResults.forEach((result, index) => {
        result.rank = index + 1;
      });

      return rankedResults.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching providers:', error);
      return [];
    }
  }

  /**
   * Generate ranking reasoning for a provider
   */
  private static generateRankingReasoning(provider: ProviderRankingData, score: number): string {
    const reasons: string[] = [];
    
    if (provider.subscriptionTier === 'pro') {
      reasons.push('Pro subscriber with premium features');
    }
    
    if (provider.hasFeaturedPlacement) {
      reasons.push('Featured placement in search results');
    }
    
    if (provider.isVerified) {
      reasons.push('Verified provider');
    }
    
    if (provider.averageRating >= 4.5) {
      reasons.push('Excellent rating (4.5+ stars)');
    } else if (provider.averageRating >= 4.0) {
      reasons.push('High rating (4.0+ stars)');
    }
    
    if (provider.totalReviews >= 50) {
      reasons.push('Highly reviewed (50+ reviews)');
    } else if (provider.totalReviews >= 20) {
      reasons.push('Well reviewed (20+ reviews)');
    }
    
    if (provider.totalBookings >= 100) {
      reasons.push('Experienced (100+ bookings)');
    } else if (provider.totalBookings >= 50) {
      reasons.push('Experienced (50+ bookings)');
    }

    return reasons.length > 0 
      ? reasons.join(', ')
      : 'Standard provider listing';
  }

  /**
   * Get featured providers (Pro subscribers with featured placement)
   */
  static async getFeaturedProviders(limitCount: number = 5): Promise<ProviderRankingData[]> {
    try {
      const providers = await this.getRankedProviders(undefined, undefined, limitCount * 3);
      return providers
        .filter(p => p.hasFeaturedPlacement)
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting featured providers:', error);
      return [];
    }
  }

  /**
   * Get providers by category with subscription ranking
   */
  static async getProvidersByCategory(
    category: string,
    limitCount: number = 20
  ): Promise<ProviderRankingData[]> {
    return this.getRankedProviders(category, undefined, limitCount);
  }

  /**
   * Get providers by location with subscription ranking
   */
  static async getProvidersByLocation(
    location: string,
    limitCount: number = 20
  ): Promise<ProviderRankingData[]> {
    return this.getRankedProviders(undefined, location, limitCount);
  }
}

// Export singleton instance
export const providerRankingService = new ProviderRankingService();
