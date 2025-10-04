import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import NotificationsPage from '../page';
import { getDb } from '@/shared/db';

// Mock the auth context
jest.mock('@/shared/auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Firebase
jest.mock('@/shared/db');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock useToast
jest.mock('@/hooks/use-toast');
const mockUseToast = jest.fn();

// Mock Firebase Firestore
const mockOnSnapshot = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn(() => ({
  where: jest.fn(() => ({
    orderBy: jest.fn(() => ({
      onSnapshot: mockOnSnapshot,
    })),
  })),
}));

describe('NotificationsPage', () => {
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
      doc: jest.fn(),
      updateDoc: mockUpdateDoc,
      deleteDoc: mockDeleteDoc,
      query: jest.fn(),
      where: jest.fn(),
      onSnapshot: mockOnSnapshot,
      orderBy: jest.fn(),
    }));
  });

  describe('Rendering', () => {
    it('renders the notifications page with correct title', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Stay updated with your latest notifications.')).toBeInTheDocument();
    });

    it('renders filter buttons', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Unread')).toBeInTheDocument();
      expect(screen.getByText('Starred')).toBeInTheDocument();
      expect(screen.getByText('Archived')).toBeInTheDocument();
    });

    it('renders search input', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      expect(screen.getByPlaceholderText('Search notifications...')).toBeInTheDocument();
    });

    it('renders mark all as read button', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      expect(screen.getByText('Mark All as Read')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockOnSnapshot.mockImplementation(() => {
        // Don't call callback immediately to simulate loading
        return jest.fn();
      });

      render(<NotificationsPage />);

      // Should show loading skeletons
      const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no notifications', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      expect(screen.getByText('No notifications found.')).toBeInTheDocument();
    });
  });

  describe('Notification Display', () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        title: 'New Booking Request',
        message: 'You have a new booking request for House Cleaning service.',
        type: 'booking_request',
        read: false,
        starred: false,
        archived: false,
        createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
        data: {
          bookingId: 'booking-1',
          clientId: 'client-1',
        },
      },
      {
        id: 'notif-2',
        title: 'Payment Received',
        message: 'Payment of ₱500.00 has been received for your service.',
        type: 'payment_received',
        read: true,
        starred: true,
        archived: false,
        createdAt: { toDate: () => new Date('2024-01-16T14:30:00Z') },
        data: {
          transactionId: 'txn-1',
          amount: 500,
        },
      },
      {
        id: 'notif-3',
        title: 'Agency Invitation',
        message: 'You have been invited to join ABC Cleaning Agency.',
        type: 'agency_invitation',
        read: false,
        starred: false,
        archived: false,
        createdAt: { toDate: () => new Date('2024-01-17T09:15:00Z') },
        data: {
          agencyId: 'agency-1',
          agencyName: 'ABC Cleaning Agency',
        },
      },
    ];

    it('displays notifications in list format', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      expect(screen.getByText('New Booking Request')).toBeInTheDocument();
      expect(screen.getByText('Payment Received')).toBeInTheDocument();
      expect(screen.getByText('Agency Invitation')).toBeInTheDocument();
    });

    it('displays notification messages', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      expect(screen.getByText('You have a new booking request for House Cleaning service.')).toBeInTheDocument();
      expect(screen.getByText('Payment of ₱500.00 has been received for your service.')).toBeInTheDocument();
      expect(screen.getByText('You have been invited to join ABC Cleaning Agency.')).toBeInTheDocument();
    });

    it('shows unread indicator for unread notifications', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      // Should show unread indicators (blue dot or similar)
      const unreadIndicators = document.querySelectorAll('[data-testid="unread-indicator"]');
      expect(unreadIndicators.length).toBe(2); // 2 unread notifications
    });

    it('shows starred indicator for starred notifications', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      // Should show starred indicators
      const starredIndicators = document.querySelectorAll('[data-testid="starred-indicator"]');
      expect(starredIndicators.length).toBe(1); // 1 starred notification
    });
  });

  describe('Filtering', () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        title: 'Unread Notification',
        message: 'This is unread',
        type: 'booking_request',
        read: false,
        starred: false,
        archived: false,
        createdAt: { toDate: () => new Date() },
      },
      {
        id: 'notif-2',
        title: 'Starred Notification',
        message: 'This is starred',
        type: 'payment_received',
        read: true,
        starred: true,
        archived: false,
        createdAt: { toDate: () => new Date() },
      },
      {
        id: 'notif-3',
        title: 'Archived Notification',
        message: 'This is archived',
        type: 'agency_invitation',
        read: true,
        starred: false,
        archived: true,
        createdAt: { toDate: () => new Date() },
      },
    ];

    it('filters to show only unread notifications', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const unreadButton = screen.getByText('Unread');
      fireEvent.click(unreadButton);

      expect(screen.getByText('Unread Notification')).toBeInTheDocument();
      expect(screen.queryByText('Starred Notification')).not.toBeInTheDocument();
      expect(screen.queryByText('Archived Notification')).not.toBeInTheDocument();
    });

    it('filters to show only starred notifications', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const starredButton = screen.getByText('Starred');
      fireEvent.click(starredButton);

      expect(screen.getByText('Starred Notification')).toBeInTheDocument();
      expect(screen.queryByText('Unread Notification')).not.toBeInTheDocument();
      expect(screen.queryByText('Archived Notification')).not.toBeInTheDocument();
    });

    it('filters to show only archived notifications', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const archivedButton = screen.getByText('Archived');
      fireEvent.click(archivedButton);

      expect(screen.getByText('Archived Notification')).toBeInTheDocument();
      expect(screen.queryByText('Unread Notification')).not.toBeInTheDocument();
      expect(screen.queryByText('Starred Notification')).not.toBeInTheDocument();
    });

    it('shows all notifications when All filter is selected', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const allButton = screen.getByText('All');
      fireEvent.click(allButton);

      expect(screen.getByText('Unread Notification')).toBeInTheDocument();
      expect(screen.getByText('Starred Notification')).toBeInTheDocument();
      expect(screen.getByText('Archived Notification')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        title: 'Booking Request',
        message: 'New booking for cleaning service',
        type: 'booking_request',
        read: false,
        starred: false,
        archived: false,
        createdAt: { toDate: () => new Date() },
      },
      {
        id: 'notif-2',
        title: 'Payment Notification',
        message: 'Payment received for your service',
        type: 'payment_received',
        read: true,
        starred: false,
        archived: false,
        createdAt: { toDate: () => new Date() },
      },
    ];

    it('filters notifications based on search query', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const searchInput = screen.getByPlaceholderText('Search notifications...');
      fireEvent.change(searchInput, { target: { value: 'booking' } });

      expect(screen.getByText('Booking Request')).toBeInTheDocument();
      expect(screen.queryByText('Payment Notification')).not.toBeInTheDocument();
    });

    it('shows no results when search query matches nothing', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const searchInput = screen.getByPlaceholderText('Search notifications...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No notifications found matching your search.')).toBeInTheDocument();
    });
  });

  describe('Notification Actions', () => {
    const mockNotification = {
      id: 'notif-1',
      title: 'Test Notification',
      message: 'Test message',
      type: 'booking_request',
      read: false,
      starred: false,
      archived: false,
      createdAt: { toDate: () => new Date() },
    };

    it('marks notification as read when mark as read is clicked', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'notif-1',
            data: () => mockNotification,
          }],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const markAsReadButton = screen.getByText('Mark as Read');
      fireEvent.click(markAsReadButton);

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          { read: true }
        );
      });
    });

    it('marks notification as starred when star button is clicked', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'notif-1',
            data: () => mockNotification,
          }],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const starButton = screen.getByText('Star');
      fireEvent.click(starButton);

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          { starred: true }
        );
      });
    });

    it('archives notification when archive button is clicked', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'notif-1',
            data: () => mockNotification,
          }],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const archiveButton = screen.getByText('Archive');
      fireEvent.click(archiveButton);

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          { archived: true }
        );
      });
    });

    it('deletes notification when delete button is clicked', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'notif-1',
            data: () => mockNotification,
          }],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteDoc).toHaveBeenCalled();
      });
    });
  });

  describe('Agency Invitation Actions', () => {
    const mockInvitationNotification = {
      id: 'notif-1',
      title: 'Agency Invitation',
      message: 'You have been invited to join ABC Cleaning Agency.',
      type: 'agency_invitation',
      read: false,
      starred: false,
      archived: false,
      createdAt: { toDate: () => new Date() },
      data: {
        agencyId: 'agency-1',
        agencyName: 'ABC Cleaning Agency',
      },
    };

    it('shows accept and decline buttons for agency invitations', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'notif-1',
            data: () => mockInvitationNotification,
          }],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      expect(screen.getByText('Accept')).toBeInTheDocument();
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });

    it('handles agency invitation acceptance', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'notif-1',
            data: () => mockInvitationNotification,
          }],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const acceptButton = screen.getByText('Accept');
      fireEvent.click(acceptButton);

      // Should show success message or handle acceptance
      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalled();
      });
    });

    it('handles agency invitation decline', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'notif-1',
            data: () => mockInvitationNotification,
          }],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const declineButton = screen.getByText('Decline');
      fireEvent.click(declineButton);

      // Should show success message or handle decline
      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalled();
      });
    });
  });

  describe('Mark All as Read', () => {
    it('marks all notifications as read when button is clicked', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          title: 'Notification 1',
          message: 'Message 1',
          type: 'booking_request',
          read: false,
          starred: false,
          archived: false,
          createdAt: { toDate: () => new Date() },
        },
        {
          id: 'notif-2',
          title: 'Notification 2',
          message: 'Message 2',
          type: 'payment_received',
          read: false,
          starred: false,
          archived: false,
          createdAt: { toDate: () => new Date() },
        },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      const markAllAsReadButton = screen.getByText('Mark All as Read');
      fireEvent.click(markAllAsReadButton);

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors gracefully', () => {
      mockOnSnapshot.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Firestore error'));
        return jest.fn();
      });

      render(<NotificationsPage />);

      // Should handle error without crashing
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('handles unauthenticated user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userRole: null,
        loading: false,
      } as any);

      render(<NotificationsPage />);

      // Should not show notifications content
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('formats dates correctly', () => {
      const mockNotification = {
        id: 'notif-1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'booking_request',
        read: false,
        starred: false,
        archived: false,
        createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'notif-1',
            data: () => mockNotification,
          }],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      // Should display formatted date
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });
  });

  describe('Notification Count', () => {
    it('displays correct notification count', () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Notification 1', message: 'Message 1', type: 'booking_request', read: false, starred: false, archived: false, createdAt: { toDate: () => new Date() } },
        { id: 'notif-2', title: 'Notification 2', message: 'Message 2', type: 'payment_received', read: true, starred: false, archived: false, createdAt: { toDate: () => new Date() } },
      ];

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockNotifications.map(notification => ({
            id: notification.id,
            data: () => notification,
          })),
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      expect(screen.getByText('2 notifications found')).toBeInTheDocument();
    });

    it('displays singular form for single notification', () => {
      const mockNotification = {
        id: 'notif-1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'booking_request',
        read: false,
        starred: false,
        archived: false,
        createdAt: { toDate: () => new Date() },
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'notif-1',
            data: () => mockNotification,
          }],
        });
        return jest.fn();
      });

      render(<NotificationsPage />);

      expect(screen.getByText('1 notification found')).toBeInTheDocument();
    });
  });
});
