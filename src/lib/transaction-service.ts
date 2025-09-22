/**
 * Transaction Service
 * 
 * This service provides comprehensive transaction management functionality
 * for the Lingkod PH system. It handles creation, updates, queries, and
 * reporting for all types of transactions.
 */

import { db } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  TransactionEntity, 
  TransactionAction, 
  TransactionStatus, 
  PaymentMethod,
  TransactionTypes,
  TransactionTypeKey
} from './transaction-types';
import {
  Transaction,
  BookingTransaction,
  SubscriptionTransaction,
  PayoutTransaction,
  AdvertisementTransaction,
  CommissionTransaction,
  RefundTransaction,
  LoyaltyTransaction,
  PenaltyTransaction,
  BonusTransaction,
  SystemTransaction,
  CreateBookingTransactionInput,
  CreateSubscriptionTransactionInput,
  CreatePayoutTransactionInput,
  CreateAdvertisementTransactionInput,
  CreateCommissionTransactionInput,
  CreateRefundTransactionInput,
  CreateLoyaltyTransactionInput,
  CreatePenaltyTransactionInput,
  CreateBonusTransactionInput,
  CreateSystemTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  TransactionStats,
  TransactionSummary,
  isBookingTransaction,
  isSubscriptionTransaction,
  isPayoutTransaction,
  isAdvertisementTransaction,
  isCommissionTransaction,
  isRefundTransaction,
  isLoyaltyTransaction,
  isPenaltyTransaction,
  isBonusTransaction,
  isSystemTransaction
} from './transaction-models';

export class TransactionService {
  private static readonly COLLECTION_NAME = 'transactions';

  /**
   * Create a booking transaction
   */
  static async createBookingTransaction(
    input: CreateBookingTransactionInput,
    action: TransactionAction.PAYMENT | TransactionAction.PAYMENT_VERIFICATION | TransactionAction.PAYMENT_REJECTION,
    status: TransactionStatus = TransactionStatus.PENDING
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transactionData: Omit<BookingTransaction, 'id'> = {
        entity: TransactionEntity.BOOKING,
        action,
        status,
        amount: input.amount,
        currency: 'PHP',
        paymentMethod: input.paymentMethod,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        bookingId: input.bookingId,
        clientId: input.clientId,
        providerId: input.providerId,
        serviceName: input.serviceName || null,
        serviceCategory: input.serviceCategory || null,
        referenceNumber: input.referenceNumber || null,
        paypalOrderId: input.paypalOrderId || null,
        payerEmail: input.payerEmail || null,
        metadata: input.metadata || {}
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), transactionData);
      
