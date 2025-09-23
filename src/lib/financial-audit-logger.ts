'use server';

import { auditLogger } from './audit-logger';

export interface FinancialTransaction {
  id: string;
  type: 'booking_payment' | 'payout_request' | 'payout_processed' | 'refund';
  amount: number;
  currency: string;
  providerId: string;
  clientId?: string;
  bookingId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
}

export class FinancialAuditLogger {
  private static instance: FinancialAuditLogger;

  private constructor() {}

  public static getInstance(): FinancialAuditLogger {
    if (!FinancialAuditLogger.instance) {
      FinancialAuditLogger.instance = new FinancialAuditLogger();
    }
    return FinancialAuditLogger.instance;
  }

  // Add missing logSecurityEvent method for compatibility
  async logSecurityEvent(event: string, details: any = {}) {
    await auditLogger.log({
      userId: details.userId || 'system',
      userRole: details.userRole || 'system',
      action: 'security_event',
      resource: 'financial',
      details: { event, ...details },
      severity: 'high',
      success: true
    });
  }

  async logBookingPayment(transaction: FinancialTransaction, requestMetadata: any) {
    await auditLogger.logAction(
      'booking_payment_received',
      transaction.providerId,
      'bookings',
      {
        userRole: 'provider',
        resourceId: transaction.bookingId || 'unknown',
        ...requestMetadata,
        amount: transaction.amount,
        currency: transaction.currency,
        clientId: transaction.clientId,
        paymentMethod: transaction.paymentMethod,
        transactionId: transaction.transactionId
      }
    );
  }

  async logPayoutRequest(transaction: FinancialTransaction, requestMetadata: any) {
    await auditLogger.logAction(
      'payout_requested',
      transaction.providerId,
      'payouts',
      {
        userRole: 'provider',
        resourceId: transaction.id,
        ...requestMetadata,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod
      }
    );
  }

  async logPayoutProcessed(transaction: FinancialTransaction, requestMetadata: any) {
    await auditLogger.logAction(
      'payout_processed',
      transaction.providerId,
      'payouts',
      {
        userRole: 'provider',
        resourceId: transaction.id,
        ...requestMetadata,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        transactionId: transaction.transactionId
      }
    );
  }


  async logRefund(transaction: FinancialTransaction, requestMetadata: any) {
    await auditLogger.logAction(
      'refund_processed',
      transaction.providerId,
      'refunds',
      {
        userRole: 'provider',
        resourceId: transaction.id,
        ...requestMetadata,
        amount: transaction.amount,
        currency: transaction.currency,
        originalTransactionId: transaction.transactionId,
        reason: transaction.metadata?.reason
      }
    );
  }

  async logSuspiciousActivity(
    providerId: string,
    activity: string,
    details: Record<string, any>,
    requestMetadata: any
  ) {
    await auditLogger.logSecurityEvent(
      providerId,
      'provider',
      `suspicious_${activity}`,
      {
        ...requestMetadata,
        ...details,
        severity: 'high'
      }
    );
  }
}

export const financialAuditLogger = FinancialAuditLogger.getInstance();
