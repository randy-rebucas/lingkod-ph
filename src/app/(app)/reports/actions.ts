
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
} from 'firebase/firestore';

export async function handleMarkAsPaid(
  payoutId: string,
  providerId: string,
  providerName: string,
  amount: number
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

    return {
      error: null,
      message: `Payout for ${providerName} marked as paid.`,
    };
  } catch (e: any) {
    console.error('Error marking payout as paid: ', e);
    return { error: e.message, message: 'Failed to update payout status.' };
  }
}
