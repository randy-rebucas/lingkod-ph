
'use server';

import { getDb  } from '@/shared/db';
import { doc, writeBatch, serverTimestamp, getDoc, collection } from "firebase/firestore";
import { z } from "zod";

const InviteActionSchema = z.object({
  inviteId: z.string(),
  accepted: z.boolean(),
});

interface ActionState {
    error: string | null;
    message: string;
}

export async function handleInviteAction(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const validatedFields = InviteActionSchema.safeParse({
        inviteId: formData.get("inviteId"),
        accepted: formData.get("accepted") === 'true',
    });

    if (!validatedFields.success) {
        return { error: "Invalid data provided.", message: "Validation failed." };
    }
    
    const { inviteId, accepted } = validatedFields.data;
    const batch = writeBatch(getDb());
    const inviteRef = doc(getDb(), 'invites', inviteId);

    try {
        const inviteDoc = await getDoc(inviteRef);
        if (!inviteDoc.exists()) {
            throw new Error("Invitation not found or has been revoked.");
        }

        const inviteData = inviteDoc.data();
        const providerRef = doc(getDb(), 'users', inviteData.providerId);

        if (accepted) {
            batch.update(providerRef, { agencyId: inviteData.agencyId });
            batch.update(inviteRef, { status: 'accepted' });

            const agencyNotificationRef = doc(collection(getDb(), `users/${inviteData.agencyId}/notifications`));
            const providerDoc = await getDoc(providerRef);
            batch.set(agencyNotificationRef, {
                type: 'info',
                message: `${providerDoc.data()?.displayName} has accepted your agency invitation.`,
                link: '/manage-providers',
                read: false,
                createdAt: serverTimestamp(),
            });

        } else {
            batch.update(inviteRef, { status: 'declined' });
             const agencyNotificationRef = doc(collection(getDb(), `users/${inviteData.agencyId}/notifications`));
            const providerDoc = await getDoc(providerRef);
            batch.set(agencyNotificationRef, {
                type: 'info',
                message: `${providerDoc.data()?.displayName} has declined your agency invitation.`,
                link: '/manage-providers',
                read: false,
                createdAt: serverTimestamp(),
            });
        }
        
        await batch.commit();
        
        return { error: null, message: `Invitation successfully ${accepted ? 'accepted' : 'declined'}.` };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: errorMessage, message: "Action failed." };
    }
}
