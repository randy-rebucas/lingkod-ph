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
import { CartService } from './cart-service';
import { WalletService } from './wallet-service';
import { ProductService } from './product-service';
import { MarketplacePaymentIntegration } from './payment-integration';

export class OrderService {
  private static readonly ORDERS_COLLECTION = 'orders';
  private static readonly TRACKING_COLLECTION = 'orderTracking';

  /**
   * Get the appropriate database instance
   */
  private static getDb() {
    // Always use client database for client-side operations
    return db;
  }

  /**
   * Create a new order from cart
   */
  static async createOrder(
    userId: string,
    userRole: 'provider' | 'agency',
    shippingAddress: ShippingAddress,
    paymentMethod: 'wallet' | 'gcash' | 'paypal' | 'bank-transfer'
  ): Promise<Order> {
    try {
      // Validate cart
      const cartValidation = await CartService.validateCart(userId);
      if (!cartValidation.isValid) {
        throw new Error(`Cart validation failed: ${cartValidation.errors.join(', ')}`);
      }

      // Calculate totals
      const totals = await CartService.calculateCartTotals(userId);
      
      // Check payment method
      if (paymentMethod === 'wallet') {
        const hasBalance = await WalletService.hasSufficientBalance(userId, totals.total);
        if (!hasBalance) {
          throw new Error('Insufficient wallet balance');
        }
      }

      // Create order items
      const orderItems: OrderItem[] = [];
      for (const cartItem of cartValidation.updatedItems) {
        const product = await ProductService.getProduct(cartItem.productId);
        if (product) {
          const unitPrice = ProductService.getBulkPricing(product, cartItem.quantity);
          orderItems.push({
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            unitPrice,
            totalPrice: unitPrice * cartItem.quantity
          });
        }
      }

      // Create order
      const orderData: Omit<Order, 'id'> = {
        userId,
        userRole,
        orderType: 'single',
        items: orderItems,
        pricing: {
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: 0, // Free shipping for now
          total: totals.total,
          currency: 'PHP'
        },
        status: 'pending',
        payment: {
          method: paymentMethod,
          status: 'pending'
        },
        shipping: {
          address: shippingAddress
        },
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      const docRef = await addDoc(collection(this.getDb(), this.ORDERS_COLLECTION), orderData);
      const order: Order = {
        id: docRef.id,
        ...orderData
      };

      // Process payment
      await this.processPayment(order, paymentMethod);

      // Clear cart
      await CartService.clearCart(userId);

      // Create initial tracking
      await this.createTrackingEvent(order.id, 'order-placed', 'Order placed successfully');

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Process payment for order
   */
  private static async processPayment(
    order: Order, 
    paymentMethod: string
  ): Promise<void> {
    try {
      // Use the payment integration service
      const paymentResult = await MarketplacePaymentIntegration.processMarketplacePayment(
        order,
        paymentMethod as any
      );

      if (paymentResult.success) {
        // Update order payment status
        await this.updateOrderPayment(order.id, {
          ...order.payment,
          status: paymentMethod === 'wallet' ? 'paid' : 'pending',
          transactionId: paymentResult.transactionId,
          paidAt: paymentMethod === 'wallet' ? serverTimestamp() as Timestamp : undefined
        });

        // Update order status
        if (paymentMethod === 'wallet') {
          await this.updateOrderStatus(order.id, 'confirmed');
        }
      } else {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Failed to process payment');
    }
  }

  /**
   * Get order by ID
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

      // Create tracking event
      await this.createTrackingEvent(orderId, this.mapStatusToTracking(status), `Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Update order payment
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
   * Cancel order
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

      // Update order status
      await this.updateOrderStatus(orderId, 'cancelled');

      // Process refund if payment was made
      if (order.payment.status === 'paid' && order.payment.method === 'wallet') {
        await WalletService.processRefund(
          order.userId,
          order.pricing.total,
          `Refund for cancelled order #${orderId}`,
          orderId
        );
      }

      // Create tracking event
      await this.createTrackingEvent(orderId, 'order-placed', `Order cancelled${reason ? `: ${reason}` : ''}`);
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error('Failed to cancel order');
    }
  }

  /**
   * Create tracking event
   */
  static async createTrackingEvent(
    orderId: string,
    status: TrackingStatus,
    location: string,
    notes?: string,
    coordinates?: { lat: number; lng: number }
  ): Promise<void> {
    try {
      const trackingData: Omit<OrderTracking, 'id'> = {
        orderId,
        status,
        location,
        timestamp: serverTimestamp() as Timestamp,
        notes,
        coordinates
      };

      await addDoc(collection(this.getDb(), this.TRACKING_COLLECTION), trackingData);
    } catch (error) {
      console.error('Error creating tracking event:', error);
      throw new Error('Failed to create tracking event');
    }
  }

  /**
   * Get order tracking
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
   * Map order status to tracking status
   */
  private static mapStatusToTracking(status: OrderStatus): TrackingStatus {
    const statusMap: Record<OrderStatus, TrackingStatus> = {
      'pending': 'order-placed',
      'confirmed': 'supplier-notified',
      'processing': 'warehouse-received',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'order-placed'
    };

    return statusMap[status] || 'order-placed';
  }

  /**
   * Get order statistics for user
   */
  static async getOrderStatistics(userId: string): Promise<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  }> {
    try {
      const orders = await this.getUserOrders(userId);
      
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length;
      const totalSpent = orders.reduce((sum, order) => sum + order.pricing.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      return {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalSpent,
        averageOrderValue
      };
    } catch (error) {
      console.error('Error getting order statistics:', error);
      throw new Error('Failed to get order statistics');
    }
  }

  /**
   * Update shipping information
   */
  static async updateShipping(
    orderId: string,
    trackingNumber?: string,
    estimatedDelivery?: Timestamp
  ): Promise<void> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const docRef = doc(this.getDb(), this.ORDERS_COLLECTION, orderId);
      await updateDoc(docRef, {
        'shipping.trackingNumber': trackingNumber,
        'shipping.estimatedDelivery': estimatedDelivery,
        updatedAt: serverTimestamp()
      });

      if (trackingNumber) {
        await this.createTrackingEvent(orderId, 'shipped', 'Package shipped', `Tracking: ${trackingNumber}`);
      }
    } catch (error) {
      console.error('Error updating shipping:', error);
      throw new Error('Failed to update shipping');
    }
  }
}
