import { Order, OrderPayment } from './types';
import { WalletService } from './wallet-service';

export class MarketplacePaymentIntegration {

  /**
   * Process marketplace payment using existing payment infrastructure
   */
  static async processMarketplacePayment(
    order: Order,
    paymentMethod: 'wallet' | 'gcash' | 'paypal' | 'bank-transfer'
  ): Promise<{
    success: boolean;
    transactionId?: string;
    paymentUrl?: string;
    error?: string;
  }> {
    try {
      switch (paymentMethod) {
        case 'wallet':
          return await this.processWalletPayment(order);
        
        case 'gcash':
          return await this.processGCashPayment(order);
        
        case 'paypal':
          return await this.processPayPalPayment(order);
        
        case 'bank-transfer':
          return await this.processBankTransferPayment(order);
        
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error) {
      console.error('Error processing marketplace payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Process wallet payment
   */
  private static async processWalletPayment(order: Order): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      // Check if user has sufficient balance
      const hasBalance = await WalletService.hasSufficientBalance(order.userId, order.pricing.total);
      
      if (!hasBalance) {
        return {
          success: false,
          error: 'Insufficient wallet balance'
        };
      }

      // Deduct from wallet
      await WalletService.deductFunds(
        order.userId,
        order.pricing.total,
        `Marketplace purchase - Order #${order.id}`,
        order.id
      );

      // Generate transaction ID
      const transactionId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        transactionId
      };
    } catch (error) {
      console.error('Error processing wallet payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Wallet payment failed'
      };
    }
  }

  /**
   * Process GCash payment using existing Adyen integration
   */
  private static async processGCashPayment(order: Order): Promise<{
    success: boolean;
    transactionId?: string;
    paymentUrl?: string;
    error?: string;
  }> {
    try {
      // Call API endpoint for GCash payment
      const response = await fetch('/api/marketplace/payments/gcash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.pricing.total,
          currency: 'PHP',
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketplace/orders/${order.id}/payment/result`,
          userId: order.userId
        })
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          transactionId: result.transactionId,
          paymentUrl: result.paymentUrl
        };
      } else {
        return {
          success: false,
          error: result.error || 'GCash payment failed'
        };
      }
    } catch (error) {
      console.error('Error processing GCash payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GCash payment failed'
      };
    }
  }

  /**
   * Process PayPal payment using existing PayPal integration
   */
  private static async processPayPalPayment(order: Order): Promise<{
    success: boolean;
    transactionId?: string;
    paymentUrl?: string;
    error?: string;
  }> {
    try {
      // Call API endpoint for PayPal payment
      const response = await fetch('/api/marketplace/payments/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.pricing.total,
          currency: 'PHP',
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketplace/orders/${order.id}/payment/result`,
          userId: order.userId
        })
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          transactionId: result.transactionId,
          paymentUrl: result.paymentUrl
        };
      } else {
        return {
          success: false,
          error: result.error || 'PayPal payment failed'
        };
      }
    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayPal payment failed'
      };
    }
  }

  /**
   * Process bank transfer payment
   */
  private static async processBankTransferPayment(order: Order): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      // Generate transaction ID for manual verification
      const transactionId = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In a real implementation, this would:
      // 1. Generate bank transfer instructions
      // 2. Send email with payment details
      // 3. Wait for manual verification by admin
      
      return {
        success: true,
        transactionId
      };
    } catch (error) {
      console.error('Error processing bank transfer payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bank transfer payment failed'
      };
    }
  }

  /**
   * Verify payment status
   */
  static async verifyPaymentStatus(
    orderId: string,
    transactionId: string,
    paymentMethod: string
  ): Promise<{
    success: boolean;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    error?: string;
  }> {
    try {
      switch (paymentMethod) {
        case 'wallet':
          // Wallet payments are immediately verified
          return {
            success: true,
            status: 'paid'
          };
        
        case 'gcash':
          // Call API endpoint for GCash verification
          const gcashResponse = await fetch(`/api/marketplace/payments/verify/gcash`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              transactionId
            })
          });

          const gcashResult = await gcashResponse.json();
          return {
            success: gcashResult.success,
            status: gcashResult.success ? 'paid' : 'failed',
            error: gcashResult.error
          };
        
        case 'paypal':
          // Call API endpoint for PayPal verification
          const paypalResponse = await fetch(`/api/marketplace/payments/verify/paypal`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              transactionId
            })
          });

          const paypalResult = await paypalResponse.json();
          return {
            success: paypalResult.success,
            status: paypalResult.success ? 'paid' : 'pending',
            error: paypalResult.error
          };
        
        case 'bank-transfer':
          // Bank transfers require manual verification
          return {
            success: true,
            status: 'pending'
          };
        
        default:
          return {
            success: false,
            status: 'failed',
            error: 'Unsupported payment method'
          };
      }
    } catch (error) {
      console.error('Error verifying payment status:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Payment verification failed'
      };
    }
  }

  /**
   * Process refund
   */
  static async processRefund(
    order: Order,
    amount: number,
    reason: string
  ): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      switch (order.payment.method) {
        case 'wallet':
          // Refund to wallet
          await WalletService.processRefund(
            order.userId,
            amount,
            `Refund for order #${order.id}: ${reason}`,
            order.id
          );
          
          return {
            success: true,
            transactionId: `refund_wallet_${Date.now()}`
          };
        
        case 'gcash':
          // Call API endpoint for GCash refund
          const gcashRefundResponse = await fetch('/api/marketplace/payments/refund/gcash', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: order.id,
              originalTransactionId: order.payment.transactionId,
              amount,
              reason
            })
          });

          const gcashRefundResult = await gcashRefundResponse.json();
          
          return {
            success: gcashRefundResult.success,
            transactionId: gcashRefundResult.transactionId,
            error: gcashRefundResult.error
          };
        
        case 'paypal':
          // This would integrate with PayPal refund
          return {
            success: true,
            transactionId: `refund_paypal_${Date.now()}`
          };
        
        case 'bank-transfer':
          // Bank transfer refunds require manual processing
          return {
            success: true,
            transactionId: `refund_bank_${Date.now()}`
          };
        
        default:
          return {
            success: false,
            error: 'Unsupported payment method for refund'
          };
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed'
      };
    }
  }

  /**
   * Get payment instructions for manual payment methods
   */
  static getPaymentInstructions(paymentMethod: string): {
    instructions: string;
    accountDetails?: {
      accountNumber: string;
      accountName: string;
      bank: string;
    };
  } {
    switch (paymentMethod) {
      case 'gcash':
        return {
          instructions: 'Send payment to our GCash account and upload proof of payment.',
          accountDetails: {
            accountNumber: '09171234567',
            accountName: 'LocalPro Marketplace',
            bank: 'GCash'
          }
        };
      
      case 'bank-transfer':
        return {
          instructions: 'Transfer the amount to our bank account and upload proof of payment.',
          accountDetails: {
            accountNumber: '1234567890',
            accountName: 'LocalPro Marketplace',
            bank: 'BPI'
          }
        };
      
      default:
        return {
          instructions: 'Please follow the payment instructions provided.'
        };
    }
  }
}
