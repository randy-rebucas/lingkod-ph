/**
 * Transaction Migration Script
 * 
 * This script migrates existing transactions from the old format to the new
 * transaction type system. It should be run once to update all existing
 * transaction records.
 */

import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { TransactionService } from '@/lib/transaction-service';
import { 
  TransactionEntity, 
  TransactionAction, 
  TransactionStatus, 
  PaymentMethod 
} from '@/lib/transaction-types';

interface LegacyTransaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  paymentMethod: string;
  userId?: string;
  clientId?: string;
  providerId?: string;
  bookingId?: string;
  subscriptionId?: string;
  payoutId?: string;
  createdAt: any;
  verifiedAt?: any;
  verifiedBy?: string;
  rejectedAt?: any;
  rejectedBy?: string;
  rejectionReason?: string;
  paypalOrderId?: string;
  payerEmail?: string;
  referenceNumber?: string;
  planName?: string;
  planType?: string;
  [key: string]: any;
}

export class TransactionMigrator {
  private static readonly BATCH_SIZE = 100;
  private static readonly COLLECTION_NAME = 'transactions';

  /**
   * Migrate all transactions from legacy format to new format
   */
  static async migrateAllTransactions(): Promise<{
    total: number;
    migrated: number;
    errors: string[];
  }> {
    console.log('Starting transaction migration...');
    
    const errors: string[] = [];
    let total = 0;
    let migrated = 0;

    try {
      // Get all transactions
      const transactionsQuery = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(transactionsQuery);
      total = snapshot.size;
      
      console.log(`Found ${total} transactions to migrate`);

      // Process in batches
      const batches = [];
      const docs = snapshot.docs;
      
      for (let i = 0; i < docs.length; i += this.BATCH_SIZE) {
        const batch = docs.slice(i, i + this.BATCH_SIZE);
        batches.push(batch);
      }

      for (const batch of batches) {
        const batchResult = await this.migrateBatch(batch);
        migrated += batchResult.migrated;
        errors.push(...batchResult.errors);
        
        console.log(`Processed batch: ${batchResult.migrated}/${batch.length} migrated`);
      }

      console.log(`Migration completed: ${migrated}/${total} transactions migrated`);
      if (errors.length > 0) {
        console.log(`Errors encountered: ${errors.length}`);
        console.log('Errors:', errors);
      }

      return { total, migrated, errors };
    } catch (error) {
      console.error('Migration failed:', error);
      return { total, migrated, errors: [...errors, `Migration failed: ${error}`] };
    }
  }

  /**
   * Migrate a batch of transactions
   */
  private static async migrateBatch(docs: any[]): Promise<{
    migrated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let migrated = 0;

    const batch = writeBatch(db);

    for (const docSnapshot of docs) {
      try {
        const transaction = { id: docSnapshot.id, ...docSnapshot.data() } as LegacyTransaction;
        
        // Skip if already migrated
        if (transaction.entity && transaction.action) {
          console.log(`Transaction ${transaction.id} already migrated, skipping`);
          continue;
        }

        const migrationResult = this.migrateTransaction(transaction);
        if (migrationResult.success) {
          const transactionRef = doc(db, this.COLLECTION_NAME, transaction.id);
          batch.update(transactionRef, {
            ...migrationResult.data,
            migratedAt: serverTimestamp(),
            migrationVersion: '1.0'
          });
          migrated++;
        } else {
          errors.push(`Transaction ${transaction.id}: ${migrationResult.error}`);
        }
      } catch (error) {
        errors.push(`Transaction ${docSnapshot.id}: ${error}`);
      }
    }

    if (migrated > 0) {
      try {
        await batch.commit();
      } catch (error) {
        errors.push(`Batch commit failed: ${error}`);
      }
    }

    return { migrated, errors };
  }

