import { getAgencyReportsData, markPayoutAsPaid } from '../actions';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          getDocs: jest.fn(() => Promise.resolve({
            docs: []
          }))
        }))
      }))
    }))
  }))
}));

describe('Reports Actions', () => {
  describe('getAgencyReportsData', () => {
    it('should return success with empty data when no providers found', async () => {
      const result = await getAgencyReportsData('test-agency-id');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        bookings: [],
        payouts: [],
        providerIds: []
      });
    });

    it('should validate agency ID', async () => {
      const result = await getAgencyReportsData('');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Agency ID is required');
    });
  });

  describe('markPayoutAsPaid', () => {
    it('should validate payout ID', async () => {
      const result = await markPayoutAsPaid('');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Payout ID is required');
    });
  });
});
