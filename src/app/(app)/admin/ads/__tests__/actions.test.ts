import { handleUpdateAdCampaign, handleAddAdCampaign, handleDeleteAdCampaign } from '../actions';
import { getDb } from '@/shared/db';
import { doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { AuditLogger } from '@/lib/audit-logger';

// Mock Firebase
jest.mock('@/shared/db');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock Firebase Firestore
jest.mock('firebase/firestore');
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;

// Mock AuditLogger
jest.mock('@/lib/audit-logger');
const mockAuditLogger = AuditLogger as jest.Mocked<typeof AuditLogger>;

describe('Admin Ads Actions', () => {
  const mockActor = {
    id: 'admin-user-id',
    name: 'Admin User',
  };

  const mockDb = {
    collection: jest.fn(),
    doc: jest.fn(),
  };

  const mockCampaignRef = {
    id: 'campaign-123',
  };

  const mockNewDoc = {
    id: 'new-campaign-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGetDb.mockReturnValue(mockDb as any);
    mockServerTimestamp.mockReturnValue('mock-timestamp' as any);
    
    mockAuditLogger.getInstance.mockReturnValue({
      logAction: jest.fn(),
    } as any);
  });

  describe('handleUpdateAdCampaign', () => {
    it('updates ad campaign successfully', async () => {
      const updateData = {
        name: 'Updated Campaign',
        price: 1000,
        isActive: true,
      };

      const result = await handleUpdateAdCampaign('campaign-123', updateData, mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('Ad campaign updated successfully.');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        updateData
      );
    });

    it('logs audit action when updating campaign', async () => {
      const updateData = {
        name: 'Updated Campaign',
        price: 1000,
      };

      await handleUpdateAdCampaign('campaign-123', updateData, mockActor);

      expect(mockAuditLogger.getInstance().logAction).toHaveBeenCalledWith(
        'AD_CAMPAIGN_UPDATED',
        'admin-user-id',
        'broadcast',
        {
          campaignId: 'campaign-123',
          changes: updateData,
          actorRole: 'admin',
        }
      );
    });

    it('handles update errors gracefully', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Database error'));

      const updateData = {
        name: 'Updated Campaign',
      };

      const result = await handleUpdateAdCampaign('campaign-123', updateData, mockActor);

      expect(result.error).toBe('Database error');
      expect(result.message).toBe('Failed to update ad campaign.');
    });

    it('handles missing campaign ID', async () => {
      const updateData = {
        name: 'Updated Campaign',
      };

      const result = await handleUpdateAdCampaign('', updateData, mockActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to update ad campaign.');
    });
  });

  describe('handleAddAdCampaign', () => {
    const validCampaignData = {
      name: 'New Campaign',
      description: 'Campaign description',
      price: 500,
      durationDays: 7,
      isActive: true,
      imageUrl: 'https://example.com/image.jpg',
      socialLink: 'https://facebook.com/page',
    };

    it('creates new ad campaign successfully', async () => {
      mockAddDoc.mockResolvedValue(mockNewDoc as any);

      const result = await handleAddAdCampaign(validCampaignData, mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('Ad campaign "New Campaign" added successfully.');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        {
          ...validCampaignData,
          createdAt: 'mock-timestamp',
        }
      );
    });

    it('logs audit action when creating campaign', async () => {
      mockAddDoc.mockResolvedValue(mockNewDoc as any);

      await handleAddAdCampaign(validCampaignData, mockActor);

      expect(mockAuditLogger.getInstance().logAction).toHaveBeenCalledWith(
        'AD_CAMPAIGN_CREATED',
        'admin-user-id',
        'ad_campaign',
        {
          campaignId: 'new-campaign-123',
          name: 'New Campaign',
          actorRole: 'admin',
        }
      );
    });

    it('validates required fields', async () => {
      const invalidData = {
        description: 'Campaign description',
        // Missing name, price, durationDays
      };

      const result = await handleAddAdCampaign(invalidData, mockActor);

      expect(result.error).toBe('Invalid data provided.');
      expect(result.message).toBe('Validation failed.');
      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it('validates name field', async () => {
      const invalidData = {
        name: '',
        price: 500,
        durationDays: 7,
      };

      const result = await handleAddAdCampaign(invalidData, mockActor);

      expect(result.error).toBe('Invalid data provided.');
      expect(result.message).toBe('Validation failed.');
    });

    it('validates price field', async () => {
      const invalidData = {
        name: 'New Campaign',
        price: 0,
        durationDays: 7,
      };

      const result = await handleAddAdCampaign(invalidData, mockActor);

      expect(result.error).toBe('Invalid data provided.');
      expect(result.message).toBe('Validation failed.');
    });

    it('validates durationDays field', async () => {
      const invalidData = {
        name: 'New Campaign',
        price: 500,
        durationDays: 0,
      };

      const result = await handleAddAdCampaign(invalidData, mockActor);

      expect(result.error).toBe('Invalid data provided.');
      expect(result.message).toBe('Validation failed.');
    });

    it('handles creation errors gracefully', async () => {
      mockAddDoc.mockRejectedValue(new Error('Database error'));

      const result = await handleAddAdCampaign(validCampaignData, mockActor);

      expect(result.error).toBe('Database error');
      expect(result.message).toBe('Failed to add ad campaign.');
    });

    it('handles missing actor information', async () => {
      const invalidActor = {
        id: '',
        name: null,
      };

      const result = await handleAddAdCampaign(validCampaignData, invalidActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to add ad campaign.');
    });

    it('handles campaign with optional fields', async () => {
      const minimalData = {
        name: 'Minimal Campaign',
        price: 300,
        durationDays: 14,
        // No description, imageUrl, socialLink
      };

      mockAddDoc.mockResolvedValue(mockNewDoc as any);

      const result = await handleAddAdCampaign(minimalData, mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('Ad campaign "Minimal Campaign" added successfully.');
    });
  });

  describe('handleDeleteAdCampaign', () => {
    it('deletes ad campaign successfully', async () => {
      const result = await handleDeleteAdCampaign('campaign-123', mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('Ad campaign has been deleted successfully.');
      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.any(Object));
    });

    it('logs audit action when deleting campaign', async () => {
      await handleDeleteAdCampaign('campaign-123', mockActor);

      expect(mockAuditLogger.getInstance().logAction).toHaveBeenCalledWith(
        'AD_CAMPAIGN_DELETED',
        'admin-user-id',
        'ad_campaign',
        {
          campaignId: 'campaign-123',
          actorRole: 'admin',
        }
      );
    });

    it('handles deletion errors gracefully', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Database error'));

      const result = await handleDeleteAdCampaign('campaign-123', mockActor);

      expect(result.error).toBe('Database error');
      expect(result.message).toBe('Failed to delete ad campaign.');
    });

    it('handles missing campaign ID', async () => {
      const result = await handleDeleteAdCampaign('', mockActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to delete ad campaign.');
    });

    it('handles non-existent campaign', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Document not found'));

      const result = await handleDeleteAdCampaign('non-existent-id', mockActor);

      expect(result.error).toBe('Document not found');
      expect(result.message).toBe('Failed to delete ad campaign.');
    });
  });

  describe('Edge Cases', () => {
    it('handles null actor data', async () => {
      const nullActor = {
        id: null as any,
        name: null,
      };

      const result = await handleAddAdCampaign({
        name: 'Test Campaign',
        price: 500,
        durationDays: 7,
      }, nullActor);

      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to add ad campaign.');
    });

    it('handles undefined campaign data', async () => {
      const result = await handleAddAdCampaign(undefined as any, mockActor);

      expect(result.error).toBe('Invalid data provided.');
      expect(result.message).toBe('Validation failed.');
    });

    it('handles very large campaign data', async () => {
      const largeData = {
        name: 'A'.repeat(1000),
        description: 'B'.repeat(10000),
        price: 999999,
        durationDays: 365,
        isActive: true,
        imageUrl: 'https://example.com/very-long-url/' + 'x'.repeat(1000),
        socialLink: 'https://facebook.com/very-long-page-name/' + 'y'.repeat(1000),
      };

      mockAddDoc.mockResolvedValue(mockNewDoc as any);

      const result = await handleAddAdCampaign(largeData, mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe(`Ad campaign "${largeData.name}" added successfully.`);
    });

    it('handles special characters in campaign data', async () => {
      const specialData = {
        name: 'Campaign with Special Chars: !@#$%^&*()',
        description: 'Description with émojis 🎉 and unicode 中文',
        price: 500,
        durationDays: 7,
        isActive: true,
        socialLink: 'https://example.com/page?param=value&other=123',
      };

      mockAddDoc.mockResolvedValue(mockNewDoc as any);

      const result = await handleAddAdCampaign(specialData, mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe(`Ad campaign "${specialData.name}" added successfully.`);
    });

    it('handles concurrent updates to same campaign', async () => {
      const updateData1 = { name: 'Update 1' };
      const updateData2 = { name: 'Update 2' };

      // Simulate concurrent updates
      const promise1 = handleUpdateAdCampaign('campaign-123', updateData1, mockActor);
      const promise2 = handleUpdateAdCampaign('campaign-123', updateData2, mockActor);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.error).toBeNull();
      expect(result2.error).toBeNull();
      expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('Database Integration', () => {
    it('uses correct collection reference', async () => {
      mockAddDoc.mockResolvedValue(mockNewDoc as any);

      await handleAddAdCampaign({
        name: 'Test Campaign',
        price: 500,
        durationDays: 7,
      }, mockActor);

      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'adCampaigns');
    });

    it('uses correct document reference for updates', async () => {
      await handleUpdateAdCampaign('campaign-123', { name: 'Updated' }, mockActor);

      expect(mockDb.doc).toHaveBeenCalledWith('adCampaigns', 'campaign-123');
    });

    it('uses correct document reference for deletions', async () => {
      await handleDeleteAdCampaign('campaign-123', mockActor);

      expect(mockDb.doc).toHaveBeenCalledWith('adCampaigns', 'campaign-123');
    });
  });
});
