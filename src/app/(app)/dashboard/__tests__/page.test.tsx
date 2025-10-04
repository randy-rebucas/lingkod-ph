import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import DashboardPage from '../page';
import { getDb } from '@/shared/db';
import { findMatchingProviders } from '@/ai/flows/find-matching-providers';

// Mock the auth context
jest.mock('@/shared/auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Firebase
jest.mock('@/shared/db');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock AI flows
jest.mock('@/ai/flows/find-matching-providers');
const mockFindMatchingProviders = findMatchingProviders as jest.MockedFunction<typeof findMatchingProviders>;

// Mock Firestore functions
const mockOnSnapshot = jest.fn();
const mockGetDocs = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date, toMillis: () => date.getTime() })),
    toDate: jest.fn((timestamp) => new Date(timestamp.toMillis())),
    toMillis: jest.fn(() => Date.now()),
  },
}));

describe('DashboardPage', () => {
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
  };

  const mockProviderUser = {
    uid: 'provider-user-id',
    displayName: 'Provider User',
    email: 'provider@example.com',
  };

  const mockAgencyUser = {
    uid: 'agency-user-id',
    displayName: 'Agency User',
    email: 'agency@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firebase database
    mockGetDb.mockReturnValue({
      collection: mockCollection,
      doc: jest.fn(),
    } as any);

    // Mock Firestore query chain
    mockCollection.mockReturnValue({});
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
    mockLimit.mockReturnValue({});
  });

  describe('Provider Dashboard', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockProviderUser,
        userRole: 'provider',
        loading: false,
      } as any);

      // Mock Firestore data
      const mockBookings = [
        {
          id: 'booking-1',
          clientId: 'client-1',
          clientName: 'Client One',
          providerId: 'provider-user-id',
          providerName: 'Provider User',
          serviceName: 'Cleaning Service',
          status: 'Completed',
          price: 1000,
          date: { toDate: () => new Date('2024-01-15'), toMillis: () => 1705276800000 },
        },
        {
          id: 'booking-2',
          clientId: 'client-2',
          clientName: 'Client Two',
          providerId: 'provider-user-id',
          providerName: 'Provider User',
          serviceName: 'Repair Service',
          status: 'Upcoming',
          price: 500,
          date: { toDate: () => new Date('2024-01-20'), toMillis: () => 1705708800000 },
        },
      ];

      const mockReviews = [
        {
          id: 'review-1',
          providerId: 'provider-user-id',
          clientName: 'Client One',
          rating: 5,
          comment: 'Excellent service!',
          clientAvatar: 'avatar-url',
        },
      ];

      const mockPayouts = [
        {
          id: 'payout-1',
          amount: 800,
          status: 'Pending',
        },
      ];

      // Mock onSnapshot to return different data for different queries
      mockOnSnapshot.mockImplementation((query, callback) => {
        // Simulate different data based on query
        if (query.toString().includes('bookings')) {
          callback({
            docs: mockBookings.map(booking => ({
              id: booking.id,
              data: () => booking,
            })),
          });
        } else if (query.toString().includes('reviews')) {
          callback({
            docs: mockReviews.map(review => ({
              id: review.id,
              data: () => review,
            })),
          });
        } else if (query.toString().includes('payouts')) {
          callback({
            docs: mockPayouts.map(payout => ({
              id: payout.id,
              data: () => payout,
            })),
          });
        }
        return jest.fn(); // unsubscribe function
      });
    });

    it('renders provider dashboard with correct stats', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('Pending Payouts')).toBeInTheDocument();
        expect(screen.getByText('Upcoming Bookings')).toBeInTheDocument();
        expect(screen.getByText('Total Clients')).toBeInTheDocument();
        expect(screen.getByText('Overall Rating')).toBeInTheDocument();
      });

      // Check if stats are calculated correctly
      await waitFor(() => {
        expect(screen.getByText('₱1,000.00')).toBeInTheDocument(); // Total revenue
        expect(screen.getByText('₱800.00')).toBeInTheDocument(); // Pending payouts
        expect(screen.getByText('1')).toBeInTheDocument(); // Upcoming bookings
        expect(screen.getByText('2')).toBeInTheDocument(); // Total clients
        expect(screen.getByText('5.0')).toBeInTheDocument(); // Overall rating
      });
    });

    it('displays earnings chart', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Earnings Overview')).toBeInTheDocument();
        expect(screen.getByText('Your earnings for the last 6 months.')).toBeInTheDocument();
      });
    });

    it('shows today\'s schedule', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
        expect(screen.getByText('Your upcoming jobs for today.')).toBeInTheDocument();
      });
    });

    it('displays recent reviews', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
        expect(screen.getByText('What your clients are saying about you.')).toBeInTheDocument();
        expect(screen.getByText('Client One')).toBeInTheDocument();
        expect(screen.getByText('Excellent service!')).toBeInTheDocument();
      });
    });
  });

  describe('Client Dashboard', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);

      // Mock providers data
      const mockProviders = [
        {
          uid: 'provider-1',
          displayName: 'John Doe',
          bio: 'Professional cleaner',
          photoURL: 'photo-url',
          rating: 4.5,
          reviewCount: 10,
          availabilityStatus: 'available',
          keyServices: ['Cleaning', 'Maintenance'],
          address: 'Manila, Philippines',
          isVerified: true,
          role: 'provider',
        },
        {
          uid: 'agency-1',
          displayName: 'Clean Pro Agency',
          bio: 'Professional cleaning agency',
          photoURL: 'agency-photo-url',
          rating: 4.8,
          reviewCount: 25,
          availabilityStatus: 'available',
          keyServices: ['Cleaning', 'Deep Cleaning'],
          address: 'Quezon City, Philippines',
          isVerified: true,
          role: 'agency',
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockProviders.map(provider => ({
          id: provider.uid,
          data: () => provider,
        })),
      } as any);
    });

    it('renders client dashboard with provider search', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('searchPlaceholder')).toBeInTheDocument();
        expect(screen.getByText('search')).toBeInTheDocument();
      });
    });

    it('displays providers in grid and list view', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Clean Pro Agency')).toBeInTheDocument();
      });

      // Test view mode toggle
      const gridButton = screen.getByRole('button', { name: /grid/i });
      const listButton = screen.getByRole('button', { name: /list/i });

      expect(gridButton).toBeInTheDocument();
      expect(listButton).toBeInTheDocument();
    });

    it('handles smart search functionality', async () => {
      mockFindMatchingProviders.mockResolvedValue({
        providers: [
          {
            providerId: 'provider-1',
            rank: 1,
            reasoning: 'Best match for cleaning services',
          },
        ],
      });

      render(<DashboardPage />);

      const searchInput = screen.getByPlaceholderText('searchPlaceholder');
      const searchButton = screen.getByText('search');

      fireEvent.change(searchInput, { target: { value: 'cleaning service' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(mockFindMatchingProviders).toHaveBeenCalledWith({
          query: 'cleaning service',
        });
      });
    });

    it('handles favorite provider toggle', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const favoriteButtons = screen.getAllByRole('button');
        const heartButton = favoriteButtons.find(button => 
          button.querySelector('svg')?.getAttribute('data-testid') === 'heart'
        );
        
        if (heartButton) {
          fireEvent.click(heartButton);
        }
      });
    });
  });

  describe('Agency Dashboard', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAgencyUser,
        userRole: 'agency',
        loading: false,
      } as any);

      // Mock agency data
      const mockAgencyProviders = [
        {
          uid: 'provider-1',
          displayName: 'Agency Provider 1',
          rating: 4.5,
          reviewCount: 10,
          totalRevenue: 5000,
        },
        {
          uid: 'provider-2',
          displayName: 'Agency Provider 2',
          rating: 4.8,
          reviewCount: 15,
          totalRevenue: 7500,
        },
      ];

      const mockAgencyBookings = [
        {
          id: 'booking-1',
          clientName: 'Client One',
          providerName: 'Agency Provider 1',
          status: 'Completed',
          price: 1000,
          date: { toDate: () => new Date('2024-01-15'), toMillis: () => 1705276800000 },
        },
      ];

      const mockAgencyPayouts = [
        {
          id: 'payout-1',
          amount: 2000,
          status: 'Pending',
        },
      ];

      mockGetDocs.mockImplementation((query) => {
        if (query.toString().includes('users') && query.toString().includes('agencyId')) {
          return Promise.resolve({
            docs: mockAgencyProviders.map(provider => ({
              id: provider.uid,
              data: () => provider,
            })),
          });
        } else if (query.toString().includes('bookings')) {
          return Promise.resolve({
            docs: mockAgencyBookings.map(booking => ({
              id: booking.id,
              data: () => booking,
            })),
          });
        } else if (query.toString().includes('payouts')) {
          return Promise.resolve({
            docs: mockAgencyPayouts.map(payout => ({
              id: payout.id,
              data: () => payout,
            })),
          });
        }
        return Promise.resolve({ docs: [] });
      });
    });

    it('renders agency dashboard with correct stats', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('Completed Bookings')).toBeInTheDocument();
        expect(screen.getByText('Managed Providers')).toBeInTheDocument();
        expect(screen.getByText('Agency Rating')).toBeInTheDocument();
        expect(screen.getByText('Pending Payouts')).toBeInTheDocument();
      });
    });

    it('displays recent bookings table', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Recent Bookings')).toBeInTheDocument();
        expect(screen.getByText('The latest bookings across your agency.')).toBeInTheDocument();
      });
    });

    it('shows top performing providers', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Top Performing Providers')).toBeInTheDocument();
        expect(screen.getByText('Your most valuable providers by revenue.')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state for provider dashboard', () => {
      mockUseAuth.mockReturnValue({
        user: mockProviderUser,
        userRole: 'provider',
        loading: true,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('loading')).toBeInTheDocument();
    });

    it('shows loading state for client dashboard', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: true,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('loading')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: mockProviderUser,
        userRole: 'provider',
        loading: false,
      } as any);

      mockOnSnapshot.mockImplementation((query, callback, errorCallback) => {
        if (errorCallback) {
          errorCallback(new Error('Firestore error'));
        }
        return jest.fn();
      });

      render(<DashboardPage />);

      // Should not crash and should show some content
      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });
    });
  });
});
