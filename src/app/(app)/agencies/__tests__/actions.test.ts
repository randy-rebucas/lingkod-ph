import { 
  getAgency, 
  getAgencyServices,
  getAgencyProviders, 
  getAgencyReviews, 
  addAgencyToFavorites, 
  removeAgencyFromFavorites, 
  isAgencyFavorited, 
  startConversationWithAgency, 
  reportAgency, 
  getAgencyAnalytics, 
  updateAgencyProfile, 
  getUserFavoriteAgencies 
} from '../actions';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock Firestore functions
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;

describe('Agencies Actions', () => {
  const mockDb = {
    collection: jest.fn(),
    doc: jest.fn(),
  };

  const mockAgency = {
    uid: 'agency-123',
    displayName: 'Test Agency',
    email: 'test@agency.com',
    role: 'agency',
    bio: 'Test agency bio',
    isVerified: true,
    totalProviders: 5,
    totalBookings: 100,
    averageRating: 4.5,
    totalReviews: 20,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);
    mockServerTimestamp.mockReturnValue('mock-timestamp' as any);
    
    // Mock Firestore functions
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockAgency,
      id: 'agency-123'
    } as any);
    mockGetDocs.mockResolvedValue({
      docs: [],
      empty: true
    } as any);
    mockAddDoc.mockResolvedValue({ id: 'new-doc-id' } as any);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
  });

  describe('getAgency', () => {
    it('should get agency successfully', async () => {
      const result = await getAgency('agency-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'agency-123', ...mockAgency });
      expect(result.message).toBe('Agency retrieved successfully');
      expect(mockGetDoc).toHaveBeenCalled();
    });

    it('should handle agency not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      } as any);

      const result = await getAgency('nonexistent-agency');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Agency not found');
      expect(result.message).toBe('The requested agency does not exist');
    });

    it('should handle invalid agency role', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockAgency, role: 'provider' })
      } as any);

      const result = await getAgency('agency-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid agency');
      expect(result.message).toBe('The requested user is not an agency');
    });

    it('should handle validation errors', async () => {
      const result = await getAgency('');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Agency ID is required');
    });
  });

  describe('getAgencyServices', () => {
    it('should get agency services successfully', async () => {
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

      const result = await getAgencyServices('agency-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockServices);
      expect(result.message).toBe('Agency services retrieved successfully');
      expect(mockGetDocs).toHaveBeenCalled();
    });

    it('should handle empty services list', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await getAgencyServices('agency-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('Agency services retrieved successfully');
    });
  });

  describe('getAgencyProviders', () => {
    it('should get agency providers successfully', async () => {
      const mockProviders = [
        { id: 'provider-1', displayName: 'Provider 1', role: 'provider' },
        { id: 'provider-2', displayName: 'Provider 2', role: 'provider' }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockProviders.map(provider => ({
          id: provider.id,
          data: () => provider
        }))
      } as any);

      const result = await getAgencyProviders('agency-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.message).toBe('Agency providers retrieved successfully');
    });

    it('should handle empty providers list', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await getAgencyProviders('agency-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('addAgencyToFavorites', () => {
    it('should add agency to favorites successfully', async () => {
      // Mock no existing favorites
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await addAgencyToFavorites('agency-123', 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.data?.agencyId).toBe('agency-123');
      expect(result.data?.userId).toBe('user-123');
      expect(result.message).toBe('Agency added to favorites successfully');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle already favorited agency', async () => {
      // Mock existing favorite
      mockGetDocs.mockResolvedValue({
        docs: [{ id: 'favorite-1', data: () => ({ agencyId: 'agency-123', userId: 'user-123' }) }],
        empty: false
      } as any);

      const result = await addAgencyToFavorites('agency-123', 'user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already favorited');
      expect(result.message).toBe('This agency is already in your favorites');
    });
  });

  describe('removeAgencyFromFavorites', () => {
    it('should remove agency from favorites successfully', async () => {
      // Mock existing favorite
      const mockFavoriteRef = { id: 'favorite-1' };
      mockGetDocs.mockResolvedValue({
        docs: [{ ref: mockFavoriteRef, data: () => ({ agencyId: 'agency-123', userId: 'user-123' }) }],
        empty: false
      } as any);

      const result = await removeAgencyFromFavorites('agency-123', 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Agency removed from favorites successfully');
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockFavoriteRef);
    });

    it('should handle agency not in favorites', async () => {
      // Mock no existing favorites
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await removeAgencyFromFavorites('agency-123', 'user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not favorited');
      expect(result.message).toBe('This agency is not in your favorites');
    });
  });

  describe('isAgencyFavorited', () => {
    it('should return true when agency is favorited', async () => {
      // Mock existing favorite
      mockGetDocs.mockResolvedValue({
        docs: [{ id: 'favorite-1' }],
        empty: false
      } as any);

      const result = await isAgencyFavorited('agency-123', 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false when agency is not favorited', async () => {
      // Mock no existing favorites
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await isAgencyFavorited('agency-123', 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('startConversationWithAgency', () => {
    it('should start conversation successfully', async () => {
      // Mock no existing conversation
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await startConversationWithAgency('agency-123', 'user-123', 'Hello!');
      
      expect(result.success).toBe(true);
      expect(result.data?.agencyId).toBe('agency-123');
      expect(result.data?.userId).toBe('user-123');
      expect(result.data?.lastMessage).toBe('Hello!');
      expect(result.message).toBe('Conversation started successfully');
      expect(mockAddDoc).toHaveBeenCalledTimes(2); // Conversation + initial message
    });

    it('should handle existing conversation', async () => {
      // Mock existing conversation
      const existingConvo = {
        id: 'convo-1',
        data: () => ({ participants: ['user-123', 'agency-123'] })
      };
      mockGetDocs.mockResolvedValue({
        docs: [existingConvo],
        empty: false
      } as any);

      const result = await startConversationWithAgency('agency-123', 'user-123', 'Hello!');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Conversation exists');
      expect(result.message).toBe('A conversation with this agency already exists');
    });
  });

  describe('reportAgency', () => {
    it('should report agency successfully', async () => {
      const reportData = {
        agencyId: 'agency-123',
        reporterId: 'user-123',
        reason: 'Inappropriate behavior',
        description: 'This agency has been engaging in inappropriate behavior with clients.',
        category: 'inappropriate_behavior' as const
      };

      const result = await reportAgency(reportData);
      
      expect(result.success).toBe(true);
      expect(result.data?.agencyId).toBe('agency-123');
      expect(result.data?.reporterId).toBe('user-123');
      expect(result.data?.status).toBe('pending');
      expect(result.message).toBe('Agency reported successfully');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle agency not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      } as any);

      const reportData = {
        agencyId: 'nonexistent-agency',
        reporterId: 'user-123',
        reason: 'Inappropriate behavior',
        description: 'This agency has been engaging in inappropriate behavior with clients.',
        category: 'inappropriate_behavior' as const
      };

      const result = await reportAgency(reportData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Agency not found');
      expect(result.message).toBe('The agency you are trying to report does not exist');
    });

    it('should handle validation errors', async () => {
      const reportData = {
        agencyId: 'agency-123',
        reporterId: 'user-123',
        reason: 'Short',
        description: 'Too short',
        category: 'inappropriate_behavior' as const
      };

      const result = await reportAgency(reportData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Reason must be at least 10 characters');
    });
  });

  describe('getAgencyAnalytics', () => {
    it('should get agency analytics successfully', async () => {
      // Mock providers
      const mockProviders = [
        { id: 'provider-1', displayName: 'Provider 1' },
        { id: 'provider-2', displayName: 'Provider 2' }
      ];
      mockGetDocs.mockResolvedValueOnce({
        docs: mockProviders.map(provider => ({
          id: provider.id,
          data: () => provider
        }))
      } as any);

      // Mock reviews
      const mockReviews = [
        { id: 'review-1', rating: 5 },
        { id: 'review-2', rating: 4 }
      ];
      mockGetDocs.mockResolvedValueOnce({
        docs: mockReviews.map(review => ({
          id: review.id,
          data: () => review
        }))
      } as any);

      const result = await getAgencyAnalytics('agency-123');
      
      expect(result.success).toBe(true);
      expect(result.data?.agencyId).toBe('agency-123');
      expect(result.data?.totalProviders).toBe(2);
      expect(result.data?.totalReviews).toBe(2);
      expect(result.data?.averageRating).toBe(4.5);
      expect(result.message).toBe('Agency analytics retrieved successfully');
    });
  });

  describe('updateAgencyProfile', () => {
    it('should update agency profile successfully', async () => {
      const updateData = {
        bio: 'Updated bio',
        phoneNumber: '+1234567890'
      };

      // Mock updated agency data
      const updatedAgency = { ...mockAgency, ...updateData };
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockAgency
      } as any);
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => updatedAgency
      } as any);

      const result = await updateAgencyProfile('agency-123', updateData);
      
      expect(result.success).toBe(true);
      expect(result.data?.bio).toBe('Updated bio');
      expect(result.data?.phoneNumber).toBe('+1234567890');
      expect(result.message).toBe('Agency profile updated successfully');
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should handle agency not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      } as any);

      const result = await updateAgencyProfile('nonexistent-agency', { bio: 'Updated bio' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Agency not found');
      expect(result.message).toBe('The agency does not exist');
    });
  });

  describe('getUserFavoriteAgencies', () => {
    it('should get user favorite agencies successfully', async () => {
      // Mock favorites
      const mockFavorites = [
        { id: 'favorite-1', data: () => ({ agencyId: 'agency-1', userId: 'user-123' }) },
        { id: 'favorite-2', data: () => ({ agencyId: 'agency-2', userId: 'user-123' }) }
      ];
      mockGetDocs.mockResolvedValueOnce({
        docs: mockFavorites,
        empty: false
      } as any);

      // Mock agency data for each favorite
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockAgency, uid: 'agency-1' })
      } as any);

      const result = await getUserFavoriteAgencies('user-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.message).toBe('Favorite agencies retrieved successfully');
    });

    it('should handle no favorite agencies', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await getUserFavoriteAgencies('user-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('No favorite agencies found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockGetDoc.mockRejectedValue(new Error('Database error'));

      const result = await getAgency('agency-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.message).toBe('Could not retrieve agency information');
    });

    it('should handle unknown errors', async () => {
      mockGetDoc.mockRejectedValue('Unknown error');

      const result = await getAgency('agency-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get agency');
      expect(result.message).toBe('Could not retrieve agency information');
    });
  });
});
