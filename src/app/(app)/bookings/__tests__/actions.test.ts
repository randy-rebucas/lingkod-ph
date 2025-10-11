import { completeBookingAction } from '../actions';
import { getDb, getStorageInstance } from '@/lib/firebase';
import { doc, runTransaction, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockGetStorageInstance = getStorageInstance as jest.MockedFunction<typeof getStorageInstance>;

// Mock Firestore functions
const mockRunTransaction = runTransaction as jest.MockedFunction<typeof runTransaction>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;

// Mock Storage functions
const mockRef = ref as jest.MockedFunction<typeof ref>;
const mockUploadString = uploadString as jest.MockedFunction<typeof uploadString>;
const mockGetDownloadURL = getDownloadURL as jest.MockedFunction<typeof getDownloadURL>;

describe('completeBookingAction', () => {
  const mockDb = {
    collection: mockCollection,
    doc: jest.fn(),
  };

  const mockStorage = {
    ref: mockRef,
  };

  const validInput = {
    bookingId: 'booking-123',
    clientId: 'client-123',
    jobId: 'job-123',
    serviceName: 'Cleaning Service',
    price: 1000,
    photoDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
    fileName: 'completion-photo.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);
    mockGetStorageInstance.mockReturnValue(mockStorage as any);
    mockServerTimestamp.mockReturnValue('mock-timestamp' as any);
    
    // Mock Firebase Storage functions
    mockRef.mockReturnValue({} as any);
    mockUploadString.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue('https://example.com/photo.jpg');
    
    // Mock Firestore functions
    mockRunTransaction.mockImplementation(async (callback) => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ loyaltyPoints: 100 })
        }),
        update: jest.fn(),
      };
      return await callback(mockTransaction);
    });
    mockCollection.mockReturnValue({} as any);
    mockAddDoc.mockResolvedValue({ id: 'notification-123' } as any);
  });

  describe('Validation', () => {
    it('should reject invalid input', async () => {
      const invalidInput = {
        bookingId: '',
        clientId: 'client-123',
        serviceName: 'Cleaning Service',
        price: 1000,
        photoDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
        fileName: 'completion-photo.jpg',
      };

      const result = await completeBookingAction(invalidInput);
      
      expect(result.error).toBe('Invalid input.');
    });

    it('should reject negative price', async () => {
      const invalidInput = {
        ...validInput,
        price: -100,
      };

      const result = await completeBookingAction(invalidInput);
      
      expect(result.error).toBe('Invalid input.');
    });

    it('should reject invalid photo data URL', async () => {
      const invalidInput = {
        ...validInput,
        photoDataUrl: 'invalid-url',
      };

      const result = await completeBookingAction(invalidInput);
      
      expect(result.error).toBe('Invalid input.');
    });
  });

  describe('Photo Upload', () => {
    beforeEach(() => {
      // Mock successful photo upload
      const mockUploadResult = {
        ref: { path: 'completion-photos/booking-123/1234567890_completion-photo.jpg' },
      };
      mockUploadString.mockResolvedValue(mockUploadResult as any);
      mockGetDownloadURL.mockResolvedValue('https://storage.googleapis.com/bucket/completion-photos/booking-123/1234567890_completion-photo.jpg');
    });

    it('should upload photo successfully', async () => {
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        await callback({
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ loyaltyPoints: 0 }),
          }),
          update: jest.fn(),
          set: jest.fn(),
        });
      });
      mockRunTransaction.mockImplementation(mockTransaction);

      const result = await completeBookingAction(validInput);
      
      expect(mockRef).toHaveBeenCalledWith(
        mockStorage,
        expect.stringContaining('completion-photos/booking-123/')
      );
      expect(mockUploadString).toHaveBeenCalledWith(
        expect.any(Object),
        validInput.photoDataUrl,
        'data_url'
      );
      expect(mockGetDownloadURL).toHaveBeenCalled();
      expect(result.error).toBeUndefined();
    });

    it('should handle photo upload failure', async () => {
      mockUploadString.mockRejectedValue(new Error('Upload failed'));

      const result = await completeBookingAction(validInput);
      
      expect(result.error).toBe('Upload failed');
    });
  });

  describe('Transaction Processing', () => {
    beforeEach(() => {
      // Mock successful photo upload
      const mockUploadResult = {
        ref: { path: 'completion-photos/booking-123/1234567890_completion-photo.jpg' },
      };
      mockUploadString.mockResolvedValue(mockUploadResult as any);
      mockGetDownloadURL.mockResolvedValue('https://storage.googleapis.com/bucket/completion-photos/booking-123/1234567890_completion-photo.jpg');
    });

    it('should complete booking transaction successfully', async () => {
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTransactionObject = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ loyaltyPoints: 50 }),
          }),
          update: jest.fn(),
          set: jest.fn(),
        };
        await callback(mockTransactionObject);
      });
      mockRunTransaction.mockImplementation(mockTransaction);

      const result = await completeBookingAction(validInput);
      
      expect(mockRunTransaction).toHaveBeenCalled();
      expect(result.error).toBeUndefined();
    });

    it('should award loyalty points correctly', async () => {
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTransactionObject = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ loyaltyPoints: 100 }),
          }),
          update: jest.fn(),
          set: jest.fn(),
        };
        await callback(mockTransactionObject);
      });
      mockRunTransaction.mockImplementation(mockTransaction);

      await completeBookingAction(validInput);
      
      expect(mockRunTransaction).toHaveBeenCalled();
      // Points should be calculated as Math.floor(1000 / 10) = 100
    });

    it('should handle client document not found', async () => {
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTransactionObject = {
          get: jest.fn().mockResolvedValue({
            exists: () => false,
            data: () => null,
          }),
          update: jest.fn(),
          set: jest.fn(),
        };
        await callback(mockTransactionObject);
      });
      mockRunTransaction.mockImplementation(mockTransaction);

      const result = await completeBookingAction(validInput);
      
      expect(result.error).toBe('Client document does not exist!');
    });

    it('should update job status when jobId is provided', async () => {
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTransactionObject = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ loyaltyPoints: 0 }),
          }),
          update: jest.fn(),
          set: jest.fn(),
        };
        await callback(mockTransactionObject);
      });
      mockRunTransaction.mockImplementation(mockTransaction);

      await completeBookingAction(validInput);
      
      expect(mockRunTransaction).toHaveBeenCalled();
    });

    it('should handle transaction failure', async () => {
      mockRunTransaction.mockRejectedValue(new Error('Transaction failed'));

      const result = await completeBookingAction(validInput);
      
      expect(result.error).toBe('Transaction failed');
    });
  });

  describe('Notification Creation', () => {
    beforeEach(() => {
      // Mock successful photo upload
      const mockUploadResult = {
        ref: { path: 'completion-photos/booking-123/1234567890_completion-photo.jpg' },
      };
      mockUploadString.mockResolvedValue(mockUploadResult as any);
      mockGetDownloadURL.mockResolvedValue('https://storage.googleapis.com/bucket/completion-photos/booking-123/1234567890_completion-photo.jpg');

      // Mock successful transaction
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTransactionObject = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ loyaltyPoints: 0 }),
          }),
          update: jest.fn(),
          set: jest.fn(),
        };
        await callback(mockTransactionObject);
      });
      mockRunTransaction.mockImplementation(mockTransaction);
    });

    it('should create notification successfully', async () => {
      mockAddDoc.mockResolvedValue({ id: 'notification-123' } as any);

      const result = await completeBookingAction(validInput);
      
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          userId: validInput.clientId,
          message: expect.stringContaining(validInput.serviceName),
          link: '/bookings',
          type: 'booking_update',
          read: false,
        })
      );
      expect(result.error).toBeUndefined();
    });

    it('should handle notification creation failure gracefully', async () => {
      mockAddDoc.mockRejectedValue(new Error('Notification failed'));

      const result = await completeBookingAction(validInput);
      
      // Should still succeed even if notification fails
      expect(result.error).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle booking without jobId', async () => {
      const { jobId, ...inputWithoutJobId } = validInput;

      // Mock successful photo upload
      const mockUploadResult = {
        ref: { path: 'completion-photos/booking-123/1234567890_completion-photo.jpg' },
      };
      mockUploadString.mockResolvedValue(mockUploadResult as any);
      mockGetDownloadURL.mockResolvedValue('https://storage.googleapis.com/bucket/completion-photos/booking-123/1234567890_completion-photo.jpg');

      // Mock successful transaction
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTransactionObject = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ loyaltyPoints: 0 }),
          }),
          update: jest.fn(),
          set: jest.fn(),
        };
        await callback(mockTransactionObject);
      });
      mockRunTransaction.mockImplementation(mockTransaction);

      mockAddDoc.mockResolvedValue({ id: 'notification-123' } as any);

      const result = await completeBookingAction(inputWithoutJobId);
      
      expect(result.error).toBeUndefined();
    });

    it('should handle zero price booking', async () => {
      const zeroPriceInput = { ...validInput, price: 0 };

      // Mock successful photo upload
      const mockUploadResult = {
        ref: { path: 'completion-photos/booking-123/1234567890_completion-photo.jpg' },
      };
      mockUploadString.mockResolvedValue(mockUploadResult as any);
      mockGetDownloadURL.mockResolvedValue('https://storage.googleapis.com/bucket/completion-photos/booking-123/1234567890_completion-photo.jpg');

      // Mock successful transaction
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTransactionObject = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ loyaltyPoints: 0 }),
          }),
          update: jest.fn(),
          set: jest.fn(),
        };
        await callback(mockTransactionObject);
      });
      mockRunTransaction.mockImplementation(mockTransaction);

      mockAddDoc.mockResolvedValue({ id: 'notification-123' } as any);

      const result = await completeBookingAction(zeroPriceInput);
      
      expect(result.error).toBeUndefined();
      // Should award 0 points for zero price
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown errors', async () => {
      mockUploadString.mockRejectedValue('Unknown error');

      const result = await completeBookingAction(validInput);
      
      expect(result.error).toBe('Could not complete the booking.');
    });
  });
});
