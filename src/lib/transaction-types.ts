/**
 * Transaction Types and Constants
 * 
 * This file defines all transaction types and related constants for the Lingkod PH system.
 * It provides a centralized way to manage different types of financial transactions
 * across the platform including bookings, subscriptions, payouts, advertisements, and more.
 */

// Transaction Entity Types - What the transaction is related to
export enum TransactionEntity {
  BOOKING = 'booking',
  SUBSCRIPTION = 'subscription', 
  PAYOUT = 'payout',
  ADVERTISEMENT = 'advertisement',
  COMMISSION = 'commission',
  REFUND = 'refund',
  LOYALTY = 'loyalty',
  PENALTY = 'penalty',
  BONUS = 'bonus',
  SYSTEM = 'system'
}

// Transaction Action Types - What action is being performed
export enum TransactionAction {
  // Payment actions
  PAYMENT = 'payment',
  PAYMENT_VERIFICATION = 'payment_verification',
  PAYMENT_REJECTION = 'payment_rejection',
  
  // Subscription actions
  SUBSCRIPTION_PURCHASE = 'subscription_purchase',
  SUBSCRIPTION_RENEWAL = 'subscription_renewal',
  SUBSCRIPTION_UPGRADE = 'subscription_upgrade',
  SUBSCRIPTION_DOWNGRADE = 'subscription_downgrade',
  SUBSCRIPTION_CANCELLATION = 'subscription_cancellation',
  
  // Payout actions
  PAYOUT_REQUEST = 'payout_request',
  PAYOUT_PROCESSING = 'payout_processing',
  PAYOUT_COMPLETION = 'payout_completion',
  PAYOUT_REJECTION = 'payout_rejection',
  
  // Advertisement actions
  AD_CREATION = 'ad_creation',
  AD_RENEWAL = 'ad_renewal',
  AD_BOOST = 'ad_boost',
  AD_PROMOTION = 'ad_promotion',
  
  // Commission actions
  COMMISSION_EARNED = 'commission_earned',
  COMMISSION_PAYOUT = 'commission_payout',
  COMMISSION_ADJUSTMENT = 'commission_adjustment',
  
  // Refund actions
  REFUND_REQUEST = 'refund_request',
  REFUND_PROCESSING = 'refund_processing',
  REFUND_COMPLETION = 'refund_completion',
  REFUND_REJECTION = 'refund_rejection',
  
  // Loyalty actions
  POINTS_EARNED = 'points_earned',
  POINTS_REDEEMED = 'points_redeemed',
  POINTS_EXPIRED = 'points_expired',
  POINTS_ADJUSTMENT = 'points_adjustment',
  
  // Penalty actions
  PENALTY_APPLIED = 'penalty_applied',
  PENALTY_WAIVED = 'penalty_waived',
  
  // Bonus actions
  BONUS_AWARDED = 'bonus_awarded',
  BONUS_ADJUSTMENT = 'bonus_adjustment',
  
  // System actions
  SYSTEM_ADJUSTMENT = 'system_adjustment',
  SYSTEM_REFUND = 'system_refund',
  SYSTEM_CREDIT = 'system_credit'
}

// Transaction Status
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
  PROCESSING = 'processing',
  VERIFIED = 'verified',
  EXPIRED = 'expired'
}

// Payment Methods
export enum PaymentMethod {
  GCASH = 'gcash',
  MAYA = 'maya',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  MANUAL_VERIFICATION = 'manual_verification',
  SYSTEM_CREDIT = 'system_credit',
  LOYALTY_POINTS = 'loyalty_points'
}