  /**
   * Migrate a single transaction
   */
  private static migrateTransaction(transaction: LegacyTransaction): {
    success: boolean;
    data?: any;
    error?: string;
  } {
    try {
      // Determine entity and action based on legacy type
      let entity: TransactionEntity;
      let action: TransactionAction;

      switch (transaction.type) {
        case 'booking_payment':
          entity = TransactionEntity.BOOKING;
          action = this.getBookingAction(transaction.status);
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
          return { 
            success: false, 
            error: `Unknown transaction type: ${transaction.type}` 
          };
      }

      // Map legacy status to new status
      const status = this.mapLegacyStatus(transaction.status);

      // Map legacy payment method to new payment method
      const paymentMethod = this.mapLegacyPaymentMethod(transaction.paymentMethod);

      // Create new transaction data
      const newTransactionData = {
        entity,
        action,
        status,
        amount: transaction.amount || 0,
        currency: 'PHP',
        paymentMethod,
        userId: transaction.userId || transaction.clientId,
        clientId: transaction.clientId,
        providerId: transaction.providerId,
        bookingId: transaction.bookingId,
        subscriptionId: transaction.subscriptionId,
        payoutId: transaction.payoutId,
        referenceNumber: transaction.referenceNumber,
        paypalOrderId: transaction.paypalOrderId,
        payerEmail: transaction.payerEmail,
        verifiedBy: transaction.verifiedBy,
        verifiedAt: transaction.verifiedAt,
        rejectedBy: transaction.rejectedBy,
        rejectedAt: transaction.rejectedAt,
        rejectionReason: transaction.rejectionReason,
        planName: transaction.planName,
        planType: transaction.planType,
        metadata: {
          migrated: true,
          originalType: transaction.type,
          migrationDate: new Date().toISOString(),
          // Preserve any additional fields in metadata
          ...Object.fromEntries(
            Object.entries(transaction).filter(([key, value]) => 
              !['id', 'type', 'status', 'amount', 'paymentMethod', 'userId', 'clientId', 
                'providerId', 'bookingId', 'subscriptionId', 'payoutId', 'referenceNumber',
                'paypalOrderId', 'payerEmail', 'verifiedBy', 'verifiedAt', 'rejectedBy',
                'rejectedAt', 'rejectionReason', 'planName', 'planType', 'createdAt'].includes(key)
            )
          )
        }
      };

      return { success: true, data: newTransactionData };
    } catch (error) {
      return { 
        success: false, 
        error: `Migration failed: ${error}` 
      };
    }
  }

  /**
   * Get booking action based on status
   */
  private static getBookingAction(status: string): TransactionAction {
    switch (status) {
      case 'completed':
        return TransactionAction.PAYMENT_VERIFICATION;
      case 'rejected':
        return TransactionAction.PAYMENT_REJECTION;
      default:
        return TransactionAction.PAYMENT;
    }
  }

  /**
   * Map legacy status to new status
   */
  private static mapLegacyStatus(status: string): TransactionStatus {
    switch (status) {
      case 'completed':
        return TransactionStatus.COMPLETED;
      case 'pending':
        return TransactionStatus.PENDING;
      case 'failed':
        return TransactionStatus.FAILED;
      case 'cancelled':
        return TransactionStatus.CANCELLED;
      case 'rejected':
        return TransactionStatus.REJECTED;
      case 'refunded':
        return TransactionStatus.REFUNDED;
      default:
        return TransactionStatus.PENDING;
    }
  }

  /**
   * Map legacy payment method to new payment method
   */
  private static mapLegacyPaymentMethod(method: string): PaymentMethod {
    switch (method) {
      case 'gcash':
        return PaymentMethod.GCASH;
      case 'maya':
        return PaymentMethod.MAYA;
      case 'bank':
        return PaymentMethod.BANK_TRANSFER;
      case 'paypal':
        return PaymentMethod.PAYPAL;
      case 'manual_verification':
        return PaymentMethod.MANUAL_VERIFICATION;
      default:
        return PaymentMethod.MANUAL_VERIFICATION;
    }
  }

