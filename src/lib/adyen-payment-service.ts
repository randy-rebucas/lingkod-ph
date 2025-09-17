import { Client, Config, CheckoutAPI } from '@adyen/api-library';
import { adminDb as db } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { PaymentNotificationService } from './payment-notifications';

export interface AdyenPaymentConfig {
  apiKey: string;
  merchantAccount: string;
  environment: 'test' | 'live';
  clientKey: string;
}

export interface GCashPaymentRequest {
  amount: number;
  currency: string;
  reference: string;
  returnUrl: string;
  bookingId: string;
  clientId: string;
  serviceName: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  error?: string;
  pspReference?: string;
}

export class AdyenPaymentService {
  private client?: Client;
  private checkout?: CheckoutAPI;
  private config: AdyenPaymentConfig;

  constructor() {
    this.config = {
      apiKey: process.env.ADYEN_API_KEY || '',
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT || '',
      environment: (process.env.ADYEN_ENVIRONMENT as 'test' | 'live') || 'test',
      clientKey: process.env.ADYEN_CLIENT_KEY || ''
    };

    // Only initialize if we have the required configuration
    if (this.config.apiKey && this.config.merchantAccount) {
      const adyenConfig = new Config();
      adyenConfig.apiKey = this.config.apiKey;
      adyenConfig.environment = this.config.environment as any;

      this.client = new Client(adyenConfig);
      this.checkout = new CheckoutAPI(this.client);
    }
  }

  /**
   * Create a GCash payment session
   */
  async createGCashPayment(paymentRequest: GCashPaymentRequest): Promise<PaymentResult> {
    try {
      // Check if Adyen is properly configured
      if (!this.client || !this.checkout) {
        return {
          success: false,
          error: 'Adyen payment service is not configured. Please contact support.',
        };
      }
      const paymentData = {
        amount: {
          currency: paymentRequest.currency,
          value: Math.round(paymentRequest.amount * 100), // Convert to cents
        },
        reference: paymentRequest.reference,
        paymentMethod: {
          type: 'gcash',
        },
        returnUrl: paymentRequest.returnUrl,
        merchantAccount: this.config.merchantAccount,
        additionalData: {
          'allow3DS2': 'true',
        },
        metadata: {
          bookingId: paymentRequest.bookingId,
          clientId: paymentRequest.clientId,
          serviceName: paymentRequest.serviceName,
        },
      };

      const response = await (this.checkout as any).payments(paymentData);

      if (response.resultCode === 'RedirectShopper') {
        // Store payment session in database
        await this.storePaymentSession(paymentRequest.bookingId, {
          pspReference: response.pspReference,
          amount: paymentRequest.amount,
          currency: paymentRequest.currency,
          status: 'pending',
          paymentMethod: 'gcash',
          createdAt: new Date(),
          redirectUrl: response.redirect?.url,
        });

        return {
          success: true,
          paymentId: response.pspReference,
          redirectUrl: response.redirect?.url,
          pspReference: response.pspReference,
        };
      } else if (response.resultCode === 'Authorised') {
        // Payment was immediately successful
        await this.handleSuccessfulPayment(paymentRequest.bookingId, response.pspReference!);
        
        return {
          success: true,
          paymentId: response.pspReference,
          pspReference: response.pspReference,
        };
      } else {
        // Payment failed
        await this.handleFailedPayment(paymentRequest.bookingId, response.pspReference!, response.refusalReason);
        
        return {
          success: false,
          error: response.refusalReason || 'Payment failed',
          pspReference: response.pspReference,
        };
      }
    } catch (error) {
      console.error('Adyen payment creation error:', error);
      return {
        success: false,
        error: 'Failed to create payment session',
      };
    }
  }

  /**
   * Handle payment result after redirect
   */
  async handlePaymentResult(bookingId: string, pspReference: string): Promise<PaymentResult> {
    try {
      // Check if Adyen is properly configured
      if (!this.client || !this.checkout) {
        return {
          success: false,
          error: 'Adyen payment service is not configured. Please contact support.',
        };
      }
      // Get payment details from Adyen
      const paymentDetails = await (this.checkout as any).getPaymentDetails({
        pspReference,
        merchantAccount: this.config.merchantAccount,
      });

      if (paymentDetails.resultCode === 'Authorised') {
        await this.handleSuccessfulPayment(bookingId, pspReference);
        return {
          success: true,
          paymentId: pspReference,
          pspReference,
        };
      } else {
        await this.handleFailedPayment(bookingId, pspReference, paymentDetails.refusalReason);
        return {
          success: false,
          error: paymentDetails.refusalReason || 'Payment failed',
          pspReference,
        };
      }
    } catch (error) {
      console.error('Error handling payment result:', error);
      return {
        success: false,
        error: 'Failed to verify payment',
      };
    }
  }

