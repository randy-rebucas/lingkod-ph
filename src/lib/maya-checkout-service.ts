/**
 * Maya Checkout Service
 * Handles Maya Checkout API integration for payments
 */

import { PaymentConfig } from './payment-config';

export interface MayaCheckoutRequest {
  totalAmount: {
    value: number;
    currency: string;
  };
  buyer?: {
    firstName?: string;
    lastName?: string;
    contact?: {
      phone?: string;
      email?: string;
    };
    shippingAddress?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      countryCode?: string;
    };
  };
  items?: Array<{
    name: string;
    quantity: number;
    code?: string;
    description?: string;
    amount: {
      value: number;
      currency: string;
    };
    totalAmount: {
      value: number;
      currency: string;
    };
  }>;
  redirectUrl?: {
    success: string;
    failure: string;
    cancel: string;
  };
  requestReferenceNumber?: string;
  metadata?: Record<string, any>;
}

export interface MayaCheckoutResponse {
  checkoutId: string;
  redirectUrl: string;
  requestReferenceNumber: string;
}

export interface MayaPaymentStatus {
  id: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  totalAmount: {
    value: number;
    currency: string;
  };
  paymentMethod: string;
  createdAt: string;
  paidAt?: string;
  requestReferenceNumber: string;
  metadata?: Record<string, any>;
}

export class MayaCheckoutService {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly secretKey: string;

  constructor() {
    const config = PaymentConfig.MAYA;
    this.publicKey = config.publicKey;
    this.secretKey = config.secretKey;
    
    // Set base URL based on environment
    this.baseUrl = config.environment === 'production' 
      ? 'https://pg.maya.ph'
      : 'https://pg-sandbox.maya.ph';
  }

  /**
   * Create a Maya Checkout payment
   */
  async createCheckout(request: MayaCheckoutRequest): Promise<{
    success: boolean;
    data?: MayaCheckoutResponse;
    error?: string;
  }> {
    try {
      if (!PaymentConfig.validateMayaConfig()) {
        return {
          success: false,
          error: 'Maya configuration is invalid. Please check your API keys.'
        };
      }

      // Log the request for debugging
      console.log('Creating Maya checkout with request:', {
        totalAmount: request.totalAmount,
        requestReferenceNumber: request.requestReferenceNumber,
        redirectUrls: request.redirectUrl,
        environment: this.baseUrl
      });

      const response = await fetch(`${this.baseUrl}/checkout/v1/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.publicKey}:`).toString('base64')}`,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      // Log the response for debugging
      console.log('Maya checkout response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });

      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Maya checkout failed:', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: true,
        data: {
          checkoutId: data.checkoutId,
          redirectUrl: data.redirectUrl,
          requestReferenceNumber: data.requestReferenceNumber,
        }
      };
    } catch (error) {
      console.error('Error creating Maya checkout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Maya checkout'
      };
    }
  }

  /**
   * Get payment status from Maya
   */
  async getPaymentStatus(checkoutId: string): Promise<{
    success: boolean;
    data?: MayaPaymentStatus;
    error?: string;
  }> {
    try {
      if (!PaymentConfig.validateMayaConfig()) {
        return {
          success: false,
          error: 'Maya configuration is invalid. Please check your API keys.'
        };
      }

      const response = await fetch(`${this.baseUrl}/checkout/v1/checkouts/${checkoutId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.publicKey}:`).toString('base64')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        data: {
          id: data.id,
          status: data.status,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          createdAt: data.createdAt,
          paidAt: data.paidAt,
          requestReferenceNumber: data.requestReferenceNumber,
          metadata: data.metadata,
        }
      };
    } catch (error) {
      console.error('Error getting Maya payment status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment status'
      };
    }
  }

  /**
   * Verify webhook signature (for webhook handling)
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Maya uses HMAC-SHA256 for webhook verification
      const crypto = require('crypto');
      
      // Handle different signature formats
      let cleanSignature = signature;
      if (signature.startsWith('sha256=')) {
        cleanSignature = signature.substring(7);
      }
      
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload)
        .digest('hex');
      
      console.log('Webhook signature verification:', {
        received: cleanSignature,
        expected: expectedSignature,
        match: cleanSignature === expectedSignature
      });
      
      return crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying Maya webhook signature:', error);
      return false;
    }
  }

  /**
   * Create checkout for booking payment
   */
  async createBookingCheckout(bookingId: string, amount: number, userEmail?: string): Promise<{
    success: boolean;
    data?: MayaCheckoutResponse;
    error?: string;
  }> {
    const request: MayaCheckoutRequest = {
      totalAmount: {
        value: amount,
        currency: 'PHP'
      },
      buyer: userEmail ? {
        contact: {
          email: userEmail
        }
      } : undefined,
      items: [{
        name: `Booking Payment - ${bookingId}`,
        quantity: 1,
        code: bookingId,
        description: `Payment for booking ${bookingId}`,
        amount: {
          value: amount,
          currency: 'PHP'
        },
        totalAmount: {
          value: amount,
          currency: 'PHP'
        }
      }],
      redirectUrl: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bookings/${bookingId}/payment/success?method=maya`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bookings/${bookingId}/payment/failure?method=maya`,
        cancel: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bookings/${bookingId}/payment/cancel?method=maya`
      },
      requestReferenceNumber: `booking_${bookingId}_${Date.now()}`,
      metadata: {
        bookingId,
        type: 'booking_payment'
      }
    };

    return this.createCheckout(request);
  }

  /**
   * Create checkout for subscription payment
   */
  async createSubscriptionCheckout(planId: string, amount: number, userEmail?: string): Promise<{
    success: boolean;
    data?: MayaCheckoutResponse;
    error?: string;
  }> {
    // Validate amount for QR code payments
    if (amount < 1) {
      return {
        success: false,
        error: 'Minimum amount for QR code payments is ₱1.00'
      };
    }

    // Ensure amount is in proper format for Maya (no decimal places for PHP)
    const formattedAmount = Math.round(amount);

    const request: MayaCheckoutRequest = {
      totalAmount: {
        value: formattedAmount,
        currency: 'PHP'
      },
      buyer: userEmail ? {
        contact: {
          email: userEmail
        }
      } : undefined,
      items: [{
        name: `Subscription Plan - ${planId}`,
        quantity: 1,
        code: planId,
        description: `Monthly subscription for ${planId} plan`,
        amount: {
          value: formattedAmount,
          currency: 'PHP'
        },
        totalAmount: {
          value: formattedAmount,
          currency: 'PHP'
        }
      }],
      redirectUrl: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription/success?method=maya&plan=${planId}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription/failure?method=maya&plan=${planId}`,
        cancel: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription/cancel?method=maya&plan=${planId}`
      },
      requestReferenceNumber: `subscription_${planId}_${Date.now()}`,
      metadata: {
        planId,
        type: 'subscription_payment',
        originalAmount: amount,
        formattedAmount: formattedAmount
      }
    };

    return this.createCheckout(request);
  }
}
