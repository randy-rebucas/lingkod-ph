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
  limit,
  FieldValue
} from 'firebase-admin/firestore';
import { 
  Order, 
  OrderItem, 
  OrderStatus, 
  OrderPayment, 
  OrderShipping,
  ShippingAddress,
  OrderTracking,
  TrackingStatus 
} from './types';
import { CartServiceServer } from './cart-service-server';
import { WalletServiceServer } from './wallet-service-server';
import { ProductServiceServer } from './product-service-server';
// import { MarketplacePaymentIntegration } from './payment-integration';

export class OrderServiceServer {
  private static readonly ORDERS_COLLECTION = 'orders';
  private static readonly TRACKING_COLLECTION = 'orderTracking';

  /**
   * Get the admin database instance
   */
  private static getDb() {
    return adminDb;
  }

  /**
   * Create a new order from cart
   */
  static async createOrder(
    userId: string,
    userRole: 'provider' | 'agency',
    shippingAddress: ShippingAddress,
    paymentMethod: string
  ): Promise<Order> {
    try {
      // Get cart items
      const cart = await CartServiceServer.getCart(userId);
      
      if (cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Validate cart
      const validation = await CartServiceServer.validateCart(userId);
      if (!validation.isValid) {
        throw new Error(`Cart validation failed: ${validation.errors.join(', ')}`);
      }

      // Calculate totals
      const totals = await CartServiceServer.calculateCartTotals(userId);

      // Create order
      const orderData: Omit<Order, 'id'> = {
        userId,
        userRole,
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: 0, // Will be calculated
          totalPrice: 0 // Will be calculated
        })),
        pricing: {
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: 0, // Free shipping for now
          total: totals.total
        },
        shipping: {
          address: shippingAddress,
          method: 'standard',
          cost: 0,
          estimatedDays: 3-5
        },
        payment: {
          method: paymentMethod,
          status: 'pending',
          amount: totals.total,
          transactionId: null,
          processedAt: null
        },
        status: 'pending',
        tracking: [],
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      // Add order to database
      const orderRef = await addDoc(collection(this.getDb(), this.ORDERS_COLLECTION), orderData);
      
      // Clear cart
      await CartServiceServer.clearCart(userId);

      // Process payment if wallet
      if (paymentMethod === 'wallet') {
        await this.processPayment(orderRef.id, paymentMethod, totals.total, userId);
      }

      // Get the created order
      const orderDoc = await getDoc(doc(this.getDb(), this.ORDERS_COLLECTION, orderRef.id));
      if (!orderDoc.exists()) {
        throw new Error('Failed to create order');
      }

      return {
        id: orderDoc.id,
        ...orderDoc.data()
      } as Order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Process payment for an order
   */
  private static async processPayment(
    orderId: string,
    paymentMethod: string,
    amount: number,
    userId: string
  ): Promise<void> {
    try {
      if (paymentMethod === 'wallet') {
        // Deduct from wallet
        await WalletServiceServer.deductBalance(userId, amount, 'order-payment', orderId);
        
        // Update order payment status
        await updateDoc(doc(this.getDb(), this.ORDERS_COLLECTION, orderId), {
          'payment.status': 'completed',
          'payment.processedAt': serverTimestamp(),
          'status': 'confirmed',
          updatedAt: serverTimestamp()
        });
      } else {
        // For other payment methods, just update status to pending
        await updateDoc(doc(this.getDb(), this.ORDERS_COLLECTION, orderId), {
          'payment.status': 'pending',
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Failed to process payment');
    }
  }

  /**
   * Get a single order by ID
   */
  static async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(this.getDb(), this.ORDERS_COLLECTION, orderId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Order;
      }

      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order');
    }
  }

  /**
   * Get user's orders
   */
  static async getUserOrders(
    userId: string,
    status?: OrderStatus,
    limitCount: number = 20
  ): Promise<Order[]> {
    try {
      let q = query(
        collection(this.getDb(), this.ORDERS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const snapshot = await getDocs(q);
      const orders: Order[] = [];

      snapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        } as Order);
      });

      return orders;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw new Error('Failed to fetch user orders');
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const docRef = doc(this.getDb(), this.ORDERS_COLLECTION, orderId);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Update order payment information
   */
  static async updateOrderPayment(orderId: string, payment: OrderPayment): Promise<void> {
    try {
      const docRef = doc(this.getDb(), this.ORDERS_COLLECTION, orderId);
      await updateDoc(docRef, {
        payment,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating order payment:', error);
      throw new Error('Failed to update order payment');
    }
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(orderId: string, reason?: string): Promise<void> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'delivered' || order.status === 'cancelled') {
        throw new Error('Cannot cancel order in current status');
      }

      // Refund if payment was completed
      if (order.payment.status === 'completed' && order.payment.method === 'wallet') {
        await WalletServiceServer.addBalance(
          order.userId,
          order.payment.amount,
          'order-refund',
          orderId
        );
      }

      // Update order status
      await updateDoc(doc(this.getDb(), this.ORDERS_COLLECTION, orderId), {
        status: 'cancelled',
        'payment.status': 'refunded',
        updatedAt: serverTimestamp()
      });

      // Add tracking event
      await this.createTrackingEvent(
        orderId,
        'cancelled',
        'Order cancelled',
        reason || 'Order was cancelled by user'
      );
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error('Failed to cancel order');
    }
  }

  /**
   * Create a tracking event for an order
   */
  static async createTrackingEvent(
    orderId: string,
    status: TrackingStatus,
    title: string,
    description: string
  ): Promise<void> {
    try {
      const trackingData = {
        orderId,
        status,
        title,
        description,
        timestamp: serverTimestamp() as Timestamp
      };

      await addDoc(collection(this.getDb(), this.TRACKING_COLLECTION), trackingData);

      // Update order tracking array
      const orderRef = doc(this.getDb(), this.ORDERS_COLLECTION, orderId);
      await updateDoc(orderRef, {
        tracking: FieldValue.arrayUnion({
          status,
          title,
          description,
          timestamp: serverTimestamp()
        }),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating tracking event:', error);
      throw new Error('Failed to create tracking event');
    }
  }

  /**
   * Get order tracking history
   */
  static async getOrderTracking(orderId: string): Promise<OrderTracking[]> {
    try {
      const q = query(
        collection(this.getDb(), this.TRACKING_COLLECTION),
        where('orderId', '==', orderId),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(q);
      const tracking: OrderTracking[] = [];

      snapshot.forEach((doc) => {
        tracking.push({
          id: doc.id,
          ...doc.data()
        } as OrderTracking);
      });

      return tracking;
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      throw new Error('Failed to fetch order tracking');
    }
  }

  /**
   * Get order statistics for a user
   */
  static async getOrderStatistics(userId: string): Promise<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  }> {
    try {
      const q = query(
        collection(this.getDb(), this.ORDERS_COLLECTION),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      let totalOrders = 0;
      let completedOrders = 0;
      let pendingOrders = 0;
      let totalSpent = 0;

      snapshot.forEach((doc) => {
        const order = doc.data() as Order;
        totalOrders++;
        
        if (order.status === 'delivered') {
          completedOrders++;
        } else if (['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)) {
          pendingOrders++;
        }

        if (order.payment.status === 'completed') {
          totalSpent += order.pricing.total;
        }
      });

      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      return {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalSpent,
        averageOrderValue
      };
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      throw new Error('Failed to fetch order statistics');
    }
  }

  /**
   * Update shipping information
   */
  static async updateShipping(
    orderId: string,
    shipping: OrderShipping
  ): Promise<void> {
    try {
      const docRef = doc(this.getDb(), this.ORDERS_COLLECTION, orderId);
      await updateDoc(docRef, {
        shipping,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating shipping:', error);
      throw new Error('Failed to update shipping');
    }
  }
}
