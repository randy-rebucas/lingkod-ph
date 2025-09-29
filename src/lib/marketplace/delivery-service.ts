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
  orderBy 
} from 'firebase/firestore';
import { Order, OrderTracking, TrackingStatus } from './types';
import { OrderService } from './order-service';

export class DeliveryService {
  private static readonly TRACKING_COLLECTION = 'orderTracking';
  private static readonly DELIVERY_COLLECTION = 'deliveries';

  /**
   * Create a new delivery for an order
   */
  static async createDelivery(orderId: string): Promise<void> {
    try {
      const order = await OrderService.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'confirmed') {
        throw new Error('Order must be confirmed before creating delivery');
      }

      // Create initial tracking event
      await OrderService.createTrackingEvent(
        orderId,
        'supplier-notified',
        'Supplier has been notified of your order',
        'Your order has been sent to the supplier for processing'
      );

      // Update order status
      await OrderService.updateOrderStatus(orderId, 'processing');
    } catch (error) {
      console.error('Error creating delivery:', error);
      throw new Error('Failed to create delivery');
    }
  }

  /**
   * Update delivery status
   */
  static async updateDeliveryStatus(
    orderId: string,
    status: TrackingStatus,
    location: string,
    notes?: string,
    coordinates?: { lat: number; lng: number }
  ): Promise<void> {
    try {
      // Create tracking event
      await OrderService.createTrackingEvent(orderId, status, location, notes, coordinates);

      // Update order status based on tracking status
      const orderStatusMap: Record<TrackingStatus, string> = {
        'order-placed': 'pending',
        'supplier-notified': 'confirmed',
        'warehouse-received': 'processing',
        'packed': 'processing',
        'shipped': 'shipped',
        'out-for-delivery': 'shipped',
        'delivered': 'delivered'
      };

      const newOrderStatus = orderStatusMap[status];
      if (newOrderStatus) {
        await OrderService.updateOrderStatus(orderId, newOrderStatus as any);
      }

      // If delivered, update delivery timestamp
      if (status === 'delivered') {
        const order = await OrderService.getOrder(orderId);
        if (order) {
          const docRef = doc(db, 'orders', orderId);
          await updateDoc(docRef, {
            'shipping.deliveredAt': serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw new Error('Failed to update delivery status');
    }
  }

  /**
   * Get delivery tracking for an order
   */
  static async getDeliveryTracking(orderId: string): Promise<OrderTracking[]> {
    try {
      return await OrderService.getOrderTracking(orderId);
    } catch (error) {
      console.error('Error fetching delivery tracking:', error);
      throw new Error('Failed to fetch delivery tracking');
    }
  }

  /**
   * Assign delivery driver
   */
  static async assignDeliveryDriver(
    orderId: string,
    driverId: string,
    driverName: string,
    driverPhone: string
  ): Promise<void> {
    try {
      // Create tracking event for driver assignment
      await OrderService.createTrackingEvent(
        orderId,
        'out-for-delivery',
        'Driver assigned for delivery',
        `Driver: ${driverName} (${driverPhone})`
      );

      // Update order with driver information
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, {
        'shipping.driver': {
          id: driverId,
          name: driverName,
          phone: driverPhone,
          assignedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error assigning delivery driver:', error);
      throw new Error('Failed to assign delivery driver');
    }
  }

  /**
   * Update delivery location (for real-time tracking)
   */
  static async updateDeliveryLocation(
    orderId: string,
    coordinates: { lat: number; lng: number },
    address: string
  ): Promise<void> {
    try {
      await OrderService.createTrackingEvent(
        orderId,
        'out-for-delivery',
        address,
        'Driver location updated',
        coordinates
      );
    } catch (error) {
      console.error('Error updating delivery location:', error);
      throw new Error('Failed to update delivery location');
    }
  }

  /**
   * Mark order as delivered
   */
  static async markAsDelivered(
    orderId: string,
    deliveredBy: string,
    deliveryNotes?: string,
    signature?: string
  ): Promise<void> {
    try {
      // Create delivery completion tracking event
      await OrderService.createTrackingEvent(
        orderId,
        'delivered',
        'Package delivered successfully',
        `Delivered by: ${deliveredBy}${deliveryNotes ? ` | Notes: ${deliveryNotes}` : ''}`
      );

      // Update order with delivery completion details
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, {
        'shipping.deliveredAt': serverTimestamp(),
        'shipping.deliveredBy': deliveredBy,
        'shipping.deliveryNotes': deliveryNotes,
        'shipping.signature': signature,
        status: 'delivered',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      throw new Error('Failed to mark order as delivered');
    }
  }

  /**
   * Get delivery statistics
   */
  static async getDeliveryStatistics(): Promise<{
    totalDeliveries: number;
    completedDeliveries: number;
    inTransitDeliveries: number;
    averageDeliveryTime: number;
  }> {
    try {
      const q = query(collection(db, 'orders'));
      const snapshot = await getDocs(q);
      
      let totalDeliveries = 0;
      let completedDeliveries = 0;
      let inTransitDeliveries = 0;
      let totalDeliveryTime = 0;

      snapshot.forEach((doc) => {
        const order = doc.data();
        if (order.status && ['processing', 'shipped', 'delivered'].includes(order.status)) {
          totalDeliveries++;
          
          if (order.status === 'delivered') {
            completedDeliveries++;
            
            // Calculate delivery time
            if (order.createdAt && order.shipping?.deliveredAt) {
              const createdTime = order.createdAt.toMillis();
              const deliveredTime = order.shipping.deliveredAt.toMillis();
              totalDeliveryTime += deliveredTime - createdTime;
            }
          } else if (['processing', 'shipped'].includes(order.status)) {
            inTransitDeliveries++;
          }
        }
      });

      const averageDeliveryTime = completedDeliveries > 0 
        ? totalDeliveryTime / completedDeliveries / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      return {
        totalDeliveries,
        completedDeliveries,
        inTransitDeliveries,
        averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10
      };
    } catch (error) {
      console.error('Error getting delivery statistics:', error);
      throw new Error('Failed to get delivery statistics');
    }
  }

  /**
   * Get orders ready for delivery
   */
  static async getOrdersReadyForDelivery(): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('status', '==', 'processing')
      );

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
      console.error('Error fetching orders ready for delivery:', error);
      throw new Error('Failed to fetch orders ready for delivery');
    }
  }

  /**
   * Get orders out for delivery
   */
  static async getOrdersOutForDelivery(): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('status', '==', 'shipped')
      );

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
      console.error('Error fetching orders out for delivery:', error);
      throw new Error('Failed to fetch orders out for delivery');
    }
  }

  /**
   * Calculate estimated delivery time
   */
  static calculateEstimatedDeliveryTime(orderDate: Date): Date {
    // Add 3-5 business days for delivery
    const deliveryDays = 4; // Average
    const estimatedDate = new Date(orderDate);
    estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);
    
    // Adjust for weekends (skip Saturday and Sunday)
    const dayOfWeek = estimatedDate.getDay();
    if (dayOfWeek === 0) { // Sunday
      estimatedDate.setDate(estimatedDate.getDate() + 1);
    } else if (dayOfWeek === 6) { // Saturday
      estimatedDate.setDate(estimatedDate.getDate() + 2);
    }
    
    return estimatedDate;
  }

  /**
   * Get delivery status description
   */
  static getDeliveryStatusDescription(status: TrackingStatus): string {
    const descriptions: Record<TrackingStatus, string> = {
      'order-placed': 'Your order has been placed and is being processed',
      'supplier-notified': 'The supplier has been notified and is preparing your items',
      'warehouse-received': 'Your items have been received at our warehouse',
      'packed': 'Your items have been packed and are ready for shipping',
      'shipped': 'Your package is on its way to you',
      'out-for-delivery': 'Your package is out for delivery and will arrive soon',
      'delivered': 'Your package has been delivered successfully'
    };

    return descriptions[status] || 'Status update';
  }
}
