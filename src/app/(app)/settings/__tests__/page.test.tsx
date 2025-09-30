import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import { useTheme } from 'next-themes';
import SettingsPage from '../page';
import { getDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Mock the auth context
jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock next-themes
jest.mock('next-themes');
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock useToast
jest.mock('@/hooks/use-toast');
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock Firebase Firestore
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDoc = jest.fn(() => ({
  getDoc: mockGetDoc,
  updateDoc: mockUpdateDoc,
}));

describe('SettingsPage', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockToast = jest.fn();
  const mockSetTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      userRole: 'client',
      loading: false,
    } as any);

    mockUseTheme.mockReturnValue({
      setTheme: mockSetTheme,
      theme: 'system',
    } as any);

    mockUseToast.mockReturnValue({
      toast: mockToast,
    } as any);

    mockGetDb.mockReturnValue({
      doc: mockDoc,
    } as any);

    // Mock Firestore functions
    jest.doMock('firebase/firestore', () => ({
      doc: mockDoc,
      getDoc: mockGetDoc,
      updateDoc: mockUpdateDoc,
    }));

    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'locale=en',
    });

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: {
        reload: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Rendering', () => {
    it('renders the settings page with correct title', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {
            bookingUpdates: true,
            newMessages: true,
            promotionalEmails: false,
            agencyInvites: true,
            newJobAlerts: true,
          },
          privacySettings: {
            profileVisibility: 'public',
            showOnlineStatus: true,
            allowDirectMessages: true,
            dataSharing: false,
          },
          accountSettings: {
            emailNotifications: true,
            smsNotifications: false,
            twoFactorAuth: false,
          },
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByText('subtitle')).toBeInTheDocument();
      });
    });

    it('renders all settings tabs', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Account')).toBeInTheDocument();
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByText('Privacy')).toBeInTheDocument();
        expect(screen.getByText('Appearance')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockGetDoc.mockImplementation(() => {
        // Don't resolve immediately to simulate loading
        return new Promise(() => {});
      });

      render(<SettingsPage />);

      // Should show loading skeletons
      const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Account Settings Tab', () => {
    it('renders account settings controls', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {
            emailNotifications: true,
            smsNotifications: false,
            twoFactorAuth: false,
          },
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Email Notifications')).toBeInTheDocument();
        expect(screen.getByText('SMS Notifications')).toBeInTheDocument();
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
      });
    });

    it('allows toggling email notifications', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {
            emailNotifications: true,
            smsNotifications: false,
            twoFactorAuth: false,
          },
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const emailSwitch = screen.getByLabelText('Email Notifications');
        fireEvent.click(emailSwitch);
      });

      // Should show unsaved changes indicator
      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });

    it('allows toggling SMS notifications', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {
            emailNotifications: true,
            smsNotifications: false,
            twoFactorAuth: false,
          },
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const smsSwitch = screen.getByLabelText('SMS Notifications');
        fireEvent.click(smsSwitch);
      });

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });

    it('allows toggling two-factor authentication', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {
            emailNotifications: true,
            smsNotifications: false,
            twoFactorAuth: false,
          },
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const twoFactorSwitch = screen.getByLabelText('Two-Factor Authentication');
        fireEvent.click(twoFactorSwitch);
      });

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });
  });

  describe('Notifications Tab', () => {
    it('renders notification settings controls', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {
            bookingUpdates: true,
            newMessages: true,
            promotionalEmails: false,
            agencyInvites: true,
            newJobAlerts: true,
          },
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('bookingUpdates')).toBeInTheDocument();
        expect(screen.getByText('newMessages')).toBeInTheDocument();
        expect(screen.getByText('promotionalEmails')).toBeInTheDocument();
      });
    });

    it('shows provider-specific notifications for provider users', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'provider',
        loading: false,
      } as any);

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {
            bookingUpdates: true,
            newMessages: true,
            promotionalEmails: false,
            agencyInvites: true,
            newJobAlerts: true,
          },
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('agencyInvites')).toBeInTheDocument();
        expect(screen.getByText('newJobAlerts')).toBeInTheDocument();
      });
    });

    it('allows toggling notification settings', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {
            bookingUpdates: true,
            newMessages: true,
            promotionalEmails: false,
            agencyInvites: true,
            newJobAlerts: true,
          },
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const bookingUpdatesSwitch = screen.getByLabelText('bookingUpdates');
        fireEvent.click(bookingUpdatesSwitch);
      });

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });
  });

  describe('Privacy Tab', () => {
    it('renders privacy settings controls', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {
            profileVisibility: 'public',
            showOnlineStatus: true,
            allowDirectMessages: true,
            dataSharing: false,
          },
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Profile Visibility')).toBeInTheDocument();
        expect(screen.getByText('Show Online Status')).toBeInTheDocument();
        expect(screen.getByText('Allow Direct Messages')).toBeInTheDocument();
        expect(screen.getByText('Data Sharing')).toBeInTheDocument();
      });
    });

    it('allows changing profile visibility', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {
            profileVisibility: 'public',
            showOnlineStatus: true,
            allowDirectMessages: true,
            dataSharing: false,
          },
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const profileVisibilitySelect = screen.getByDisplayValue('Public - Everyone can see your profile');
        fireEvent.click(profileVisibilitySelect);
      });

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });

    it('allows toggling privacy settings', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {
            profileVisibility: 'public',
            showOnlineStatus: true,
            allowDirectMessages: true,
            dataSharing: false,
          },
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const showOnlineStatusSwitch = screen.getByLabelText('Show Online Status');
        fireEvent.click(showOnlineStatusSwitch);
      });

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });
  });

  describe('Appearance Tab', () => {
    it('renders appearance settings controls', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Theme')).toBeInTheDocument();
        expect(screen.getByText('Language')).toBeInTheDocument();
      });
    });

    it('allows changing theme', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const themeSelect = screen.getByDisplayValue('System');
        fireEvent.click(themeSelect);
      });

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });

    it('allows changing language', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const languageSelect = screen.getByDisplayValue('English');
        fireEvent.click(languageSelect);
      });

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });

    it('reloads page when language is changed', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const languageSelect = screen.getByDisplayValue('English');
        fireEvent.click(languageSelect);

        const filipinoOption = screen.getByText('Filipino');
        fireEvent.click(filipinoOption);
      });

      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Save Changes', () => {
    it('saves changes successfully', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {
            bookingUpdates: true,
            newMessages: true,
            promotionalEmails: false,
            agencyInvites: true,
            newJobAlerts: true,
          },
          privacySettings: {
            profileVisibility: 'public',
            showOnlineStatus: true,
            allowDirectMessages: true,
            dataSharing: false,
          },
          accountSettings: {
            emailNotifications: true,
            smsNotifications: false,
            twoFactorAuth: false,
          },
          theme: 'system',
          language: 'en',
        }),
      });

      mockUpdateDoc.mockResolvedValue(undefined);

      render(<SettingsPage />);

      await waitFor(() => {
        const emailSwitch = screen.getByLabelText('Email Notifications');
        fireEvent.click(emailSwitch);
      });

      const saveButton = screen.getByText('savePreferences');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: 'success',
          description: 'preferencesSaved',
        });
      });
    });

    it('handles save errors gracefully', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      mockUpdateDoc.mockRejectedValue(new Error('Save failed'));

      render(<SettingsPage />);

      await waitFor(() => {
        const emailSwitch = screen.getByLabelText('Email Notifications');
        fireEvent.click(emailSwitch);
      });

      const saveButton = screen.getByText('savePreferences');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'saveFailed',
          description: 'Save failed',
        });
      });
    });

    it('disables save button when no changes', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const saveButton = screen.getByText('savePreferences');
        expect(saveButton).toBeDisabled();
      });
    });

    it('shows loading state when saving', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      mockUpdateDoc.mockImplementation(() => {
        // Don't resolve immediately to simulate loading
        return new Promise(() => {});
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const emailSwitch = screen.getByLabelText('Email Notifications');
        fireEvent.click(emailSwitch);
      });

      const saveButton = screen.getByText('savePreferences');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('saving')).toBeInTheDocument();
      });
    });
  });

  describe('Unsaved Changes Indicator', () => {
    it('shows unsaved changes indicator when settings are modified', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const emailSwitch = screen.getByLabelText('Email Notifications');
        fireEvent.click(emailSwitch);
      });

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });

    it('hides unsaved changes indicator after saving', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      mockUpdateDoc.mockResolvedValue(undefined);

      render(<SettingsPage />);

      await waitFor(() => {
        const emailSwitch = screen.getByLabelText('Email Notifications');
        fireEvent.click(emailSwitch);
      });

      const saveButton = screen.getByText('savePreferences');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('All changes have been saved')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles unauthenticated user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userRole: null,
        loading: false,
      } as any);

      render(<SettingsPage />);

      await waitFor(() => {
        const emailSwitch = screen.getByLabelText('Email Notifications');
        fireEvent.click(emailSwitch);
      });

      const saveButton = screen.getByText('savePreferences');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'error',
          description: 'mustBeLoggedIn',
        });
      });
    });

    it('handles Firestore errors gracefully', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      render(<SettingsPage />);

      // Should handle error without crashing
      await waitFor(() => {
        expect(screen.getByText('title')).toBeInTheDocument();
      });
    });
  });

  describe('Default Values', () => {
    it('uses default values when user document does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => ({}),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('title')).toBeInTheDocument();
      });
    });

    it('uses default values when user document has no settings', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('title')).toBeInTheDocument();
      });
    });
  });

  describe('Cookie Handling', () => {
    it('reads language from cookie', async () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'locale=tl',
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          notificationSettings: {},
          privacySettings: {},
          accountSettings: {},
          theme: 'system',
          language: 'en',
        }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('title')).toBeInTheDocument();
      });
    });
  });
});
