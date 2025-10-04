
'use server';

import { getDb  } from '@/shared/db';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { AuditLogger } from '@/lib/audit-logger';

type Actor = {
    id: string;
    name: string | null;
}

export async function handleUpdateTicketStatus(
    ticketId: string,
    status: 'New' | 'In Progress' | 'Closed',
    actor: Actor
) {
    try {
        const ticketRef = doc(getDb(), 'tickets', ticketId);
        await updateDoc(ticketRef, { 
            status,
            updatedAt: serverTimestamp() 
        });

        await AuditLogger.getInstance().logAction(
            actor.id,
            'tickets',
            'TICKET_STATUS_UPDATED',
            { ticketId, newStatus: status, actorRole: 'admin' }
        );

        return { error: null, message: `Ticket status updated to "${status}".` };
    } catch (e: any) {
        console.error('Error updating ticket status: ', e);
        return { error: e.message, message: 'Failed to update ticket status.' };
    }
}


export async function handleAddTicketNote(
    ticketId: string,
    note: string,
    actor: Actor
) {
     if (!note.trim()) {
        return { error: 'Note cannot be empty.', message: 'Validation failed.' };
    }
    try {
        const ticketRef = doc(getDb(), 'tickets', ticketId);
        await updateDoc(ticketRef, {
            notes: arrayUnion({
                text: note,
                authorId: actor.id,
                authorName: actor.name,
                createdAt: serverTimestamp(),
            }),
            updatedAt: serverTimestamp()
        });

         await AuditLogger.getInstance().logAction(
            actor.id,
            'tickets',
            'TICKET_NOTE_ADDED',
            { ticketId, actorRole: 'admin' }
        );

        return { error: null, message: 'Note added successfully.' };
    } catch (e: any) {
        console.error('Error adding note to ticket: ', e);
        return { error: e.message, message: 'Failed to add note.' };
    }
}