  /**
   * Store payment session in database
   */
  private async storePaymentSession(bookingId: string, sessionData: any) {
    try {
      await db.collection('paymentSessions').doc(bookingId).set({
        ...sessionData,
        bookingId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error storing payment session:', error);
    }
  }

  /**
   * Handle successful payment
   */
  private async handleSuccessfulPayment(bookingId: string, pspReference: string) {
    try {
      const batch = db.batch();

      // Update booking status
      const bookingRef = db.collection('bookings').doc(bookingId);
      batch.update(bookingRef, {
        status: 'Upcoming',
        paymentVerifiedAt: FieldValue.serverTimestamp(),
        paymentVerifiedBy: 'adyen_gcash',
        paymentMethod: 'gcash_adyen',
        adyenPspReference: pspReference,
      });

      // Create transaction record
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
          paymentMethod: 'gcash_adyen',
          createdAt: FieldValue.serverTimestamp(),
          verifiedAt: FieldValue.serverTimestamp(),
          verifiedBy: 'adyen_gcash',
          adyenPspReference: pspReference,
        });
      }

      // Update payment session
      const sessionRef = db.collection('paymentSessions').doc(bookingId);
      batch.update(sessionRef, {
        status: 'completed',
        completedAt: FieldValue.serverTimestamp(),
        pspReference,
      });

      await batch.commit();

      // Send notification
      await this.sendPaymentSuccessNotification(bookingId);
      
      // Send email notification
      await this.sendEmailNotification(bookingId, 'success');
    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  }

  /**
   * Handle failed payment
   */
  private async handleFailedPayment(bookingId: string, pspReference: string, reason?: string) {
    try {
      const batch = db.batch();

      // Update booking status
      const bookingRef = db.collection('bookings').doc(bookingId);
      batch.update(bookingRef, {
        status: 'Payment Rejected',
        paymentRejectionReason: reason || 'Payment failed',
        paymentRejectedAt: FieldValue.serverTimestamp(),
        paymentRejectedBy: 'adyen_gcash',
        adyenPspReference: pspReference,
      });

      // Update payment session
      const sessionRef = db.collection('paymentSessions').doc(bookingId);
      batch.update(sessionRef, {
        status: 'failed',
        failedAt: FieldValue.serverTimestamp(),
        failureReason: reason,
        pspReference,
      });

      await batch.commit();

      // Send notification
      await this.sendPaymentFailureNotification(bookingId, reason);
      
      // Send email notification
      await this.sendEmailNotification(bookingId, 'failure', reason);
    } catch (error) {
      console.error('Error handling failed payment:', error);
    }
  }

  /**
   * Send payment success notification
   */
  private async sendPaymentSuccessNotification(bookingId: string) {
    try {
      const bookingDoc = await db.collection('bookings').doc(bookingId).get();
      if (!bookingDoc.exists) return;

      const bookingData = bookingDoc.data();
      const userDoc = await db.collection('users').doc(bookingData?.clientId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Add notification to user's notifications
        await db.collection(`users/${bookingData?.clientId}/notifications`).add({
          type: 'success',
          message: `Your GCash payment for ${bookingData?.serviceName} has been confirmed!`,
          link: '/bookings',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });

        // Notify provider
        if (bookingData?.providerId) {
          await db.collection(`users/${bookingData?.providerId}/notifications`).add({
            type: 'info',
            message: `Payment confirmed for booking #${bookingId.slice(0, 6)} - ${bookingData?.serviceName}`,
            link: '/bookings',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error('Error sending payment success notification:', error);
    }
  }

  /**
   * Send payment failure notification
   */
  private async sendPaymentFailureNotification(bookingId: string, reason?: string) {
    try {
      const bookingDoc = await db.collection('bookings').doc(bookingId).get();
      if (!bookingDoc.exists) return;

      const bookingData = bookingDoc.data();
      
      // Add notification to user's notifications
      await db.collection(`users/${bookingData?.clientId}/notifications`).add({
        type: 'error',
        message: `Your GCash payment for ${bookingData?.serviceName} failed. ${reason ? `Reason: ${reason}` : ''}`,
        link: `/bookings/${bookingId}/payment`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending payment failure notification:', error);
    }
  }

  /**
   * Get payment session status
   */
  async getPaymentSessionStatus(bookingId: string) {
    try {
      const sessionDoc = await db.collection('paymentSessions').doc(bookingId).get();
      if (sessionDoc.exists) {
        return sessionDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting payment session status:', error);
      return null;
    }
  }

  /**
   * Cancel payment session
   */
  async cancelPaymentSession(bookingId: string) {
    try {
      await db.collection('paymentSessions').doc(bookingId).update({
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error cancelling payment session:', error);
    }
  }

  /**
   * Send email notification for payment events
   */
  private async sendEmailNotification(bookingId: string, type: 'success' | 'failure', reason?: string) {
    try {
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
            paymentMethod: 'GCash (Automated)',
          });
        } else {
          await PaymentNotificationService.sendPaymentRejectionNotification({
            type: 'payment_rejected',
            clientEmail: userData?.email,
            clientName: userData?.name || userData?.displayName || 'User',
            amount: bookingData?.price,
            serviceName: bookingData?.serviceName,
            bookingId,
            rejectionReason: reason || 'Payment processing failed',
          });
        }
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }
}

// Export singleton instance
export const adyenPaymentService = new AdyenPaymentService();
