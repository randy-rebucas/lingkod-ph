import { handleInviteAction } from '../actions';
import { getDb } from '@/shared/db';
import { writeBatch, doc, getDoc, collection, serverTimestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/shared/db');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock Firestore functions
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;

describe('handleInviteAction', () => {
  const mockDb = {
    collection: mockCollection,
    doc: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);
    mockServerTimestamp.mockReturnValue('mock-timestamp' as any);
  });

  describe('Validation', () => {
    it('should reject invalid form data', async () => {
      const invalidFormData = new FormData();
      invalidFormData.append('inviteId', '');
      invalidFormData.append('accepted', 'invalid');

      const result = await handleInviteAction(
        { error: null, message: '' },
        invalidFormData
      );

      expect(result.error).toBe('Invalid data provided.');
      expect(result.message).toBe('Validation failed.');
    });

    it('should reject missing inviteId', async () => {
      const invalidFormData = new FormData();
      invalidFormData.append('accepted', 'true');

      const result = await handleInviteAction(
        { error: null, message: '' },
        invalidFormData
      );

      expect(result.error).toBe('Invalid data provided.');
      expect(result.message).toBe('Validation failed.');
    });

    it('should reject missing accepted field', async () => {
      const invalidFormData = new FormData();
      invalidFormData.append('inviteId', 'invite-123');

      const result = await handleInviteAction(
        { error: null, message: '' },
        invalidFormData
      );

      expect(result.error).toBe('Invalid data provided.');
      expect(result.message).toBe('Validation failed.');
    });
  });

  describe('Invite Acceptance', () => {
    const validFormData = new FormData();
    validFormData.append('inviteId', 'invite-123');
    validFormData.append('accepted', 'true');

    const mockInviteData = {
      providerId: 'provider-123',
      agencyId: 'agency-123',
    };

    const mockProviderData = {
      displayName: 'John Provider',
    };

    beforeEach(() => {
      // Mock invite exists
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockInviteData,
      } as any);

      // Mock provider exists
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockProviderData,
      } as any);

      // Mock batch operations
      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);
    });

    it('should accept invite successfully', async () => {
      const result = await handleInviteAction(
        { error: null, message: '' },
        validFormData
      );

      expect(result.error).toBeNull();
      expect(result.message).toBe('Invitation successfully accepted.');
      expect(mockWriteBatch).toHaveBeenCalled();
    });

    it('should update provider with agencyId when accepted', async () => {
      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);

      await handleInviteAction(
        { error: null, message: '' },
        validFormData
      );

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.any(Object), // provider ref
        { agencyId: 'agency-123' }
      );
    });

    it('should update invite status to accepted', async () => {
      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);

      await handleInviteAction(
        { error: null, message: '' },
        validFormData
      );

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.any(Object), // invite ref
        { status: 'accepted' }
      );
    });

    it('should create notification for agency when accepted', async () => {
      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);

      await handleInviteAction(
        { error: null, message: '' },
        validFormData
      );

      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.any(Object), // notification ref
        {
          type: 'info',
          message: 'John Provider has accepted your agency invitation.',
          link: '/manage-providers',
          read: false,
          createdAt: 'mock-timestamp',
        }
      );
    });
  });

  describe('Invite Decline', () => {
    const declineFormData = new FormData();
    declineFormData.append('inviteId', 'invite-123');
    declineFormData.append('accepted', 'false');

    const mockInviteData = {
      providerId: 'provider-123',
      agencyId: 'agency-123',
    };

    const mockProviderData = {
      displayName: 'John Provider',
    };

    beforeEach(() => {
      // Mock invite exists
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockInviteData,
      } as any);

      // Mock provider exists
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockProviderData,
      } as any);

      // Mock batch operations
      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);
    });

    it('should decline invite successfully', async () => {
      const result = await handleInviteAction(
        { error: null, message: '' },
        declineFormData
      );

      expect(result.error).toBeNull();
      expect(result.message).toBe('Invitation successfully declined.');
      expect(mockWriteBatch).toHaveBeenCalled();
    });

    it('should update invite status to declined', async () => {
      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);

      await handleInviteAction(
        { error: null, message: '' },
        declineFormData
      );

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.any(Object), // invite ref
        { status: 'declined' }
      );
    });

    it('should create notification for agency when declined', async () => {
      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);

      await handleInviteAction(
        { error: null, message: '' },
        declineFormData
      );

      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.any(Object), // notification ref
        {
          type: 'info',
          message: 'John Provider has declined your agency invitation.',
          link: '/manage-providers',
          read: false,
          createdAt: 'mock-timestamp',
        }
      );
    });

    it('should not update provider when declined', async () => {
      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);

      await handleInviteAction(
        { error: null, message: '' },
        declineFormData
      );

      // Should not update provider with agencyId when declined
      expect(mockBatch.update).not.toHaveBeenCalledWith(
        expect.any(Object),
        { agencyId: 'agency-123' }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invite not found', async () => {
      const validFormData = new FormData();
      validFormData.append('inviteId', 'non-existent-invite');
      validFormData.append('accepted', 'true');

      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => null,
      } as any);

      const result = await handleInviteAction(
        { error: null, message: '' },
        validFormData
      );

      expect(result.error).toBe('Invitation not found or has been revoked.');
      expect(result.message).toBe('Action failed.');
    });

    it('should handle batch commit failure', async () => {
      const validFormData = new FormData();
      validFormData.append('inviteId', 'invite-123');
      validFormData.append('accepted', 'true');

      const mockInviteData = {
        providerId: 'provider-123',
        agencyId: 'agency-123',
      };

      const mockProviderData = {
        displayName: 'John Provider',
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockInviteData,
      } as any);

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockProviderData,
      } as any);

      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn().mockRejectedValue(new Error('Batch commit failed')),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);

      const result = await handleInviteAction(
        { error: null, message: '' },
        validFormData
      );

      expect(result.error).toBe('Batch commit failed');
      expect(result.message).toBe('Action failed.');
    });

    it('should handle unknown errors', async () => {
      const validFormData = new FormData();
      validFormData.append('inviteId', 'invite-123');
      validFormData.append('accepted', 'true');

      mockGetDoc.mockRejectedValue('Unknown error');

      const result = await handleInviteAction(
        { error: null, message: '' },
        validFormData
      );

      expect(result.error).toBe('An unknown error occurred.');
      expect(result.message).toBe('Action failed.');
    });
  });

  describe('Edge Cases', () => {
    it('should handle provider document not found', async () => {
      const validFormData = new FormData();
      validFormData.append('inviteId', 'invite-123');
      validFormData.append('accepted', 'true');

      const mockInviteData = {
        providerId: 'provider-123',
        agencyId: 'agency-123',
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockInviteData,
      } as any);

      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => null,
      } as any);

      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);

      const result = await handleInviteAction(
        { error: null, message: '' },
        validFormData
      );

      // Should still succeed but notification message might be different
      expect(result.error).toBeNull();
      expect(result.message).toBe('Invitation successfully accepted.');
    });

    it('should handle missing provider displayName', async () => {
      const validFormData = new FormData();
      validFormData.append('inviteId', 'invite-123');
      validFormData.append('accepted', 'true');

      const mockInviteData = {
        providerId: 'provider-123',
        agencyId: 'agency-123',
      };

      const mockProviderData = {
        displayName: null,
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockInviteData,
      } as any);

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockProviderData,
      } as any);

      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);

      const result = await handleInviteAction(
        { error: null, message: '' },
        validFormData
      );

      expect(result.error).toBeNull();
      expect(result.message).toBe('Invitation successfully accepted.');
    });
  });
});
