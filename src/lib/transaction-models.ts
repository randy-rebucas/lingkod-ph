/**
 * Transaction Models and Interfaces
 * 
 * This file defines the transaction data models and interfaces used throughout
 * the Lingkod PH system. It provides type-safe interfaces for different types
 * of transactions and their related data.
 */

import { Timestamp } from 'firebase/firestore';
import { 
  TransactionEntity, 
  TransactionAction, 
  TransactionStatus, 
  PaymentMethod,
  TransactionTypeKey 
} from './transaction-types';

// Base transaction interface
export interface BaseTransaction {
  id: string;
  entity: TransactionEntity;
  action: TransactionAction;
  status: TransactionStatus;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  metadata?: Record<string, any>;
}

// User-related transaction fields
export interface UserTransactionFields {
  userId: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
}

// Admin-related transaction fields
export interface AdminTransactionFields {
  processedBy?: string;
  processedAt?: Timestamp;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  rejectedBy?: string;
  rejectedAt?: Timestamp;
  rejectionReason?: string;
}

// Booking transaction interface
export interface BookingTransaction extends BaseTransaction, UserTransactionFields, AdminTransactionFields {
  entity: TransactionEntity.BOOKING;
  action: TransactionAction.PAYMENT | TransactionAction.PAYMENT_VERIFICATION | TransactionAction.PAYMENT_REJECTION;
  bookingId: string;
  clientId: string;
  providerId: string;
  serviceName?: string;
  serviceCategory?: string;
  bookingDate?: Timestamp;
  completionDate?: Timestamp;
  referenceNumber?: string;
  paypalOrderId?: string;
  payerEmail?: string;
}

// Subscription transaction interface
export interface SubscriptionTransaction extends BaseTransaction, UserTransactionFields, AdminTransactionFields {
  entity: TransactionEntity.SUBSCRIPTION;
  action: TransactionAction.SUBSCRIPTION_PURCHASE | TransactionAction.SUBSCRIPTION_RENEWAL | 
          TransactionAction.SUBSCRIPTION_UPGRADE | TransactionAction.SUBSCRIPTION_DOWNGRADE | 
          TransactionAction.SUBSCRIPTION_CANCELLATION;
  subscriptionId?: string;
  planId: string;
  planName: string;
  planType: 'provider' | 'agency' | 'premium';
  billingCycle?: 'monthly' | 'yearly';
  renewalDate?: Timestamp;
  referenceNumber?: string;
  paypalOrderId?: string;
  payerEmail?: string;
}

// Payout transaction interface
export interface PayoutTransaction extends BaseTransaction, UserTransactionFields, AdminTransactionFields {
  entity: TransactionEntity.PAYOUT;
  action: TransactionAction.PAYOUT_REQUEST | TransactionAction.PAYOUT_PROCESSING | 
          TransactionAction.PAYOUT_COMPLETION | TransactionAction.PAYOUT_REJECTION;
  payoutId: string;
  providerId: string;
  providerName?: string;
  agencyId?: string;
  payoutDetails?: {
    method: 'bank_transfer' | 'gcash' | 'paypal';
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    email?: string;
  };
  transactionId?: string;
  referenceNumber?: string;
  fees?: number;
  netAmount?: number;
}

// Advertisement transaction interface
export interface AdvertisementTransaction extends BaseTransaction, UserTransactionFields, AdminTransactionFields {
  entity: TransactionEntity.ADVERTISEMENT;
  action: TransactionAction.AD_CREATION | TransactionAction.AD_RENEWAL | 
          TransactionAction.AD_BOOST | TransactionAction.AD_PROMOTION;
  advertisementId: string;
  adType?: 'service_promotion' | 'profile_boost' | 'featured_listing';
  duration?: number; // in days
  targetAudience?: string;
  referenceNumber?: string;
}

// Commission transaction interface
export interface CommissionTransaction extends BaseTransaction, UserTransactionFields, AdminTransactionFields {
  entity: TransactionEntity.COMMISSION;
  action: TransactionAction.COMMISSION_EARNED | TransactionAction.COMMISSION_PAYOUT | 
          TransactionAction.COMMISSION_ADJUSTMENT;
  commissionId?: string;
  partnerId: string;
  partnerName?: string;
  referralId?: string;
  jobId?: string;
  bookingId?: string;
  commissionRate?: number;
  jobValue?: number;
  referenceNumber?: string;
}

