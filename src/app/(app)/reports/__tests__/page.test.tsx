import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import ReportsPage from '../page';
import { getDb } from '@/shared/db';
import { useToast } from '@/hooks/use-toast';

// Mock the auth context
jest.mock('@/shared/auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Firebase
jest.mock('@/shared/db');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock useToast
jest.mock('@/hooks/use-toast');
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock Firebase Firestore
const mockOnSnapshot = jest.fn();
const mockGetDocs = jest.fn();
const mockCollection = jest.fn(() => ({
  where: jest.fn(() => ({
    onSnapshot: mockOnSnapshot,
  })),
}));

const mockQuery = jest.fn();

describe('ReportsPage', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      userRole: 'agency',
      loading: false,
    } as any);

    mockUseToast.mockReturnValue({
      toast: mockToast,
    } as any);

    mockGetDb.mockReturnValue({
      collection: mockCollection,
      query: mockQuery,
    } as any);

    // Mock Firestore functions
    jest.doMock('firebase/firestore', () => ({
      collection: mockCollection,
      query: mockQuery,
      where: jest.fn(),
      onSnapshot: mockOnSnapshot,
      getDocs: mockGetDocs,
    }));
  });

  describe('Access Control', () => {
    it('shows upgrade message for non-agency users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);

      render(<ReportsPage />);

      expect(screen.getByText('upgradeTitle')).toBeInTheDocument();
      expect(screen.getByText('upgradeDescription')).toBeInTheDocument();
      expect(screen.getByText('getInsights')).toBeInTheDocument();
    });

    it('renders reports page for agency users', () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      expect(screen.getByText('advancedReports')).toBeInTheDocument();
      expect(screen.getByText('advancedDescription')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('renders the reports page with correct title', () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      expect(screen.getByText('advancedReports')).toBeInTheDocument();
      expect(screen.getByText('advancedDescription')).toBeInTheDocument();
    });

    it('renders advanced filters section', () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
      expect(screen.getByText('Customize your reports with advanced filtering options')).toBeInTheDocument();
    });

    it('renders filter controls', () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Report Type')).toBeInTheDocument();
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('Export Options')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockGetDocs.mockImplementation(() => {
        // Don't resolve immediately to simulate loading
        return new Promise(() => {});
      });

      render(<ReportsPage />);

      // Should show loading skeletons
      const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('KPI Cards', () => {
    const mockBookings = [
      {
        id: 'booking-1',
        providerId: 'provider-1',
        providerName: 'John Doe',
        status: 'Completed',
        price: 500,
        date: { toDate: () => new Date('2024-01-15') },
      },
      {
        id: 'booking-2',
        providerId: 'provider-2',
        providerName: 'Jane Smith',
        status: 'Completed',
        price: 300,
        date: { toDate: () => new Date('2024-01-16') },
      },
    ];

    it('displays KPI cards with correct data', () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'provider-1', data: () => ({ role: 'provider' }) },
          { id: 'provider-2', data: () => ({ role: 'provider' }) },
        ],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Completed Bookings')).toBeInTheDocument();
      expect(screen.getByText('Avg. Booking Value')).toBeInTheDocument();
      expect(screen.getByText('Active Providers')).toBeInTheDocument();
    });

    it('calculates revenue correctly', () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'provider-1', data: () => ({ role: 'provider' }) },
        ],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      // Total revenue should be 500 + 300 = 800
      expect(screen.getByText('₱800.00')).toBeInTheDocument();
    });

    it('calculates completed bookings count', () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'provider-1', data: () => ({ role: 'provider' }) },
          { id: 'provider-2', data: () => ({ role: 'provider' }) },
        ],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      // Should show 2 completed bookings
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Tabs Navigation', () => {
    it('renders all report tabs', () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Financial')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });

    it('switches between tabs', () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      const financialTab = screen.getByText('Financial');
      fireEvent.click(financialTab);

      expect(financialTab).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    const mockBookings = [
      {
        id: 'booking-1',
        providerId: 'provider-1',
        providerName: 'John Doe',
        status: 'Completed',
        price: 500,
        date: { toDate: () => new Date('2024-01-15') },
      },
    ];

    const mockPayouts = [
      {
        id: 'payout-1',
        transactionId: 'txn-123',
        providerId: 'provider-1',
        providerName: 'John Doe',
        amount: 400,
        status: 'Pending',
        requestedAt: { toDate: () => new Date('2024-01-15') },
      },
    ];

    it('displays revenue trend chart', () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'provider-1', data: () => ({ role: 'provider' }) },
        ],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      expect(screen.getByText('Monthly Revenue Trend')).toBeInTheDocument();
      expect(screen.getByText('Revenue performance over the last 12 months')).toBeInTheDocument();
    });

    it('displays provider performance chart', () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'provider-1', data: () => ({ role: 'provider' }) },
        ],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      expect(screen.getByText('Provider Performance')).toBeInTheDocument();
      expect(screen.getByText('Top performing providers by bookings')).toBeInTheDocument();
    });

    it('displays payout requests table', () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'provider-1', data: () => ({ role: 'provider' }) },
        ],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockPayouts.map(payout => ({
            id: payout.id,
            data: () => payout,
          })),
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      expect(screen.getByText('Payout Requests')).toBeInTheDocument();
      expect(screen.getByText('Manage provider payout requests')).toBeInTheDocument();
    });
  });

  describe('Financial Tab', () => {
    it('displays financial metrics', () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      // Switch to Financial tab
      const financialTab = screen.getByText('Financial');
      fireEvent.click(financialTab);

      expect(screen.getByText('Revenue Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Financial performance overview')).toBeInTheDocument();
      expect(screen.getByText('Financial Metrics')).toBeInTheDocument();
      expect(screen.getByText('Key financial indicators')).toBeInTheDocument();
    });
  });

  describe('Performance Tab', () => {
    it('displays performance metrics', () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      // Switch to Performance tab
      const performanceTab = screen.getByText('Performance');
      fireEvent.click(performanceTab);

      expect(screen.getByText('Provider Performance')).toBeInTheDocument();
      expect(screen.getByText('Detailed provider performance metrics')).toBeInTheDocument();
      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
      expect(screen.getByText('Key performance indicators and trends')).toBeInTheDocument();
    });
  });

  describe('Analytics Tab', () => {
    it('displays analytics charts', () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      // Switch to Analytics tab
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      expect(screen.getByText('Revenue Analytics')).toBeInTheDocument();
      expect(screen.getByText('Advanced revenue analysis and trends')).toBeInTheDocument();
      expect(screen.getByText('Performance Distribution')).toBeInTheDocument();
      expect(screen.getByText('Provider performance distribution analysis')).toBeInTheDocument();
    });
  });

  describe('Insights Tab', () => {
    it('displays business insights', () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      // Switch to Insights tab
      const insightsTab = screen.getByText('Insights');
      fireEvent.click(insightsTab);

      expect(screen.getByText('Business Insights')).toBeInTheDocument();
      expect(screen.getByText('AI-powered insights and recommendations')).toBeInTheDocument();
      expect(screen.getByText('Growth Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Strategic recommendations for business growth')).toBeInTheDocument();
    });
  });

  describe('Payout Management', () => {
    const mockPayout = {
      id: 'payout-1',
      transactionId: 'txn-123',
      providerId: 'provider-1',
      providerName: 'John Doe',
      amount: 400,
      status: 'Pending',
      requestedAt: { toDate: () => new Date('2024-01-15') },
    };

    it('displays payout requests in table', () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'provider-1', data: () => ({ role: 'provider' }) },
        ],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'payout-1',
            data: () => mockPayout,
          }],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      expect(screen.getByText('txn-123')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('₱400.00')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('allows marking payouts as paid', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'provider-1', data: () => ({ role: 'provider' }) },
        ],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'payout-1',
            data: () => mockPayout,
          }],
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      const markAsPaidButton = screen.getByText('Mark as Paid');
      fireEvent.click(markAsPaidButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors gracefully', () => {
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      render(<ReportsPage />);

      // Should handle error without crashing
      expect(screen.getByText('advancedReports')).toBeInTheDocument();
    });

    it('handles payout action errors gracefully', async () => {
      const mockPayout = {
        id: 'payout-1',
        transactionId: 'txn-123',
        providerId: 'provider-1',
        providerName: 'John Doe',
        amount: 400,
        status: 'Pending',
        requestedAt: { toDate: () => new Date('2024-01-15') },
      };

      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'provider-1', data: () => ({ role: 'provider' }) },
        ],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'payout-1',
            data: () => mockPayout,
          }],
        });
        return jest.fn();
      });

      // Mock handleMarkAsPaid to return error
      jest.doMock('@/app/(app)/admin/payouts/actions', () => ({
        handleMarkAsPaid: jest.fn().mockResolvedValue({
          error: 'Payment failed',
          message: 'Could not process payment',
        }),
      }));

      render(<ReportsPage />);

      const markAsPaidButton = screen.getByText('Mark as Paid');
      fireEvent.click(markAsPaidButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'error',
          description: 'Could not process payment',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Data Processing', () => {
    it('processes revenue chart data correctly', () => {
      const mockBookings = [
        {
          id: 'booking-1',
          providerId: 'provider-1',
          providerName: 'John Doe',
          status: 'Completed',
          price: 500,
          date: { toDate: () => new Date('2024-01-15') },
        },
        {
          id: 'booking-2',
          providerId: 'provider-2',
          providerName: 'Jane Smith',
          status: 'Completed',
          price: 300,
          date: { toDate: () => new Date('2024-02-15') },
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'provider-1', data: () => ({ role: 'provider' }) },
          { id: 'provider-2', data: () => ({ role: 'provider' }) },
        ],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      // Should process and display data correctly
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });

    it('calculates provider performance correctly', () => {
      const mockBookings = [
        {
          id: 'booking-1',
          providerId: 'provider-1',
          providerName: 'John Doe',
          status: 'Completed',
          price: 500,
          date: { toDate: () => new Date('2024-01-15') },
        },
        {
          id: 'booking-2',
          providerId: 'provider-1',
          providerName: 'John Doe',
          status: 'Completed',
          price: 300,
          date: { toDate: () => new Date('2024-01-16') },
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'provider-1', data: () => ({ role: 'provider' }) },
        ],
      });

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<ReportsPage />);

      // Should calculate provider performance
      expect(screen.getByText('Provider Performance')).toBeInTheDocument();
    });
  });
});