// Transaction Type Combinations - Predefined combinations for common use cases
export const TransactionTypes = {
  // Booking related
  BOOKING_PAYMENT: {
    entity: TransactionEntity.BOOKING,
    action: TransactionAction.PAYMENT,
    description: 'Service booking payment'
  },
  BOOKING_PAYMENT_VERIFICATION: {
    entity: TransactionEntity.BOOKING,
    action: TransactionAction.PAYMENT_VERIFICATION,
    description: 'Booking payment verification'
  },
  BOOKING_PAYMENT_REJECTION: {
    entity: TransactionEntity.BOOKING,
    action: TransactionAction.PAYMENT_REJECTION,
    description: 'Booking payment rejection'
  },
  BOOKING_REFUND: {
    entity: TransactionEntity.REFUND,
    action: TransactionAction.REFUND_COMPLETION,
    description: 'Booking refund'
  },

  // Subscription related
  SUBSCRIPTION_PURCHASE: {
    entity: TransactionEntity.SUBSCRIPTION,
    action: TransactionAction.SUBSCRIPTION_PURCHASE,
    description: 'Subscription plan purchase'
  },
  SUBSCRIPTION_RENEWAL: {
    entity: TransactionEntity.SUBSCRIPTION,
    action: TransactionAction.SUBSCRIPTION_RENEWAL,
    description: 'Subscription renewal'
  },
  SUBSCRIPTION_UPGRADE: {
    entity: TransactionEntity.SUBSCRIPTION,
    action: TransactionAction.SUBSCRIPTION_UPGRADE,
    description: 'Subscription upgrade'
  },
  SUBSCRIPTION_CANCELLATION: {
    entity: TransactionEntity.SUBSCRIPTION,
    action: TransactionAction.SUBSCRIPTION_CANCELLATION,
    description: 'Subscription cancellation'
  },

  // Payout related
  PAYOUT_REQUEST: {
    entity: TransactionEntity.PAYOUT,
    action: TransactionAction.PAYOUT_REQUEST,
    description: 'Provider payout request'
  },
  PAYOUT_PROCESSING: {
    entity: TransactionEntity.PAYOUT,
    action: TransactionAction.PAYOUT_PROCESSING,
    description: 'Payout processing'
  },
  PAYOUT_COMPLETION: {
    entity: TransactionEntity.PAYOUT,
    action: TransactionAction.PAYOUT_COMPLETION,
    description: 'Payout completed'
  },
  PAYOUT_REJECTION: {
    entity: TransactionEntity.PAYOUT,
    action: TransactionAction.PAYOUT_REJECTION,
    description: 'Payout rejection'
  },

  // Advertisement related
  AD_CREATION: {
    entity: TransactionEntity.ADVERTISEMENT,
    action: TransactionAction.AD_CREATION,
    description: 'Advertisement creation'
  },
  AD_RENEWAL: {
    entity: TransactionEntity.ADVERTISEMENT,
    action: TransactionAction.AD_RENEWAL,
    description: 'Advertisement renewal'
  },
  AD_BOOST: {
    entity: TransactionEntity.ADVERTISEMENT,
    action: TransactionAction.AD_BOOST,
    description: 'Advertisement boost'
  },

  // Commission related
  COMMISSION_EARNED: {
    entity: TransactionEntity.COMMISSION,
    action: TransactionAction.COMMISSION_EARNED,
    description: 'Commission earned'
  },
  COMMISSION_PAYOUT: {
    entity: TransactionEntity.COMMISSION,
    action: TransactionAction.COMMISSION_PAYOUT,
    description: 'Commission payout'
  },

  // Loyalty related
  LOYALTY_POINTS_EARNED: {
    entity: TransactionEntity.LOYALTY,
    action: TransactionAction.POINTS_EARNED,
    description: 'Loyalty points earned'
  },
  LOYALTY_POINTS_REDEEMED: {
    entity: TransactionEntity.LOYALTY,
    action: TransactionAction.POINTS_REDEEMED,
    description: 'Loyalty points redeemed'
  },

  // System related
  SYSTEM_ADJUSTMENT: {
    entity: TransactionEntity.SYSTEM,
    action: TransactionAction.SYSTEM_ADJUSTMENT,
    description: 'System adjustment'
  },
  SYSTEM_REFUND: {
    entity: TransactionEntity.SYSTEM,
    action: TransactionAction.SYSTEM_REFUND,
    description: 'System refund'
  }
} as const;

