import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  addDoc,
  getDoc
} from "firebase/firestore";
import { TransactionService } from "./transaction-service";
import { TransactionAction, TransactionStatus, TransactionEntity } from "./transaction-types";
import { isSubscriptionTransaction } from "./transaction-models";

export interface SubscriptionPayment {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  planType: 'provider' | 'agency';
  amount: number;
  paymentMethod: 'gcash' | 'maya' | 'bank' | 'paypal';
  referenceNumber: string;
  paymentProofUrl: string;
  notes?: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  createdAt: any;
  verifiedAt?: any;
  verifiedBy?: string;
  rejectionReason?: string;
  userEmail?: string;
  userName?: string;
}

export interface TransactionRecord {
  id: string;
  type: 'subscription_payment' | 'booking_payment';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentId?: string;
  userId: string;
  amount: number;
  planName?: string;
  planType?: 'provider' | 'agency';
  paymentMethod: string;
  referenceNumber?: string;
  verifiedAt?: any;
  verifiedBy?: string;
  createdAt: any;
  bookingId?: string;
  clientId?: string;
  providerId?: string;
}

export class SubscriptionPaymentProcessor {
  /**
   * Get all pending subscription payments that need verification
   */
  static async getPendingSubscriptionPayments(): Promise<SubscriptionPayment[]> {
    try {
      const q = query(
        collection(db, 'subscriptionPayments'),
        where('status', '==', 'pending_verification'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SubscriptionPayment));
    } catch (error) {
      console.error('Error fetching pending subscription payments:', error);
      throw error;
    }
  }

  /**
   * Get all subscription payments (pending, verified, rejected)
   */
  static async getAllSubscriptionPayments(): Promise<SubscriptionPayment[]> {
    try {
      const q = query(
        collection(db, 'subscriptionPayments'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SubscriptionPayment));
    } catch (error) {
      console.error('Error fetching subscription payments:', error);
      throw error;
    }
  }

