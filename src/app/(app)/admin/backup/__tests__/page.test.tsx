import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import AdminBackupPage from '../page';
import { getDb } from '@/lib/firebase';
import { createBackup } from '@/ai/flows/create-backup';

// Mock the auth context
jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock createBackup
jest.mock('@/ai/flows/create-backup');
const mockCreateBackup = createBackup as jest.MockedFunction<typeof createBackup>;

// Mock useToast
jest.mock('@/hooks/use-toast');
const mockUseToast = jest.fn();

// Mock Firebase Firestore
const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn(() => ({
  orderBy: jest.fn(() => ({
    onSnapshot: mockOnSnapshot,
  })),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => 'Jan 15, 2024 at 10:00 AM'),
}));

describe('AdminBackupPage', () => {
  const mockUser = {
    uid: 'test-admin-id',
    email: 'admin@example.com',
    displayName: 'Admin User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      userRole: 'admin',
      loading: false,
    } as any);

    mockGetDb.mockReturnValue({
      collection: mockCollection,
    } as any);

    // Mock Firestore functions
    jest.doMock('firebase/firestore', () => ({
      collection: mockCollection,
      query: jest.fn(),
      onSnapshot: mockOnSnapshot,
      orderBy: jest.fn(),
      Timestamp: {
        fromDate: jest.fn(),
      },
    }));
  });

  describe('Access Control', () => {
    it('shows access denied for non-admin users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);

      render(<AdminBackupPage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('This page is for administrators only.')).toBeInTheDocument();
    });

    it('shows access denied for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userRole: null,
        loading: false,
      } as any);

      render(<AdminBackupPage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockOnSnapshot.mockImplementation(() => {
        // Don't call callback immediately to simulate loading
        return jest.fn();
      });

      render(<AdminBackupPage />);

      expect(screen.getByText('Data Backup & Recovery')).toBeInTheDocument();
      expect(screen.getByText('Manage and download backups of your platform\'s data.')).toBeInTheDocument();
      // Should show loading skeleton
      const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no backups', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      expect(screen.getByText('No backups found.')).toBeInTheDocument();
    });
  });

  describe('Backup Display', () => {
    const mockBackups = [
      {
        id: 'backup-1',
        fileName: 'backup_2024-01-15.json',
        downloadUrl: 'https://storage.googleapis.com/backup-1.json',
        documentCount: 1500,
        collections: ['users', 'bookings', 'jobs'],
        createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
      },
      {
        id: 'backup-2',
        fileName: 'backup_2024-01-10.json',
        downloadUrl: 'https://storage.googleapis.com/backup-2.json',
        documentCount: 1200,
        collections: ['users', 'bookings'],
        createdAt: { toDate: () => new Date('2024-01-10T14:30:00Z') },
      },
    ];

    it('displays backups in table format', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBackups.map(backup => ({
            id: backup.id,
            data: () => backup,
          })),
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      expect(screen.getByText('backup_2024-01-15.json')).toBeInTheDocument();
      expect(screen.getByText('backup_2024-01-10.json')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('1,200')).toBeInTheDocument();
    });

    it('formats dates correctly', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBackups.map(backup => ({
            id: backup.id,
            data: () => backup,
          })),
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      // Should show formatted dates
      expect(screen.getByText('Jan 15, 2024 at 10:00 AM')).toBeInTheDocument();
    });

    it('shows download buttons for each backup', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBackups.map(backup => ({
            id: backup.id,
            data: () => backup,
          })),
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      const downloadButtons = screen.getAllByText('Download');
      expect(downloadButtons).toHaveLength(2);
    });

    it('download buttons have correct href attributes', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBackups.map(backup => ({
            id: backup.id,
            data: () => backup,
          })),
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      const downloadLinks = document.querySelectorAll('a[href*="storage.googleapis.com"]');
      expect(downloadLinks).toHaveLength(2);
      expect(downloadLinks[0]).toHaveAttribute('href', 'https://storage.googleapis.com/backup-1.json');
      expect(downloadLinks[1]).toHaveAttribute('href', 'https://storage.googleapis.com/backup-2.json');
    });

    it('download buttons open in new tab', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockBackups.map(backup => ({
            id: backup.id,
            data: () => backup,
          })),
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      const downloadLinks = document.querySelectorAll('a[target="_blank"]');
      expect(downloadLinks).toHaveLength(2);
    });
  });

  describe('Create Backup', () => {
    it('shows create backup button', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      expect(screen.getByText('Create New Backup')).toBeInTheDocument();
    });

    it('handles successful backup creation', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      mockCreateBackup.mockResolvedValue({
        success: true,
        message: 'Backup created successfully',
        backupId: 'new-backup-123',
      });

      render(<AdminBackupPage />);

      const createButton = screen.getByText('Create New Backup');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateBackup).toHaveBeenCalledWith({
          id: mockUser.uid,
          name: mockUser.displayName,
          role: 'admin',
        });
      });
    });

    it('handles backup creation failure', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      mockCreateBackup.mockResolvedValue({
        success: false,
        message: 'Failed to create backup',
      });

      render(<AdminBackupPage />);

      const createButton = screen.getByText('Create New Backup');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateBackup).toHaveBeenCalled();
      });
    });

    it('shows loading state during backup creation', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      // Mock a slow backup creation
      mockCreateBackup.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ success: true, message: 'Backup created' }), 100)
        )
      );

      render(<AdminBackupPage />);

      const createButton = screen.getByText('Create New Backup');
      fireEvent.click(createButton);

      // Should show loading state
      expect(screen.getByText('Creating Backup...')).toBeInTheDocument();
      expect(createButton).toBeDisabled();
    });

    it('handles backup creation errors', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      mockCreateBackup.mockRejectedValue(new Error('Database connection failed'));

      render(<AdminBackupPage />);

      const createButton = screen.getByText('Create New Backup');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateBackup).toHaveBeenCalled();
      });
    });

    it('handles unauthenticated user in backup creation', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userRole: null,
        loading: false,
      } as any);

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      // Should not show create button for unauthenticated users
      expect(screen.queryByText('Create New Backup')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors gracefully', () => {
      mockOnSnapshot.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Firestore error'));
        return jest.fn();
      });

      render(<AdminBackupPage />);

      // Should handle error without crashing
      expect(screen.getByText('Data Backup & Recovery')).toBeInTheDocument();
    });

    it('handles missing backup data gracefully', () => {
      const incompleteBackup = {
        id: 'backup-1',
        fileName: 'backup.json',
        // Missing other fields
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'backup-1',
            data: () => incompleteBackup,
          }],
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      // Should handle missing data gracefully
      expect(screen.getByText('backup.json')).toBeInTheDocument();
    });

    it('handles backup with null createdAt', () => {
      const backupWithNullDate = {
        id: 'backup-1',
        fileName: 'backup.json',
        downloadUrl: 'https://example.com/backup.json',
        documentCount: 100,
        collections: ['users'],
        createdAt: null,
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'backup-1',
            data: () => backupWithNullDate,
          }],
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      // Should show N/A for null date
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Backup Information', () => {
    it('shows backup history header', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      expect(screen.getByText('Backup History')).toBeInTheDocument();
      expect(screen.getByText('Backups are stored as JSON files in your Firebase Storage.')).toBeInTheDocument();
    });

    it('shows correct table headers', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      expect(screen.getByText('Date Created')).toBeInTheDocument();
      expect(screen.getByText('File Name')).toBeInTheDocument();
      expect(screen.getByText('Document Count')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('formats document count with locale', () => {
      const backupWithLargeCount = {
        id: 'backup-1',
        fileName: 'backup.json',
        downloadUrl: 'https://example.com/backup.json',
        documentCount: 1234567,
        collections: ['users'],
        createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'backup-1',
            data: () => backupWithLargeCount,
          }],
        });
        return jest.fn();
      });

      render(<AdminBackupPage />);

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });
  });

  describe('Backup Actions', () => {
    it('disables create button during backup creation', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      // Mock a slow backup creation
      mockCreateBackup.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ success: true, message: 'Backup created' }), 100)
        )
      );

      render(<AdminBackupPage />);

      const createButton = screen.getByText('Create New Backup');
      fireEvent.click(createButton);

      // Button should be disabled during creation
      expect(createButton).toBeDisabled();
    });

    it('re-enables create button after backup creation completes', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      mockCreateBackup.mockResolvedValue({
        success: true,
        message: 'Backup created successfully',
      });

      render(<AdminBackupPage />);

      const createButton = screen.getByText('Create New Backup');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateBackup).toHaveBeenCalled();
      });

      // Button should be re-enabled after completion
      expect(createButton).not.toBeDisabled();
    });
  });
});
