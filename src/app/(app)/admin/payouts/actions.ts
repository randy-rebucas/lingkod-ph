
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
} from 'firebase/firestore';
import { AuditLogger } from '@/lib/audit-logger';
import { TransactionService } from '@/lib/transaction-service';
import { TransactionAction, TransactionStatus } from '@/lib/transaction-types';

type Actor = {
    id: string;
    name: string | null;
}

export async function handleMarkAsPaid(
  payoutId: string,
  providerId: string,
  providerName: string,
  amount: number,
  actor: Actor
) {
  try {
    const payoutRef = doc(db, 'payouts', payoutId);
    await updateDoc(payoutRef, {
      status: 'Paid',
      processedAt: serverTimestamp(),
    });

    // Notify the provider that their payment has been received
    const notifRef = collection(db, `users/${providerId}/notifications`);
    await addDoc(notifRef, {
      type: 'info',
      message: `Your payout of ₱${amount.toFixed(2)} has been processed and sent.`,
      link: '/earnings',
      read: false,
      createdAt: serverTimestamp(),
    });
    
    await AuditLogger.getInstance().logAction(
        'PAYOUT_PROCESSED',
        actor.id,
        'payouts',
        { payoutId, providerId, providerName, amount, actorRole: 'admin' }
    );

    // Create payout completion transaction
    await TransactionService.createPayoutTransaction(
      {
        payoutId: payoutId,
        providerId: providerId,
        amount: amount,
        payoutDetails: {
          method: 'bank_transfer' // Default, should be updated with actual details
        },
        metadata: {
          processedBy: actor.id,
          processedByName: actor.name,
          processedAt: new Date().toISOString()
        }
      },
      TransactionAction.PAYOUT_COMPLETION,
      TransactionStatus.COMPLETED
    );

    return {
      error: null,
      message: `Payout for ${providerName} marked as paid.`,
    };
  } catch (e: any) {
    console.error('Error marking payout as paid: ', e);
    return { error: e.message, message: 'Failed to update payout status.' };
  }
}