  /**
   * Verify a subscription payment and activate the user's subscription
   */
  static async verifySubscriptionPayment(
    paymentId: string, 
    verifiedBy: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get the payment document
      const paymentRef = doc(db, 'subscriptionPayments', paymentId);
      const paymentDoc = await getDoc(paymentRef);
      
      if (!paymentDoc.exists()) {
        return { success: false, message: 'Payment not found' };
      }

      const payment = paymentDoc.data() as SubscriptionPayment;
      
      if (payment.status !== 'pending_verification') {
        return { success: false, message: 'Payment is not pending verification' };
      }

      // Update payment status to verified
      await updateDoc(paymentRef, {
        status: 'verified',
        verifiedAt: serverTimestamp(),
        verifiedBy: verifiedBy
      });

      // Update user subscription and role
      const userRef = doc(db, 'users', payment.userId);
      const subscriptionData = {
        // Core subscription fields
        subscriptionStatus: 'active',
        subscriptionPlanId: payment.planId,
        subscriptionPlanName: payment.planName,
        subscriptionAmount: payment.amount,
        subscriptionPaymentMethod: payment.paymentMethod,
        subscriptionReferenceNumber: payment.referenceNumber,
        subscriptionVerifiedAt: serverTimestamp(),
        subscriptionVerifiedBy: verifiedBy,
        
        // User role and permissions
        role: payment.planType, // Upgrade user role (provider/agency)
        
        // Subscription timing
        subscriptionRenewsOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subscriptionStartDate: serverTimestamp(),
        
        // Plan-specific features and limits
        subscriptionFeatures: this.getPlanFeatures(payment.planName, payment.planType),
        subscriptionLimits: this.getPlanLimits(payment.planName, payment.planType),
        
        // Provider-specific fields (if applicable)
        ...(payment.planType === 'provider' && {
          isVerifiedProvider: true,
          providerVerificationDate: serverTimestamp(),
          providerVerificationMethod: 'subscription_upgrade',
          providerTier: this.getProviderTier(payment.planName),
          providerBenefits: this.getProviderBenefits(payment.planName)
        }),
        
        // Agency-specific fields (if applicable)
        ...(payment.planType === 'agency' && {
          isVerifiedAgency: true,
          agencyVerificationDate: serverTimestamp(),
          agencyVerificationMethod: 'subscription_upgrade',
          agencyTier: this.getAgencyTier(payment.planName),
          agencyBenefits: this.getAgencyBenefits(payment.planName)
        }),
        
        // Update last modified timestamp
        updatedAt: serverTimestamp(),
        lastSubscriptionUpdate: serverTimestamp()
      };
      
      await updateDoc(userRef, subscriptionData);

      // Create transaction record using new transaction service
      await TransactionService.createSubscriptionTransaction(
        {
          userId: payment.userId,
          planId: payment.planId,
          planName: payment.planName,
          planType: payment.planType,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          referenceNumber: payment.referenceNumber,
          metadata: {
            paymentId: paymentId,
            userEmail: payment.userEmail,
            userName: payment.userName
          }
        },
        TransactionAction.SUBSCRIPTION_PURCHASE,
        TransactionStatus.COMPLETED
      );

      // Send notification to user
      await this.sendPaymentVerificationNotification(payment, 'verified');

      return { 
        success: true, 
        message: `Payment verified successfully. User ${payment.userName || payment.userEmail} has been upgraded to ${payment.planType} role.` 
      };

    } catch (error) {
      console.error('Error verifying subscription payment:', error);
      return { success: false, message: 'Failed to verify payment' };
    }
  }

  /**
   * Reject a subscription payment
   */
  static async rejectSubscriptionPayment(
    paymentId: string, 
    verifiedBy: string, 
    rejectionReason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get the payment document
      const paymentRef = doc(db, 'subscriptionPayments', paymentId);
      const paymentDoc = await getDoc(paymentRef);
      
      if (!paymentDoc.exists()) {
        return { success: false, message: 'Payment not found' };
      }

      const payment = paymentDoc.data() as SubscriptionPayment;
      
      if (payment.status !== 'pending_verification') {
        return { success: false, message: 'Payment is not pending verification' };
      }

      // Update payment status to rejected
      await updateDoc(paymentRef, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        verifiedAt: serverTimestamp(),
        verifiedBy: verifiedBy
      });

      // Update user subscription status
      const userRef = doc(db, 'users', payment.userId);
      await updateDoc(userRef, {
        subscriptionStatus: 'rejected',
        subscriptionRejectionReason: rejectionReason.trim(),
        subscriptionRejectedAt: serverTimestamp(),
        subscriptionRejectedBy: verifiedBy
      });

      // Send notification to user
      await this.sendPaymentVerificationNotification(payment, 'rejected', rejectionReason);

      return { 
        success: true, 
        message: `Payment rejected. User ${payment.userName || payment.userEmail} has been notified.` 
      };

    } catch (error) {
      console.error('Error rejecting subscription payment:', error);
      return { success: false, message: 'Failed to reject payment' };
    }
  }

  /**
   * Get transaction records for subscription payments using the new transaction service
   */
  static async getSubscriptionTransactions(): Promise<TransactionRecord[]> {
    try {
      // Use the new TransactionService to get subscription transactions
      const result = await TransactionService.getTransactions({
        entity: TransactionEntity.SUBSCRIPTION
      }, 200);
      
      // Convert to TransactionRecord format for compatibility
      const transactions = result.transactions.map(transaction => ({
        id: transaction.id,
        type: 'subscription_payment' as const,
        status: transaction.status,
        userId: 'userId' in transaction ? transaction.userId : 'unknown',
        amount: transaction.amount,
        planName: isSubscriptionTransaction(transaction) ? transaction.planName : 'Unknown Plan',
        planType: isSubscriptionTransaction(transaction) ? transaction.planType : 'provider',
        paymentMethod: transaction.paymentMethod,
        referenceNumber: transaction.metadata?.referenceNumber || transaction.id,
        verifiedAt: 'verifiedAt' in transaction ? transaction.verifiedAt : undefined,
        verifiedBy: 'verifiedBy' in transaction ? transaction.verifiedBy : undefined,
        createdAt: transaction.createdAt,
        bookingId: 'bookingId' in transaction ? transaction.bookingId : undefined,
        providerId: 'providerId' in transaction ? transaction.providerId : undefined
      } as TransactionRecord));
      
      return transactions;
    } catch (error) {
      console.error('Error fetching subscription transactions:', error);
      throw error;
    }
  }

  /**
   * Get pending transactions that need verification
   */
  static async getPendingTransactions(): Promise<TransactionRecord[]> {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TransactionRecord));
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      throw error;
    }
  }

  /**
   * Send notification to user about payment status
   */
  private static async sendPaymentVerificationNotification(
    payment: SubscriptionPayment, 
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ): Promise<void> {
    try {
      const notificationData = {
        type: status === 'verified' ? 'payment_verified' : 'payment_rejected',
        userEmail: payment.userEmail || '',
        userName: payment.userName || 'User',
        planName: payment.planName,
        planType: payment.planType,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
        ...(status === 'rejected' && { rejectionReason })
      };

      // Send notification via API
      await fetch('/api/subscription-payments/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: notificationData.type,
          paymentData: notificationData
        })
      });

      // Add in-app notification
      await addDoc(collection(db, `users/${payment.userId}/notifications`), {
        type: 'subscription_update',
        message: status === 'verified' 
          ? `Your ${payment.planName} subscription has been activated! You now have access to all premium features.`
          : `Your ${payment.planName} subscription payment was rejected. Reason: ${rejectionReason}`,
        link: '/subscription',
        read: false,
        createdAt: serverTimestamp(),
      });

    } catch (error) {
      console.error('Error sending payment verification notification:', error);
    }
  }

  /**
   * Get subscription payment statistics using both old and new data sources
   */
  static async getSubscriptionPaymentStats(): Promise<{
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    totalRevenue: number;
  }> {
    try {
      // Get stats from both subscription payments and transaction service
      const [payments, transactionStats] = await Promise.all([
        this.getAllSubscriptionPayments(),
        TransactionService.getTransactionStats({
          entity: TransactionEntity.SUBSCRIPTION
        })
      ]);
      
      // Calculate stats from subscription payments collection
      const paymentStats = payments.reduce((acc, payment) => {
        acc.total++;
        acc[payment.status]++;
        if (payment.status === 'verified') {
          acc.totalRevenue += payment.amount;
        }
        return acc;
      }, {
        total: 0,
        pending_verification: 0,
        verified: 0,
        rejected: 0,
        totalRevenue: 0
      });

      // Combine with transaction service stats for more comprehensive data
      const combinedStats = {
        total: Math.max(paymentStats.total, transactionStats.totalTransactions),
        pending: paymentStats.pending_verification,
        verified: Math.max(paymentStats.verified, transactionStats.byStatus[TransactionStatus.COMPLETED]?.count || 0),
        rejected: paymentStats.rejected,
        totalRevenue: Math.max(paymentStats.totalRevenue, transactionStats.totalAmount)
      };

      return combinedStats;
    } catch (error) {
      console.error('Error getting subscription payment stats:', error);
      throw error;
    }
  }

  /**
   * Process all pending subscription payments (batch processing)
   */
  static async processPendingPayments(
    verifiedBy: string,
    autoVerify: boolean = false
  ): Promise<{ processed: number; errors: string[] }> {
    try {
      const pendingPayments = await this.getPendingSubscriptionPayments();
      const errors: string[] = [];
      let processed = 0;

      for (const payment of pendingPayments) {
        try {
          if (autoVerify) {
            const result = await this.verifySubscriptionPayment(payment.id, verifiedBy);
            if (result.success) {
              processed++;
            } else {
              errors.push(`Payment ${payment.id}: ${result.message}`);
            }
          } else {
            // Just mark as reviewed (you can implement custom logic here)
            await updateDoc(doc(db, 'subscriptionPayments', payment.id), {
              reviewedAt: serverTimestamp(),
              reviewedBy: verifiedBy
            });
            processed++;
          }
        } catch (error) {
          errors.push(`Payment ${payment.id}: ${error}`);
        }
      }

      return { processed, errors };
    } catch (error) {
      console.error('Error processing pending payments:', error);
      throw error;
    }
  }

  /**
   * Get plan features based on plan name and type
   */
  private static getPlanFeatures(planName: string, planType: 'provider' | 'agency'): string[] {
    const normalizedPlan = planName.toLowerCase();
    
    if (planType === 'provider') {
      switch (normalizedPlan) {
        case 'pro':
          return ['smart-rate', 'enhanced-profile', 'quote-builder', 'priority-support'];
        case 'elite':
          return ['smart-rate', 'enhanced-profile', 'quote-builder', 'invoices', 'analytics', 'top-placement', 'priority-support'];
        default:
          return ['basic-features'];
      }
    } else if (planType === 'agency') {
      switch (normalizedPlan) {
        case 'lite':
          return ['basic-reports', 'provider-management', 'team-collaboration'];
        case 'custom':
          return ['basic-reports', 'enhanced-reports', 'branded-communications', 'api-access', 'provider-management', 'team-collaboration'];
        default:
          return ['basic-features'];
      }
    }
    
    return ['basic-features'];
  }

  /**
   * Get plan limits based on plan name and type
   */
  private static getPlanLimits(planName: string, planType: 'provider' | 'agency'): Record<string, any> {
    const normalizedPlan = planName.toLowerCase();
    
    if (planType === 'provider') {
      switch (normalizedPlan) {
        case 'pro':
          return {
            maxBookingsPerMonth: 50,
            maxQuotesPerMonth: 100,
            maxInvoicesPerMonth: 25,
            maxAnalyticsReports: 5
          };
        case 'elite':
          return {
            maxBookingsPerMonth: -1, // Unlimited
            maxQuotesPerMonth: -1,
            maxInvoicesPerMonth: -1,
            maxAnalyticsReports: -1
          };
        default:
          return {
            maxBookingsPerMonth: 10,
            maxQuotesPerMonth: 20,
            maxInvoicesPerMonth: 0,
            maxAnalyticsReports: 0
          };
      }
    } else if (planType === 'agency') {
      switch (normalizedPlan) {
        case 'lite':
          return {
            maxProviders: 3,
            maxReportsPerMonth: 10,
            maxTeamMembers: 5
          };
        case 'custom':
          return {
            maxProviders: -1, // Unlimited
            maxReportsPerMonth: -1,
            maxTeamMembers: -1
          };
        default:
          return {
            maxProviders: 1,
            maxReportsPerMonth: 5,
            maxTeamMembers: 2
          };
      }
    }
    
    return {};
  }

  /**
   * Get provider tier based on plan name
   */
  private static getProviderTier(planName: string): string {
    const normalizedPlan = planName.toLowerCase();
    switch (normalizedPlan) {
      case 'pro':
        return 'pro';
      case 'elite':
        return 'elite';
      default:
        return 'basic';
    }
  }

  /**
   * Get agency tier based on plan name
   */
  private static getAgencyTier(planName: string): string {
    const normalizedPlan = planName.toLowerCase();
    switch (normalizedPlan) {
      case 'lite':
        return 'lite';
      case 'custom':
        return 'custom';
      default:
        return 'basic';
    }
  }

  /**
   * Get provider benefits based on plan name
   */
  private static getProviderBenefits(planName: string): string[] {
    const normalizedPlan = planName.toLowerCase();
    switch (normalizedPlan) {
      case 'pro':
        return [
          'Smart rate suggestions',
          'Enhanced profile visibility',
          'Quote builder access',
          'Priority customer support',
          'Advanced booking management'
        ];
      case 'elite':
        return [
          'All Pro benefits',
          'Invoice generation',
          'Advanced analytics',
          'Top placement in search',
          'Premium customer support',
          'Unlimited bookings and quotes'
        ];
      default:
        return [
          'Basic profile listing',
          'Standard booking management'
        ];
    }
  }

  /**
   * Get agency benefits based on plan name
   */
  private static getAgencyBenefits(planName: string): string[] {
    const normalizedPlan = planName.toLowerCase();
    switch (normalizedPlan) {
      case 'lite':
        return [
          'Basic reporting',
          'Provider management (up to 3)',
          'Team collaboration tools',
          'Standard support'
        ];
      case 'custom':
        return [
          'All Lite benefits',
          'Enhanced reporting',
          'Branded communications',
          'API access',
          'Unlimited providers',
          'Premium support'
        ];
      default:
        return [
          'Basic provider management',
          'Standard reporting'
        ];
    }
  }
}
