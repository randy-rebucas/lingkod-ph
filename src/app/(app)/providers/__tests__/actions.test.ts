import { 
  getProvider,
  getProviderServices,
  getProviderReviews, 
  addProviderToFavorites,
  removeProviderFromFavorites,
  isProviderFavorited,
  startConversationWithProvider,
  reportProvider,
  getUserFavoriteProviders
} from '../actions';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase');

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
  serverTimestamp: jest.fn(),
  orderBy: jest.fn(),
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
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;

describe('Providers Actions', () => {
  const mockProvider = {
    uid: 'provider-123',
    displayName: 'Test Provider',
    email: 'provider@test.com',
    role: 'provider',
    bio: 'Test bio',
    photoURL: 'https://example.com/photo.jpg',
    availabilityStatus: 'available',
    keyServices: ['Service 1', 'Service 2'],
    isVerified: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);
    mockServerTimestamp.mockReturnValue('mock-timestamp' as any);

    // Mock Firestore functions
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockProvider,
      id: 'provider-123'
    } as any);
    mockGetDocs.mockResolvedValue({
      docs: [],
      empty: true
    } as any);
    mockAddDoc.mockResolvedValue({ id: 'new-doc-id' } as any);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockQuery.mockReturnValue({} as any);
    mockWhere.mockReturnValue({} as any);
    mockOrderBy.mockReturnValue({} as any);
    mockCollection.mockReturnValue({} as any);
  });

  describe('getProvider', () => {
    it('should get provider successfully', async () => {
      const result = await getProvider('provider-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ uid: 'provider-123', ...mockProvider });
      expect(result.message).toBe('Provider retrieved successfully');
      expect(mockGetDoc).toHaveBeenCalled();
    });

    it('should handle provider not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
        id: 'provider-123'
      } as any);

      const result = await getProvider('provider-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Provider not found');
      expect(result.message).toBe('The requested provider does not exist');
    });

    it('should handle invalid provider role', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockProvider, role: 'client' }),
        id: 'provider-123'
      } as any);

      const result = await getProvider('provider-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid provider');
      expect(result.message).toBe('The requested user is not a provider');
    });

    it('should handle validation errors', async () => {
      const result = await getProvider('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider ID is required');
    });
  });

  describe('getProviderServices', () => {
    it('should get provider services successfully', async () => {
      const mockServices = [
        { id: 'service-1', name: 'Service 1', status: 'Active' },
        { id: 'service-2', name: 'Service 2', status: 'Active' }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockServices.map(service => ({
          id: service.id,
          data: () => service
        }))
      } as any);

      const result = await getProviderServices('provider-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockServices);
      expect(result.message).toBe('Provider services retrieved successfully');
      expect(mockGetDocs).toHaveBeenCalled();
    });

    it('should handle empty services list', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await getProviderServices('provider-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('Provider services retrieved successfully');
    });
  });

  describe('getProviderReviews', () => {
    it('should get provider reviews successfully', async () => {
      const mockReviews = [
        { id: 'review-1', rating: 5, comment: 'Great service' },
        { id: 'review-2', rating: 4, comment: 'Good service' }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockReviews.map(review => ({
          id: review.id,
          data: () => review
        }))
      } as any);

      const result = await getProviderReviews('provider-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReviews);
      expect(result.message).toBe('Provider reviews retrieved successfully');
      expect(mockGetDocs).toHaveBeenCalled();
    });

    it('should handle empty reviews list', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await getProviderReviews('provider-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('Provider reviews retrieved successfully');
    });
  });

  describe('addProviderToFavorites', () => {
    it('should add provider to favorites successfully', async () => {
      // Mock no existing favorites
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await addProviderToFavorites('provider-123', 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'new-doc-id' });
      expect(result.message).toBe('Provider added to favorites successfully');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle already favorited provider', async () => {
      // Mock existing favorite
      mockGetDocs.mockResolvedValue({
        docs: [{ id: 'favorite-1' }],
        empty: false
      } as any);

      const result = await addProviderToFavorites('provider-123', 'user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already favorited');
      expect(result.message).toBe('This provider is already in your favorites');
    });
  });

  describe('removeProviderFromFavorites', () => {
    it('should remove provider from favorites successfully', async () => {
      // Mock existing favorite
      mockGetDocs.mockResolvedValue({
        docs: [{ ref: 'favorite-ref' }],
        empty: false
      } as any);

      const result = await removeProviderFromFavorites('provider-123', 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Provider removed from favorites successfully');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should handle provider not in favorites', async () => {
      // Mock no existing favorites
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await removeProviderFromFavorites('provider-123', 'user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not favorited');
      expect(result.message).toBe('This provider is not in your favorites');
    });
  });

  describe('isProviderFavorited', () => {
    it('should return true when provider is favorited', async () => {
      // Mock existing favorite
      mockGetDocs.mockResolvedValue({
        docs: [{ id: 'favorite-1' }],
        empty: false
      } as any);

      const result = await isProviderFavorited('provider-123', 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false when provider is not favorited', async () => {
      // Mock no existing favorites
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await isProviderFavorited('provider-123', 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('startConversationWithProvider', () => {
    it('should start conversation successfully', async () => {
      // Mock no existing conversation
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true,
        forEach: jest.fn()
      } as any);

      const result = await startConversationWithProvider(
        'provider-123', 
        'user-123', 
        'User Name', 
        'user-photo.jpg', 
        'Provider Name', 
        'provider-photo.jpg'
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'new-doc-id' });
      expect(result.message).toBe('Conversation started successfully');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle existing conversation', async () => {
      // Mock existing conversation
      const mockForEach = jest.fn((callback) => {
        callback({
          id: 'existing-convo',
          data: () => ({
            participants: ['user-123', 'provider-123']
          })
        });
      });

      mockGetDocs.mockResolvedValue({
        docs: [{
          id: 'existing-convo',
          data: () => ({
            participants: ['user-123', 'provider-123']
          })
        }],
        empty: false,
        forEach: mockForEach
      } as any);

      const result = await startConversationWithProvider(
        'provider-123', 
        'user-123', 
        'User Name', 
        'user-photo.jpg', 
        'Provider Name', 
        'provider-photo.jpg'
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'existing-convo' });
      expect(result.message).toBe('Conversation already exists');
    });
  });

  describe('reportProvider', () => {
    it('should report provider successfully', async () => {
      const reportData = {
        reportedBy: 'user-123',
        reportedItemType: 'user',
        reportedItemId: 'provider-123',
        reason: 'This is a valid reason for reporting',
        status: 'New'
      };

      const result = await reportProvider(reportData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'new-doc-id' });
      expect(result.message).toBe('Report submitted successfully');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const invalidReportData = {
        reportedBy: '',
        reportedItemType: '',
        reportedItemId: '',
        reason: 'short',
        status: ''
      };

      const result = await reportProvider(invalidReportData as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Reporter ID is required');
    });
  });

  describe('getUserFavoriteProviders', () => {
    it('should get user favorite providers successfully', async () => {
      // Mock favorites
      mockGetDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ providerId: 'provider-123' }) }],
        empty: false
      } as any);

      // Mock provider details
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProvider,
        id: 'provider-123'
      } as any);

      const result = await getUserFavoriteProviders('user-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ uid: 'provider-123', ...mockProvider }]);
      expect(result.message).toBe('Favorite providers retrieved successfully');
    });

    it('should handle no favorite providers', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await getUserFavoriteProviders('user-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('No favorite providers found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockGetDoc.mockRejectedValue(new Error('Database error'));

      const result = await getProvider('provider-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.message).toBe('Could not retrieve provider information');
    });

    it('should handle unknown errors', async () => {
      mockGetDoc.mockRejectedValue('Unknown error');

      const result = await getProvider('provider-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get provider');
      expect(result.message).toBe('Could not retrieve provider information');
    });
  });
});
