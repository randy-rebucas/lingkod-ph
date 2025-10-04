'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/auth';
import { CateringBooking } from '../types';
import { 
  getClientCateringBookings,
  getProviderCateringBookings,
  updateCateringBookingStatus,
  cancelCateringBooking
} from '../services/catering-booking-service';

export function useCateringBookings() {
  const [bookings, setBookings] = useState<CateringBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        let userBookings: CateringBooking[] = [];
        
        if (userRole === 'client') {
          userBookings = await getClientCateringBookings(user.uid);
        } else if (userRole === 'provider' || userRole === 'agency') {
          userBookings = await getProviderCateringBookings(user.uid);
        }

        setBookings(userBookings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, userRole]);

  const refreshBookings = async () => {
    if (!user) return;

    try {
      setError(null);
      let userBookings: CateringBooking[] = [];
      
      if (userRole === 'client') {
        userBookings = await getClientCateringBookings(user.uid);
      } else if (userRole === 'provider' || userRole === 'agency') {
        userBookings = await getProviderCateringBookings(user.uid);
      }

      setBookings(userBookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh bookings');
    }
  };

  const updateBookingStatus = async (bookingId: string, status: CateringBooking['status']) => {
    try {
      const success = await updateCateringBookingStatus(bookingId, status);
      if (success) {
        await refreshBookings();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking status');
      return false;
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const success = await cancelCateringBooking(bookingId);
      if (success) {
        await refreshBookings();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      return false;
    }
  };

  return {
    bookings,
    loading,
    error,
    refreshBookings,
    updateBookingStatus,
    cancelBooking,
  };
}
