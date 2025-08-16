
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { logAdminAction } from '@/lib/audit-logger';
import { auth } from '@/lib/firebase';

async function getActor() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    return {
        id: currentUser.uid,
        name: currentUser.displayName,
        role: 'admin'
    };
}

export async function sendBroadcastAction(message: string): Promise<{ error: string | null; message: string }> {
    if (message.trim().length < 10) {
        return { error: "Broadcast message must be at least 10 characters.", message: "Message too short" };
    }

    try {
        const actor = await getActor();
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
            actor,
            action: 'BROADCAST_SENT',
            details: { message }
        });

        return { error: null, message: "Your message is now active for all users." };

    } catch (error) {
        console.error("Error sending broadcast:", error);
        return { error: "Failed to send broadcast.", message: "An internal error occurred." };
    }
}
