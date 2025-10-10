import { handleUpdateBookingStatus } from '../actions';
import { getDb } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { AuditLogger } from '@/lib/audit-logger';

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock Firebase Firestore
jest.mock('firebase/firestore');
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;

// Mock AuditLogger
jest.mock('@/lib/audit-logger');
const mockAuditLogger = AuditLogger as jest.Mocked<typeof AuditLogger>;

describe('Admin Bookings Actions', () => {
  const mockActor = {
    id: 'admin-user-id',
    name: 'Admin User',
  };

  const mockDb = {
    doc: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGetDb.mockReturnValue(mockDb as any);
    
    mockAuditLogger.getInstance.mockReturnValue({
      logAction: jest.fn(),
    } as any);
  });

  describe('handleUpdateBookingStatus', () => {
    it('updates booking status successfully', async () => {
      const result = await handleUpdateBookingStatus('booking-123', 'Completed', mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('Booking status updated to Completed.');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        { status: 'Completed' }
      );
    });

    it('logs audit action when updating booking status', async () => {
      await handleUpdateBookingStatus('booking-123', 'Cancelled', mockActor);

      expect(mockAuditLogger.getInstance().logAction).toHaveBeenCalledWith(
        'admin-user-id',
        'bookings',
        'BOOKING_STATUS_UPDATED',
        {
          bookingId: 'booking-123',
          newStatus: 'Cancelled',
          actorRole: 'admin',
        }
      );
    });

    it('handles different status values', async () => {
      const statuses = ['Pending', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'];

      for (const status of statuses) {
        const result = await handleUpdateBookingStatus('booking-123', status, mockActor);

        expect(result.error).toBeNull();
        expect(result.message).toBe(`Booking status updated to ${status}.`);
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.any(Object),
          { status }
        );
      }
    });

    it('handles update errors gracefully', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Database error'));

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', mockActor);

      expect(result.error).toBe('Database error');
      expect(result.message).toBe('Failed to update booking status.');
    });

    it('handles missing booking ID', async () => {
      const result = await handleUpdateBookingStatus('', 'Completed', mockActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to update booking status.');
    });

    it('handles missing status', async () => {
      const result = await handleUpdateBookingStatus('booking-123', '', mockActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to update booking status.');
    });

    it('handles null actor data', async () => {
      const nullActor = {
        id: null as any,
        name: null,
      };

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', nullActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to update booking status.');
    });

    it('handles undefined actor data', async () => {
      const undefinedActor = {
        id: 'test-id',
        name: null,
      };

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', undefinedActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to update booking status.');
    });
  });

  describe('Database Integration', () => {
    it('uses correct document reference for updates', async () => {
      await handleUpdateBookingStatus('booking-123', 'Completed', mockActor);

      expect(mockDb.doc).toHaveBeenCalledWith('bookings', 'booking-123');
    });

    it('handles database connection errors', async () => {
      mockGetDb.mockReturnValue(null as any);

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', mockActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to update booking status.');
    });

    it('handles invalid document reference', async () => {
      mockDb.doc.mockReturnValue(null as any);

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', mockActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to update booking status.');
    });
  });

  describe('Audit Logging', () => {
    it('logs correct audit information', async () => {
      await handleUpdateBookingStatus('booking-123', 'Completed', mockActor);

      expect(mockAuditLogger.getInstance().logAction).toHaveBeenCalledWith(
        'admin-user-id',
        'bookings',
        'BOOKING_STATUS_UPDATED',
        {
          bookingId: 'booking-123',
          newStatus: 'Completed',
          actorRole: 'admin',
        }
      );
    });

    it('handles audit logging errors gracefully', async () => {
      (mockAuditLogger.getInstance().logAction as jest.Mock).mockRejectedValue(new Error('Audit error'));

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', mockActor);

      // Should still succeed even if audit logging fails
      expect(result.error).toBeNull();
      expect(result.message).toBe('Booking status updated to Completed.');
    });

    it('handles missing audit logger instance', async () => {
      mockAuditLogger.getInstance.mockReturnValue(null as any);

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', mockActor);

      // Should still succeed even if audit logger is not available
      expect(result.error).toBeNull();
      expect(result.message).toBe('Booking status updated to Completed.');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long booking IDs', async () => {
      const longBookingId = 'a'.repeat(1000);

      const result = await handleUpdateBookingStatus(longBookingId, 'Completed', mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('Booking status updated to Completed.');
    });

    it('handles special characters in booking ID', async () => {
      const specialBookingId = 'booking-123!@#$%^&*()';

      const result = await handleUpdateBookingStatus(specialBookingId, 'Completed', mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('Booking status updated to Completed.');
    });

    it('handles special characters in status', async () => {
      const specialStatus = 'Status with émojis 🎉 and unicode 中文';

      const result = await handleUpdateBookingStatus('booking-123', specialStatus, mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe(`Booking status updated to ${specialStatus}.`);
    });

    it('handles concurrent status updates', async () => {
      const promise1 = handleUpdateBookingStatus('booking-123', 'Completed', mockActor);
      const promise2 = handleUpdateBookingStatus('booking-123', 'Cancelled', mockActor);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.error).toBeNull();
      expect(result2.error).toBeNull();
      expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    });

    it('handles very long actor names', async () => {
      const longNameActor = {
        id: 'admin-user-id',
        name: 'A'.repeat(1000),
      };

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', longNameActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('Booking status updated to Completed.');
    });

    it('handles null actor name', async () => {
      const nullNameActor = {
        id: 'admin-user-id',
        name: null,
      };

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', nullNameActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('Booking status updated to Completed.');
    });
  });

  describe('Status Validation', () => {
    it('handles valid status values', async () => {
      const validStatuses = [
        'Pending',
        'Upcoming',
        'In Progress',
        'Completed',
        'Cancelled',
        'Pending Payment',
        'Confirmed',
      ];

      for (const status of validStatuses) {
        const result = await handleUpdateBookingStatus('booking-123', status, mockActor);

        expect(result.error).toBeNull();
        expect(result.message).toBe(`Booking status updated to ${status}.`);
      }
    });

    it('handles invalid status values', async () => {
      const invalidStatuses = [
        'InvalidStatus',
        'random',
        '123',
        'status with spaces',
        'STATUS_IN_UPPERCASE',
      ];

      for (const status of invalidStatuses) {
        const result = await handleUpdateBookingStatus('booking-123', status, mockActor);

        // Should still succeed as we don't validate status values
        expect(result.error).toBeNull();
        expect(result.message).toBe(`Booking status updated to ${status}.`);
      }
    });

    it('handles empty status', async () => {
      const result = await handleUpdateBookingStatus('booking-123', '', mockActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to update booking status.');
    });

    it('handles null status', async () => {
      const result = await handleUpdateBookingStatus('booking-123', null as any, mockActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to update booking status.');
    });

    it('handles undefined status', async () => {
      const result = await handleUpdateBookingStatus('booking-123', undefined as any, mockActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to update booking status.');
    });
  });

  describe('Error Scenarios', () => {
    it('handles network errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Network error'));

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', mockActor);

      expect(result.error).toBe('Network error');
      expect(result.message).toBe('Failed to update booking status.');
    });

    it('handles permission errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Permission denied'));

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', mockActor);

      expect(result.error).toBe('Permission denied');
      expect(result.message).toBe('Failed to update booking status.');
    });

    it('handles document not found errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Document not found'));

      const result = await handleUpdateBookingStatus('non-existent-booking', 'Completed', mockActor);

      expect(result.error).toBe('Document not found');
      expect(result.message).toBe('Failed to update booking status.');
    });

    it('handles unknown errors', async () => {
      mockUpdateDoc.mockRejectedValue('Unknown error');

      const result = await handleUpdateBookingStatus('booking-123', 'Completed', mockActor);

      expect(result.error).toBe('Unknown error');
      expect(result.message).toBe('Failed to update booking status.');
    });
  });
});
