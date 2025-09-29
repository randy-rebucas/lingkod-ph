import { adminDb } from '../firebase-admin';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp,
  orderBy,
  limit 
} from 'firebase-admin/firestore';
import { SubscriptionKit, KitProduct } from './types';
import { ProductServiceServer } from './product-service-server';

export class SubscriptionServiceServer {
  private static readonly KITS_COLLECTION = 'subscriptionKits';

  /**
   * Get the admin database instance
   */
  private static getDb() {
    return adminDb;
  }

  /**
   * Get all available subscription kits
   */
  static async getSubscriptionKits(): Promise<SubscriptionKit[]> {
    try {
      const q = query(
        collection(this.getDb(), this.KITS_COLLECTION),
        where('isActive', '==', true),
        orderBy('featured', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const kits: SubscriptionKit[] = [];

      snapshot.forEach((doc) => {
        kits.push({
          id: doc.id,
          ...doc.data()
        } as SubscriptionKit);
      });

      return kits;
    } catch (error) {
      console.error('Error fetching subscription kits:', error);
      throw new Error('Failed to fetch subscription kits');
    }
  }

  /**
   * Get a single subscription kit by ID
   */
  static async getSubscriptionKit(kitId: string): Promise<SubscriptionKit | null> {
    try {
      const docRef = doc(this.getDb(), this.KITS_COLLECTION, kitId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as SubscriptionKit;
      }

      return null;
    } catch (error) {
      console.error('Error fetching subscription kit:', error);
      throw new Error('Failed to fetch subscription kit');
    }
  }

  /**
   * Get featured subscription kits
   */
  static async getFeaturedKits(limitCount: number = 6): Promise<SubscriptionKit[]> {
    try {
      const q = query(
        collection(this.getDb(), this.KITS_COLLECTION),
        where('isActive', '==', true),
        where('featured', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const kits: SubscriptionKit[] = [];

      snapshot.forEach((doc) => {
        kits.push({
          id: doc.id,
          ...doc.data()
        } as SubscriptionKit);
      });

      return kits;
    } catch (error) {
      console.error('Error fetching featured kits:', error);
      throw new Error('Failed to fetch featured kits');
    }
  }

  /**
   * Get subscription kits by category
   */
  static async getKitsByCategory(category: string): Promise<SubscriptionKit[]> {
    try {
      const q = query(
        collection(this.getDb(), this.KITS_COLLECTION),
        where('isActive', '==', true),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const kits: SubscriptionKit[] = [];

      snapshot.forEach((doc) => {
        kits.push({
          id: doc.id,
          ...doc.data()
        } as SubscriptionKit);
      });

      return kits;
    } catch (error) {
      console.error('Error fetching kits by category:', error);
      throw new Error('Failed to fetch kits by category');
    }
  }

  /**
   * Calculate kit total value
   */
  static async calculateKitValue(kit: SubscriptionKit): Promise<{
    totalValue: number;
    savings: number;
    savingsPercentage: number;
  }> {
    try {
      let totalValue = 0;
      let totalKitPrice = 0;

      for (const kitProduct of kit.products) {
        const product = await ProductServiceServer.getProduct(kitProduct.productId);
        if (product) {
          const productValue = product.pricing.marketPrice * kitProduct.quantity;
          totalValue += productValue;
          totalKitPrice += product.pricing.partnerPrice * kitProduct.quantity;
        }
      }

      const savings = totalValue - kit.price;
      const savingsPercentage = totalValue > 0 ? (savings / totalValue) * 100 : 0;

      return {
        totalValue,
        savings,
        savingsPercentage: Math.round(savingsPercentage)
      };
    } catch (error) {
      console.error('Error calculating kit value:', error);
      throw new Error('Failed to calculate kit value');
    }
  }

  /**
   * Validate kit products availability
   */
  static async validateKitAvailability(kit: SubscriptionKit): Promise<{
    isAvailable: boolean;
    unavailableProducts: string[];
    totalStock: number;
  }> {
    try {
      const unavailableProducts: string[] = [];
      let totalStock = Infinity;

      for (const kitProduct of kit.products) {
        const product = await ProductServiceServer.getProduct(kitProduct.productId);
        if (!product) {
          unavailableProducts.push(kitProduct.productId);
          continue;
        }

        if (!ProductServiceServer.isInStock(product)) {
          unavailableProducts.push(product.name);
          continue;
        }

        if (product.inventory.stock < kitProduct.quantity) {
          unavailableProducts.push(`${product.name} (only ${product.inventory.stock} available)`);
          continue;
        }

        // Track minimum stock across all products
        const availableForKit = Math.floor(product.inventory.stock / kitProduct.quantity);
        totalStock = Math.min(totalStock, availableForKit);
      }

      return {
        isAvailable: unavailableProducts.length === 0,
        unavailableProducts,
        totalStock: totalStock === Infinity ? 0 : totalStock
      };
    } catch (error) {
      console.error('Error validating kit availability:', error);
      throw new Error('Failed to validate kit availability');
    }
  }

  /**
   * Get kit recommendations based on user preferences
   */
  static async getKitRecommendations(
    userId: string,
    limitCount: number = 4
  ): Promise<SubscriptionKit[]> {
    try {
      // For now, return featured kits
      // In the future, this could be based on user purchase history, preferences, etc.
      return await this.getFeaturedKits(limitCount);
    } catch (error) {
      console.error('Error fetching kit recommendations:', error);
      throw new Error('Failed to fetch kit recommendations');
    }
  }

  /**
   * Search subscription kits
   */
  static async searchKits(
    searchQuery: string,
    limitCount: number = 20
  ): Promise<SubscriptionKit[]> {
    try {
      const q = query(
        collection(this.getDb(), this.KITS_COLLECTION),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const allKits: SubscriptionKit[] = [];

      snapshot.forEach((doc) => {
        allKits.push({
          id: doc.id,
          ...doc.data()
        } as SubscriptionKit);
      });

      // Filter by search query (client-side filtering for text search)
      const searchLower = searchQuery.toLowerCase();
      const filteredKits = allKits.filter(kit =>
        kit.name.toLowerCase().includes(searchLower) ||
        kit.description.toLowerCase().includes(searchLower) ||
        kit.category.toLowerCase().includes(searchLower) ||
        kit.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );

      return filteredKits;
    } catch (error) {
      console.error('Error searching kits:', error);
      throw new Error('Failed to search kits');
    }
  }

  /**
   * Get kit categories
   */
  static async getKitCategories(): Promise<string[]> {
    try {
      const q = query(
        collection(this.getDb(), this.KITS_COLLECTION),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const categories = new Set<string>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });

      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error fetching kit categories:', error);
      throw new Error('Failed to fetch kit categories');
    }
  }

  /**
   * Update kit view count
   */
  static async incrementKitViews(kitId: string): Promise<void> {
    try {
      const docRef = doc(this.getDb(), this.KITS_COLLECTION, kitId);
      await updateDoc(docRef, {
        viewCount: adminDb.FieldValue.increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error incrementing kit views:', error);
      // Don't throw error for view count updates
    }
  }
}
