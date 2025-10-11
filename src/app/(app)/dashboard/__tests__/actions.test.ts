import { 
  getProviderDashboardData,
  getAgencyDashboardData,
  getClientDashboardData,
  getAllProviders,
  getAllReviews,
  addProviderToFavorites,
  removeProviderFromFavorites,
  searchProviders
} from '../actions';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

// Mock date-fns
jest.mock('date-fns', () => ({
  startOfDay: jest.fn((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())),
  endOfDay: jest.fn((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999))
}));

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
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockLimit = limit as jest.MockedFunction<typeof limit>;

describe('Dashboard Actions', () => {
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

  const mockBooking = {
    id: 'booking-123',
    clientId: 'client-123',
    clientName: 'Test Client',
    providerId: 'provider-123',
    providerName: 'Test Provider',
    serviceName: 'Test Service',
    status: 'Upcoming',
    price: 100,
    date: new Date()
  };

  const mockReview = {
    id: 'review-123',
    providerId: 'provider-123',
    clientName: 'Test Client',
    rating: 5,
    comment: 'Great service',
    createdAt: new Date()
  };

  const mockPayout = {
    id: 'payout-123',
    providerId: 'provider-123',
    amount: 100,
    status: 'pending',
    createdAt: new Date()
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
    mockQuery.mockReturnValue({} as any);
    mockWhere.mockReturnValue({} as any);
    mockOrderBy.mockReturnValue({} as any);
    mockLimit.mockReturnValue({} as any);
    mockCollection.mockReturnValue({} as any);
  });

  describe('getProviderDashboardData', () => {
    it('should get provider dashboard data successfully', async () => {
      const mockBookings = [mockBooking];
      const mockTodaysJobs = [mockBooking];
      const mockReviews = [mockReview];
      const mockPayouts = [mockPayout];

      mockGetDocs
        .mockResolvedValueOnce({ docs: mockBookings.map(b => ({ id: b.id, data: () => b })) } as any)
        .mockResolvedValueOnce({ docs: mockTodaysJobs.map(j => ({ id: j.id, data: () => j })) } as any)
        .mockResolvedValueOnce({ docs: mockReviews.map(r => ({ id: r.id, data: () => r })) } as any)
        .mockResolvedValueOnce({ docs: mockPayouts.map(p => ({ id: p.id, data: () => p })) } as any);

      const result = await getProviderDashboardData('provider-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        bookings: mockBookings,
        todaysJobs: mockTodaysJobs,
        reviews: mockReviews,
        payouts: mockPayouts
      });
      expect(result.message).toBe('Provider dashboard data retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getProviderDashboardData('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider ID is required');
    });
  });

  describe('getAgencyDashboardData', () => {
    it('should get agency dashboard data successfully', async () => {
      const mockProviders = [mockProvider];
      const mockBookings = [mockBooking];
      const mockReviews = [mockReview];
      const mockPayouts = [mockPayout];

      mockGetDocs
        .mockResolvedValueOnce({ docs: mockProviders.map(p => ({ id: p.uid, data: () => p })) } as any)
        .mockResolvedValueOnce({ docs: mockBookings.map(b => ({ id: b.id, data: () => b })) } as any)
        .mockResolvedValueOnce({ docs: mockReviews.map(r => ({ id: r.id, data: () => r })) } as any)
        .mockResolvedValueOnce({ docs: mockPayouts.map(p => ({ id: p.id, data: () => p })) } as any);

      const result = await getAgencyDashboardData('agency-123');

      expect(result.success).toBe(true);
      expect(result.data.providers).toHaveLength(1);
      expect(result.data.bookings).toEqual(mockBookings);
      expect(result.data.payouts).toEqual(mockPayouts);
      expect(result.message).toBe('Agency dashboard data retrieved successfully');
    });

    it('should handle no providers case', async () => {
      // Mock empty providers
      mockGetDocs.mockResolvedValueOnce({ docs: [], empty: true } as any);

      const result = await getAgencyDashboardData('agency-123');

      expect(result.success).toBe(true);
      expect(result.data.providers).toEqual([]);
      expect(result.data.bookings).toEqual([]);
      expect(result.data.payouts).toEqual([]);
      expect(result.message).toBe('Agency dashboard data retrieved successfully (no providers)');
    });
  });

  describe('getClientDashboardData', () => {
    it('should get client dashboard data successfully', async () => {
      const mockBookings = [mockBooking];
      const mockFavorites = [{ id: 'fav-123', userId: 'client-123', providerId: 'provider-123' }];

      mockGetDocs
        .mockResolvedValueOnce({ docs: mockBookings.map(b => ({ id: b.id, data: () => b })) } as any)
        .mockResolvedValueOnce({ docs: mockFavorites.map(f => ({ id: f.id, data: () => f })) } as any);

      const result = await getClientDashboardData('client-123');

      expect(result.success).toBe(true);
      expect(result.data.bookings).toEqual(mockBookings);
      expect(result.data.favorites).toEqual(mockFavorites);
      expect(result.message).toBe('Client dashboard data retrieved successfully');
    });
  });

  describe('getAllProviders', () => {
    it('should get all providers successfully', async () => {
      const mockProviders = [mockProvider];

      mockGetDocs.mockResolvedValue({
        docs: mockProviders.map(p => ({ id: p.uid, data: () => p }))
      } as any);

      const result = await getAllProviders();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProviders);
      expect(result.message).toBe('All providers retrieved successfully');
    });
  });

  describe('getAllReviews', () => {
    it('should get all reviews successfully', async () => {
      const mockReviews = [mockReview];

      mockGetDocs.mockResolvedValue({
        docs: mockReviews.map(r => ({ id: r.id, data: () => r }))
      } as any);

      const result = await getAllReviews();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReviews);
      expect(result.message).toBe('All reviews retrieved successfully');
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

  describe('searchProviders', () => {
    it('should search providers successfully', async () => {
      const mockProviders = [
        { ...mockProvider, displayName: 'Test Provider', bio: 'Test bio' },
        { ...mockProvider, uid: 'provider-456', displayName: 'Another Provider' }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockProviders.map(p => ({ id: p.uid, data: () => p }))
      } as any);

      const result = await searchProviders('test');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.message).toBe('Provider search completed successfully');
    });

    it('should handle validation errors', async () => {
      const result = await searchProviders('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Search query is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      const result = await getProviderDashboardData('provider-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.message).toBe('Could not retrieve provider dashboard data');
    });

    it('should handle unknown errors', async () => {
      mockGetDocs.mockRejectedValue('Unknown error');

      const result = await getProviderDashboardData('provider-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get provider dashboard data');
      expect(result.message).toBe('Could not retrieve provider dashboard data');
    });
  });
});
