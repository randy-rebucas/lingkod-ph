import { db } from '../firebase';
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
} from 'firebase/firestore';
import { SubscriptionKit, KitProduct } from './types';
import { ProductService } from './product-service';

export class SubscriptionService {
  private static readonly KITS_COLLECTION = 'subscriptionKits';

  /**
   * Get the appropriate database instance
   */
  private static getDb() {
    // Always use client database for client-side operations
    return db;
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
   * Get subscription kit by ID
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
  static async getFeaturedKits(limitCount: number = 3): Promise<SubscriptionKit[]> {
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
      console.error('Error fetching kits by category:', error);
      throw new Error('Failed to fetch kits by category');
    }
  }

  /**
   * Calculate kit savings
   */
  static calculateKitSavings(kit: SubscriptionKit): {
    monthlySavings: number;
    oneTimeSavings: number;
    monthlySavingsPercentage: number;
    oneTimeSavingsPercentage: number;
  } {
    // Calculate individual product prices
    let individualTotal = 0;
    kit.products.forEach(kitProduct => {
      individualTotal += kitProduct.price * kitProduct.quantity;
    });

    const monthlySavings = individualTotal - kit.pricing.monthlyPrice;
    const oneTimeSavings = individualTotal - kit.pricing.oneTimePrice;
    
    const monthlySavingsPercentage = (monthlySavings / individualTotal) * 100;
    const oneTimeSavingsPercentage = (oneTimeSavings / individualTotal) * 100;

    return {
      monthlySavings,
      oneTimeSavings,
      monthlySavingsPercentage: Math.round(monthlySavingsPercentage),
      oneTimeSavingsPercentage: Math.round(oneTimeSavingsPercentage)
    };
  }

  /**
   * Validate kit products availability
   */
  static async validateKitProducts(kit: SubscriptionKit): Promise<{
    isValid: boolean;
    unavailableProducts: string[];
    updatedKit: SubscriptionKit;
  }> {
    try {
      const unavailableProducts: string[] = [];
      const updatedProducts: KitProduct[] = [];

      for (const kitProduct of kit.products) {
        const product = await ProductService.getProduct(kitProduct.productId);
        
        if (!product) {
          unavailableProducts.push(kitProduct.productId);
          continue;
        }

        if (!ProductService.isInStock(product)) {
          unavailableProducts.push(product.name);
          continue;
        }

        if (kitProduct.quantity > product.inventory.stock) {
          // Update quantity to available stock
          updatedProducts.push({
            ...kitProduct,
            quantity: product.inventory.stock
          });
        } else {
          updatedProducts.push(kitProduct);
        }
      }

      const updatedKit: SubscriptionKit = {
        ...kit,
        products: updatedProducts
      };

      return {
        isValid: unavailableProducts.length === 0,
        unavailableProducts,
        updatedKit
      };
    } catch (error) {
      console.error('Error validating kit products:', error);
      throw new Error('Failed to validate kit products');
    }
  }

  /**
   * Get kit product details
   */
  static async getKitProductDetails(kit: SubscriptionKit): Promise<{
    products: Array<{
      product: any;
      kitProduct: KitProduct;
      savings: number;
    }>;
    totalValue: number;
    totalSavings: number;
  }> {
    try {
      const products = [];
      let totalValue = 0;

      for (const kitProduct of kit.products) {
        const product = await ProductService.getProduct(kitProduct.productId);
        if (product) {
          const individualPrice = product.pricing.marketPrice * kitProduct.quantity;
          const kitPrice = kitProduct.price * kitProduct.quantity;
          const savings = individualPrice - kitPrice;

          products.push({
            product,
            kitProduct,
            savings
          });

          totalValue += individualPrice;
        }
      }

      const totalSavings = totalValue - kit.pricing.oneTimePrice;

      return {
        products,
        totalValue,
        totalSavings
      };
    } catch (error) {
      console.error('Error getting kit product details:', error);
      throw new Error('Failed to get kit product details');
    }
  }

  /**
   * Create custom subscription kit
   */
  static async createCustomKit(
    name: string,
    description: string,
    category: string,
    products: KitProduct[],
    deliverySchedule: 'monthly' | 'quarterly' | 'custom'
  ): Promise<SubscriptionKit> {
    try {
      // Validate all products
      let totalPrice = 0;
      for (const kitProduct of products) {
        const product = await ProductService.getProduct(kitProduct.productId);
        if (!product) {
          throw new Error(`Product ${kitProduct.productId} not found`);
        }
        totalPrice += kitProduct.price * kitProduct.quantity;
      }

      // Calculate pricing
      const monthlyPrice = totalPrice;
      const oneTimePrice = Math.round(totalPrice * 1.2); // 20% premium for one-time
      const savings = oneTimePrice - monthlyPrice;

      const kitData: Omit<SubscriptionKit, 'id'> = {
        name,
        description,
        category,
        products,
        pricing: {
          monthlyPrice,
          oneTimePrice,
          savings
        },
        deliverySchedule,
        isActive: true,
        featured: false,
        createdAt: serverTimestamp() as Timestamp
      };

      const docRef = await addDoc(collection(this.getDb(), this.KITS_COLLECTION), kitData);
      
      return {
        id: docRef.id,
        ...kitData
      };
    } catch (error) {
      console.error('Error creating custom kit:', error);
      throw new Error('Failed to create custom kit');
    }
  }

  /**
   * Get recommended kits based on user's service category
   */
  static async getRecommendedKits(userServiceCategory: string): Promise<SubscriptionKit[]> {
    try {
      // Map service categories to product categories
      const categoryMapping: Record<string, string> = {
        'cleaning': 'cleaning',
        'pest-control': 'pest-control',
        'maintenance': 'tools',
        'painting': 'paint',
        'plumbing': 'plumbing',
        'electrical': 'electrical'
      };

      const productCategory = categoryMapping[userServiceCategory] || 'tools';
      
      return await this.getKitsByCategory(productCategory);
    } catch (error) {
      console.error('Error getting recommended kits:', error);
      throw new Error('Failed to get recommended kits');
    }
  }

  /**
   * Get kit delivery schedule options
   */
  static getDeliveryScheduleOptions(): Array<{
    value: 'monthly' | 'quarterly' | 'custom';
    label: string;
    description: string;
  }> {
    return [
      {
        value: 'monthly',
        label: 'Monthly Delivery',
        description: 'Receive your kit every month'
      },
      {
        value: 'quarterly',
        label: 'Quarterly Delivery',
        description: 'Receive your kit every 3 months'
      },
      {
        value: 'custom',
        label: 'Custom Schedule',
        description: 'Set your own delivery frequency'
      }
    ];
  }

  /**
   * Calculate next delivery date
   */
  static calculateNextDeliveryDate(
    deliverySchedule: 'monthly' | 'quarterly' | 'custom',
    lastDeliveryDate?: Date
  ): Date {
    const now = new Date();
    const baseDate = lastDeliveryDate || now;

    switch (deliverySchedule) {
      case 'monthly':
        return new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate());
      case 'quarterly':
        return new Date(baseDate.getFullYear(), baseDate.getMonth() + 3, baseDate.getDate());
      case 'custom':
        // For custom, default to monthly
        return new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate());
      default:
        return new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate());
    }
  }
}
