import { verifyAdminRole, verifyUserRole } from '../auth-utils';
import { getDb } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('../firebase');
jest.mock('firebase/firestore');

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

describe('Auth Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyAdminRole', () => {
    it('returns true for valid admin user', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'admin',
          accountStatus: 'active',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyAdminRole('admin-user-id');

      expect(result).toBe(true);
      expect(mockGetDoc).toHaveBeenCalledWith(doc(mockGetDb(), 'users', 'admin-user-id'));
    });

    it('returns false for non-admin user', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'client',
          accountStatus: 'active',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyAdminRole('client-user-id');

      expect(result).toBe(false);
    });

    it('returns false for suspended admin user', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'admin',
          accountStatus: 'suspended',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyAdminRole('admin-user-id');

      expect(result).toBe(false);
    });

    it('returns false when user document does not exist', async () => {
      const mockUserDoc = {
        exists: () => false,
        data: () => null,
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyAdminRole('non-existent-user-id');

      expect(result).toBe(false);
    });

    it('returns false when Firestore throws an error', async () => {
      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      const result = await verifyAdminRole('user-id');

      expect(result).toBe(false);
    });

    it('handles missing role field', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          accountStatus: 'active',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyAdminRole('user-id');

      expect(result).toBe(false);
    });

    it('handles missing accountStatus field', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'admin',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyAdminRole('user-id');

      expect(result).toBe(false);
    });
  });

  describe('verifyUserRole', () => {
    it('returns true for user with allowed role', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'provider',
          accountStatus: 'active',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyUserRole('provider-user-id', ['provider', 'client']);

      expect(result).toBe(true);
      expect(mockGetDoc).toHaveBeenCalledWith(doc(mockGetDb(), 'users', 'provider-user-id'));
    });

    it('returns false for user with disallowed role', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'admin',
          accountStatus: 'active',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyUserRole('admin-user-id', ['provider', 'client']);

      expect(result).toBe(false);
    });

    it('returns false for suspended user', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'provider',
          accountStatus: 'suspended',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyUserRole('provider-user-id', ['provider', 'client']);

      expect(result).toBe(false);
    });

    it('returns false when user document does not exist', async () => {
      const mockUserDoc = {
        exists: () => false,
        data: () => null,
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyUserRole('non-existent-user-id', ['provider', 'client']);

      expect(result).toBe(false);
    });

    it('returns false when Firestore throws an error', async () => {
      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      const result = await verifyUserRole('user-id', ['provider', 'client']);

      expect(result).toBe(false);
    });

    it('handles empty allowed roles array', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'provider',
          accountStatus: 'active',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyUserRole('provider-user-id', []);

      expect(result).toBe(false);
    });

    it('handles multiple allowed roles', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'agency',
          accountStatus: 'active',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyUserRole('agency-user-id', ['provider', 'agency', 'client']);

      expect(result).toBe(true);
    });

    it('handles case-sensitive role matching', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'Provider', // Capital P
          accountStatus: 'active',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyUserRole('provider-user-id', ['provider']); // lowercase p

      expect(result).toBe(false);
    });

    it('handles missing role field', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          accountStatus: 'active',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyUserRole('user-id', ['provider', 'client']);

      expect(result).toBe(false);
    });

    it('handles missing accountStatus field', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'provider',
        }),
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyUserRole('user-id', ['provider', 'client']);

      expect(result).toBe(false);
    });

    it('handles null user data', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => null,
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyUserRole('user-id', ['provider', 'client']);

      expect(result).toBe(false);
    });

    it('handles undefined user data', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => undefined,
      };

      mockGetDb.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const result = await verifyUserRole('user-id', ['provider', 'client']);

      expect(result).toBe(false);
    });
  });
});
