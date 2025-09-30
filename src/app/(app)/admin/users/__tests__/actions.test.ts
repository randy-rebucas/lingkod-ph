import { handleCreateUser, handleDeleteUser } from '../actions';
import { getDb } from '@/lib/firebase';
import { setDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { adminAuth } from '@/lib/firebase-admin';
import { AuditLogger } from '@/lib/audit-logger';

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock Firestore functions
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin');
const mockAdminAuth = adminAuth as jest.Mocked<typeof adminAuth>;

// Mock Audit Logger
jest.mock('@/lib/audit-logger');
const mockAuditLogger = AuditLogger as jest.Mocked<typeof AuditLogger>;

describe('Admin User Actions', () => {
  const mockDb = {
    collection: jest.fn(),
    doc: jest.fn(),
  };

  const mockActor = {
    id: 'admin-123',
    name: 'Admin User',
    role: 'admin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);
    
    // Mock AuditLogger instance
    const mockAuditLoggerInstance = {
      logAction: jest.fn(),
    };
    mockAuditLogger.getInstance.mockReturnValue(mockAuditLoggerInstance as any);
  });

  describe('handleCreateUser', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'provider' as const,
      phone: '+1234567890',
    };

    it('should create user successfully', async () => {
      const mockUserRecord = {
        uid: 'new-user-123',
        email: 'john@example.com',
        displayName: 'John Doe',
      };

      mockAdminAuth.createUser.mockResolvedValue(mockUserRecord as any);
      mockSetDoc.mockResolvedValue(undefined);

      const result = await handleCreateUser(validUserData, mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('User created successfully!');
      expect(mockAdminAuth.createUser).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        displayName: 'John Doe',
      });
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'J', // Too short
        email: 'invalid-email',
        password: '123', // Too short
        role: 'invalid-role' as any,
        phone: '+1234567890',
      };

      const result = await handleCreateUser(invalidData, mockActor);

      expect(result.error).toContain('Name must be at least 2 characters');
      expect(result.error).toContain('Please enter a valid email');
      expect(result.error).toContain('Password must be at least 6 characters');
      expect(result.message).toBe('Validation failed.');
    });

    it('should handle Firebase Auth creation failure', async () => {
      mockAdminAuth.createUser.mockRejectedValue(new Error('Auth creation failed'));

      const result = await handleCreateUser(validUserData, mockActor);

      expect(result.error).toContain('Failed to create user: Auth creation failed');
      expect(result.message).toBe('User creation failed.');
    });

    it('should handle Firestore document creation failure', async () => {
      const mockUserRecord = {
        uid: 'new-user-123',
        email: 'john@example.com',
        displayName: 'John Doe',
      };

      mockAdminAuth.createUser.mockResolvedValue(mockUserRecord as any);
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      const result = await handleCreateUser(validUserData, mockActor);

      expect(result.error).toContain('Failed to create user: Firestore error');
      expect(result.message).toBe('User creation failed.');
    });

    it('should generate referral code for new user', async () => {
      const mockUserRecord = {
        uid: 'new-user-123',
        email: 'john@example.com',
        displayName: 'John Doe',
      };

      mockAdminAuth.createUser.mockResolvedValue(mockUserRecord as any);
      mockSetDoc.mockResolvedValue(undefined);

      await handleCreateUser(validUserData, mockActor);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          referralCode: expect.any(String),
        })
      );
    });

    it('should log admin action', async () => {
      const mockUserRecord = {
        uid: 'new-user-123',
        email: 'john@example.com',
        displayName: 'John Doe',
      };

      mockAdminAuth.createUser.mockResolvedValue(mockUserRecord as any);
      mockSetDoc.mockResolvedValue(undefined);

      await handleCreateUser(validUserData, mockActor);

      expect(mockAuditLogger.getInstance().logAction).toHaveBeenCalledWith(
        'admin-123',
        'users',
        'USER_CREATED',
        expect.objectContaining({
          targetUserId: 'new-user-123',
          userEmail: 'john@example.com',
          userRole: 'provider',
          actorRole: 'admin',
        })
      );
    });

    it('should handle user without phone number', async () => {
      const userDataWithoutPhone = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'provider' as const,
      };

      const mockUserRecord = {
        uid: 'new-user-123',
        email: 'john@example.com',
        displayName: 'John Doe',
      };

      mockAdminAuth.createUser.mockResolvedValue(mockUserRecord as any);
      mockSetDoc.mockResolvedValue(undefined);

      const result = await handleCreateUser(userDataWithoutPhone, mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('User created successfully!');
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          phone: '',
        })
      );
    });
  });

  describe('handleDeleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-to-delete-123';
      
      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await handleDeleteUser(userId, mockActor);

      expect(result.error).toBeNull();
      expect(result.message).toBe('User deleted successfully!');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should handle deletion failure', async () => {
      const userId = 'user-to-delete-123';
      
      mockDeleteDoc.mockRejectedValue(new Error('Deletion failed'));

      const result = await handleDeleteUser(userId, mockActor);

      expect(result.error).toContain('Failed to delete user: Deletion failed');
      expect(result.message).toBe('User deletion failed.');
    });

    it('should log admin action for deletion', async () => {
      const userId = 'user-to-delete-123';
      
      mockDeleteDoc.mockResolvedValue(undefined);

      await handleDeleteUser(userId, mockActor);

      expect(mockAuditLogger.getInstance().logAction).toHaveBeenCalledWith(
        'admin-123',
        'users',
        'USER_DELETED',
        expect.objectContaining({
          targetUserId: userId,
          actorRole: 'admin',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown errors in createUser', async () => {
      mockAdminAuth.createUser.mockRejectedValue('Unknown error');

      const result = await handleCreateUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'provider',
        phone: '+1234567890',
      }, mockActor);

      expect(result.error).toContain('Failed to create user: An unknown error occurred');
      expect(result.message).toBe('User creation failed.');
    });

    it('should handle unknown errors in deleteUser', async () => {
      mockDeleteDoc.mockRejectedValue('Unknown error');

      const result = await handleDeleteUser('user-123', mockActor);

      expect(result.error).toContain('Failed to delete user: An unknown error occurred');
      expect(result.message).toBe('User deletion failed.');
    });
  });
});
