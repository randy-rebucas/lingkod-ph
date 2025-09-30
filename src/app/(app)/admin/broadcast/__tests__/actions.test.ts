import { sendBroadcastAction, sendCampaignEmailAction } from '../actions';

describe('Admin Broadcast Actions', () => {
  describe('sendBroadcastAction', () => {
    it('validates message length', async () => {
      const result = await sendBroadcastAction('short', { id: 'admin-id', name: 'Admin' });
      expect(result.error).toBe('Broadcast message must be at least 10 characters.');
    });

    it('sends broadcast with valid message', async () => {
      const result = await sendBroadcastAction('This is a valid broadcast message', { id: 'admin-id', name: 'Admin' });
      expect(result.error).toBeNull();
      expect(result.message).toBe('Your message is now active for all users.');
    });

    it('handles empty message', async () => {
      const result = await sendBroadcastAction('', { id: 'admin-id', name: 'Admin' });
      expect(result.error).toBe('Broadcast message must be at least 10 characters.');
    });
  });

  describe('sendCampaignEmailAction', () => {
    it('validates email data', async () => {
      const result = await sendCampaignEmailAction(
        { subject: 'Hi', message: 'Short' },
        { id: 'admin-id', name: 'Admin' }
      );
      expect(result.error).toContain('Subject must be at least 5 characters');
    });

    it('sends campaign email with valid data', async () => {
      const result = await sendCampaignEmailAction(
        { subject: 'Valid Subject', message: 'This is a valid campaign message' },
        { id: 'admin-id', name: 'Admin' }
      );
      // Should handle the email sending (mocked in jest.setup.js)
      expect(result).toBeDefined();
    });
  });
});