// Type for transaction type keys
export type TransactionTypeKey = keyof typeof TransactionTypes;

// Helper function to get transaction type by key
export function getTransactionType(typeKey: TransactionTypeKey) {
  return TransactionTypes[typeKey];
}

// Helper function to create a transaction type string
export function createTransactionTypeString(entity: TransactionEntity, action: TransactionAction): string {
  return `${entity}_${action}`;
}

// Helper function to parse transaction type string
export function parseTransactionTypeString(typeString: string): { entity: TransactionEntity; action: TransactionAction } | null {
  const parts = typeString.split('_');
  if (parts.length < 2) return null;
  
  const entity = parts[0] as TransactionEntity;
  const action = parts.slice(1).join('_') as TransactionAction;
  
  if (!Object.values(TransactionEntity).includes(entity) || !Object.values(TransactionAction).includes(action)) {
    return null;
  }
  
  return { entity, action };
}

// Transaction type validation
export function isValidTransactionType(entity: string, action: string): boolean {
  return Object.values(TransactionEntity).includes(entity as TransactionEntity) &&
         Object.values(TransactionAction).includes(action as TransactionAction);
}

// Get all transaction types for a specific entity
export function getTransactionTypesForEntity(entity: TransactionEntity): Array<{ key: TransactionTypeKey; type: typeof TransactionTypes[TransactionTypeKey] }> {
  return Object.entries(TransactionTypes)
    .filter(([_, type]) => type.entity === entity)
    .map(([key, type]) => ({ key: key as TransactionTypeKey, type }));
}

// Get all transaction types for a specific action
export function getTransactionTypesForAction(action: TransactionAction): Array<{ key: TransactionTypeKey; type: typeof TransactionTypes[TransactionTypeKey] }> {
  return Object.entries(TransactionTypes)
    .filter(([_, type]) => type.action === action)
    .map(([key, type]) => ({ key: key as TransactionTypeKey, type }));
}

// Transaction type display helpers
export function getTransactionTypeDisplayName(typeKey: TransactionTypeKey): string {
  return TransactionTypes[typeKey].description;
}

export function getTransactionEntityDisplayName(entity: TransactionEntity): string {
  const displayNames: Record<TransactionEntity, string> = {
    [TransactionEntity.BOOKING]: 'Service Booking',
    [TransactionEntity.SUBSCRIPTION]: 'Subscription',
    [TransactionEntity.PAYOUT]: 'Payout',
    [TransactionEntity.ADVERTISEMENT]: 'Advertisement',
    [TransactionEntity.COMMISSION]: 'Commission',
    [TransactionEntity.REFUND]: 'Refund',
    [TransactionEntity.LOYALTY]: 'Loyalty',
    [TransactionEntity.PENALTY]: 'Penalty',
    [TransactionEntity.BONUS]: 'Bonus',
    [TransactionEntity.SYSTEM]: 'System'
  };
  return displayNames[entity];
}

