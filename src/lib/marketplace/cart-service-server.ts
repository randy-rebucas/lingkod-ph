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
  deleteDoc, 
  serverTimestamp,
  Timestamp,
  orderBy 
} from 'firebase-admin/firestore';
import { CartItem, Cart } from './types';
import { ProductService } from './product-service';

export class CartServiceServer {
  private static readonly CART_COLLECTION = 'cart';

  /**
   * Get the admin database instance
   */
  private static getDb() {
    return adminDb;
  }

  /**
   * Get user's cart
   */
  static async getCart(userId: string): Promise<Cart> {
    try {
      const q = query(
        collection(this.getDb(), 'users', userId, this.CART_COLLECTION),
        orderBy('addedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const items: CartItem[] = [];

      snapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        } as CartItem);
      });

      // Calculate totals
      let totalPrice = 0;
      let totalItems = 0;

      for (const item of items) {
        const product = await ProductService.getProduct(item.productId);
        if (product) {
          const itemPrice = ProductService.getBulkPricing(product, item.quantity);
          totalPrice += itemPrice * item.quantity;
          totalItems += item.quantity;
        }
      }

      return {
        items,
        totalItems,
        totalPrice,
        lastUpdated: Timestamp.now()
      };
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw new Error('Failed to fetch cart');
    }
  }

  /**
   * Add item to cart
   */
  static async addToCart(
    userId: string, 
    productId: string, 
    quantity: number = 1
  ): Promise<void> {
    try {
      // Check if item already exists in cart
      const existingItem = await this.getCartItem(userId, productId);
      
      if (existingItem) {
        // Update quantity
        await this.updateCartItemQuantity(userId, existingItem.id, existingItem.quantity + quantity);
      } else {
        // Add new item
        const cartItem: Omit<CartItem, 'id'> = {
          productId,
          quantity,
          addedAt: serverTimestamp() as Timestamp
        };

        await addDoc(collection(this.getDb(), 'users', userId, this.CART_COLLECTION), cartItem);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw new Error('Failed to add item to cart');
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    try {
      const docRef = doc(this.getDb(), 'users', userId, this.CART_COLLECTION, cartItemId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw new Error('Failed to remove item from cart');
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItemQuantity(
    userId: string, 
    cartItemId: string, 
    quantity: number
  ): Promise<void> {
    try {
      if (quantity <= 0) {
        await this.removeFromCart(userId, cartItemId);
        return;
      }

      const docRef = doc(this.getDb(), 'users', userId, this.CART_COLLECTION, cartItemId);
      await updateDoc(docRef, {
        quantity,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw new Error('Failed to update cart item quantity');
    }
  }

  /**
   * Clear entire cart
   */
  static async clearCart(userId: string): Promise<void> {
    try {
      const q = query(collection(this.getDb(), 'users', userId, this.CART_COLLECTION));
      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new Error('Failed to clear cart');
    }
  }

  /**
   * Get specific cart item
   */
  static async getCartItem(userId: string, productId: string): Promise<CartItem | null> {
    try {
      const q = query(
        collection(this.getDb(), 'users', userId, this.CART_COLLECTION),
        where('productId', '==', productId)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as CartItem;
    } catch (error) {
      console.error('Error fetching cart item:', error);
      throw new Error('Failed to fetch cart item');
    }
  }

  /**
   * Get cart item count
   */
  static async getCartItemCount(userId: string): Promise<number> {
    try {
      const cart = await this.getCart(userId);
      return cart.totalItems;
    } catch (error) {
      console.error('Error fetching cart item count:', error);
      return 0;
    }
  }

  /**
   * Validate cart items (check stock, prices, etc.)
   */
  static async validateCart(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
    updatedItems: CartItem[];
  }> {
    try {
      const cart = await this.getCart(userId);
      const errors: string[] = [];
      const updatedItems: CartItem[] = [];

      for (const item of cart.items) {
        const product = await ProductService.getProduct(item.productId);
        
        if (!product) {
          errors.push(`Product ${item.productId} no longer exists`);
          continue;
        }

        if (!ProductService.isInStock(product)) {
          errors.push(`${product.name} is out of stock`);
          continue;
        }

        if (item.quantity > product.inventory.stock) {
          errors.push(`Only ${product.inventory.stock} units of ${product.name} available`);
          // Update quantity to available stock
          const updatedItem = { ...item, quantity: product.inventory.stock };
          updatedItems.push(updatedItem);
          continue;
        }

        updatedItems.push(item);
      }

      return {
        isValid: errors.length === 0,
        errors,
        updatedItems
      };
    } catch (error) {
      console.error('Error validating cart:', error);
      throw new Error('Failed to validate cart');
    }
  }

  /**
   * Calculate cart totals with current pricing
   */
  static async calculateCartTotals(userId: string): Promise<{
    subtotal: number;
    discount: number;
    total: number;
    itemCount: number;
  }> {
    try {
      const cart = await this.getCart(userId);
      let subtotal = 0;
      let itemCount = 0;

      for (const item of cart.items) {
        const product = await ProductService.getProduct(item.productId);
        if (product) {
          const unitPrice = ProductService.getBulkPricing(product, item.quantity);
          subtotal += unitPrice * item.quantity;
          itemCount += item.quantity;
        }
      }

      // Calculate discount (difference between market price and partner price)
      let marketTotal = 0;
      for (const item of cart.items) {
        const product = await ProductService.getProduct(item.productId);
        if (product) {
          marketTotal += product.pricing.marketPrice * item.quantity;
        }
      }

      const discount = marketTotal - subtotal;
      const total = subtotal; // No additional fees for now

      return {
        subtotal,
        discount,
        total,
        itemCount
      };
    } catch (error) {
      console.error('Error calculating cart totals:', error);
      throw new Error('Failed to calculate cart totals');
    }
  }
}
