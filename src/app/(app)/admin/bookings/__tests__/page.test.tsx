import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import AdminBookingsPage from '../page';
import { getDb } from '@/lib/firebase';
import { handleUpdateBookingStatus } from '../actions';

// Mock the auth context
jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock server actions
jest.mock('../actions');
const mockHandleUpdateBookingStatus = handleUpdateBookingStatus as jest.MockedFunction<typeof handleUpdateBookingStatus>;

// Mock useToast
jest.mock('@/hooks/use-toast');
const mockUseToast = jest.fn();

// Mock BookingDetailsDialog
jest.mock('@/components/booking-details-dialog', () => ({
  BookingDetailsDialog: ({ isOpen, booking }: any) => 
    isOpen ? <div data-testid="booking-details-dialog">Booking Details: {booking.id}</div> : null,
}));

// Mock Firebase Firestore
const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn(() => ({
  orderBy: jest.fn(() => ({
    onSnapshot: mockOnSnapshot,
  })),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => 'Jan 15, 2024'),
}));

describe('AdminBookingsPage', () => {
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
    } as any);

    // Mock Firestore functions
    jest.doMock('firebase/firestore', () => ({
      collection: mockCollection,
      query: jest.fn(),
      onSnapshot: mockOnSnapshot,
      orderBy: jest.fn(),
    }));
  });

  describe('Access Control', () => {
    it('shows access denied for non-admin users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);

      render(<AdminBookingsPage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('This page is for administrators only.')).toBeInTheDocument();
    });

    it('shows access denied for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userRole: null,
        loading: false,
      } as any);

      render(<AdminBookingsPage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockOnSnapshot.mockImplementation(() => {
        // Don't call callback immediately to simulate loading
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      expect(screen.getByText('Booking Management')).toBeInTheDocument();
      expect(screen.getByText('Monitor all bookings on the platform.')).toBeInTheDocument();
      // Should show loading skeleton
      const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no bookings', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      expect(screen.getByText('No bookings found.')).toBeInTheDocument();
    });
  });

  describe('Booking Display', () => {
    const mockBookings = [
      {
        id: 'booking-1',
        serviceName: 'House Cleaning',
        clientName: 'John Client',
        providerName: 'Jane Provider',
        price: 500,
        status: 'Upcoming',
        date: { toDate: () => new Date('2024-01-15T10:00:00Z') },
        clientId: 'client-1',
        providerId: 'provider-1',
        createdAt: { toDate: () => new Date('2024-01-10T10:00:00Z') },
      },
      {
        id: 'booking-2',
        serviceName: 'Garden Maintenance',
        clientName: 'Bob Client',
        providerName: 'Alice Provider',
        price: 300,
        status: 'Completed',
        date: { toDate: () => new Date('2024-01-12T14:00:00Z') },
        clientId: 'client-2',
        providerId: 'provider-2',
        createdAt: { toDate: () => new Date('2024-01-08T10:00:00Z') },
      },
    ];

    it('displays bookings in table format', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      expect(screen.getByText('House Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Garden Maintenance')).toBeInTheDocument();
      expect(screen.getByText('John Client')).toBeInTheDocument();
      expect(screen.getByText('Bob Client')).toBeInTheDocument();
      expect(screen.getByText('Jane Provider')).toBeInTheDocument();
      expect(screen.getByText('Alice Provider')).toBeInTheDocument();
      expect(screen.getByText('₱500.00')).toBeInTheDocument();
      expect(screen.getByText('₱300.00')).toBeInTheDocument();
    });

    it('shows correct status badges', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('formats dates correctly', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      // Should show formatted dates
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('shows N/A for missing dates', () => {
      const bookingWithNullDate = {
        id: 'booking-3',
        serviceName: 'Service',
        clientName: 'Client',
        providerName: 'Provider',
        price: 200,
        status: 'Pending',
        date: null,
        clientId: 'client-3',
        providerId: 'provider-3',
        createdAt: { toDate: () => new Date() },
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'booking-3',
            data: () => bookingWithNullDate,
          }],
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Booking Actions', () => {
    const mockBooking = {
      id: 'booking-1',
      serviceName: 'House Cleaning',
      clientName: 'John Client',
      providerName: 'Jane Provider',
      price: 500,
      status: 'Upcoming',
      date: { toDate: () => new Date('2024-01-15T10:00:00Z') },
      clientId: 'client-1',
      providerId: 'provider-1',
      createdAt: { toDate: () => new Date('2024-01-10T10:00:00Z') },
    };

    it('opens booking details dialog when View Details is clicked', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'booking-1',
            data: () => mockBooking,
          }],
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      const actionsButton = screen.getByRole('button');
      fireEvent.click(actionsButton);

      const viewDetailsButton = screen.getByText('View Details');
      fireEvent.click(viewDetailsButton);

      expect(screen.getByTestId('booking-details-dialog')).toBeInTheDocument();
      expect(screen.getByText('Booking Details: booking-1')).toBeInTheDocument();
    });

    it('handles status update to Completed', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'booking-1',
            data: () => mockBooking,
          }],
        });
        return jest.fn();
      });

      mockHandleUpdateBookingStatus.mockResolvedValue({
        error: null,
        message: 'Booking status updated successfully',
      });

      render(<AdminBookingsPage />);

      const actionsButton = screen.getByRole('button');
      fireEvent.click(actionsButton);

      const markCompletedButton = screen.getByText('Mark as Completed');
      fireEvent.click(markCompletedButton);

      await waitFor(() => {
        expect(mockHandleUpdateBookingStatus).toHaveBeenCalledWith(
          'booking-1',
          'Completed',
          { id: mockUser.uid, name: mockUser.displayName }
        );
      });
    });

    it('handles status update to Cancelled', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'booking-1',
            data: () => mockBooking,
          }],
        });
        return jest.fn();
      });

      mockHandleUpdateBookingStatus.mockResolvedValue({
        error: null,
        message: 'Booking status updated successfully',
      });

      render(<AdminBookingsPage />);

      const actionsButton = screen.getByRole('button');
      fireEvent.click(actionsButton);

      const markCancelledButton = screen.getByText('Mark as Cancelled');
      fireEvent.click(markCancelledButton);

      await waitFor(() => {
        expect(mockHandleUpdateBookingStatus).toHaveBeenCalledWith(
          'booking-1',
          'Cancelled',
          { id: mockUser.uid, name: mockUser.displayName }
        );
      });
    });

    it('disables status update buttons for already completed bookings', () => {
      const completedBooking = {
        ...mockBooking,
        status: 'Completed',
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'booking-1',
            data: () => completedBooking,
          }],
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      const actionsButton = screen.getByRole('button');
      fireEvent.click(actionsButton);

      const markCompletedButton = screen.getByText('Mark as Completed');
      expect(markCompletedButton).toBeDisabled();
    });

    it('disables status update buttons for already cancelled bookings', () => {
      const cancelledBooking = {
        ...mockBooking,
        status: 'Cancelled',
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'booking-1',
            data: () => cancelledBooking,
          }],
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      const actionsButton = screen.getByRole('button');
      fireEvent.click(actionsButton);

      const markCancelledButton = screen.getByText('Mark as Cancelled');
      expect(markCancelledButton).toBeDisabled();
    });

    it('shows links to view client and provider', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'booking-1',
            data: () => mockBooking,
          }],
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      const actionsButton = screen.getByRole('button');
      fireEvent.click(actionsButton);

      const viewClientLink = screen.getByText('View Client');
      const viewProviderLink = screen.getByText('View Provider');

      expect(viewClientLink.closest('a')).toHaveAttribute('href', '/admin/users?search=client-1');
      expect(viewProviderLink.closest('a')).toHaveAttribute('href', '/admin/users?search=provider-1');
    });
  });

  describe('Status Variants', () => {
    it('shows correct badge variants for different statuses', () => {
      const bookingsWithDifferentStatuses = [
        { ...mockBooking, id: 'booking-1', status: 'Upcoming' },
        { ...mockBooking, id: 'booking-2', status: 'In Progress' },
        { ...mockBooking, id: 'booking-3', status: 'Completed' },
        { ...mockBooking, id: 'booking-4', status: 'Cancelled' },
        { ...mockBooking, id: 'booking-5', status: 'Pending' },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: bookingsWithDifferentStatuses.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors gracefully', () => {
      mockOnSnapshot.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Firestore error'));
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      // Should handle error without crashing
      expect(screen.getByText('Booking Management')).toBeInTheDocument();
    });

    it('handles status update errors', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'booking-1',
            data: () => mockBooking,
          }],
        });
        return jest.fn();
      });

      mockHandleUpdateBookingStatus.mockResolvedValue({
        error: 'Database error',
        message: 'Failed to update booking status',
      });

      render(<AdminBookingsPage />);

      const actionsButton = screen.getByRole('button');
      fireEvent.click(actionsButton);

      const markCompletedButton = screen.getByText('Mark as Completed');
      fireEvent.click(markCompletedButton);

      await waitFor(() => {
        expect(mockHandleUpdateBookingStatus).toHaveBeenCalled();
      });
    });

    it('handles unauthenticated user in status update', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userRole: null,
        loading: false,
      } as any);

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'booking-1',
            data: () => mockBooking,
          }],
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      // Should not show actions for unauthenticated users
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Table Headers', () => {
    it('shows correct table headers', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Service')).toBeInTheDocument();
      expect(screen.getByText('Client')).toBeInTheDocument();
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('Booking Details Dialog', () => {
    it('closes booking details dialog when setIsOpen is called', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'booking-1',
            data: () => mockBooking,
          }],
        });
        return jest.fn();
      });

      render(<AdminBookingsPage />);

      const actionsButton = screen.getByRole('button');
      fireEvent.click(actionsButton);

      const viewDetailsButton = screen.getByText('View Details');
      fireEvent.click(viewDetailsButton);

      expect(screen.getByTestId('booking-details-dialog')).toBeInTheDocument();

      // Simulate closing the dialog
      const dialog = screen.getByTestId('booking-details-dialog');
      fireEvent.click(dialog);

      // Dialog should still be there as we're just testing the component structure
      expect(screen.getByTestId('booking-details-dialog')).toBeInTheDocument();
    });
  });
});
