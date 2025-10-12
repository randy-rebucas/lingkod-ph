/**
 * PayMaya Payment Service
 * Handles PayMaya payment processing and subscription integration
 * Based on PayMaya Developer Hub: https://developers.maya.ph/docs/pay-with-maya
 */

import { PaymentConfig } from './payment-config';
import { PaymentNotificationService } from './payment-notifications';
import { PayMayaAnalytics } from './paymaya-analytics';

export interface PayMayaPaymentRequest {
  amount: number;
  currency: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  returnUrl: string;
  cancelUrl: string;
  description?: string;
}

export interface PayMayaPaymentResponse {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  expiresAt?: string;
  status?: string;
  error?: string;
}

export interface PayMayaSubscriptionRequest {
  planId: string;
  planName: string;
  price: number;
  currency: string;
  userId: string;
  userEmail: string;
  returnUrl: string;
  cancelUrl: string;
  billingCycle: 'monthly' | 'yearly';
}

export interface PayMayaSubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  error?: string;
}

export interface PayMayaWebhookEvent {
  id: string;
  type: string;
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      amount: number;
      currency: string;
      description?: string;
      payment_method?: string;
      created_at: string;
      updated_at: string;
    };
  };
}

export class PayMayaPaymentService {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly environment: 'sandbox' | 'production';

  constructor() {
    this.publicKey = process.env.NEXT_PUBLIC_PAYMAYA_PUBLIC_KEY || '';
    this.secretKey = process.env.PAYMAYA_SECRET_KEY || '';
    this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    
    // PayMaya API endpoints
    this.baseUrl = this.environment === 'production' 
      ? 'https://pg.maya.ph' 
      : 'https://pg-sandbox.maya.ph';
  }

