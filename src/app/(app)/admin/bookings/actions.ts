
'use server';

import { getDb  } from '@/lib/firebase';
import {
  doc,
  updateDoc,
} from 'firebase/firestore';
import { AuditLogger } from '@/lib/audit-logger';

type Actor = {
    id: string;
    name: string | null;
}

export async function handleUpdateBookingStatus(
  bookingId: string,
  status: string,
  actor: Actor,
) {
  try {
    // Validate input parameters
    if (!bookingId || !status || !actor?.id) {
      return { 
        error: 'Missing required parameters', 
        message: 'Failed to update booking status.' 
      };
    }

    const bookingRef = doc(getDb(), 'bookings', bookingId);
    await updateDoc(bookingRef, { status });

    // Try to log audit action, but don't fail if it doesn't work
    try {
      await AuditLogger.getInstance().logAction(
          actor.id,
          'bookings',
          'BOOKING_STATUS_UPDATED',
          { bookingId, newStatus: status, actorRole: 'admin' }
      );
    } catch (auditError) {
      console.warn('Failed to log audit action:', auditError);
      // Continue execution even if audit logging fails
    }

    return {
      error: null,
      message: `Booking status updated to ${status}.`,
    };
  } catch (e: any) {
    console.error('Error updating booking status: ', e);
    return { error: e.message, message: 'Failed to update booking status.' };
  }
}
