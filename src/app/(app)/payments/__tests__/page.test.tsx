import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import PaymentHistoryPage from '../page';
import { getDb } from '@/lib/firebase';

// Mock the auth context
jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock useToast
jest.mock('@/hooks/use-toast');
const mockUseToast = jest.fn();

// Mock Firebase Firestore
const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn(() => ({
  where: jest.fn(() => ({
    orderBy: jest.fn(() => ({
      onSnapshot: mockOnSnapshot,
    })),
  })),
}));

describe('PaymentHistoryPage', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      userRole: 'client',
      loading: false,
    } as any);

    mockGetDb.mockReturnValue({
      collection: mockCollection,
    } as any);

    // Mock Firestore functions
    jest.doMock('firebase/firestore', () => ({
      collection: mockCollection,
      query: jest.fn(),
      where: jest.fn(),
      onSnapshot: mockOnSnapshot,
      orderBy: jest.fn(),
    }));
  });

  describe('Rendering', () => {
    it('renders the payment history page with correct title', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      expect(screen.getByText('Payment History')).toBeInTheDocument();
      expect(screen.getByText('View all your payment transactions and receipts.')).toBeInTheDocument();
    });

    it('renders refresh button', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockOnSnapshot.mockImplementation(() => {
        // Don't call callback immediately to simulate loading
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      // Should show loading skeletons
      const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no transactions', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      expect(screen.getByText('No payment transactions found.')).toBeInTheDocument();
    });
  });

  describe('Transaction Display', () => {
    const mockTransactions = [
      {
        id: 'txn-1',
        bookingId: 'booking-1',
        clientId: 'client-1',
        providerId: 'provider-1',
        amount: 500,
        type: 'booking_payment',
        status: 'completed',
        paymentMethod: 'GCash',
        createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
        verifiedAt: { toDate: () => new Date('2024-01-15T10:05:00Z') },
        paypalOrderId: 'PAYPAL-123',
        payerEmail: 'payer@example.com',
      },
      {
        id: 'txn-2',
        bookingId: 'booking-2',
        clientId: 'client-1',
        providerId: 'provider-2',
        amount: 300,
        type: 'booking_payment',
        status: 'pending',
        paymentMethod: 'PayPal',
        createdAt: { toDate: () => new Date('2024-01-16T14:30:00Z') },
      },
      {
        id: 'txn-3',
        bookingId: 'booking-3',
        clientId: 'client-1',
        providerId: 'provider-3',
        amount: 200,
        type: 'refund',
        status: 'rejected',
        paymentMethod: 'GCash',
        createdAt: { toDate: () => new Date('2024-01-17T09:15:00Z') },
        rejectedAt: { toDate: () => new Date('2024-01-17T09:20:00Z') },
        rejectedBy: 'admin-1',
        rejectionReason: 'Invalid payment proof',
      },
    ];

    it('displays transactions in table format', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockTransactions.map(transaction => ({
            id: transaction.id,
            data: () => transaction,
          })),
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Method')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('displays transaction data correctly', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockTransactions.map(transaction => ({
            id: transaction.id,
            data: () => transaction,
          })),
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      expect(screen.getByText('Service Payment')).toBeInTheDocument();
      expect(screen.getByText('Refund')).toBeInTheDocument();
      expect(screen.getByText('₱500.00')).toBeInTheDocument();
      expect(screen.getByText('₱300.00')).toBeInTheDocument();
      expect(screen.getByText('₱200.00')).toBeInTheDocument();
      expect(screen.getByText('GCash')).toBeInTheDocument();
      expect(screen.getByText('PayPal')).toBeInTheDocument();
    });

    it('displays correct status badges', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockTransactions.map(transaction => ({
            id: transaction.id,
            data: () => transaction,
          })),
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
  });

  describe('Transaction Details Dialog', () => {
    const mockTransaction = {
      id: 'txn-1',
      bookingId: 'booking-1',
      clientId: 'client-1',
      providerId: 'provider-1',
      amount: 500,
      type: 'booking_payment',
      status: 'completed',
      paymentMethod: 'GCash',
      createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
      verifiedAt: { toDate: () => new Date('2024-01-15T10:05:00Z') },
      paypalOrderId: 'PAYPAL-123',
      payerEmail: 'payer@example.com',
    };

    it('opens transaction details dialog when view button is clicked', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'txn-1',
            data: () => mockTransaction,
          }],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);

      expect(screen.getByText('Transaction Details')).toBeInTheDocument();
      expect(screen.getByText('Transaction ID: txn-1')).toBeInTheDocument();
    });

    it('displays transaction details in dialog', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'txn-1',
            data: () => mockTransaction,
          }],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);

      expect(screen.getByText('Service Payment')).toBeInTheDocument();
      expect(screen.getByText('₱500.00')).toBeInTheDocument();
      expect(screen.getByText('GCash')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('displays PayPal information when available', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'txn-1',
            data: () => mockTransaction,
          }],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);

      expect(screen.getByText('PayPal Order ID')).toBeInTheDocument();
      expect(screen.getByText('PAYPAL-123')).toBeInTheDocument();
      expect(screen.getByText('Payer Email')).toBeInTheDocument();
      expect(screen.getByText('payer@example.com')).toBeInTheDocument();
    });

    it('displays booking ID when available', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'txn-1',
            data: () => mockTransaction,
          }],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);

      expect(screen.getByText('Booking ID')).toBeInTheDocument();
      expect(screen.getByText('booking-1')).toBeInTheDocument();
    });

    it('displays rejection information when transaction is rejected', () => {
      const rejectedTransaction = {
        ...mockTransaction,
        status: 'rejected',
        rejectedAt: { toDate: () => new Date('2024-01-15T10:05:00Z') },
        rejectedBy: 'admin-1',
        rejectionReason: 'Invalid payment proof',
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'txn-1',
            data: () => rejectedTransaction,
          }],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);

      expect(screen.getByText('Rejection Reason')).toBeInTheDocument();
      expect(screen.getByText('Invalid payment proof')).toBeInTheDocument();
    });

    it('displays verification information when transaction is verified', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'txn-1',
            data: () => mockTransaction,
          }],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);

      expect(screen.getByText('Verified At')).toBeInTheDocument();
    });
  });

  describe('Transaction Types', () => {
    it('displays correct labels for different transaction types', () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          type: 'booking_payment',
          amount: 500,
          status: 'completed',
          paymentMethod: 'GCash',
          createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
        },
        {
          id: 'txn-2',
          type: 'payout_request',
          amount: 400,
          status: 'pending',
          paymentMethod: 'Bank Transfer',
          createdAt: { toDate: () => new Date('2024-01-16T14:30:00Z') },
        },
        {
          id: 'txn-3',
          type: 'refund',
          amount: 200,
          status: 'completed',
          paymentMethod: 'GCash',
          createdAt: { toDate: () => new Date('2024-01-17T09:15:00Z') },
        },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockTransactions.map(transaction => ({
            id: transaction.id,
            data: () => transaction,
          })),
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      expect(screen.getByText('Service Payment')).toBeInTheDocument();
      expect(screen.getByText('Payout Request')).toBeInTheDocument();
      expect(screen.getByText('Refund')).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('displays correct status badges for different statuses', () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          type: 'booking_payment',
          amount: 500,
          status: 'completed',
          paymentMethod: 'GCash',
          createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
        },
        {
          id: 'txn-2',
          type: 'booking_payment',
          amount: 300,
          status: 'pending',
          paymentMethod: 'PayPal',
          createdAt: { toDate: () => new Date('2024-01-16T14:30:00Z') },
        },
        {
          id: 'txn-3',
          type: 'booking_payment',
          amount: 200,
          status: 'rejected',
          paymentMethod: 'GCash',
          createdAt: { toDate: () => new Date('2024-01-17T09:15:00Z') },
        },
        {
          id: 'txn-4',
          type: 'booking_payment',
          amount: 150,
          status: 'failed',
          paymentMethod: 'GCash',
          createdAt: { toDate: () => new Date('2024-01-18T11:00:00Z') },
        },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockTransactions.map(transaction => ({
            id: transaction.id,
            data: () => transaction,
          })),
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes the page when refresh button is clicked', () => {
      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: {
          reload: mockReload,
        },
        writable: true,
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors gracefully', () => {
      mockOnSnapshot.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Firestore error'));
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      // Should handle error without crashing
      expect(screen.getByText('Payment History')).toBeInTheDocument();
    });

    it('handles unauthenticated user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userRole: null,
        loading: false,
      } as any);

      render(<PaymentHistoryPage />);

      // Should not show payment history content
      expect(screen.queryByText('Payment History')).not.toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('formats dates correctly', () => {
      const mockTransaction = {
        id: 'txn-1',
        type: 'booking_payment',
        amount: 500,
        status: 'completed',
        paymentMethod: 'GCash',
        createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'txn-1',
            data: () => mockTransaction,
          }],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      // Should display formatted date
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('formats amounts correctly', () => {
      const mockTransaction = {
        id: 'txn-1',
        type: 'booking_payment',
        amount: 500.50,
        status: 'completed',
        paymentMethod: 'GCash',
        createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'txn-1',
            data: () => mockTransaction,
          }],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      expect(screen.getByText('₱500.50')).toBeInTheDocument();
    });
  });

  describe('Transaction Count', () => {
    it('displays correct transaction count', () => {
      const mockTransactions = [
        { id: 'txn-1', type: 'booking_payment', amount: 500, status: 'completed', paymentMethod: 'GCash', createdAt: { toDate: () => new Date() } },
        { id: 'txn-2', type: 'booking_payment', amount: 300, status: 'pending', paymentMethod: 'PayPal', createdAt: { toDate: () => new Date() } },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockTransactions.map(transaction => ({
            id: transaction.id,
            data: () => transaction,
          })),
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      expect(screen.getByText('2 transactions found')).toBeInTheDocument();
    });

    it('displays singular form for single transaction', () => {
      const mockTransaction = {
        id: 'txn-1',
        type: 'booking_payment',
        amount: 500,
        status: 'completed',
        paymentMethod: 'GCash',
        createdAt: { toDate: () => new Date() },
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'txn-1',
            data: () => mockTransaction,
          }],
        });
        return jest.fn();
      });

      render(<PaymentHistoryPage />);

      expect(screen.getByText('1 transaction found')).toBeInTheDocument();
    });
  });
});