export function getTransactionActionDisplayName(action: TransactionAction): string {
  const displayNames: Record<TransactionAction, string> = {
    [TransactionAction.PAYMENT]: 'Payment',
    [TransactionAction.PAYMENT_VERIFICATION]: 'Payment Verification',
    [TransactionAction.PAYMENT_REJECTION]: 'Payment Rejection',
    [TransactionAction.SUBSCRIPTION_PURCHASE]: 'Subscription Purchase',
    [TransactionAction.SUBSCRIPTION_RENEWAL]: 'Subscription Renewal',
    [TransactionAction.SUBSCRIPTION_UPGRADE]: 'Subscription Upgrade',
    [TransactionAction.SUBSCRIPTION_DOWNGRADE]: 'Subscription Downgrade',
    [TransactionAction.SUBSCRIPTION_CANCELLATION]: 'Subscription Cancellation',
    [TransactionAction.PAYOUT_REQUEST]: 'Payout Request',
    [TransactionAction.PAYOUT_PROCESSING]: 'Payout Processing',
    [TransactionAction.PAYOUT_COMPLETION]: 'Payout Completion',
    [TransactionAction.PAYOUT_REJECTION]: 'Payout Rejection',
    [TransactionAction.AD_CREATION]: 'Ad Creation',
    [TransactionAction.AD_RENEWAL]: 'Ad Renewal',
    [TransactionAction.AD_BOOST]: 'Ad Boost',
    [TransactionAction.AD_PROMOTION]: 'Ad Promotion',
    [TransactionAction.COMMISSION_EARNED]: 'Commission Earned',
    [TransactionAction.COMMISSION_PAYOUT]: 'Commission Payout',
    [TransactionAction.COMMISSION_ADJUSTMENT]: 'Commission Adjustment',
    [TransactionAction.REFUND_REQUEST]: 'Refund Request',
    [TransactionAction.REFUND_PROCESSING]: 'Refund Processing',
    [TransactionAction.REFUND_COMPLETION]: 'Refund Completion',
    [TransactionAction.REFUND_REJECTION]: 'Refund Rejection',
    [TransactionAction.POINTS_EARNED]: 'Points Earned',
    [TransactionAction.POINTS_REDEEMED]: 'Points Redeemed',
    [TransactionAction.POINTS_EXPIRED]: 'Points Expired',
    [TransactionAction.POINTS_ADJUSTMENT]: 'Points Adjustment',
    [TransactionAction.PENALTY_APPLIED]: 'Penalty Applied',
    [TransactionAction.PENALTY_WAIVED]: 'Penalty Waived',
    [TransactionAction.BONUS_AWARDED]: 'Bonus Awarded',
    [TransactionAction.BONUS_ADJUSTMENT]: 'Bonus Adjustment',
    [TransactionAction.SYSTEM_ADJUSTMENT]: 'System Adjustment',
    [TransactionAction.SYSTEM_REFUND]: 'System Refund',
    [TransactionAction.SYSTEM_CREDIT]: 'System Credit'
  };
  return displayNames[action];
}

export function getTransactionStatusDisplayName(status: TransactionStatus): string {
  const displayNames: Record<TransactionStatus, string> = {
    [TransactionStatus.PENDING]: 'Pending',
    [TransactionStatus.COMPLETED]: 'Completed',
    [TransactionStatus.FAILED]: 'Failed',
    [TransactionStatus.CANCELLED]: 'Cancelled',
    [TransactionStatus.REJECTED]: 'Rejected',
    [TransactionStatus.REFUNDED]: 'Refunded',
    [TransactionStatus.PROCESSING]: 'Processing',
    [TransactionStatus.VERIFIED]: 'Verified',
    [TransactionStatus.EXPIRED]: 'Expired'
  };
  return displayNames[status];
}

export function getPaymentMethodDisplayName(method: PaymentMethod): string {
  const displayNames: Record<PaymentMethod, string> = {
    [PaymentMethod.GCASH]: 'GCash',
    [PaymentMethod.MAYA]: 'Maya',
    [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
    [PaymentMethod.PAYPAL]: 'PayPal',
    [PaymentMethod.CREDIT_CARD]: 'Credit Card',
    [PaymentMethod.DEBIT_CARD]: 'Debit Card',
    [PaymentMethod.CASH]: 'Cash',
    [PaymentMethod.MANUAL_VERIFICATION]: 'Manual Verification',
    [PaymentMethod.SYSTEM_CREDIT]: 'System Credit',
    [PaymentMethod.LOYALTY_POINTS]: 'Loyalty Points'
  };
  return displayNames[method];
}