// Refund transaction interface
export interface RefundTransaction extends BaseTransaction, UserTransactionFields, AdminTransactionFields {
  entity: TransactionEntity.REFUND;
  action: TransactionAction.REFUND_REQUEST | TransactionAction.REFUND_PROCESSING | 
          TransactionAction.REFUND_COMPLETION | TransactionAction.REFUND_REJECTION;
  refundId?: string;
  originalTransactionId: string;
  refundReason: string;
  refundAmount: number;
  refundMethod?: PaymentMethod;
  referenceNumber?: string;
  paypalRefundId?: string;
}

// Loyalty transaction interface
export interface LoyaltyTransaction extends BaseTransaction, UserTransactionFields {
  entity: TransactionEntity.LOYALTY;
  action: TransactionAction.POINTS_EARNED | TransactionAction.POINTS_REDEEMED | 
          TransactionAction.POINTS_EXPIRED | TransactionAction.POINTS_ADJUSTMENT;
  pointsAmount: number;
  pointsBalance?: number;
  description?: string;
  bookingId?: string;
  redemptionId?: string;
}

// Penalty transaction interface
export interface PenaltyTransaction extends BaseTransaction, UserTransactionFields, AdminTransactionFields {
  entity: TransactionEntity.PENALTY;
  action: TransactionAction.PENALTY_APPLIED | TransactionAction.PENALTY_WAIVED;
  penaltyId?: string;
  penaltyReason: string;
  violationType?: string;
  bookingId?: string;
  referenceNumber?: string;
}

// Bonus transaction interface
export interface BonusTransaction extends BaseTransaction, UserTransactionFields, AdminTransactionFields {
  entity: TransactionEntity.BONUS;
  action: TransactionAction.BONUS_AWARDED | TransactionAction.BONUS_ADJUSTMENT;
  bonusId?: string;
  bonusReason: string;
  bonusType?: 'performance' | 'referral' | 'loyalty' | 'special';
  referenceNumber?: string;
}

// System transaction interface
export interface SystemTransaction extends BaseTransaction, AdminTransactionFields {
  entity: TransactionEntity.SYSTEM;
  action: TransactionAction.SYSTEM_ADJUSTMENT | TransactionAction.SYSTEM_REFUND | 
          TransactionAction.SYSTEM_CREDIT;
  systemReason: string;
  affectedUserId?: string;
  referenceNumber?: string;
}

// Union type for all transaction types
export type Transaction = 
  | BookingTransaction
  | SubscriptionTransaction
  | PayoutTransaction
  | AdvertisementTransaction
  | CommissionTransaction
  | RefundTransaction
  | LoyaltyTransaction
  | PenaltyTransaction
  | BonusTransaction
  | SystemTransaction;