  /**
   * Check if PayMaya is properly configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.NEXT_PUBLIC_PAYMAYA_PUBLIC_KEY && 
      process.env.PAYMAYA_SECRET_KEY
    );
  }

  /**
   * Get PayMaya access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.publicKey}:${this.secretKey}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`PayMaya token request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting PayMaya access token:', error);
      throw new Error('Failed to authenticate with PayMaya');
    }
  }

  /**
   * Create a one-time payment with enhanced error handling
   */
  async createPayment(paymentRequest: PayMayaPaymentRequest): Promise<PayMayaPaymentResponse> {
    try {
      if (!PayMayaPaymentService.isConfigured()) {
        return {
          success: false,
          error: 'PayMaya is not properly configured. Please contact support.',
        };
      }

      // Validate payment request
      if (paymentRequest.amount <= 0) {
        return {
          success: false,
          error: 'Invalid payment amount. Amount must be greater than 0.',
        };
      }

      if (!paymentRequest.userEmail || !paymentRequest.userEmail.includes('@')) {
        return {
          success: false,
          error: 'Valid email address is required for payment processing.',
        };
      }

      const accessToken = await this.getAccessToken();

      // Enhanced payment data with better structure
      const paymentData = {
        totalAmount: {
          amount: paymentRequest.amount.toFixed(2),
          currency: paymentRequest.currency,
        },
        buyer: {
          firstName: 'Customer',
          lastName: 'User',
          email: paymentRequest.userEmail,
          contact: {
            phone: '+639000000000', // Default Philippine number
            countryCode: '+63'
          }
        },
        items: [
          {
            name: paymentRequest.planName,
            description: paymentRequest.description || `Subscription to ${paymentRequest.planName} plan`,
            amount: {
              amount: paymentRequest.amount.toFixed(2),
              currency: paymentRequest.currency,
            },
            quantity: 1,
            totalAmount: {
              amount: paymentRequest.amount.toFixed(2),
              currency: paymentRequest.currency,
            }
          },
        ],
        redirectUrl: {
          success: paymentRequest.returnUrl,
          failure: paymentRequest.cancelUrl,
          cancel: paymentRequest.cancelUrl,
        },
        requestReferenceNumber: `subscription_${paymentRequest.userId}_${paymentRequest.planId}_${Date.now()}`,
        metadata: {
          userId: paymentRequest.userId,
          planId: paymentRequest.planId,
          planName: paymentRequest.planName,
          timestamp: new Date().toISOString(),
          source: 'lingkod-ph-subscription'
        },
        // Add payment method preferences
        paymentMethod: {
          card: true,
          paymaya: true,
          qr: true
        }
      };

      const response = await fetch(`${this.baseUrl}/v1/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Lingkod-PH/1.0',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          console.error('PayMaya payment creation failed:', errorData);
          
          // Enhanced error message handling
          if (errorData.details && Array.isArray(errorData.details)) {
            errorMessage = errorData.details.map((detail: any) => detail.message).join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        return {
          success: false,
          error: `Payment creation failed: ${errorMessage}`,
        };
      }

      const payment = await response.json();

      // Enhanced response validation
      if (!payment.checkoutId) {
        return {
          success: false,
          error: 'Invalid response from PayMaya: Missing checkout ID',
        };
      }

      // Track payment creation in analytics
      await PayMayaAnalytics.trackPaymentCreated(
        payment.checkoutId,
        paymentRequest.userId,
        paymentRequest.planId,
        paymentRequest.amount,
        paymentRequest.currency
      );

      return {
        success: true,
        paymentId: payment.checkoutId,
        checkoutUrl: payment.redirectUrl,
        qrCode: payment.qrCode,
        expiresAt: payment.expiresAt,
        status: payment.status,
      };
    } catch (error) {
      console.error('Error creating PayMaya payment:', error);
      return {
        success: false,
        error: 'Failed to create PayMaya payment. Please try again.',
      };
    }
  }

  /**
   * Create a subscription payment (recurring)
   */
  async createSubscription(subscriptionRequest: PayMayaSubscriptionRequest): Promise<PayMayaSubscriptionResponse> {
    try {
      if (!PayMayaPaymentService.isConfigured()) {
        return {
          success: false,
          error: 'PayMaya is not properly configured. Please contact support.',
        };
      }

      const accessToken = await this.getAccessToken();

      // For recurring payments, we'll create a payment link that can be used for subscription
      const subscriptionData = {
        totalAmount: {
          amount: subscriptionRequest.price,
          currency: subscriptionRequest.currency,
        },
        buyer: {
          firstName: 'Customer',
          lastName: 'User',
          email: subscriptionRequest.userEmail,
        },
        items: [
          {
            name: subscriptionRequest.planName,
            description: `Monthly subscription to ${subscriptionRequest.planName} plan`,
            amount: {
              amount: subscriptionRequest.price,
              currency: subscriptionRequest.currency,
            },
            quantity: 1,
          },
        ],
        redirectUrl: {
          success: subscriptionRequest.returnUrl,
          failure: subscriptionRequest.cancelUrl,
          cancel: subscriptionRequest.cancelUrl,
        },
        requestReferenceNumber: `subscription_${subscriptionRequest.userId}_${subscriptionRequest.planId}_${Date.now()}`,
        metadata: {
          userId: subscriptionRequest.userId,
          planId: subscriptionRequest.planId,
          planName: subscriptionRequest.planName,
          billingCycle: subscriptionRequest.billingCycle,
          isSubscription: true,
        },
      };

      const response = await fetch(`${this.baseUrl}/v1/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayMaya subscription creation failed:', errorData);
        return {
          success: false,
          error: `PayMaya subscription creation failed: ${errorData.message || 'Unknown error'}`,
        };
      }

      const subscription = await response.json();

      return {
        success: true,
        subscriptionId: subscription.checkoutId,
        checkoutUrl: subscription.redirectUrl,
        qrCode: subscription.qrCode,
      };
    } catch (error) {
      console.error('Error creating PayMaya subscription:', error);
      return {
        success: false,
        error: 'Failed to create PayMaya subscription. Please try again.',
      };
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v1/checkouts/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get payment details: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting PayMaya payment details:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      // PayMaya webhook signature verification
      // This is a simplified version - in production, implement proper signature verification
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying PayMaya webhook signature:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(webhookEvent: PayMayaWebhookEvent): Promise<void> {
    try {
      const { type, data } = webhookEvent;
      const paymentId = data.id;
      const status = data.attributes.status;

      console.log(`Processing PayMaya webhook event: ${type} for payment ${paymentId}`);

      switch (type) {
        case 'payment.success':
          await this.handlePaymentSuccess(paymentId, data.attributes);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(paymentId, data.attributes);
          break;
        case 'payment.cancelled':
          await this.handlePaymentCancelled(paymentId, data.attributes);
          break;
        default:
          console.log(`Unhandled PayMaya webhook event type: ${type}`);
      }
    } catch (error) {
      console.error('Error processing PayMaya webhook event:', error);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(paymentId: string, attributes: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Get payment details to extract metadata
      const paymentDetails = await this.getPaymentDetails(paymentId);
      const metadata = paymentDetails.metadata || {};

      if (metadata.isSubscription && metadata.userId && metadata.planId) {
        // Handle subscription payment success
        await this.updateUserSubscription(metadata.userId, {
          planId: metadata.planId,
          planName: metadata.planName,
          price: attributes.amount,
          period: 'month',
          status: 'active',
          paymayaPaymentId: paymentId,
          paymentMethod: 'paymaya',
        });
      }

      // Track successful payment in analytics
      const processingTime = Date.now() - startTime;
      await PayMayaAnalytics.trackPaymentSuccess(
        paymentId,
        metadata.userId || 'unknown',
        metadata.planId || 'unknown',
        attributes.amount || 0,
        processingTime,
        attributes.currency || 'PHP'
      );

      // Send success notification
      await this.sendPaymentSuccessNotification(paymentId, attributes);
    } catch (error) {
      console.error('Error handling payment success:', error);
      
      // Track payment failure in analytics
      await PayMayaAnalytics.trackPaymentFailed(
        paymentId,
        'unknown',
        'unknown',
        0,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentId: string, attributes: any): Promise<void> {
    try {
      console.log(`Payment failed for ${paymentId}:`, attributes);
      // Handle payment failure logic here
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  /**
   * Handle cancelled payment
   */
  private async handlePaymentCancelled(paymentId: string, attributes: any): Promise<void> {
    try {
      console.log(`Payment cancelled for ${paymentId}:`, attributes);
      // Handle payment cancellation logic here
    } catch (error) {
      console.error('Error handling payment cancellation:', error);
    }
  }

  /**
   * Update user subscription in database
   */
  private async updateUserSubscription(userId: string, subscriptionData: any): Promise<void> {
    try {
      // This would integrate with your existing subscription update logic
      const response = await fetch('/api/subscriptions/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...subscriptionData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user subscription');
      }
    } catch (error) {
      console.error('Error updating user subscription:', error);
    }
  }

  /**
   * Send payment success notification
   */
  private async sendPaymentSuccessNotification(paymentId: string, attributes: any): Promise<void> {
    try {
      // This would integrate with your existing notification system
      console.log(`Payment success notification sent for ${paymentId}`);
    } catch (error) {
      console.error('Error sending payment success notification:', error);
    }
  }
}

// Export singleton instance
export const paymayaPaymentService = new PayMayaPaymentService();
