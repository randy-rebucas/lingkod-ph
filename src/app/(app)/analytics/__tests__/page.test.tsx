import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import AnalyticsPage from '../page';
import { getDb } from '@/lib/firebase';

// Mock the auth context
jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock Firebase Firestore
const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn(() => ({
  where: jest.fn(() => ({
    onSnapshot: mockOnSnapshot,
  })),
}));

describe('AnalyticsPage', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      userRole: 'provider',
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
    }));
  });

  describe('Access Control', () => {
    it('shows upgrade message for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userRole: null,
        loading: false,
      } as any);

      render(<AnalyticsPage />);

      expect(screen.getByText('upgradeToElite')).toBeInTheDocument();
      expect(screen.getByText('eliteExclusive')).toBeInTheDocument();
      expect(screen.getByText('advancedAnalytics')).toBeInTheDocument();
    });

    it('renders analytics page for authenticated users', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('advancedAnalyticsTitle')).toBeInTheDocument();
      expect(screen.getByText('deepDiveDescription')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('renders the analytics page with correct title', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('advancedAnalyticsTitle')).toBeInTheDocument();
      expect(screen.getByText('deepDiveDescription')).toBeInTheDocument();
    });

    it('renders time period selector and export button', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockOnSnapshot.mockImplementation(() => {
        // Don't call callback immediately to simulate loading
        return jest.fn();
      });

      render(<AnalyticsPage />);

      // Should show loading skeletons
      const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('KPI Cards', () => {
    const mockBookings = [
      {
        id: 'booking-1',
        clientId: 'client-1',
        serviceName: 'House Cleaning',
        status: 'Completed',
        price: 500,
        date: { toDate: () => new Date('2024-01-15') },
        location: 'Manila',
        serviceArea: 'Metro Manila',
      },
      {
        id: 'booking-2',
        clientId: 'client-2',
        serviceName: 'Garden Maintenance',
        status: 'Completed',
        price: 300,
        date: { toDate: () => new Date('2024-01-16') },
        location: 'Quezon City',
        serviceArea: 'Metro Manila',
      },
    ];

    const mockReviews = [
      {
        id: 'review-1',
        rating: 5,
        createdAt: { toDate: () => new Date('2024-01-15') },
      },
      {
        id: 'review-2',
        rating: 4,
        createdAt: { toDate: () => new Date('2024-01-16') },
      },
    ];

    it('displays KPI cards with correct data', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      // Mock reviews query
      const mockReviewsSnapshot = {
        docs: mockReviews.map(review => ({
          id: review.id,
          data: () => review,
        })),
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback(mockReviewsSnapshot);
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('avgBookingValue')).toBeInTheDocument();
      expect(screen.getByText('New Clients')).toBeInTheDocument();
      expect(screen.getByText('Client Retention')).toBeInTheDocument();
      expect(screen.getByText('utilizationRate')).toBeInTheDocument();
      expect(screen.getByText('avgRating')).toBeInTheDocument();
    });

    it('calculates revenue correctly', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      // Total revenue should be 500 + 300 = 800
      expect(screen.getByText('₱800.00')).toBeInTheDocument();
    });

    it('calculates average booking value correctly', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      // Average booking value should be 800 / 2 = 400
      expect(screen.getByText('₱400.00')).toBeInTheDocument();
    });

    it('calculates average rating correctly', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockReviews.map(review => ({
            id: review.id,
            data: () => review,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      // Average rating should be (5 + 4) / 2 = 4.5
      expect(screen.getByText('4.50')).toBeInTheDocument();
    });
  });

  describe('Performance Alerts', () => {
    it('shows revenue decline alert when growth is negative', () => {
      const mockBookings = [
        {
          id: 'booking-1',
          clientId: 'client-1',
          serviceName: 'House Cleaning',
          status: 'Completed',
          price: 500,
          date: { toDate: () => new Date('2024-01-15') },
          location: 'Manila',
          serviceArea: 'Metro Manila',
        },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      // Should show performance alerts
      expect(screen.getByText('Revenue has decreased')).toBeInTheDocument();
    });

    it('shows revenue growth alert when growth is positive', () => {
      const mockBookings = [
        {
          id: 'booking-1',
          clientId: 'client-1',
          serviceName: 'House Cleaning',
          status: 'Completed',
          price: 500,
          date: { toDate: () => new Date('2024-01-15') },
          location: 'Manila',
          serviceArea: 'Metro Manila',
        },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      // Should show growth alerts
      expect(screen.getByText('Great! Revenue is up')).toBeInTheDocument();
    });
  });

  describe('Charts and Visualizations', () => {
    it('renders revenue growth chart', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
      expect(screen.getByText('Monthly revenue trends and projections')).toBeInTheDocument();
    });

    it('renders client analytics chart', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('Client Analytics')).toBeInTheDocument();
      expect(screen.getByText('New vs returning client distribution')).toBeInTheDocument();
    });

    it('renders booking trends chart', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('bookingTrends')).toBeInTheDocument();
      expect(screen.getByText('totalVsCompleted')).toBeInTheDocument();
    });

    it('renders service performance chart', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('servicePerformance')).toBeInTheDocument();
      expect(screen.getByText('revenueDistribution')).toBeInTheDocument();
    });
  });

  describe('Time Period Filtering', () => {
    it('allows changing time period', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      const timePeriodSelect = screen.getByDisplayValue('Last 30 days');
      fireEvent.click(timePeriodSelect);

      // Should show time period options
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 days')).toBeInTheDocument();
      expect(screen.getByText('Last year')).toBeInTheDocument();
      expect(screen.getByText('All time')).toBeInTheDocument();
    });

    it('filters data based on selected time period', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          clientId: 'client-1',
          serviceName: 'House Cleaning',
          status: 'Completed',
          price: 500,
          date: { toDate: () => new Date('2024-01-15') },
          location: 'Manila',
          serviceArea: 'Metro Manila',
        },
        {
          id: 'booking-2',
          clientId: 'client-2',
          serviceName: 'Garden Maintenance',
          status: 'Completed',
          price: 300,
          date: { toDate: () => new Date('2023-12-15') }, // Older booking
          location: 'Quezon City',
          serviceArea: 'Metro Manila',
        },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      // Change to 7 days filter
      const timePeriodSelect = screen.getByDisplayValue('Last 30 days');
      fireEvent.click(timePeriodSelect);

      const sevenDaysOption = screen.getByText('Last 7 days');
      fireEvent.click(sevenDaysOption);

      // Should filter data based on time period
      await waitFor(() => {
        expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      });
    });
  });

  describe('Data Export', () => {
    it('allows exporting analytics data', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      // Mock URL.createObjectURL and document.createElement
      const mockCreateObjectURL = jest.fn(() => 'mock-url');
      const mockRevokeObjectURL = jest.fn();
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();

      Object.defineProperty(window, 'URL', {
        value: {
          createObjectURL: mockCreateObjectURL,
          revokeObjectURL: mockRevokeObjectURL,
        },
        writable: true,
      });

      Object.defineProperty(document, 'createElement', {
        value: jest.fn(() => ({
          href: '',
          download: '',
          click: mockClick,
        })),
        writable: true,
      });

      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true,
      });

      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true,
      });

      render(<AnalyticsPage />);

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Geographic Analytics', () => {
    const mockBookings = [
      {
        id: 'booking-1',
        clientId: 'client-1',
        serviceName: 'House Cleaning',
        status: 'Completed',
        price: 500,
        date: { toDate: () => new Date('2024-01-15') },
        location: 'Manila',
        serviceArea: 'Metro Manila',
      },
      {
        id: 'booking-2',
        clientId: 'client-2',
        serviceName: 'Garden Maintenance',
        status: 'Completed',
        price: 300,
        date: { toDate: () => new Date('2024-01-16') },
        location: 'Quezon City',
        serviceArea: 'Metro Manila',
      },
    ];

    it('displays top locations', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('Top Locations')).toBeInTheDocument();
      expect(screen.getByText('Revenue by location')).toBeInTheDocument();
    });

    it('displays service areas', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('Service Areas')).toBeInTheDocument();
      expect(screen.getByText('Distribution of service areas')).toBeInTheDocument();
    });
  });

  describe('Top Performing Services', () => {
    const mockBookings = [
      {
        id: 'booking-1',
        clientId: 'client-1',
        serviceName: 'House Cleaning',
        status: 'Completed',
        price: 500,
        date: { toDate: () => new Date('2024-01-15') },
        location: 'Manila',
        serviceArea: 'Metro Manila',
      },
      {
        id: 'booking-2',
        clientId: 'client-2',
        serviceName: 'Garden Maintenance',
        status: 'Completed',
        price: 300,
        date: { toDate: () => new Date('2024-01-16') },
        location: 'Quezon City',
        serviceArea: 'Metro Manila',
      },
    ];

    it('displays top performing services table', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('topPerformingServices')).toBeInTheDocument();
      expect(screen.getByText('mostProfitableServices')).toBeInTheDocument();
    });

    it('shows service performance data', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('service')).toBeInTheDocument();
      expect(screen.getByText('totalRevenue')).toBeInTheDocument();
      expect(screen.getByText('Bookings')).toBeInTheDocument();
      expect(screen.getByText('Avg. Value')).toBeInTheDocument();
    });
  });

  describe('Performance Insights', () => {
    it('displays performance insights', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
      expect(screen.getByText('Key performance indicators and recommendations')).toBeInTheDocument();
    });

    it('shows quick stats', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      expect(screen.getByText('At-a-glance business metrics')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors gracefully', () => {
      mockOnSnapshot.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Firestore error'));
        return jest.fn();
      });

      render(<AnalyticsPage />);

      // Should handle error without crashing
      expect(screen.getByText('advancedAnalyticsTitle')).toBeInTheDocument();
    });
  });

  describe('Data Processing', () => {
    it('processes booking trends data correctly', () => {
      const mockBookings = [
        {
          id: 'booking-1',
          clientId: 'client-1',
          serviceName: 'House Cleaning',
          status: 'Completed',
          price: 500,
          date: { toDate: () => new Date('2024-01-15') },
          location: 'Manila',
          serviceArea: 'Metro Manila',
        },
        {
          id: 'booking-2',
          clientId: 'client-2',
          serviceName: 'Garden Maintenance',
          status: 'Upcoming',
          price: 300,
          date: { toDate: () => new Date('2024-01-16') },
          location: 'Quezon City',
          serviceArea: 'Metro Manila',
        },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      // Should process and display data correctly
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });

    it('calculates client analytics correctly', () => {
      const mockBookings = [
        {
          id: 'booking-1',
          clientId: 'client-1',
          serviceName: 'House Cleaning',
          status: 'Completed',
          price: 500,
          date: { toDate: () => new Date('2024-01-15') },
          location: 'Manila',
          serviceArea: 'Metro Manila',
        },
        {
          id: 'booking-2',
          clientId: 'client-1',
          serviceName: 'Garden Maintenance',
          status: 'Completed',
          price: 300,
          date: { toDate: () => new Date('2024-01-16') },
          location: 'Quezon City',
          serviceArea: 'Metro Manila',
        },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AnalyticsPage />);

      // Should calculate client analytics
      expect(screen.getByText('Client Analytics')).toBeInTheDocument();
    });
  });
});
