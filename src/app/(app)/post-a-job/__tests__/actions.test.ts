import { postJobAction, PostJobInput } from '../actions';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock Firestore functions
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>;

describe('postJobAction', () => {
  const mockDb = {
    collection: mockCollection,
    doc: jest.fn(),
  };

  const validJobData: PostJobInput = {
    title: 'Need a professional cleaner for my office',
    description: 'Looking for a reliable cleaning service to clean our office space weekly. Must be professional and punctual.',
    categoryId: 'category-1',
    budgetAmount: 2000,
    budgetType: 'Fixed',
    isNegotiable: true,
    location: 'Makati City, Metro Manila',
    deadline: new Date('2024-02-01'),
    additionalDetails: JSON.stringify({ frequency: 'weekly', specialRequirements: 'eco-friendly products' }),
    userId: 'user-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);
    mockServerTimestamp.mockReturnValue('mock-timestamp' as any);
  });

  describe('Validation', () => {
    it('should reject job with short title', async () => {
      const invalidData = { ...validJobData, title: 'Short' };
      
      const result = await postJobAction(invalidData);
      
      expect(result.error).toContain('Job title must be at least 10 characters');
      expect(result.message).toBe('Validation failed. Please check the fields.');
    });

    it('should reject job with short description', async () => {
      const invalidData = { ...validJobData, description: 'Short desc' };
      
      const result = await postJobAction(invalidData);
      
      expect(result.error).toContain('Description must be at least 20 characters');
      expect(result.message).toBe('Validation failed. Please check the fields.');
    });

    it('should reject job with negative budget', async () => {
      const invalidData = { ...validJobData, budgetAmount: -100 };
      
      const result = await postJobAction(invalidData);
      
      expect(result.error).toContain('Budget must be a positive number');
      expect(result.message).toBe('Validation failed. Please check the fields.');
    });

    it('should reject job with short location', async () => {
      const invalidData = { ...validJobData, location: 'NYC' };
      
      const result = await postJobAction(invalidData);
      
      expect(result.error).toContain('Please provide a specific location');
      expect(result.message).toBe('Validation failed. Please check the fields.');
    });

    it('should reject job without user ID', async () => {
      const invalidData = { ...validJobData, userId: '' };
      
      const result = await postJobAction(invalidData);
      
      expect(result.error).toBe('You must be logged in to post a job.');
      expect(result.message).toBe('Authentication failed.');
    });
  });

  describe('Category Validation', () => {
    it('should reject job with non-existent category', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      } as any);

      const result = await postJobAction(validJobData);
      
      expect(result.error).toContain('Failed to save job: Category document not found');
      expect(result.message).toBe('An error occurred while saving your job.');
    });
  });

  describe('Job Creation', () => {
    beforeEach(() => {
      // Mock category exists
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'Cleaning Services' }),
      } as any);

      // Mock user exists
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ 
          displayName: 'John Doe',
          photoURL: 'photo-url',
          verification: { status: 'Verified' }
        }),
      } as any);

      // Mock providers query
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'provider-1',
            data: () => ({
              notificationSettings: { newJobAlerts: true }
            }),
          },
        ],
      } as any);

      // Mock batch operations
      const mockBatch = {
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);
    });

    it('should create new job successfully', async () => {
      const result = await postJobAction(validJobData);
      
      expect(result.error).toBeNull();
      expect(result.message).toBe('Your job has been posted successfully!');
      expect(mockGetDoc).toHaveBeenCalledWith(expect.any(Object)); // Category check
      expect(mockGetDoc).toHaveBeenCalledWith(expect.any(Object)); // User check
      expect(mockWriteBatch).toHaveBeenCalled();
    });

    it('should notify matching providers', async () => {
      await postJobAction(validJobData);
      
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.any(Object)
      );
      expect(mockGetDocs).toHaveBeenCalled();
    });

    it('should handle invalid JSON in additional details', async () => {
      const dataWithInvalidJSON = { 
        ...validJobData, 
        additionalDetails: 'invalid json' 
      };
      
      const result = await postJobAction(dataWithInvalidJSON);
      
      expect(result.error).toBeNull();
      expect(result.message).toBe('Your job has been posted successfully!');
    });
  });

  describe('Job Update', () => {
    beforeEach(() => {
      // Mock category exists
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'Cleaning Services' }),
      } as any);
    });

    it('should update existing job successfully', async () => {
      const updateData = { ...validJobData, jobId: 'job-123' };
      
      // Mock job exists and user owns it
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ clientId: 'user-123' }),
      } as any);

      const result = await postJobAction(updateData);
      
      expect(result.error).toBeNull();
      expect(result.message).toBe('Your job has been updated successfully!');
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should reject update if user does not own job', async () => {
      const updateData = { ...validJobData, jobId: 'job-123' };
      
      // Mock job exists but user doesn't own it
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ clientId: 'other-user' }),
      } as any);

      const result = await postJobAction(updateData);
      
      expect(result.error).toBe('Permission denied.');
      expect(result.message).toBe('You cannot edit this job.');
    });

    it('should reject update if job does not exist', async () => {
      const updateData = { ...validJobData, jobId: 'job-123' };
      
      // Mock job doesn't exist
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => null,
      } as any);

      const result = await postJobAction(updateData);
      
      expect(result.error).toBe('Permission denied.');
      expect(result.message).toBe('You cannot edit this job.');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockGetDoc.mockRejectedValue(new Error('Database connection failed'));

      const result = await postJobAction(validJobData);
      
      expect(result.error).toContain('Failed to save job: Database connection failed');
      expect(result.message).toBe('An error occurred while saving your job.');
    });

    it('should handle unknown errors', async () => {
      mockGetDoc.mockRejectedValue('Unknown error');

      const result = await postJobAction(validJobData);
      
      expect(result.error).toContain('Failed to save job: An unknown error occurred');
      expect(result.message).toBe('An error occurred while saving your job.');
    });
  });

  describe('Edge Cases', () => {
    it('should handle job without deadline', async () => {
      const dataWithoutDeadline = { ...validJobData };
      delete dataWithoutDeadline.deadline;

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'Cleaning Services' }),
      } as any);

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ 
          displayName: 'John Doe',
          photoURL: 'photo-url',
          verification: { status: 'Verified' }
        }),
      } as any);

      mockGetDocs.mockResolvedValue({ docs: [] } as any);
      
      const mockBatch = {
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);

      const result = await postJobAction(dataWithoutDeadline);
      
      expect(result.error).toBeNull();
      expect(result.message).toBe('Your job has been posted successfully!');
    });

    it('should handle job without additional details', async () => {
      const dataWithoutDetails = { ...validJobData };
      delete dataWithoutDetails.additionalDetails;

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'Cleaning Services' }),
      } as any);

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ 
          displayName: 'John Doe',
          photoURL: 'photo-url',
          verification: { status: 'Verified' }
        }),
      } as any);

      mockGetDocs.mockResolvedValue({ docs: [] } as any);
      
      const mockBatch = {
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);

      const result = await postJobAction(dataWithoutDetails);
      
      expect(result.error).toBeNull();
      expect(result.message).toBe('Your job has been posted successfully!');
    });
  });
});
