import { PaymentValidator, ValidationResult, DuplicatePaymentCheck } from '../payment-validator';
import { adminDb as db } from '../firebase-admin';
import { PaymentConfig } from '../payment-config';

// Mock Firebase Admin
jest.mock('../firebase-admin');
jest.mock('../payment-config');

const mockDb = db as jest.Mocked<typeof db>;
const mockPaymentConfig = PaymentConfig as jest.Mocked<typeof PaymentConfig>;

describe('PaymentValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePaymentAmount', () => {
    it('returns valid for matching amounts', () => {
      mockPaymentConfig.validatePaymentAmount.mockReturnValue(true);

      const result = PaymentValidator.validatePaymentAmount(1000, 1000);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns invalid for zero amount', () => {
      const result = PaymentValidator.validatePaymentAmount(0, 1000);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Payment amount must be greater than zero');
    });

    it('returns invalid for negative amount', () => {
      const result = PaymentValidator.validatePaymentAmount(-100, 1000);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Payment amount must be greater than zero');
    });

    it('returns invalid for zero expected amount', () => {
      const result = PaymentValidator.validatePaymentAmount(1000, 0);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid expected amount');
    });

    it('returns invalid for negative expected amount', () => {
      const result = PaymentValidator.validatePaymentAmount(1000, -100);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid expected amount');
    });

    it('returns invalid when amounts do not match', () => {
      mockPaymentConfig.validatePaymentAmount.mockReturnValue(false);

      const result = PaymentValidator.validatePaymentAmount(1000, 1200);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Payment amount (₱1000.00) does not match expected amount (₱1200.00)');
      expect(result.error).toContain('Difference: ₱200.00');
    });

    it('handles decimal amounts correctly', () => {
      mockPaymentConfig.validatePaymentAmount.mockReturnValue(false);

      const result = PaymentValidator.validatePaymentAmount(1000.50, 1000.75);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('₱1000.50');
      expect(result.error).toContain('₱1000.75');
      expect(result.error).toContain('₱0.25');
    });
  });

  describe('checkDuplicatePayment', () => {
    it('returns no duplicate when no transactions found', async () => {
      const mockQuery = {
        empty: true,
        docs: [],
      };

      mockDb.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockQuery),
      } as any);

      const result = await PaymentValidator.checkDuplicatePayment('booking-1', 1000, 'paypal');

      expect(result.isDuplicate).toBe(false);
      expect(result.existingTransaction).toBeUndefined();
      expect(result.timeDifference).toBeUndefined();
    });

    it('returns duplicate when transaction is within 5 minutes', async () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000); // 4 minutes ago
      
      const mockTransaction = {
        id: 'txn-1',
        amount: 1000,
        paymentMethod: 'paypal',
        createdAt: { toDate: () => fiveMinutesAgo },
      };

      const mockQuery = {
        empty: false,
        docs: [{ data: () => mockTransaction }],
      };

      mockDb.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockQuery),
      } as any);

      const result = await PaymentValidator.checkDuplicatePayment('booking-1', 1000, 'paypal');

      expect(result.isDuplicate).toBe(true);
      expect(result.existingTransaction).toEqual(mockTransaction);
      expect(result.timeDifference).toBeGreaterThan(0);
    });

    it('returns no duplicate when transaction is older than 5 minutes', async () => {
      const now = new Date();
      const sixMinutesAgo = new Date(now.getTime() - 6 * 60 * 1000); // 6 minutes ago
      
      const mockTransaction = {
        id: 'txn-1',
        amount: 1000,
        paymentMethod: 'paypal',
        createdAt: { toDate: () => sixMinutesAgo },
      };

      const mockQuery = {
        empty: false,
        docs: [{ data: () => mockTransaction }],
      };

      mockDb.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockQuery),
      } as any);

      const result = await PaymentValidator.checkDuplicatePayment('booking-1', 1000, 'paypal');

      expect(result.isDuplicate).toBe(false);
      expect(result.existingTransaction).toEqual(mockTransaction);
      expect(result.timeDifference).toBeGreaterThan(5 * 60 * 1000);
    });

    it('handles Firestore errors gracefully', async () => {
      mockDb.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error('Firestore error')),
      } as any);

      const result = await PaymentValidator.checkDuplicatePayment('booking-1', 1000, 'paypal');

      expect(result.isDuplicate).toBe(false);
      expect(result.existingTransaction).toBeUndefined();
      expect(result.timeDifference).toBeUndefined();
    });
  });

  describe('validateBookingForPayment', () => {
    it('returns valid for correct booking', async () => {
      const mockBookingData = {
        clientId: 'user-1',
        status: 'Pending Payment',
        createdAt: { toDate: () => new Date() }, // Recent booking
      };

      const mockDoc = {
        exists: true,
        data: () => mockBookingData,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validateBookingForPayment('booking-1', 'user-1');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns invalid when booking does not exist', async () => {
      const mockDoc = {
        exists: false,
        data: () => null,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validateBookingForPayment('booking-1', 'user-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Booking not found');
    });

    it('returns invalid when booking data is null', async () => {
      const mockDoc = {
        exists: true,
        data: () => null,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validateBookingForPayment('booking-1', 'user-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid booking data');
    });

    it('returns invalid when booking does not belong to user', async () => {
      const mockBookingData = {
        clientId: 'user-2',
        status: 'Pending Payment',
        createdAt: { toDate: () => new Date() },
      };

      const mockDoc = {
        exists: true,
        data: () => mockBookingData,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validateBookingForPayment('booking-1', 'user-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unauthorized access to booking');
    });

    it('returns invalid when booking is not in pending payment state', async () => {
      const mockBookingData = {
        clientId: 'user-1',
        status: 'Completed',
        createdAt: { toDate: () => new Date() },
      };

      const mockDoc = {
        exists: true,
        data: () => mockBookingData,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validateBookingForPayment('booking-1', 'user-1');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Booking is not in pending payment state');
      expect(result.error).toContain('Current status: Completed');
    });

    it('returns invalid when booking has expired', async () => {
      const now = new Date();
      const expiredDate = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
      
      const mockBookingData = {
        clientId: 'user-1',
        status: 'Pending Payment',
        createdAt: { toDate: () => expiredDate },
      };

      const mockDoc = {
        exists: true,
        data: () => mockBookingData,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validateBookingForPayment('booking-1', 'user-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Booking has expired. Please create a new booking.');
    });

    it('handles Firestore errors gracefully', async () => {
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(new Error('Firestore error')),
        }),
      } as any);

      const result = await PaymentValidator.validateBookingForPayment('booking-1', 'user-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Failed to validate booking');
    });
  });

  describe('validatePaymentSession', () => {
    it('returns valid for active session', async () => {
      const mockSessionData = {
        status: 'pending',
        createdAt: { toDate: () => new Date() },
      };

      const mockDoc = {
        exists: true,
        data: () => mockSessionData,
      };

      mockPaymentConfig.isPaymentSessionValid.mockReturnValue(true);

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validatePaymentSession('booking-1');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns invalid when session does not exist', async () => {
      const mockDoc = {
        exists: false,
        data: () => null,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validatePaymentSession('booking-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Payment session not found');
    });

    it('returns invalid when session data is null', async () => {
      const mockDoc = {
        exists: true,
        data: () => null,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validatePaymentSession('booking-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid session data');
    });

    it('returns invalid when session has expired', async () => {
      const mockSessionData = {
        status: 'pending',
        createdAt: { toDate: () => new Date() },
      };

      const mockDoc = {
        exists: true,
        data: () => mockSessionData,
      };

      mockPaymentConfig.isPaymentSessionValid.mockReturnValue(false);

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validatePaymentSession('booking-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Payment session has expired');
    });

    it('returns invalid when session is already completed', async () => {
      const mockSessionData = {
        status: 'completed',
        createdAt: { toDate: () => new Date() },
      };

      const mockDoc = {
        exists: true,
        data: () => mockSessionData,
      };

      mockPaymentConfig.isPaymentSessionValid.mockReturnValue(true);

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validatePaymentSession('booking-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Payment session already completed');
    });

    it('returns invalid when session has failed', async () => {
      const mockSessionData = {
        status: 'failed',
        createdAt: { toDate: () => new Date() },
      };

      const mockDoc = {
        exists: true,
        data: () => mockSessionData,
      };

      mockPaymentConfig.isPaymentSessionValid.mockReturnValue(true);

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const result = await PaymentValidator.validatePaymentSession('booking-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Payment session failed');
    });

    it('handles Firestore errors gracefully', async () => {
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(new Error('Firestore error')),
        }),
      } as any);

      const result = await PaymentValidator.validatePaymentSession('booking-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Failed to validate payment session');
    });
  });

  describe('validatePaymentProofFile', () => {
    it('returns valid for valid file', () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 50000, writable: true }); // 50KB

      mockPaymentConfig.validateFileUpload.mockReturnValue({ valid: true });

      const result = PaymentValidator.validatePaymentProofFile(mockFile);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns invalid when PaymentConfig validation fails', () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

      mockPaymentConfig.validateFileUpload.mockReturnValue({ 
        valid: false, 
        error: 'Invalid file type' 
      });

      const result = PaymentValidator.validatePaymentProofFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid file type');
    });

    it('returns warning for very small file', () => {
      const mockFile = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 500, writable: true }); // Less than 1KB

      mockPaymentConfig.validateFileUpload.mockReturnValue({ valid: true });

      const result = PaymentValidator.validatePaymentProofFile(mockFile);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('File size is very small. Please ensure the image is clear and readable.');
    });

    it('returns invalid for suspicious filename', () => {
      const mockFile = new File(['test content'], 'script.jpg', { type: 'image/jpeg' });

      mockPaymentConfig.validateFileUpload.mockReturnValue({ valid: true });

      const result = PaymentValidator.validatePaymentProofFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid filename detected');
    });

    it('returns invalid for filename with javascript pattern', () => {
      const mockFile = new File(['test content'], 'javascript.jpg', { type: 'image/jpeg' });

      mockPaymentConfig.validateFileUpload.mockReturnValue({ valid: true });

      const result = PaymentValidator.validatePaymentProofFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid filename detected');
    });

    it('returns invalid for filename with onload pattern', () => {
      const mockFile = new File(['test content'], 'onload.jpg', { type: 'image/jpeg' });

      mockPaymentConfig.validateFileUpload.mockReturnValue({ valid: true });

      const result = PaymentValidator.validatePaymentProofFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid filename detected');
    });
  });

  describe('validatePaymentMethodConfig', () => {

    it('returns valid for bank with complete config', () => {
      Object.defineProperty(mockPaymentConfig, 'BANK', {
        value: {
          accountName: 'Test Account',
          accountNumber: '1234567890',
          bankName: 'Test Bank',
        },
        writable: true
      });

      const result = PaymentValidator.validatePaymentMethodConfig('bank');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns invalid for bank with incomplete config', () => {
      Object.defineProperty(mockPaymentConfig, 'BANK', {
        value: {
          accountName: 'Test Account',
          accountNumber: '1234567890',
          bankName: '',
        },
        writable: true
      });

      const result = PaymentValidator.validatePaymentMethodConfig('bank');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Bank transfer configuration is incomplete');
    });

    it('returns valid for paypal with valid config', () => {
      mockPaymentConfig.validatePayPalConfig.mockReturnValue(true);

      const result = PaymentValidator.validatePaymentMethodConfig('paypal');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns invalid for paypal with invalid config', () => {
      mockPaymentConfig.validatePayPalConfig.mockReturnValue(false);

      const result = PaymentValidator.validatePaymentMethodConfig('paypal');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('PayPal configuration is incomplete');
    });


    it('returns invalid for unknown payment method', () => {
      const result = PaymentValidator.validatePaymentMethodConfig('unknown' as any);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown payment method');
    });
  });

  describe('validatePayment', () => {
    it('returns valid for complete valid payment', async () => {
      // Mock all validations to pass
      const mockBookingData = {
        clientId: 'user-1',
        status: 'Pending Payment',
        price: 1000,
        createdAt: { toDate: () => new Date() },
      };

      const mockBookingDoc = {
        exists: true,
        data: () => mockBookingData,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockBookingDoc),
        }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
      } as any);

      mockPaymentConfig.validatePaymentAmount.mockReturnValue(true);
      Object.defineProperty(mockPaymentConfig, 'BANK', {
        value: { accountName: 'Test', accountNumber: '09123456789', bankName: 'Test Bank' },
        writable: true
      });

      const result = await PaymentValidator.validatePayment('booking-1', 'user-1', 1000, 'paypal');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns invalid with multiple errors', async () => {
      // Mock booking validation to fail
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(new Error('Firestore error')),
        }),
      } as any);

      const result = await PaymentValidator.validatePayment('booking-1', 'user-1', 1000, 'paypal');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Failed to validate booking');
    });

    it('includes warnings from file validation', async () => {
      const mockFile = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 500, writable: true }); // Very small file

      const mockBookingData = {
        clientId: 'user-1',
        status: 'Pending Payment',
        price: 1000,
        createdAt: { toDate: () => new Date() },
      };

      const mockBookingDoc = {
        exists: true,
        data: () => mockBookingData,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockBookingDoc),
        }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
      } as any);

      mockPaymentConfig.validatePaymentAmount.mockReturnValue(true);
      mockPaymentConfig.validateFileUpload.mockReturnValue({ valid: true });
      Object.defineProperty(mockPaymentConfig, 'BANK', {
        value: { accountName: 'Test', accountNumber: '09123456789', bankName: 'Test Bank' },
        writable: true
      });

      const result = await PaymentValidator.validatePayment('booking-1', 'user-1', 1000, 'paypal', mockFile);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('File size is very small. Please ensure the image is clear and readable.');
    });
  });
});
