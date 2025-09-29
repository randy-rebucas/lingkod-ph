import { adminDb } from '../firebase-admin';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp 
} from 'firebase-admin/firestore';
import { 
  Product, 
  ProductCategoryData, 
  ProductFilters, 
  PaginatedResponse 
} from './types';

export class ProductServiceServer {
  private static readonly PRODUCTS_COLLECTION = 'products';
  private static readonly CATEGORIES_COLLECTION = 'productCategories';

  /**
   * Get the admin database instance
   */
  private static getDb() {
    return adminDb;
  }

  /**
   * Get all products with optional filtering and pagination
   */
  static async getProducts(
    filters?: ProductFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Product>> {
    try {
      let q = query(collection(this.getDb(), this.PRODUCTS_COLLECTION));

      // Apply filters
      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters?.subcategory) {
        q = query(q, where('subcategory', '==', filters.subcategory));
      }

      if (filters?.brand && filters.brand.length > 0) {
        q = query(q, where('brand', 'in', filters.brand));
      }

      if (filters?.inStock) {
        q = query(q, where('inventory.stock', '>', 0));
      }

      if (filters?.isFeatured) {
        q = query(q, where('isFeatured', '==', true));
      }

      // Only show active products
      q = query(q, where('isActive', '==', true));

      // Order by featured first, then by creation date
      q = query(q, orderBy('isFeatured', 'desc'), orderBy('createdAt', 'desc'));

      // Apply pagination
      const offset = (page - 1) * pageSize;
      if (offset > 0) {
        // For pagination, we'd need to implement cursor-based pagination
        // This is a simplified version
      }
      q = query(q, limit(pageSize));

      const snapshot = await getDocs(q);
      const products: Product[] = [];

      snapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        } as Product);
      });

      // Apply client-side filters that can't be done in Firestore
      let filteredProducts = products;

      if (filters?.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.brand.toLowerCase().includes(searchLower) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filters?.priceRange) {
        filteredProducts = filteredProducts.filter(product =>
          product.pricing.partnerPrice >= filters.priceRange!.min &&
          product.pricing.partnerPrice <= filters.priceRange!.max
        );
      }

      return {
        items: filteredProducts,
        total: filteredProducts.length,
        page,
        limit: pageSize,
        hasMore: filteredProducts.length === pageSize
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  /**
   * Get a single product by ID
   */
  static async getProduct(productId: string): Promise<Product | null> {
    try {
      const docRef = doc(this.getDb(), this.PRODUCTS_COLLECTION, productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Product;
      }

      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(
    category: string,
    subcategory?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Product>> {
    const filters: ProductFilters = {
      category,
      subcategory
    };

    return this.getProducts(filters, page, pageSize);
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limitCount: number = 10): Promise<Product[]> {
    try {
      const q = query(
        collection(this.getDb(), this.PRODUCTS_COLLECTION),
        where('isFeatured', '==', true),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const products: Product[] = [];

      snapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        } as Product);
      });

      return products;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw new Error('Failed to fetch featured products');
    }
  }

  /**
   * Search products by query
   */
  static async searchProducts(
    searchQuery: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Product>> {
    const filters: ProductFilters = {
      searchQuery
    };

    return this.getProducts(filters, page, pageSize);
  }

  /**
   * Get all product categories
   */
  static async getCategories(): Promise<ProductCategoryData[]> {
    try {
      const q = query(
        collection(this.getDb(), this.CATEGORIES_COLLECTION),
        where('isActive', '==', true),
        orderBy('sortOrder', 'asc')
      );

      const snapshot = await getDocs(q);
      const categories: ProductCategoryData[] = [];

      snapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...doc.data()
        } as ProductCategoryData);
      });

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get unique brands from products
   */
  static async getBrands(): Promise<string[]> {
    try {
      const q = query(
        collection(this.getDb(), this.PRODUCTS_COLLECTION),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const brands = new Set<string>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.brand) {
          brands.add(data.brand);
        }
      });

      return Array.from(brands).sort();
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw new Error('Failed to fetch brands');
    }
  }

  /**
   * Get related products based on category and tags
   */
  static async getRelatedProducts(
    productId: string,
    limitCount: number = 4
  ): Promise<Product[]> {
    try {
      const product = await this.getProduct(productId);
      if (!product) {
        return [];
      }

      const q = query(
        collection(this.getDb(), this.PRODUCTS_COLLECTION),
        where('category', '==', product.category),
        where('isActive', '==', true),
        limit(limitCount + 1) // +1 to exclude the current product
      );

      const snapshot = await getDocs(q);
      const products: Product[] = [];

      snapshot.forEach((doc) => {
        if (doc.id !== productId) {
          products.push({
            id: doc.id,
            ...doc.data()
          } as Product);
        }
      });

      return products.slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching related products:', error);
      throw new Error('Failed to fetch related products');
    }
  }

  /**
   * Calculate savings for a product
   */
  static calculateSavings(product: Product): { amount: number; percentage: number } {
    const savings = product.pricing.marketPrice - product.pricing.partnerPrice;
    const percentage = (savings / product.pricing.marketPrice) * 100;

    return {
      amount: savings,
      percentage: Math.round(percentage)
    };
  }

  /**
   * Check if product is in stock
   */
  static isInStock(product: Product): boolean {
    return product.inventory.stock > 0;
  }

  /**
   * Get bulk pricing for a product
   */
  static getBulkPricing(product: Product, quantity: number): number {
    if (quantity >= 10 && product.pricing.bulkPrice) {
      return product.pricing.bulkPrice;
    }
    return product.pricing.partnerPrice;
  }
}
