import { 
  getClientJobs,
  updateJobStatus,
  deleteJob,
  getJobById,
  searchClientJobs,
  getClientJobsByStatus,
  getClientJobStats
} from '../actions';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';

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

describe('My Job Posts Actions', () => {
  const mockJob = {
    id: 'job-123',
    title: 'Test Job',
    status: 'Open' as const,
    budget: {
      amount: 1000,
      type: 'Fixed' as const,
      negotiable: true
    },
    applications: ['provider-1', 'provider-2'],
    description: 'Test job description',
    category: 'Technology',
    location: 'Test City',
    clientId: 'client-123',
    createdAt: new Date(),
    updatedAt: new Date()
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
    mockDeleteDoc.mockResolvedValue(undefined);
    mockQuery.mockReturnValue({} as any);
    mockWhere.mockReturnValue({} as any);
    mockOrderBy.mockReturnValue({} as any);
    mockCollection.mockReturnValue({} as any);
  });

  describe('getClientJobs', () => {
    it('should get client jobs successfully', async () => {
      const mockJobs = [mockJob];

      mockGetDocs.mockResolvedValue({
        docs: mockJobs.map(j => ({ id: j.id, data: () => j }))
      } as any);

      const result = await getClientJobs('client-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockJobs);
      expect(result.message).toBe('Client jobs retrieved successfully');
    });

    it('should handle empty results', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      } as any);

      const result = await getClientJobs('client-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('Client jobs retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getClientJobs('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Client ID is required');
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status successfully', async () => {
      const result = await updateJobStatus('job-123', 'In Progress');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Job status updated successfully');
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const result = await updateJobStatus('', 'In Progress');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Job ID is required');
    });

    it('should handle invalid status', async () => {
      const result = await updateJobStatus('job-123', 'Invalid Status' as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid enum value');
    });
  });

  describe('deleteJob', () => {
    it('should delete job successfully', async () => {
      const result = await deleteJob('job-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Job deleted successfully');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const result = await deleteJob('');

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

  describe('searchClientJobs', () => {
    it('should search client jobs successfully', async () => {
      const mockJobs = [
        { ...mockJob, title: 'Test Job', description: 'Unique test description' },
        { ...mockJob, id: 'job-456', title: 'Different Job', description: 'Completely different content' }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockJobs.map(j => ({ id: j.id, data: () => j }))
      } as any);

      const result = await searchClientJobs('client-123', 'unique');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].title).toBe('Test Job');
      expect(result.message).toBe('Job search completed successfully');
    });

    it('should handle validation errors', async () => {
      const result = await searchClientJobs('', 'test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Client ID is required');
    });

    it('should handle empty search term', async () => {
      const result = await searchClientJobs('client-123', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Search term is required');
    });
  });

  describe('getClientJobsByStatus', () => {
    it('should get client jobs by status successfully', async () => {
      const mockJobs = [
        { ...mockJob, status: 'Open' },
        { ...mockJob, id: 'job-456', status: 'In Progress' }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockJobs.map(j => ({ id: j.id, data: () => j }))
      } as any);

      const result = await getClientJobsByStatus('client-123', 'Open');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].status).toBe('Open');
      expect(result.message).toBe('Jobs by status retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getClientJobsByStatus('', 'Open');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Client ID is required');
    });
  });

  describe('getClientJobStats', () => {
    it('should get client job stats successfully', async () => {
      const mockJobs = [
        { ...mockJob, status: 'Open', applications: ['provider-1'] },
        { ...mockJob, id: 'job-456', status: 'In Progress', applications: ['provider-2', 'provider-3'] },
        { ...mockJob, id: 'job-789', status: 'Completed', applications: [] }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockJobs.map(j => ({ id: j.id, data: () => j }))
      } as any);

      const result = await getClientJobStats('client-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        total: 3,
        open: 1,
        inProgress: 1,
        completed: 1,
        closed: 0,
        totalApplications: 3
      });
      expect(result.message).toBe('Job statistics retrieved successfully');
    });

    it('should handle validation errors', async () => {
      const result = await getClientJobStats('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Client ID is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      const result = await getClientJobs('client-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.message).toBe('Could not retrieve client jobs');
    });

    it('should handle unknown errors', async () => {
      mockGetDocs.mockRejectedValue('Unknown error');

      const result = await getClientJobs('client-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get client jobs');
      expect(result.message).toBe('Could not retrieve client jobs');
    });
  });
});
