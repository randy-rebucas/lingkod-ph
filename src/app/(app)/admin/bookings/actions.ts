
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
} from 'firebase/firestore';
import { logAdminAction } from '@/lib/audit-logger';

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
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { status });

    await logAdminAction({
        actor: { ...actor, role: 'admin' },
        action: 'BOOKING_STATUS_UPDATED',
        details: { bookingId, newStatus: status }
    });

    return {
      error: null,
      message: `Booking status updated to ${status}.`,
    };
  } catch (e: any) {
    console.error('Error updating booking status: ', e);
    return { error: e.message, message: 'Failed to update booking status.' };
  }
}
