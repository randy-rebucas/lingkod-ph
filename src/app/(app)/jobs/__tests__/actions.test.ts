import { 
  getOpenJobs,
  getJobsByClient,
  getJobsByProvider,
  applyForJob,
  getJobById,
  updateJobStatus,
  getJobsByCategory,
  searchJobs
} from '../actions';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, arrayUnion, orderBy } from 'firebase/firestore';

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
  arrayUnion: jest.fn(),
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
const mockArrayUnion = arrayUnion as jest.MockedFunction<typeof arrayUnion>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;

describe('Jobs Actions', () => {
  const mockJob = {
    id: 'job-123',
    title: 'Test Job',
    description: 'Test job description',
    categoryName: 'Technology',
    budget: {
      amount: 1000,
      type: 'Fixed' as const,
      negotiable: true
    },
    location: 'Test City',
    clientName: 'Test Client',
    clientId: 'client-123',
    clientIsVerified: true,
    createdAt: new Date(),
    applications: ['provider-1'],
    status: 'Open'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);

    // Mock Firestore functions
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockJob,
      id: 'job-123'
    } as any);
    mockGetDocs.mockResolvedValue({
      docs: [],
      empty: true
    } as any);
    mockAddDoc.mockResolvedValue({ id: 'new-doc-id' } as any);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockArrayUnion.mockReturnValue('array-union-value' as any);
    mockQuery.mockReturnValue({} as any);
    mockWhere.mockReturnValue({} as any);
    mockOrderBy.mockReturnValue({} as any);
    mockCollection.mockReturnValue({} as any);
  });

  describe('getOpenJobs', () => {
    it('should get open jobs successfully', async () => {
      const mockJobs = [mockJob];

      mockGetDocs.mockResolvedValue({
        docs: mockJobs.map(j => ({ id: j.id, data: () => j }))
      } as any);

      const result = await getOpenJobs();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockJobs);
      expect(result.message).toBe('Open jobs retrieved successfully');
    });

    it('should handle empty results', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await getOpenJobs();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('Open jobs retrieved successfully');
    });
  });

  describe('getJobsByClient', () => {
    it('should get jobs by client successfully', async () => {
      const mockJobs = [mockJob];

      mockGetDocs.mockResolvedValue({
        docs: mockJobs.map(j => ({ id: j.id, data: () => j }))
      } as any);

      const result = await getJobsByClient('client-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockJobs);
      expect(result.message).toBe('Client jobs retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getJobsByClient('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Client ID is required');
    });
  });

  describe('getJobsByProvider', () => {
    it('should get jobs by provider successfully', async () => {
      const mockJobs = [mockJob];

      mockGetDocs.mockResolvedValue({
        docs: mockJobs.map(j => ({ id: j.id, data: () => j }))
      } as any);

      const result = await getJobsByProvider('provider-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockJobs);
      expect(result.message).toBe('Provider jobs retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getJobsByProvider('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider ID is required');
    });
  });

  describe('applyForJob', () => {
    it('should apply for job successfully', async () => {
      const result = await applyForJob('job-123', 'provider-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully applied for job');
      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(mockArrayUnion).toHaveBeenCalledWith('provider-123');
    });

    it('should handle validation errors', async () => {
      const result = await applyForJob('', 'provider-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Job ID is required');
    });
  });

  describe('getJobById', () => {
    it('should get job by ID successfully', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ id: mockJob.id, data: () => mockJob }],
        empty: false
      } as any);

      const result = await getJobById('job-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockJob);
      expect(result.message).toBe('Job retrieved successfully');
    });

    it('should handle job not found', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await getJobById('job-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Job not found');
      expect(result.message).toBe('Could not find job');
    });

    it('should handle validation errors', async () => {
      const result = await getJobById('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Job ID is required');
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status successfully', async () => {
      const result = await updateJobStatus('job-123', 'Closed');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Job status updated successfully');
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const result = await updateJobStatus('', 'Closed');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Job ID is required');
    });
  });

  describe('getJobsByCategory', () => {
    it('should get jobs by category successfully', async () => {
      const mockJobs = [mockJob];

      mockGetDocs.mockResolvedValue({
        docs: mockJobs.map(j => ({ id: j.id, data: () => j }))
      } as any);

      const result = await getJobsByCategory('Technology');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockJobs);
      expect(result.message).toBe('Jobs by category retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getJobsByCategory('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Category name is required');
    });
  });

  describe('searchJobs', () => {
    it('should search jobs successfully', async () => {
      const mockJobs = [mockJob];

      mockGetDocs.mockResolvedValue({
        docs: mockJobs.map(j => ({ id: j.id, data: () => j }))
      } as any);

      const result = await searchJobs('test');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockJobs);
      expect(result.message).toBe('Job search completed successfully');
    });

    it('should filter jobs based on search term', async () => {
      const mockJobs = [
        { ...mockJob, title: 'Test Job', description: 'Unique description' },
        { ...mockJob, id: 'job-456', title: 'Different Job', description: 'Another description' }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockJobs.map(j => ({ id: j.id, data: () => j }))
      } as any);

      const result = await searchJobs('unique');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].title).toBe('Test Job');
    });

    it('should handle validation errors', async () => {
      const result = await searchJobs('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Search term is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      const result = await getOpenJobs();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.message).toBe('Could not retrieve open jobs');
    });

    it('should handle unknown errors', async () => {
      mockGetDocs.mockRejectedValue('Unknown error');

      const result = await getOpenJobs();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get open jobs');
      expect(result.message).toBe('Could not retrieve open jobs');
    });
  });
});
