import { 
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
  deleteAllReadNotifications,
  createNotification,
  getUnreadNotificationCount,
  getNotificationsByType
} from '../actions';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  getDb: jest.fn()
}));

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockDb = {};

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(),
}));

const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;

describe('Notifications Actions', () => {
  const mockNotification = {
    id: 'notification-123',
    type: 'new_message' as const,
    message: 'You have a new message',
    link: '/messages',
    read: false,
    createdAt: new Date(),
    priority: 'medium' as const,
    metadata: {}
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);

    // Mock Firestore functions
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockNotification,
      id: 'notification-123'
    } as any);
    mockGetDocs.mockResolvedValue({
      docs: [],
      empty: true
    } as any);
    mockAddDoc.mockResolvedValue({ id: 'new-doc-id' } as any);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockQuery.mockReturnValue({} as any);
    mockWhere.mockReturnValue({} as any);
    mockOrderBy.mockReturnValue({} as any);
    mockCollection.mockReturnValue({} as any);
    mockServerTimestamp.mockReturnValue('server-timestamp' as any);
  });

  describe('getUserNotifications', () => {
    it('should get user notifications successfully', async () => {
      const mockNotifications = [mockNotification];

      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map(n => ({ id: n.id, data: () => n }))
      } as any);

      const result = await getUserNotifications('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNotifications);
      expect(result.message).toBe('Notifications retrieved successfully');
    });

    it('should handle empty results', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await getUserNotifications('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('Notifications retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getUserNotifications('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const result = await markNotificationAsRead('user-123', 'notification-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Notification marked as read');
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const result = await markNotificationAsRead('', 'notification-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      const result = await deleteNotification('user-123', 'notification-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Notification deleted successfully');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const result = await deleteNotification('user-123', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Notification ID is required');
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      const mockNotifications = [
        { ...mockNotification, read: false },
        { ...mockNotification, id: 'notification-456', read: false }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map(n => ({ id: n.id, data: () => n }))
      } as any);

      const result = await markAllNotificationsAsRead('user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('All notifications marked as read');
      expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    });

    it('should handle no unread notifications', async () => {
      const mockNotifications = [
        { ...mockNotification, read: true },
        { ...mockNotification, id: 'notification-456', read: true }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map(n => ({ id: n.id, data: () => n }))
      } as any);

      const result = await markAllNotificationsAsRead('user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('No unread notifications to mark');
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const result = await markAllNotificationsAsRead('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });
  });

  describe('deleteAllReadNotifications', () => {
    it('should delete all read notifications successfully', async () => {
      const mockNotifications = [
        { ...mockNotification, read: true },
        { ...mockNotification, id: 'notification-456', read: true }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map(n => ({ id: n.id, data: () => n }))
      } as any);

      const result = await deleteAllReadNotifications('user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('All read notifications deleted');
      expect(mockDeleteDoc).toHaveBeenCalledTimes(2);
    });

    it('should handle no read notifications', async () => {
      const mockNotifications = [
        { ...mockNotification, read: false },
        { ...mockNotification, id: 'notification-456', read: false }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map(n => ({ id: n.id, data: () => n }))
      } as any);

      const result = await deleteAllReadNotifications('user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('No read notifications to delete');
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const result = await deleteAllReadNotifications('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const notificationData = {
        type: 'new_message' as const,
        message: 'Test notification',
        link: 'https://example.com',
        priority: 'high' as const
      };

      const result = await createNotification('user-123', notificationData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Notification created successfully');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const result = await createNotification('', {
        type: 'new_message',
        message: 'Test notification'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });

    it('should handle invalid notification type', async () => {
      const result = await createNotification('user-123', {
        type: 'invalid_type' as any,
        message: 'Test notification'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid enum value');
    });
  });

  describe('getUnreadNotificationCount', () => {
    it('should get unread notification count successfully', async () => {
      const mockNotifications = [
        { ...mockNotification, read: false },
        { ...mockNotification, id: 'notification-456', read: true },
        { ...mockNotification, id: 'notification-789', read: false }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map(n => ({ id: n.id, data: () => n }))
      } as any);

      const result = await getUnreadNotificationCount('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toBe(2);
      expect(result.message).toBe('Unread notification count retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getUnreadNotificationCount('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });
  });

  describe('getNotificationsByType', () => {
    it('should get notifications by type successfully', async () => {
      const mockNotifications = [
        { ...mockNotification, type: 'new_message' },
        { ...mockNotification, id: 'notification-456', type: 'booking_update' },
        { ...mockNotification, id: 'notification-789', type: 'new_message' }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map(n => ({ id: n.id, data: () => n }))
      } as any);

      const result = await getNotificationsByType('user-123', 'new_message');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].type).toBe('new_message');
      expect(result.data?.[1].type).toBe('new_message');
      expect(result.message).toBe('Notifications by type retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getNotificationsByType('', 'new_message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      const result = await getUserNotifications('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.message).toBe('Could not retrieve notifications');
    });

    it('should handle unknown errors', async () => {
      mockGetDocs.mockRejectedValue('Unknown error');

      const result = await getUserNotifications('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get notifications');
      expect(result.message).toBe('Could not retrieve notifications');
    });
  });
});
