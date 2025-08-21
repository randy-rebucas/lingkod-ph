
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, query, where, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
import { logAdminAction } from '@/lib/audit-logger';
import { z } from 'zod';
import { Resend } from 'resend';
import CampaignEmail from '@/emails/campaign-email';

type Actor = {
    id: string;
    name: string | null;
}

export async function sendBroadcastAction(message: string, actor: Actor): Promise<{ error: string | null; message: string }> {
    if (message.trim().length < 10) {
        return { error: "Broadcast message must be at least 10 characters.", message: "Message too short" };
    }

    try {
        const batch = writeBatch(db);
        const broadcastsRef = collection(db, "broadcasts");

        // 1. Deactivate all existing active broadcasts
        const q = query(broadcastsRef, where("status", "==", "active"));
        const activeBroadcasts = await getDocs(q);
        activeBroadcasts.forEach(doc => {
            batch.update(doc.ref, { status: "inactive" });
        });

        // 2. Add the new broadcast as active
        const newBroadcastRef = doc(collection(db, "broadcasts"));
        batch.set(newBroadcastRef, {
            message,
            status: 'active',
            createdAt: serverTimestamp()
        });

        await batch.commit();

        await logAdminAction({
            actor: { ...actor, role: 'admin' },
            action: 'BROADCAST_SENT',
            details: { message }
        });

        return { error: null, message: "Your message is now active for all users." };

    } catch (error) {
        console.error("Error sending broadcast:", error);
        return { error: "Failed to send broadcast.", message: "An internal error occurred." };
    }
}


const campaignEmailSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  message: z.string().min(20, "Message must be at least 20 characters."),
});

export async function sendCampaignEmailAction(data: z.infer<typeof campaignEmailSchema>, actor: Actor): Promise<{ error: string | null, message: string }> {
     const validatedFields = campaignEmailSchema.safeParse(data);
    if (!validatedFields.success) {
        return { error: validatedFields.error.errors.map(e => e.message).join(', '), message: "Validation failed." };
    }

    const { subject, message } = validatedFields.data;

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const providersQuery = query(collection(db, "users"), where("role", "==", "provider"));
        const providersSnapshot = await getDocs(providersQuery);

        if (providersSnapshot.empty) {
            return { error: "No providers found to send email to.", message: "There are no providers to email." };
        }

        const BATCH_SIZE = 50; // Resend has a limit of 50 recipients per call
        const providerEmails = providersSnapshot.docs.map(doc => ({
            email: doc.data().email,
            name: doc.data().displayName,
        }));
        
        let sentCount = 0;
        for (let i = 0; i < providerEmails.length; i += BATCH_SIZE) {
            const batchEmails = providerEmails.slice(i, i + BATCH_SIZE);
            await resend.emails.send({
                from: 'LocalPro Team <onboarding@resend.dev>',
                to: 'delivered@resend.dev', // Required, but BCC is used for the actual list
                bcc: batchEmails.map(p => p.email),
                subject: subject,
                react: CampaignEmail({ subject, message, providerName: "Valued Provider" }), // Generic name for batch email
            });
            sentCount += batchEmails.length;
        }

        await logAdminAction({
            actor,
            action: 'BROADCAST_SENT', // Reusing action type, could be more specific
            details: { type: 'email_campaign', subject, providersCount: sentCount }
        });

        return { error: null, message: `Email campaign sent to ${sentCount} providers.` };

    } catch (error) {
        console.error("Error sending campaign email:", error);
        return { error: "Failed to send email campaign.", message: "An internal error occurred." };
    }
}
