/**
 * PayPal Payment Service
 * Handles PayPal payment processing and integration
 */

// Note: Firebase Admin imports are only used in server-side contexts
// This service should only be used in API routes, not in client components
import { PaymentConfig } from './payment-config';
import { PaymentNotificationService } from './payment-notifications';

export interface PayPalPaymentRequest {
  amount: number;
  currency: string;
  bookingId: string;
  clientId: string;
  serviceName: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayPalOrderResponse {
  success: boolean;
  orderId?: string;
  approvalUrl?: string;
  error?: string;
}

export interface PayPalCaptureResponse {
  success: boolean;
  transactionId?: string;
  payerEmail?: string;
  error?: string;
}

export class PayPalPaymentService {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.clientId = PaymentConfig.PAYPAL.clientId;
    this.clientSecret = PaymentConfig.PAYPAL.clientSecret;
    
    // Use sandbox for development, live for production
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
  }

  /**
   * Check if PayPal is properly configured
   */
  static isConfigured(): boolean {
    return PaymentConfig.validatePayPalConfig();
  }

  /**
   * Get PayPal access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`PayPal token request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting PayPal access token:', error);
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  /**
   * Create PayPal order
   */
  async createOrder(paymentRequest: PayPalPaymentRequest, db?: any): Promise<PayPalOrderResponse> {
    try {
      if (!PayPalPaymentService.isConfigured()) {
        return {
          success: false,
          error: 'PayPal is not properly configured. Please contact support.',
        };
      }

      const accessToken = await this.getAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: `booking_${paymentRequest.bookingId}`,
            amount: {
              currency_code: paymentRequest.currency,
              value: paymentRequest.amount.toFixed(2),
            },
            description: `Payment for ${paymentRequest.serviceName}`,
            custom_id: paymentRequest.bookingId,
          },
        ],
        application_context: {
          brand_name: 'LocalPro',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: paymentRequest.returnUrl,
          cancel_url: paymentRequest.cancelUrl,
        },
      };

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `booking_${paymentRequest.bookingId}_${Date.now()}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal order creation failed:', errorData);
        return {
          success: false,
          error: `PayPal order creation failed: ${errorData.message || 'Unknown error'}`,
        };
      }

      const order = await response.json();

      // Store order in database (if db is provided)
      if (db) {
        await this.storePayPalOrder(paymentRequest.bookingId, {
          orderId: order.id,
          status: order.status,
          amount: paymentRequest.amount,
          currency: paymentRequest.currency,
          createdAt: new Date(),
          clientId: paymentRequest.clientId,
          serviceName: paymentRequest.serviceName,
        }, db);
      }

      return {
        success: true,
        orderId: order.id,
        approvalUrl: order.links?.find((link: any) => link.rel === 'approve')?.href,
      };
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      return {
        success: false,
        error: 'Failed to create PayPal order. Please try again.',
      };
    }
  }

  /**
   * Capture PayPal order
   */
  async captureOrder(orderId: string, bookingId: string, db?: any): Promise<PayPalCaptureResponse> {
    try {
      if (!PayPalPaymentService.isConfigured()) {
        return {
          success: false,
          error: 'PayPal is not properly configured. Please contact support.',
        };
      }

      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `capture_${orderId}_${Date.now()}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal capture failed:', errorData);
        return {
          success: false,
          error: `PayPal capture failed: ${errorData.message || 'Unknown error'}`,
        };
      }

      const capture = await response.json();

      if (capture.status === 'COMPLETED') {
        // Handle successful payment
        if (db) {
          await this.handleSuccessfulPayment(bookingId, orderId, capture, db);
        }
        
        return {
          success: true,
          transactionId: capture.id,
          payerEmail: capture.payer?.email_address,
        };
      } else {
        return {
          success: false,
          error: `Payment not completed. Status: ${capture.status}`,
        };
      }
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      return {
        success: false,
        error: 'Failed to capture PayPal payment. Please try again.',
      };
    }
  }

  /**
   * Get PayPal order details
   */
  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get order details: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting PayPal order details:', error);
      throw error;
    }
  }

  /**
   * Store PayPal order in database
   */
  private async storePayPalOrder(bookingId: string, orderData: any, db: any) {
    try {
      await db.collection('paypalOrders').doc(bookingId).set({
        ...orderData,
        bookingId,
        updatedAt: db.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error storing PayPal order:', error);
    }
  }

  /**
   * Handle successful PayPal payment
   */
  private async handleSuccessfulPayment(bookingId: string, orderId: string, captureData: any, db: any) {
    try {
      const batch = db.batch();

      // Update booking status
      const bookingRef = db.collection('bookings').doc(bookingId);
      batch.update(bookingRef, {
        status: 'Upcoming',
        paymentVerifiedAt: db.FieldValue.serverTimestamp(),
        paymentVerifiedBy: 'paypal',
        paymentMethod: 'paypal',
        paypalOrderId: orderId,
        paypalTransactionId: captureData.id,
      });

      // Get booking data for transaction record
      const bookingDoc = await bookingRef.get();
      if (bookingDoc.exists) {
        const bookingData = bookingDoc.data();
        const transactionRef = db.collection('transactions').doc();
        batch.set(transactionRef, {
          bookingId,
          clientId: bookingData?.clientId,
          providerId: bookingData?.providerId,
          amount: bookingData?.price,
          type: 'booking_payment',
          status: 'completed',
          paymentMethod: 'paypal',
          createdAt: db.FieldValue.serverTimestamp(),
          verifiedAt: db.FieldValue.serverTimestamp(),
          verifiedBy: 'paypal',
          paypalOrderId: orderId,
          paypalTransactionId: captureData.id,
          payerEmail: captureData.payer?.email_address,
        });
      }

      // Update PayPal order status
      const orderRef = db.collection('paypalOrders').doc(bookingId);
      batch.update(orderRef, {
        status: 'COMPLETED',
        capturedAt: db.FieldValue.serverTimestamp(),
        transactionId: captureData.id,
        payerEmail: captureData.payer?.email_address,
      });

      await batch.commit();

      // Send notifications
      await this.sendPaymentSuccessNotification(bookingId, db);
      await this.sendEmailNotification(bookingId, 'success', undefined, db);
    } catch (error) {
      console.error('Error handling successful PayPal payment:', error);
    }
  }

  /**
   * Send payment success notification
   */
  private async sendPaymentSuccessNotification(bookingId: string, db?: any) {
    try {
      const bookingDoc = await db.collection('bookings').doc(bookingId).get();
      if (!bookingDoc.exists) return;

      const bookingData = bookingDoc.data();
      
      if (db) {
        // Add notification to user's notifications
        await db.collection(`users/${bookingData?.clientId}/notifications`).add({
          type: 'success',
          message: `Your PayPal payment for ${bookingData?.serviceName} has been confirmed!`,
          link: '/bookings',
          read: false,
          createdAt: db.FieldValue.serverTimestamp(),
        });

        // Notify provider
        if (bookingData?.providerId) {
          await db.collection(`users/${bookingData?.providerId}/notifications`).add({
            type: 'info',
            message: `Payment confirmed for booking #${bookingId.slice(0, 6)} - ${bookingData?.serviceName}`,
            link: '/bookings',
            read: false,
            createdAt: db.FieldValue.serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error('Error sending PayPal payment success notification:', error);
    }
  }

  /**
   * Send email notification for PayPal payment events
   */
  private async sendEmailNotification(bookingId: string, type: 'success' | 'failure', reason?: string, db?: any) {
    try {
      if (!db) return;
      
      const bookingDoc = await db.collection('bookings').doc(bookingId).get();
      if (!bookingDoc.exists) return;

      const bookingData = bookingDoc.data();
      const userDoc = await db.collection('users').doc(bookingData?.clientId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        if (type === 'success') {
          await PaymentNotificationService.sendAutomatedPaymentNotification({
            type: 'payment_completed_automated',
            clientEmail: userData?.email,
            clientName: userData?.name || userData?.displayName || 'User',
            amount: bookingData?.price,
            serviceName: bookingData?.serviceName,
            bookingId,
            paymentMethod: 'PayPal',
          });
        } else {
          await PaymentNotificationService.sendPaymentRejectionNotification({
            type: 'payment_rejected',
            clientEmail: userData?.email,
            clientName: userData?.name || userData?.displayName || 'User',
            amount: bookingData?.price,
            serviceName: bookingData?.serviceName,
            bookingId,
            rejectionReason: reason || 'PayPal payment failed',
          });
        }
      }
    } catch (error) {
      console.error('Error sending PayPal email notification:', error);
    }
  }

  /**
   * Get PayPal order status
   */
  async getOrderStatus(bookingId: string, db?: any) {
    try {
      if (!db) return null;
      
      const orderDoc = await db.collection('paypalOrders').doc(bookingId).get();
      if (orderDoc.exists) {
        return orderDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting PayPal order status:', error);
      return null;
    }
  }

  /**
   * Cancel PayPal order
   */
  async cancelOrder(bookingId: string, db?: any) {
    try {
      if (!db) return;
      
      await db.collection('paypalOrders').doc(bookingId).update({
        status: 'CANCELLED',
        cancelledAt: db.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error cancelling PayPal order:', error);
    }
  }
}

// Export singleton instance
export const paypalPaymentService = new PayPalPaymentService();