      return { success: true, transactionId: docRef.id };
    } catch (error) {
      console.error('Error creating booking transaction:', error);
      return { success: false, error: 'Failed to create booking transaction' };
    }
  }

  /**
   * Create a subscription transaction
   */
  static async createSubscriptionTransaction(
    input: CreateSubscriptionTransactionInput,
    action: TransactionAction.SUBSCRIPTION_PURCHASE | TransactionAction.SUBSCRIPTION_RENEWAL | 
            TransactionAction.SUBSCRIPTION_UPGRADE | TransactionAction.SUBSCRIPTION_DOWNGRADE | 
            TransactionAction.SUBSCRIPTION_CANCELLATION,
    status: TransactionStatus = TransactionStatus.PENDING
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transactionData: Omit<SubscriptionTransaction, 'id'> = {
        entity: TransactionEntity.SUBSCRIPTION,
        action,
        status,
        amount: input.amount,
        currency: 'PHP',
        paymentMethod: input.paymentMethod,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        userId: input.userId,
        planId: input.planId,
        planName: input.planName,
        planType: input.planType,
        billingCycle: input.billingCycle || 'monthly', // Default to monthly if not specified
        referenceNumber: input.referenceNumber || null, // Set to null if undefined
        paypalOrderId: input.paypalOrderId || null, // Set to null if undefined
        payerEmail: input.payerEmail || null, // Set to null if undefined
        metadata: input.metadata || {}
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), transactionData);
      
      return { success: true, transactionId: docRef.id };
    } catch (error) {
      console.error('Error creating subscription transaction:', error);
      return { success: false, error: 'Failed to create subscription transaction' };
    }
  }

  /**
   * Create a payout transaction
   */
  static async createPayoutTransaction(
    input: CreatePayoutTransactionInput,
    action: TransactionAction.PAYOUT_REQUEST | TransactionAction.PAYOUT_PROCESSING | 
            TransactionAction.PAYOUT_COMPLETION | TransactionAction.PAYOUT_REJECTION,
    status: TransactionStatus = TransactionStatus.PENDING
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transactionData: Omit<PayoutTransaction, 'id'> = {
        entity: TransactionEntity.PAYOUT,
        action,
        status,
        amount: input.amount,
        currency: 'PHP',
        paymentMethod: PaymentMethod.BANK_TRANSFER, // Default for payouts
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        userId: input.providerId, // Provider is the user for payouts
        payoutId: input.payoutId,
        providerId: input.providerId,
        payoutDetails: input.payoutDetails || null,
        fees: input.fees || 0,
        netAmount: input.fees ? input.amount - input.fees : input.amount,
        metadata: input.metadata || {}
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), transactionData);
      
      return { success: true, transactionId: docRef.id };
    } catch (error) {
      console.error('Error creating payout transaction:', error);
      return { success: false, error: 'Failed to create payout transaction' };
    }
  }

  /**
   * Create an advertisement transaction
   */
  static async createAdvertisementTransaction(
    input: CreateAdvertisementTransactionInput,
    action: TransactionAction.AD_CREATION | TransactionAction.AD_RENEWAL | 
            TransactionAction.AD_BOOST | TransactionAction.AD_PROMOTION,
    status: TransactionStatus = TransactionStatus.PENDING
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transactionData: Omit<AdvertisementTransaction, 'id'> = {
        entity: TransactionEntity.ADVERTISEMENT,
        action,
        status,
        amount: input.amount,
        currency: 'PHP',
        paymentMethod: input.paymentMethod,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        userId: input.userId,
        advertisementId: input.advertisementId,
        adType: input.adType,
        duration: input.duration,
        referenceNumber: input.referenceNumber,
        metadata: input.metadata
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), transactionData);
      
      return { success: true, transactionId: docRef.id };
    } catch (error) {
      console.error('Error creating advertisement transaction:', error);
      return { success: false, error: 'Failed to create advertisement transaction' };
    }
  }

  /**
   * Create a commission transaction
   */
  static async createCommissionTransaction(
    input: CreateCommissionTransactionInput,
    action: TransactionAction.COMMISSION_EARNED | TransactionAction.COMMISSION_PAYOUT | 
            TransactionAction.COMMISSION_ADJUSTMENT,
    status: TransactionStatus = TransactionStatus.PENDING
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transactionData: Omit<CommissionTransaction, 'id'> = {
        entity: TransactionEntity.COMMISSION,
        action,
        status,
        amount: input.amount,
        currency: 'PHP',
        paymentMethod: PaymentMethod.SYSTEM_CREDIT, // Default for commissions
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        userId: input.partnerId,
        partnerId: input.partnerId,
        commissionRate: input.commissionRate,
        jobValue: input.jobValue,
        referralId: input.referralId,
        jobId: input.jobId,
        bookingId: input.bookingId,
        metadata: input.metadata
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), transactionData);
      
      return { success: true, transactionId: docRef.id };
    } catch (error) {
      console.error('Error creating commission transaction:', error);
      return { success: false, error: 'Failed to create commission transaction' };
    }
  }

  /**
   * Create a refund transaction
   */
  static async createRefundTransaction(
    input: CreateRefundTransactionInput,
    action: TransactionAction.REFUND_REQUEST | TransactionAction.REFUND_PROCESSING | 
            TransactionAction.REFUND_COMPLETION | TransactionAction.REFUND_REJECTION,
    status: TransactionStatus = TransactionStatus.PENDING
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transactionData: Omit<RefundTransaction, 'id'> = {
        entity: TransactionEntity.REFUND,
        action,
        status,
        amount: input.refundAmount,
        currency: 'PHP',
        paymentMethod: input.refundMethod || PaymentMethod.SYSTEM_CREDIT,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        originalTransactionId: input.originalTransactionId,
        refundReason: input.refundReason,
        refundAmount: input.refundAmount,
        refundMethod: input.refundMethod,
        referenceNumber: input.referenceNumber,
        paypalRefundId: input.paypalRefundId,
        metadata: input.metadata
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), transactionData);
      
      return { success: true, transactionId: docRef.id };
    } catch (error) {
      console.error('Error creating refund transaction:', error);
      return { success: false, error: 'Failed to create refund transaction' };
    }
  }

  /**
   * Create a loyalty transaction
   */
  static async createLoyaltyTransaction(
    input: CreateLoyaltyTransactionInput,
    status: TransactionStatus = TransactionStatus.COMPLETED
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transactionData: Omit<LoyaltyTransaction, 'id'> = {
        entity: TransactionEntity.LOYALTY,
        action: input.action,
        status,
        amount: input.pointsAmount,
        currency: 'POINTS',
        paymentMethod: PaymentMethod.LOYALTY_POINTS,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        userId: input.userId,
        pointsAmount: input.pointsAmount,
        description: input.description,
        bookingId: input.bookingId,
        redemptionId: input.redemptionId,
        metadata: input.metadata
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), transactionData);
      
      return { success: true, transactionId: docRef.id };
    } catch (error) {
      console.error('Error creating loyalty transaction:', error);
      return { success: false, error: 'Failed to create loyalty transaction' };
    }
  }

  /**
   * Create a penalty transaction
   */
  static async createPenaltyTransaction(
    input: CreatePenaltyTransactionInput,
    action: TransactionAction.PENALTY_APPLIED | TransactionAction.PENALTY_WAIVED,
    status: TransactionStatus = TransactionStatus.COMPLETED
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transactionData: Omit<PenaltyTransaction, 'id'> = {
        entity: TransactionEntity.PENALTY,
        action,
        status,
        amount: input.amount,
        currency: 'PHP',
        paymentMethod: PaymentMethod.SYSTEM_CREDIT,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        userId: input.userId,
        penaltyReason: input.penaltyReason,
        violationType: input.violationType,
        bookingId: input.bookingId,
        referenceNumber: input.referenceNumber,
        metadata: input.metadata
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), transactionData);
      
      return { success: true, transactionId: docRef.id };
    } catch (error) {
      console.error('Error creating penalty transaction:', error);
      return { success: false, error: 'Failed to create penalty transaction' };
    }
  }

  /**
   * Create a bonus transaction
   */
  static async createBonusTransaction(
    input: CreateBonusTransactionInput,
    action: TransactionAction.BONUS_AWARDED | TransactionAction.BONUS_ADJUSTMENT,
    status: TransactionStatus = TransactionStatus.COMPLETED
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transactionData: Omit<BonusTransaction, 'id'> = {
        entity: TransactionEntity.BONUS,
        action,
        status,
        amount: input.amount,
        currency: 'PHP',
        paymentMethod: PaymentMethod.SYSTEM_CREDIT,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        userId: input.userId,
        bonusReason: input.bonusReason,
        bonusType: input.bonusType,
        referenceNumber: input.referenceNumber,
        metadata: input.metadata
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), transactionData);
      
      return { success: true, transactionId: docRef.id };
    } catch (error) {
      console.error('Error creating bonus transaction:', error);
      return { success: false, error: 'Failed to create bonus transaction' };
    }
  }

  /**
   * Create a system transaction
   */
  static async createSystemTransaction(
    input: CreateSystemTransactionInput,
    action: TransactionAction.SYSTEM_ADJUSTMENT | TransactionAction.SYSTEM_REFUND | 
            TransactionAction.SYSTEM_CREDIT,
    status: TransactionStatus = TransactionStatus.COMPLETED
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transactionData: Omit<SystemTransaction, 'id'> = {
        entity: TransactionEntity.SYSTEM,
        action,
        status,
        amount: input.amount,
        currency: 'PHP',
        paymentMethod: PaymentMethod.SYSTEM_CREDIT,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        systemReason: input.systemReason,
        affectedUserId: input.affectedUserId,
        referenceNumber: input.referenceNumber,
        metadata: input.metadata
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), transactionData);
      
      return { success: true, transactionId: docRef.id };
    } catch (error) {
      console.error('Error creating system transaction:', error);
      return { success: false, error: 'Failed to create system transaction' };
    }
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(
    transactionId: string,
    input: UpdateTransactionInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const transactionRef = doc(db, this.COLLECTION_NAME, transactionId);
      const updateData: any = {
        ...input,
        updatedAt: serverTimestamp()
      };

      await updateDoc(transactionRef, updateData);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating transaction:', error);
      return { success: false, error: 'Failed to update transaction' };
    }
  }

  /**
   * Get a transaction by ID
   */
  static async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      const transactionRef = doc(db, this.COLLECTION_NAME, transactionId);
      const transactionDoc = await getDoc(transactionRef);
      
      if (!transactionDoc.exists()) {
        return null;
      }
      
      return { id: transactionDoc.id, ...transactionDoc.data() } as Transaction;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  /**
   * Get transactions with filters
   */
  static async getTransactions(
    filters: TransactionFilters = {},
    limitCount: number = 50,
    startAfterDoc?: any
  ): Promise<{ transactions: Transaction[]; lastDoc?: any }> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      // Apply filters
      if (filters.entity) {
        q = query(q, where('entity', '==', filters.entity));
      }
      if (filters.action) {
        q = query(q, where('action', '==', filters.action));
      }
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.providerId) {
        q = query(q, where('providerId', '==', filters.providerId));
      }
      if (filters.clientId) {
        q = query(q, where('clientId', '==', filters.clientId));
      }
      if (filters.bookingId) {
        q = query(q, where('bookingId', '==', filters.bookingId));
      }
      if (filters.subscriptionId) {
        q = query(q, where('subscriptionId', '==', filters.subscriptionId));
      }
      if (filters.payoutId) {
        q = query(q, where('payoutId', '==', filters.payoutId));
      }
      if (filters.advertisementId) {
        q = query(q, where('advertisementId', '==', filters.advertisementId));
      }
      if (filters.commissionId) {
        q = query(q, where('commissionId', '==', filters.commissionId));
      }
      if (filters.refundId) {
        q = query(q, where('refundId', '==', filters.refundId));
      }
      if (filters.paymentMethod) {
        q = query(q, where('paymentMethod', '==', filters.paymentMethod));
      }
      if (filters.dateFrom) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom)));
      }
      if (filters.dateTo) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.dateTo)));
      }
      if (filters.amountMin) {
        q = query(q, where('amount', '>=', filters.amountMin));
      }
      if (filters.amountMax) {
        q = query(q, where('amount', '<=', filters.amountMax));
      }

      // Order by creation date (newest first)
      q = query(q, orderBy('createdAt', 'desc'));

      // Apply pagination
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }
      q = query(q, limit(limitCount));

      const snapshot = await getDocs(q);
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return { transactions, lastDoc };
    } catch (error) {
      console.error('Error getting transactions:', error);
      return { transactions: [] };
    }
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(
    filters: TransactionFilters = {}
  ): Promise<TransactionStats> {
    try {
      const { transactions } = await this.getTransactions(filters, 1000); // Get more for stats

      const stats: TransactionStats = {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        byEntity: {} as Record<TransactionEntity, { count: number; amount: number }>,
        byStatus: {} as Record<TransactionStatus, { count: number; amount: number }>,
        byPaymentMethod: {} as Record<PaymentMethod, { count: number; amount: number }>,
        byAction: {} as Record<TransactionAction, { count: number; amount: number }>
      };

      // Initialize counters
      Object.values(TransactionEntity).forEach(entity => {
        stats.byEntity[entity] = { count: 0, amount: 0 };
      });
      Object.values(TransactionStatus).forEach(status => {
        stats.byStatus[status] = { count: 0, amount: 0 };
      });
      Object.values(PaymentMethod).forEach(method => {
        stats.byPaymentMethod[method] = { count: 0, amount: 0 };
      });
      Object.values(TransactionAction).forEach(action => {
        stats.byAction[action] = { count: 0, amount: 0 };
      });

      // Count transactions
      transactions.forEach(transaction => {
        stats.byEntity[transaction.entity].count++;
        stats.byEntity[transaction.entity].amount += transaction.amount;
        
        stats.byStatus[transaction.status].count++;
        stats.byStatus[transaction.status].amount += transaction.amount;
        
        stats.byPaymentMethod[transaction.paymentMethod].count++;
        stats.byPaymentMethod[transaction.paymentMethod].amount += transaction.amount;
        
        stats.byAction[transaction.action].count++;
        stats.byAction[transaction.action].amount += transaction.amount;
      });

      return stats;
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      throw error;
    }
  }

  /**
   * Get transaction summary for a period
   */
  static async getTransactionSummary(
    from: Date,
    to: Date,
    filters: TransactionFilters = {}
  ): Promise<TransactionSummary> {
    try {
      const periodFilters = {
        ...filters,
        dateFrom: from,
        dateTo: to
      };

      const { transactions } = await this.getTransactions(periodFilters, 1000);
      const stats = await this.getTransactionStats(periodFilters);

      // Sort transactions by amount for top transactions
      const topTransactions = transactions
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Get recent transactions (already sorted by date)
      const recentTransactions = transactions.slice(0, 10);

      return {
        period: { from, to },
        stats,
        topTransactions,
        recentTransactions
      };
    } catch (error) {
      console.error('Error getting transaction summary:', error);
      throw error;
    }
  }

  /**
   * Migrate old transaction format to new format
   */
  static async migrateOldTransaction(oldTransaction: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Determine entity and action based on old type
      let entity: TransactionEntity;
      let action: TransactionAction;

      switch (oldTransaction.type) {
        case 'booking_payment':
          entity = TransactionEntity.BOOKING;
          action = oldTransaction.status === 'completed' ? 
            TransactionAction.PAYMENT_VERIFICATION : 
            oldTransaction.status === 'rejected' ? 
            TransactionAction.PAYMENT_REJECTION : 
            TransactionAction.PAYMENT;
          break;
        case 'subscription_payment':
          entity = TransactionEntity.SUBSCRIPTION;
          action = TransactionAction.SUBSCRIPTION_PURCHASE;
          break;
        case 'payout_request':
          entity = TransactionEntity.PAYOUT;
          action = TransactionAction.PAYOUT_REQUEST;
          break;
        case 'payout_processed':
          entity = TransactionEntity.PAYOUT;
          action = TransactionAction.PAYOUT_COMPLETION;
          break;
        case 'refund':
          entity = TransactionEntity.REFUND;
          action = TransactionAction.REFUND_COMPLETION;
          break;
        default:
          return { success: false, error: 'Unknown transaction type' };
      }

      // Map old status to new status
      let status: TransactionStatus;
      switch (oldTransaction.status) {
        case 'completed':
          status = TransactionStatus.COMPLETED;
          break;
        case 'pending':
          status = TransactionStatus.PENDING;
          break;
        case 'failed':
          status = TransactionStatus.FAILED;
          break;
        case 'cancelled':
          status = TransactionStatus.CANCELLED;
          break;
        case 'rejected':
          status = TransactionStatus.REJECTED;
          break;
        case 'refunded':
          status = TransactionStatus.REFUNDED;
          break;
        default:
          status = TransactionStatus.PENDING;
      }

      // Map old payment method to new payment method
      let paymentMethod: PaymentMethod;
      switch (oldTransaction.paymentMethod) {
        case 'gcash':
          paymentMethod = PaymentMethod.GCASH;
          break;
        case 'maya':
          paymentMethod = PaymentMethod.MAYA;
          break;
        case 'bank':
          paymentMethod = PaymentMethod.BANK_TRANSFER;
          break;
        case 'paypal':
          paymentMethod = PaymentMethod.PAYPAL;
          break;
        case 'manual_verification':
          paymentMethod = PaymentMethod.MANUAL_VERIFICATION;
          break;
        default:
          paymentMethod = PaymentMethod.MANUAL_VERIFICATION;
      }

      // Create new transaction data
      const newTransactionData = {
        entity,
        action,
        status,
        amount: oldTransaction.amount || 0,
        currency: 'PHP',
        paymentMethod,
        createdAt: oldTransaction.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: oldTransaction.userId || oldTransaction.clientId,
        clientId: oldTransaction.clientId,
        providerId: oldTransaction.providerId,
        bookingId: oldTransaction.bookingId,
        subscriptionId: oldTransaction.subscriptionId,
        payoutId: oldTransaction.payoutId,
        referenceNumber: oldTransaction.referenceNumber,
        paypalOrderId: oldTransaction.paypalOrderId,
        payerEmail: oldTransaction.payerEmail,
        verifiedBy: oldTransaction.verifiedBy,
        verifiedAt: oldTransaction.verifiedAt,
        rejectedBy: oldTransaction.rejectedBy,
        rejectedAt: oldTransaction.rejectedAt,
        rejectionReason: oldTransaction.rejectionReason,
        metadata: {
          migrated: true,
          originalType: oldTransaction.type,
          migrationDate: new Date().toISOString()
        }
      };

      // Update the transaction document
      const transactionRef = doc(db, this.COLLECTION_NAME, oldTransaction.id);
      await updateDoc(transactionRef, newTransactionData);

      return { success: true };
    } catch (error) {
      console.error('Error migrating transaction:', error);
      return { success: false, error: 'Failed to migrate transaction' };
    }
  }
}