// Transaction creation input types
export interface CreateBookingTransactionInput {
  bookingId: string;
  clientId: string;
  providerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  serviceName?: string;
  serviceCategory?: string;
  referenceNumber?: string;
  paypalOrderId?: string;
  payerEmail?: string;
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionTransactionInput {
  userId: string;
  planId: string;
  planName: string;
  planType: 'provider' | 'agency' | 'premium';
  amount: number;
  paymentMethod: PaymentMethod;
  billingCycle?: 'monthly' | 'yearly';
  referenceNumber?: string;
  paypalOrderId?: string;
  payerEmail?: string;
  metadata?: Record<string, any>;
}

export interface CreatePayoutTransactionInput {
  payoutId: string;
  providerId: string;
  amount: number;
  payoutDetails: {
    method: 'bank_transfer' | 'gcash' | 'paypal';
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    email?: string;
  };
  fees?: number;
  metadata?: Record<string, any>;
}

export interface CreateAdvertisementTransactionInput {
  advertisementId: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  adType?: 'service_promotion' | 'profile_boost' | 'featured_listing';
  duration?: number;
  referenceNumber?: string;
  metadata?: Record<string, any>;
}

export interface CreateCommissionTransactionInput {
  partnerId: string;
  amount: number;
  commissionRate?: number;
  jobValue?: number;
  referralId?: string;
  jobId?: string;
  bookingId?: string;
  metadata?: Record<string, any>;
}

export interface CreateRefundTransactionInput {
  originalTransactionId: string;
  refundAmount: number;
  refundReason: string;
  refundMethod?: PaymentMethod;
  referenceNumber?: string;
  paypalRefundId?: string;
  metadata?: Record<string, any>;
}

export interface CreateLoyaltyTransactionInput {
  userId: string;
  pointsAmount: number;
  action: TransactionAction.POINTS_EARNED | TransactionAction.POINTS_REDEEMED | 
          TransactionAction.POINTS_EXPIRED | TransactionAction.POINTS_ADJUSTMENT;
  description?: string;
  bookingId?: string;
  redemptionId?: string;
  metadata?: Record<string, any>;
}

export interface CreatePenaltyTransactionInput {
  userId: string;
  amount: number;
  penaltyReason: string;
  violationType?: string;
  bookingId?: string;
  referenceNumber?: string;
  metadata?: Record<string, any>;
}

export interface CreateBonusTransactionInput {
  userId: string;
  amount: number;
  bonusReason: string;
  bonusType?: 'performance' | 'referral' | 'loyalty' | 'special';
  referenceNumber?: string;
  metadata?: Record<string, any>;
}

export interface CreateSystemTransactionInput {
  amount: number;
  systemReason: string;
  affectedUserId?: string;
  referenceNumber?: string;
  metadata?: Record<string, any>;
}

// Transaction update input types
export interface UpdateTransactionInput {
  status?: TransactionStatus;
  processedBy?: string;
  verifiedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  referenceNumber?: string;
  metadata?: Record<string, any>;
}

// Transaction query filters
export interface TransactionFilters {
  entity?: TransactionEntity;
  action?: TransactionAction;
  status?: TransactionStatus;
  userId?: string;
  providerId?: string;
  clientId?: string;
  bookingId?: string;
  subscriptionId?: string;
  payoutId?: string;
  advertisementId?: string;
  commissionId?: string;
  refundId?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

// Transaction statistics
export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  byEntity: Record<TransactionEntity, { count: number; amount: number }>;
  byStatus: Record<TransactionStatus, { count: number; amount: number }>;
  byPaymentMethod: Record<PaymentMethod, { count: number; amount: number }>;
  byAction: Record<TransactionAction, { count: number; amount: number }>;
}

// Transaction summary for reports
export interface TransactionSummary {
  period: {
    from: Date;
    to: Date;
  };
  stats: TransactionStats;
  topTransactions: Transaction[];
  recentTransactions: Transaction[];
}

// Type guards for transaction types
export function isBookingTransaction(transaction: Transaction): transaction is BookingTransaction {
  return transaction.entity === TransactionEntity.BOOKING;
}

export function isSubscriptionTransaction(transaction: Transaction): transaction is SubscriptionTransaction {
  return transaction.entity === TransactionEntity.SUBSCRIPTION;
}

export function isPayoutTransaction(transaction: Transaction): transaction is PayoutTransaction {
  return transaction.entity === TransactionEntity.PAYOUT;
}

export function isAdvertisementTransaction(transaction: Transaction): transaction is AdvertisementTransaction {
  return transaction.entity === TransactionEntity.ADVERTISEMENT;
}

export function isCommissionTransaction(transaction: Transaction): transaction is CommissionTransaction {
  return transaction.entity === TransactionEntity.COMMISSION;
}

export function isRefundTransaction(transaction: Transaction): transaction is RefundTransaction {
  return transaction.entity === TransactionEntity.REFUND;
}

export function isLoyaltyTransaction(transaction: Transaction): transaction is LoyaltyTransaction {
  return transaction.entity === TransactionEntity.LOYALTY;
}

export function isPenaltyTransaction(transaction: Transaction): transaction is PenaltyTransaction {
  return transaction.entity === TransactionEntity.PENALTY;
}

export function isBonusTransaction(transaction: Transaction): transaction is BonusTransaction {
  return transaction.entity === TransactionEntity.BONUS;
}

export function isSystemTransaction(transaction: Transaction): transaction is SystemTransaction {
  return transaction.entity === TransactionEntity.SYSTEM;
}
