
'use server';

import { getDb, getStorageInstance   } from '@/shared/db';
import { doc, runTransaction, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { z } from 'zod';

const completeBookingSchema = z.object({
  bookingId: z.string(),
  clientId: z.string(),
  jobId: z.string().optional(),
  serviceName: z.string(),
  price: z.number(),
  photoDataUrl: z.string(),
  fileName: z.string(),
});

type CompleteBookingInput = z.infer<typeof completeBookingSchema>;

const createNotification = async (userId: string, message: string, link: string) => {
    try {
        const notificationsRef = collection(getDb(), `users/${userId}/notifications`);
        await addDoc(notificationsRef, {
            userId, message, link,
            type: 'booking_update',
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating notification: ", error);
    }
};

export async function completeBookingAction(input: CompleteBookingInput): Promise<{ error?: string }> {
    const validatedFields = completeBookingSchema.safeParse(input);

    if (!validatedFields.success) {
        return { error: 'Invalid input.' };
    }
    
    const { bookingId, clientId, jobId, serviceName, price, photoDataUrl, fileName } = validatedFields.data;

    try {
        const storagePath = `completion-photos/${bookingId}/${Date.now()}_${fileName}`;
        const storageRef = ref(getStorageInstance(), storagePath);
        
        // Upload the base64 string
        const uploadResult = await uploadString(storageRef, photoDataUrl, 'data_url');
        const completionPhotoURL = await getDownloadURL(uploadResult.ref);
        
        await runTransaction(getDb(), async (transaction) => {
            const bookingRef = doc(getDb(), "bookings", bookingId);
            const clientRef = doc(getDb(), "users", clientId);

            const clientDoc = await transaction.get(clientRef);
            if (!clientDoc.exists()) {
                throw new Error("Client document does not exist!");
            }
            
            transaction.update(bookingRef, { status: "Completed", completionPhotoURL });

            const pointsToAward = Math.floor(price / 10);
            const currentPoints = clientDoc.data().loyaltyPoints || 0;
            const newTotalPoints = currentPoints + pointsToAward;
            transaction.update(clientRef, { loyaltyPoints: newTotalPoints });

            const loyaltyTxRef = doc(collection(getDb(), `users/${clientId}/loyaltyTransactions`));
            transaction.set(loyaltyTxRef, {
                points: pointsToAward, type: 'earn',
                description: `Points for completing service: ${serviceName}`,
                bookingId: bookingId, createdAt: serverTimestamp()
            });
            
            if (jobId) {
                const jobRef = doc(getDb(), "jobs", jobId);
                transaction.update(jobRef, { status: "Completed" });
            }
        });

        await createNotification(clientId, `Your booking for "${serviceName}" has been marked as completed.`, '/bookings');
        
        return {};
    } catch (error: unknown) {
        console.error("Error completing booking:", error);
        return { error: error instanceof Error ? error.message : "Could not complete the booking." };
    }
}
