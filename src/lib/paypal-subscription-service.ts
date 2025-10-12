/**
 * PayPal Subscription Service
 * Handles PayPal subscription and recurring billing integration
 */

import { PaymentConfig } from './payment-config';
import { PaymentNotificationService } from './payment-notifications';

export interface PayPalSubscriptionRequest {
  planId: string;
  planName: string;
  price: number;
  currency: string;
  userId: string;
  userEmail: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayPalSubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  approvalUrl?: string;
  error?: string;
}

export interface PayPalSubscriptionPlan {
  id: string;
  name: string;
  description: string;
  status: string;
  billing_cycles: Array<{
    frequency: {
      interval_unit: string;
      interval_count: number;
    };
    tenure_type: string;
    sequence: number;
    total_cycles: number;
    pricing_scheme: {
      fixed_price: {
        value: string;
        currency_code: string;
      };
    };
  }>;
  payment_preferences: {
    auto_bill_outstanding: boolean;
    setup_fee_failure_action: string;
    payment_failure_threshold: number;
  };
  taxes: {
    percentage: string;
    inclusive: boolean;
  };
}

export class PayPalSubscriptionService {
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
   * Create a subscription plan in PayPal
   */
  async createSubscriptionPlan(planData: {
    planId: string;
    planName: string;
    description: string;
    price: number;
    currency: string;
  }): Promise<{ success: boolean; planId?: string; error?: string }> {
    try {
      if (!PayPalSubscriptionService.isConfigured()) {
        return {
          success: false,
          error: 'PayPal is not properly configured. Please contact support.',
        };
      }

      const accessToken = await this.getAccessToken();

      const planPayload: PayPalSubscriptionPlan = {
        id: planData.planId,
        name: planData.planName,
        description: planData.description,
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: 'MONTH',
              interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // 0 means infinite cycles
            pricing_scheme: {
              fixed_price: {
                value: planData.price.toFixed(2),
                currency_code: planData.currency,
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
        taxes: {
          percentage: '0',
          inclusive: false,
        },
      };

      const response = await fetch(`${this.baseUrl}/v1/billing/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `plan_${planData.planId}_${Date.now()}`,
        },
        body: JSON.stringify(planPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal plan creation failed:', errorData);
        return {
          success: false,
          error: `PayPal plan creation failed: ${errorData.message || 'Unknown error'}`,
        };
      }

      const plan = await response.json();

      return {
        success: true,
        planId: plan.id,
      };
    } catch (error) {
      console.error('Error creating PayPal subscription plan:', error);
      return {
        success: false,
        error: 'Failed to create PayPal subscription plan. Please try again.',
      };
    }
  }

  /**
   * Create a subscription for a user
   */
  async createSubscription(subscriptionRequest: PayPalSubscriptionRequest): Promise<PayPalSubscriptionResponse> {
    try {
      if (!PayPalSubscriptionService.isConfigured()) {
        return {
          success: false,
          error: 'PayPal is not properly configured. Please contact support.',
        };
      }

      const accessToken = await this.getAccessToken();

      // Map internal plan IDs to PayPal plan IDs
      const paypalPlanId = this.getPayPalPlanId(subscriptionRequest.planId);
      
      const subscriptionPayload = {
        plan_id: paypalPlanId,
        start_time: new Date(Date.now() + 60000).toISOString(), // Start in 1 minute
        subscriber: {
          email_address: subscriptionRequest.userEmail,
        },
        application_context: {
          brand_name: 'Lingkod PH',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
          return_url: subscriptionRequest.returnUrl,
          cancel_url: subscriptionRequest.cancelUrl,
        },
        custom_id: `subscription_${subscriptionRequest.userId}_${subscriptionRequest.planId}`,
      };

      const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `subscription_${subscriptionRequest.userId}_${Date.now()}`,
        },
        body: JSON.stringify(subscriptionPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal subscription creation failed:', errorData);
        return {
          success: false,
          error: `PayPal subscription creation failed: ${errorData.message || 'Unknown error'}`,
        };
      }

      const subscription = await response.json();

      return {
        success: true,
        subscriptionId: subscription.id,
        approvalUrl: subscription.links?.find((link: any) => link.rel === 'approve')?.href,
      };
    } catch (error) {
      console.error('Error creating PayPal subscription:', error);
      return {
        success: false,
        error: 'Failed to create PayPal subscription. Please try again.',
      };
    }
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get subscription details: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting PayPal subscription details:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, reason: string = 'User requested cancellation'): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();

      const cancelPayload = {
        reason: reason,
      };

      const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(cancelPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal subscription cancellation failed:', errorData);
        return {
          success: false,
          error: `PayPal subscription cancellation failed: ${errorData.message || 'Unknown error'}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling PayPal subscription:', error);
      return {
        success: false,
        error: 'Failed to cancel PayPal subscription. Please try again.',
      };
    }
  }

  /**
   * Suspend a subscription
   */
  async suspendSubscription(subscriptionId: string, reason: string = 'User requested suspension'): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();

      const suspendPayload = {
        reason: reason,
      };

      const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(suspendPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal subscription suspension failed:', errorData);
        return {
          success: false,
          error: `PayPal subscription suspension failed: ${errorData.message || 'Unknown error'}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error suspending PayPal subscription:', error);
      return {
        success: false,
        error: 'Failed to suspend PayPal subscription. Please try again.',
      };
    }
  }

  /**
   * Reactivate a suspended subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();

      const reactivatePayload = {
        reason: 'User requested reactivation',
      };

      const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(reactivatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal subscription reactivation failed:', errorData);
        return {
          success: false,
          error: `PayPal subscription reactivation failed: ${errorData.message || 'Unknown error'}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error reactivating PayPal subscription:', error);
      return {
        success: false,
        error: 'Failed to reactivate PayPal subscription. Please try again.',
      };
    }
  }

  /**
   * Get PayPal plan ID from internal plan ID
   */
  private getPayPalPlanId(internalPlanId: string): string {
    // Map internal plan IDs to PayPal plan IDs
    const planMapping: { [key: string]: string } = {
      'premium': 'premium_monthly',
      'elite': 'elite_monthly',
      'free': 'free_plan'
    };
    
    return planMapping[internalPlanId] || internalPlanId;
  }

  /**
   * Update subscription (change plan)
   */
  async updateSubscription(subscriptionId: string, newPlanId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();
      const paypalPlanId = this.getPayPalPlanId(newPlanId);

      const updatePayload = {
        plan_id: paypalPlanId,
      };

      const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal subscription update failed:', errorData);
        return {
          success: false,
          error: `PayPal subscription update failed: ${errorData.message || 'Unknown error'}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating PayPal subscription:', error);
      return {
        success: false,
        error: 'Failed to update PayPal subscription. Please try again.',
      };
    }
  }
}

// Export singleton instance
export const paypalSubscriptionService = new PayPalSubscriptionService();
