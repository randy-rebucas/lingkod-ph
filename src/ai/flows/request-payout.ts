
'use server';

/**
 * @fileOverview This file defines the Genkit flow for handling provider payout requests.
 *
 * - handleRequestPayout: Processes a payout request, creating a record in the 'payouts' collection
 *   and notifying the relevant party (agency or admin).
 * - RequestPayoutInput: The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Resend } from 'resend';
import PayoutRequestEmail from '@/emails/payout-request-email';

const RequestPayoutInputSchema = z.object({
  providerId: z.string().describe('The ID of the provider requesting the payout.'),
  amount: z.number().positive().describe('The total amount requested for payout.'),
});
export type RequestPayoutInput = z.infer<typeof RequestPayoutInputSchema>;

export async function handleRequestPayout(input: RequestPayoutInput): Promise<void> {
  return requestPayoutFlow(input);
}

const requestPayoutFlow = ai.defineFlow(
  {
    name: 'requestPayoutFlow',
    inputSchema: RequestPayoutInputSchema,
    outputSchema: z.void(),
  },
  async ({ providerId, amount }) => {
    const providerRef = doc(db, 'users', providerId);
    const providerDoc = await getDoc(providerRef);

    if (!providerDoc.exists()) {
      throw new Error('Provider not found.');
    }

    const providerData = providerDoc.data();
    const payoutDetails = providerData.payoutDetails;

    if (!payoutDetails || !payoutDetails.method) {
        throw new Error('Provider has not configured their payout details.');
    }
    
    const transactionId = `PAYOUT-${Date.now()}-${providerId.slice(-6)}`;

    const payoutData = {
        transactionId,
        providerId,
        providerName: providerData.displayName,
        agencyId: providerData.agencyId || null,
        amount,
        payoutDetails,
        status: 'Pending',
        requestedAt: serverTimestamp(),
        processedAt: null,
    };
    
    // Create a record in the main payouts collection
    await addDoc(collection(db, 'payouts'), payoutData);


    if (providerData.agencyId) {
      // Notify the agency
      const agencyNotifRef = collection(db, `users/${providerData.agencyId}/notifications`);
      await addDoc(agencyNotifRef, {
        type: 'info',
        message: `${providerData.displayName} has requested a payout of ₱${amount.toFixed(2)}.`,
        link: '/reports',
        read: false,
        createdAt: serverTimestamp(),
      });
    } else {
      // Email the admin
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Payouts <onboarding@resend.dev>',
        to: 'admin@localpro.asia',
        subject: `New Payout Request from ${providerData.displayName}`,
        react: PayoutRequestEmail({
            providerName: providerData.displayName,
            amount,
            payoutDetails,
        }),
      });
    }
  }
);

    
