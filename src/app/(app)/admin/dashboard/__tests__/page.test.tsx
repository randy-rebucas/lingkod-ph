import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import AdminDashboardPage from '../page';
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
  onSnapshot: mockOnSnapshot,
}));

const mockQuery = jest.fn(() => ({
  orderBy: jest.fn(() => ({
    limit: jest.fn(() => ({
      onSnapshot: mockOnSnapshot,
    })),
  })),
}));

describe('AdminDashboardPage', () => {
  const mockUser = {
    uid: 'test-admin-id',
    email: 'admin@example.com',
    displayName: 'Admin User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      userRole: 'admin',
      loading: false,
    } as any);

    mockGetDb.mockReturnValue({
      collection: mockCollection,
      query: mockQuery,
    } as any);

    // Mock Firestore functions
    jest.doMock('firebase/firestore', () => ({
      collection: mockCollection,
      query: mockQuery,
      onSnapshot: mockOnSnapshot,
      orderBy: jest.fn(),
      limit: jest.fn(),
    }));
  });

  describe('Access Control', () => {
    it('shows access denied for non-admin users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);

      render(<AdminDashboardPage />);

      expect(screen.getByText('accessDenied')).toBeInTheDocument();
      expect(screen.getByText('adminOnly')).toBeInTheDocument();
    });

    it('renders admin dashboard for admin users', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: jest.fn(),
          size: 0,
        });
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('subtitle')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('renders the admin dashboard with correct title', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: jest.fn(),
          size: 0,
        });
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('subtitle')).toBeInTheDocument();
    });

    it('renders KPI cards', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: jest.fn(),
          size: 0,
        });
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      expect(screen.getByText('totalRevenue')).toBeInTheDocument();
      expect(screen.getByText('totalBookings')).toBeInTheDocument();
      expect(screen.getByText('totalUsers')).toBeInTheDocument();
      expect(screen.getByText('totalProviders')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockOnSnapshot.mockImplementation(() => {
        // Don't call callback immediately to simulate loading
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      // Should show loading skeletons
      const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics Calculation', () => {
    it('calculates user statistics correctly', () => {
      const mockUsers = [
        { data: () => ({ role: 'client' }) },
        { data: () => ({ role: 'provider' }) },
        { data: () => ({ role: 'agency' }) },
        { data: () => ({ role: 'client' }) },
        { data: () => ({ role: 'provider' }) },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: (fn: any) => mockUsers.forEach(fn),
          size: 5,
        });
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      // Should display correct counts
      expect(screen.getByText('5')).toBeInTheDocument(); // Total users
    });

    it('calculates booking statistics correctly', () => {
      const mockBookings = [
        { data: () => ({ status: 'Completed', price: 500 }) },
        { data: () => ({ status: 'Completed', price: 300 }) },
        { data: () => ({ status: 'Cancelled', price: 200 }) },
        { data: () => ({ status: 'Upcoming', price: 400 }) },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: (fn: any) => mockBookings.forEach(fn),
          size: 4,
        });
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      // Should display correct counts
      expect(screen.getByText('4')).toBeInTheDocument(); // Total bookings
    });
  });

  describe('Recent Bookings Table', () => {
    const mockRecentBookings = [
      {
        id: 'booking-1',
        serviceName: 'House Cleaning',
        clientName: 'John Doe',
        providerName: 'Jane Smith',
        status: 'Completed',
      },
      {
        id: 'booking-2',
        serviceName: 'Garden Maintenance',
        clientName: 'Bob Wilson',
        providerName: 'Alice Brown',
        status: 'Upcoming',
      },
    ];

    it('displays recent bookings table', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: jest.fn(),
          size: 0,
        });
        return jest.fn();
      });

      // Mock recent bookings query
      const mockRecentBookingsSnapshot = {
        docs: mockRecentBookings.map(booking => ({
          id: booking.id,
          data: () => booking,
        })),
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback(mockRecentBookingsSnapshot);
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      expect(screen.getByText('recentBookings')).toBeInTheDocument();
      expect(screen.getByText('The latest bookings made on the platform.')).toBeInTheDocument();
    });

    it('displays booking data in table', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: jest.fn(),
          size: 0,
        });
        return jest.fn();
      });

      // Mock recent bookings query
      const mockRecentBookingsSnapshot = {
        docs: mockRecentBookings.map(booking => ({
          id: booking.id,
          data: () => booking,
        })),
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback(mockRecentBookingsSnapshot);
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      expect(screen.getByText('serviceName')).toBeInTheDocument();
      expect(screen.getByText('clientName')).toBeInTheDocument();
      expect(screen.getByText('providerName')).toBeInTheDocument();
      expect(screen.getByText('status')).toBeInTheDocument();
    });

    it('shows empty state when no recent bookings', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: jest.fn(),
          size: 0,
        });
        return jest.fn();
      });

      // Mock empty recent bookings
      const mockEmptyBookings = {
        docs: [],
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback(mockEmptyBookings);
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      expect(screen.getByText('No recent bookings.')).toBeInTheDocument();
    });
  });

  describe('Recent Users Table', () => {
    const mockRecentUsers = [
      {
        uid: 'user-1',
        displayName: 'John Doe',
        email: 'john@example.com',
        role: 'client',
        photoURL: 'https://example.com/photo1.jpg',
      },
      {
        uid: 'user-2',
        displayName: 'Jane Smith',
        email: 'jane@example.com',
        role: 'provider',
        photoURL: 'https://example.com/photo2.jpg',
      },
    ];

    it('displays recent users table', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: jest.fn(),
          size: 0,
        });
        return jest.fn();
      });

      // Mock recent users query
      const mockRecentUsersSnapshot = {
        docs: mockRecentUsers.map(user => ({
          id: user.uid,
          data: () => user,
        })),
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback(mockRecentUsersSnapshot);
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      expect(screen.getByText('recentUsers')).toBeInTheDocument();
      expect(screen.getByText('The latest users to join the platform.')).toBeInTheDocument();
    });

    it('displays user data in table', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: jest.fn(),
          size: 0,
        });
        return jest.fn();
      });

      // Mock recent users query
      const mockRecentUsersSnapshot = {
        docs: mockRecentUsers.map(user => ({
          id: user.uid,
          data: () => user,
        })),
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback(mockRecentUsersSnapshot);
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('client')).toBeInTheDocument();
    });

    it('shows empty state when no recent users', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: jest.fn(),
          size: 0,
        });
        return jest.fn();
      });

      // Mock empty recent users
      const mockEmptyUsers = {
        docs: [],
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback(mockEmptyUsers);
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      expect(screen.getByText('No new users.')).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('displays correct status badges for bookings', () => {
      const mockBookings = [
        {
          id: 'booking-1',
          serviceName: 'House Cleaning',
          clientName: 'John Doe',
          providerName: 'Jane Smith',
          status: 'Completed',
        },
        {
          id: 'booking-2',
          serviceName: 'Garden Maintenance',
          clientName: 'Bob Wilson',
          providerName: 'Alice Brown',
          status: 'Upcoming',
        },
        {
          id: 'booking-3',
          serviceName: 'Plumbing',
          clientName: 'Charlie Brown',
          providerName: 'David Wilson',
          status: 'Cancelled',
        },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: jest.fn(),
          size: 0,
        });
        return jest.fn();
      });

      // Mock recent bookings query
      const mockRecentBookingsSnapshot = {
        docs: mockBookings.map(booking => ({
          id: booking.id,
          data: () => booking,
        })),
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback(mockRecentBookingsSnapshot);
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  describe('User Role Badges', () => {
    it('displays correct role badges for users', () => {
      const mockUsers = [
        {
          uid: 'user-1',
          displayName: 'John Doe',
          email: 'john@example.com',
          role: 'client',
          photoURL: 'https://example.com/photo1.jpg',
        },
        {
          uid: 'user-2',
          displayName: 'Jane Smith',
          email: 'jane@example.com',
          role: 'provider',
          photoURL: 'https://example.com/photo2.jpg',
        },
        {
          uid: 'user-3',
          displayName: 'Bob Wilson',
          email: 'bob@example.com',
          role: 'agency',
          photoURL: 'https://example.com/photo3.jpg',
        },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          forEach: jest.fn(),
          size: 0,
        });
        return jest.fn();
      });

      // Mock recent users query
      const mockRecentUsersSnapshot = {
        docs: mockUsers.map(user => ({
          id: user.uid,
          data: () => user,
        })),
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback(mockRecentUsersSnapshot);
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      expect(screen.getByText('client')).toBeInTheDocument();
      expect(screen.getByText('provider')).toBeInTheDocument();
      expect(screen.getByText('agency')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors gracefully', () => {
      mockOnSnapshot.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Firestore error'));
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      // Should handle error without crashing
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  describe('Data Updates', () => {
    it('updates statistics when data changes', () => {
      let callback: any;
      mockOnSnapshot.mockImplementation((cb) => {
        callback = cb;
        return jest.fn();
      });

      render(<AdminDashboardPage />);

      // Simulate data change
      const newMockUsers = [
        { data: () => ({ role: 'client' }) },
        { data: () => ({ role: 'provider' }) },
      ];

      callback({
        forEach: (fn: any) => newMockUsers.forEach(fn),
        size: 2,
      });

      // Should update with new data
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Component Cleanup', () => {
    it('cleans up Firestore listeners on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const { unmount } = render(<AdminDashboardPage />);

      unmount();

      // Should call unsubscribe for each listener
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