  /**
   * Validate migration results
   */
  static async validateMigration(): Promise<{
    total: number;
    migrated: number;
    legacy: number;
    errors: string[];
  }> {
    console.log('Validating migration...');
    
    const errors: string[] = [];
    let total = 0;
    let migrated = 0;
    let legacy = 0;

    try {
      const transactionsQuery = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(transactionsQuery);
      total = snapshot.size;

      for (const docSnapshot of snapshot.docs) {
        const transaction = docSnapshot.data();
        
        if (transaction.entity && transaction.action) {
          migrated++;
        } else if (transaction.type) {
          legacy++;
        } else {
          errors.push(`Transaction ${docSnapshot.id} has no type information`);
        }
      }

      console.log(`Validation completed:`);
      console.log(`- Total transactions: ${total}`);
      console.log(`- Migrated: ${migrated}`);
      console.log(`- Legacy: ${legacy}`);
      console.log(`- Errors: ${errors.length}`);

      return { total, migrated, legacy, errors };
    } catch (error) {
      console.error('Validation failed:', error);
      return { total, migrated, legacy, errors: [`Validation failed: ${error}`] };
    }
  }

  /**
   * Rollback migration (restore legacy format)
   */
  static async rollbackMigration(): Promise<{
    total: number;
    rolledBack: number;
    errors: string[];
  }> {
    console.log('Rolling back migration...');
    
    const errors: string[] = [];
    let total = 0;
    let rolledBack = 0;

    try {
      const transactionsQuery = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(transactionsQuery);
      total = snapshot.size;

      const batch = writeBatch(db);

      for (const docSnapshot of snapshot.docs) {
        const transaction = docSnapshot.data();
        
        if (transaction.migrated && transaction.originalType) {
          try {
            const transactionRef = doc(db, this.COLLECTION_NAME, docSnapshot.id);
            
            // Remove new fields and restore legacy fields
            const rollbackData = {
              type: transaction.originalType,
              status: transaction.status,
              amount: transaction.amount,
              paymentMethod: transaction.paymentMethod,
              userId: transaction.userId,
              clientId: transaction.clientId,
              providerId: transaction.providerId,
              bookingId: transaction.bookingId,
              subscriptionId: transaction.subscriptionId,
              payoutId: transaction.payoutId,
              referenceNumber: transaction.referenceNumber,
              paypalOrderId: transaction.paypalOrderId,
              payerEmail: transaction.payerEmail,
              verifiedBy: transaction.verifiedBy,
              verifiedAt: transaction.verifiedAt,
              rejectedBy: transaction.rejectedBy,
              rejectedAt: transaction.rejectedAt,
              rejectionReason: transaction.rejectionReason,
              planName: transaction.planName,
              planType: transaction.planType,
              rolledBackAt: serverTimestamp()
            };

            // Remove new fields
            const fieldsToRemove = [
              'entity', 'action', 'currency', 'metadata', 'migrated', 
              'originalType', 'migrationDate', 'migrationVersion'
            ];

            fieldsToRemove.forEach(field => {
              batch.update(transactionRef, { [field]: null });
            });

            // Update with legacy data
            batch.update(transactionRef, rollbackData);
            rolledBack++;
          } catch (error) {
            errors.push(`Transaction ${docSnapshot.id}: ${error}`);
          }
        }
      }

      if (rolledBack > 0) {
        await batch.commit();
      }

      console.log(`Rollback completed: ${rolledBack}/${total} transactions rolled back`);
      return { total, rolledBack, errors };
    } catch (error) {
      console.error('Rollback failed:', error);
      return { total, rolledBack, errors: [...errors, `Rollback failed: ${error}`] };
    }
  }
}

// CLI interface for running migrations
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      TransactionMigrator.migrateAllTransactions()
        .then(result => {
          console.log('Migration result:', result);
          process.exit(0);
        })
        .catch(error => {
          console.error('Migration error:', error);
          process.exit(1);
        });
      break;
      
    case 'validate':
      TransactionMigrator.validateMigration()
        .then(result => {
          console.log('Validation result:', result);
          process.exit(0);
        })
        .catch(error => {
          console.error('Validation error:', error);
          process.exit(1);
        });
      break;
      
    case 'rollback':
      TransactionMigrator.rollbackMigration()
        .then(result => {
          console.log('Rollback result:', result);
          process.exit(0);
        })
        .catch(error => {
          console.error('Rollback error:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log('Usage: node migrate-transactions.js [migrate|validate|rollback]');
      process.exit(1);
  }
}
