import { 
  getUserConversations,
  getConversationMessages,
  sendMessage,
  createNotification,
  startConversation,
  markMessagesAsRead,
  getConversationById
} from '../actions';
import { getDb, getStorageInstance } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  getDb: jest.fn(),
  getStorageInstance: jest.fn()
}));

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockGetStorageInstance = getStorageInstance as jest.MockedFunction<typeof getStorageInstance>;
const mockDb = {};
const mockStorage = {};

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
  serverTimestamp: jest.fn(),
  orderBy: jest.fn(),
}));

// Mock Storage functions
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockRef = ref as jest.MockedFunction<typeof ref>;
const mockUploadBytes = uploadBytes as jest.MockedFunction<typeof uploadBytes>;
const mockGetDownloadURL = getDownloadURL as jest.MockedFunction<typeof getDownloadURL>;

describe('Messages Actions', () => {
  const mockConversation = {
    id: 'conversation-123',
    participants: ['user-1', 'user-2'],
    participantInfo: {
      'user-1': { displayName: 'User 1', photoURL: 'photo1.jpg' },
      'user-2': { displayName: 'User 2', photoURL: 'photo2.jpg' }
    },
    lastMessage: 'Hello there!',
    timestamp: new Date(),
    unread: 0
  };

  const mockMessage = {
    id: 'message-123',
    senderId: 'user-1',
    text: 'Hello there!',
    timestamp: new Date(),
    status: 'sent' as const
  };

  const mockUser = {
    uid: 'user-1',
    displayName: 'Test User',
    email: 'test@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);
    mockGetStorageInstance.mockReturnValue(mockStorage as any);
    mockServerTimestamp.mockReturnValue('mock-timestamp' as any);

    // Mock Firestore functions
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUser,
      id: 'user-1'
    } as any);
    mockGetDocs.mockResolvedValue({
      docs: [],
      empty: true
    } as any);
    mockAddDoc.mockResolvedValue({ id: 'new-doc-id' } as any);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockQuery.mockReturnValue({} as any);
    mockWhere.mockReturnValue({} as any);
    mockOrderBy.mockReturnValue({} as any);
    mockCollection.mockReturnValue({} as any);

    // Mock Storage functions
    mockRef.mockReturnValue({} as any);
    mockUploadBytes.mockResolvedValue({ ref: {} } as any);
    mockGetDownloadURL.mockResolvedValue('https://example.com/image.jpg');
  });

  describe('getUserConversations', () => {
    it('should get user conversations successfully', async () => {
      const mockConversations = [mockConversation];

      mockGetDocs.mockResolvedValue({
        docs: mockConversations.map(c => ({ id: c.id, data: () => c }))
      } as any);

      const result = await getUserConversations('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockConversations);
      expect(result.message).toBe('User conversations retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getUserConversations('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });
  });

  describe('getConversationMessages', () => {
    it('should get conversation messages successfully', async () => {
      const mockMessages = [mockMessage];

      mockGetDocs.mockResolvedValue({
        docs: mockMessages.map(m => ({ id: m.id, data: () => m }))
      } as any);

      const result = await getConversationMessages('conversation-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessages);
      expect(result.message).toBe('Conversation messages retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getConversationMessages('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Conversation ID is required');
    });
  });

  describe('sendMessage', () => {
    it('should send text message successfully', async () => {
      const result = await sendMessage('conversation-123', 'user-1', 'Hello there!');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ messageId: 'new-doc-id' });
      expect(result.message).toBe('Message sent successfully');
      expect(mockAddDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should send message with image successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const result = await sendMessage('conversation-123', 'user-1', 'Check this out!', mockFile);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ messageId: 'new-doc-id' });
      expect(result.message).toBe('Message sent successfully');
      expect(mockUploadBytes).toHaveBeenCalled();
      expect(mockGetDownloadURL).toHaveBeenCalled();
      expect(mockAddDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const result = await sendMessage('', 'user-1', 'Hello');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Conversation ID is required');
    });
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const result = await createNotification('user-2', 'User 1', 'Hello there!', '/messages');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ notificationId: 'new-doc-id' });
      expect(result.message).toBe('Notification created successfully');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should skip notification if user has disabled message notifications', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ notificationSettings: { newMessages: false } }),
        id: 'user-2'
      } as any);

      const result = await createNotification('user-2', 'User 1', 'Hello there!', '/messages');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Notification skipped due to user settings');
      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const result = await createNotification('', 'User 1', 'Hello', '/messages');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });
  });

  describe('startConversation', () => {
    it('should start new conversation successfully', async () => {
      // Mock no existing conversations
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const participant1Info = { displayName: 'User 1', photoURL: 'photo1.jpg' };
      const participant2Info = { displayName: 'User 2', photoURL: 'photo2.jpg' };

      const result = await startConversation('user-1', 'user-2', participant1Info, participant2Info);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ conversationId: 'new-doc-id' });
      expect(result.message).toBe('New conversation created successfully');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should return existing conversation if found', async () => {
      // Mock existing conversation
      mockGetDocs.mockResolvedValue({
        docs: [{ id: 'existing-conversation', data: () => ({ participants: ['user-1', 'user-2'] }) }],
        empty: false
      } as any);

      const participant1Info = { displayName: 'User 1', photoURL: 'photo1.jpg' };
      const participant2Info = { displayName: 'User 2', photoURL: 'photo2.jpg' };

      const result = await startConversation('user-1', 'user-2', participant1Info, participant2Info);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ conversationId: 'existing-conversation' });
      expect(result.message).toBe('Existing conversation found');
      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const participant1Info = { displayName: 'User 1', photoURL: 'photo1.jpg' };
      const participant2Info = { displayName: 'User 2', photoURL: 'photo2.jpg' };

      const result = await startConversation('', 'user-2', participant1Info, participant2Info);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read successfully', async () => {
      const result = await markMessagesAsRead('conversation-123', 'user-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Messages marked as read successfully');
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const result = await markMessagesAsRead('', 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Conversation ID is required');
    });
  });

  describe('getConversationById', () => {
    it('should get conversation by ID successfully', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockConversation,
        id: 'conversation-123'
      } as any);

      const result = await getConversationById('conversation-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockConversation);
      expect(result.message).toBe('Conversation retrieved successfully');
    });

    it('should handle conversation not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
        id: 'conversation-123'
      } as any);

      const result = await getConversationById('conversation-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Conversation not found');
      expect(result.message).toBe('Could not find conversation');
    });

    it('should handle validation errors', async () => {
      const result = await getConversationById('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Conversation ID is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      const result = await getUserConversations('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.message).toBe('Could not retrieve conversations');
    });

    it('should handle unknown errors', async () => {
      mockGetDocs.mockRejectedValue('Unknown error');

      const result = await getUserConversations('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get user conversations');
      expect(result.message).toBe('Could not retrieve conversations');
    });
  });
});
