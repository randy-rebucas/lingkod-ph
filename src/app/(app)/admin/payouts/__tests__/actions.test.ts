import { handleMarkAsPaid } from '../actions';

describe('Admin Payouts Actions', () => {
  const mockActor = { id: 'admin-id', name: 'Admin' };

  describe('handleMarkAsPaid', () => {
    it('marks payout as paid successfully', async () => {
      const result = await handleMarkAsPaid(
        'payout-123',
        'provider-123',
        'John Doe',
        1000,
        mockActor
      );
      expect(result.error).toBeNull();
      expect(result.message).toBe('Payout for John Doe marked as paid.');
    });

    it('handles payout processing errors', async () => {
      const result = await handleMarkAsPaid(
        'invalid-id',
        'provider-123',
        'John Doe',
        1000,
        mockActor
      );
      expect(result.error).toBeDefined();
      expect(result.message).toBe('Failed to update payout status.');
    });

    it('processes payout with correct amount formatting', async () => {
      const result = await handleMarkAsPaid(
        'payout-123',
        'provider-123',
        'Jane Smith',
        1500.50,
        mockActor
      );
      expect(result.error).toBeNull();
      expect(result.message).toBe('Payout for Jane Smith marked as paid.');
    });
  });
});
