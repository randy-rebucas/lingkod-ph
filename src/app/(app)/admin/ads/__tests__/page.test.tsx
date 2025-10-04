import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import AdminAdsPage from '../page';
import { getDb, getStorageInstance } from '@/shared/db';
import { handleUpdateAdCampaign, handleDeleteAdCampaign, handleAddAdCampaign } from '../actions';

// Mock the auth context
jest.mock('@/shared/auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Firebase
jest.mock('@/shared/db');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockGetStorageInstance = getStorageInstance as jest.MockedFunction<typeof getStorageInstance>;

// Mock server actions
jest.mock('../actions');
const mockHandleUpdateAdCampaign = handleUpdateAdCampaign as jest.MockedFunction<typeof handleUpdateAdCampaign>;
const mockHandleDeleteAdCampaign = handleDeleteAdCampaign as jest.MockedFunction<typeof handleDeleteAdCampaign>;
const mockHandleAddAdCampaign = handleAddAdCampaign as jest.MockedFunction<typeof handleAddAdCampaign>;

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

// Mock Firebase Storage
const mockRef = jest.fn();
const mockUploadBytesResumable = jest.fn();
const mockGetDownloadURL = jest.fn();

describe('AdminAdsPage', () => {
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

    mockGetStorageInstance.mockReturnValue({
      ref: mockRef,
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

    // Mock Firebase Storage functions
    jest.doMock('firebase/storage', () => ({
      ref: mockRef,
      uploadBytesResumable: mockUploadBytesResumable,
      getDownloadURL: mockGetDownloadURL,
    }));

    // Mock date-fns
    jest.doMock('date-fns', () => ({
      differenceInDays: jest.fn(() => 2),
      addDays: jest.fn(() => new Date('2024-01-20')),
    }));
  });

  describe('Access Control', () => {
    it('shows access denied for non-admin users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);

      render(<AdminAdsPage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('This page is for administrators only.')).toBeInTheDocument();
    });

    it('shows access denied for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userRole: null,
        loading: false,
      } as any);

      render(<AdminAdsPage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockOnSnapshot.mockImplementation(() => {
        // Don't call callback immediately to simulate loading
        return jest.fn();
      });

      render(<AdminAdsPage />);

      expect(screen.getByText('Ad Management')).toBeInTheDocument();
      expect(screen.getByText('Manage promotional campaigns for providers.')).toBeInTheDocument();
      // Should show loading skeleton
      const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no campaigns', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      expect(screen.getByText('No ad campaigns found.')).toBeInTheDocument();
    });
  });

  describe('Campaign Display', () => {
    const mockCampaigns = [
      {
        id: 'campaign-1',
        name: 'Homepage Feature',
        description: 'Featured placement on homepage',
        price: 500,
        durationDays: 7,
        isActive: true,
        imageUrl: 'https://example.com/image1.jpg',
        socialLink: 'https://facebook.com/page',
        createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
      },
      {
        id: 'campaign-2',
        name: 'Sidebar Banner',
        description: 'Banner in sidebar',
        price: 300,
        durationDays: 14,
        isActive: false,
        createdAt: { toDate: () => new Date('2024-01-10T10:00:00Z') },
      },
    ];

    it('displays campaigns in table format', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockCampaigns.map(campaign => ({
            id: campaign.id,
            data: () => campaign,
          })),
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      expect(screen.getByText('Homepage Feature')).toBeInTheDocument();
      expect(screen.getByText('Sidebar Banner')).toBeInTheDocument();
      expect(screen.getByText('₱500.00')).toBeInTheDocument();
      expect(screen.getByText('₱300.00')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument();
    });

    it('shows campaign status badges', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockCampaigns.map(campaign => ({
            id: campaign.id,
            data: () => campaign,
          })),
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('shows expiring soon badge for campaigns expiring within 3 days', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockCampaigns.map(campaign => ({
            id: campaign.id,
            data: () => campaign,
          })),
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      // Should show expiring soon badge
      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
    });

    it('displays campaign images when available', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockCampaigns.map(campaign => ({
            id: campaign.id,
            data: () => campaign,
          })),
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      // Should show image for campaign with imageUrl
      const images = document.querySelectorAll('img');
      expect(images.length).toBeGreaterThan(0);
    });

    it('shows placeholder icon for campaigns without images', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockCampaigns.map(campaign => ({
            id: campaign.id,
            data: () => campaign,
          })),
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      // Should show placeholder icons for campaigns without images
      const imageIcons = document.querySelectorAll('[data-testid="image-icon"]');
      expect(imageIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Add Campaign Dialog', () => {
    it('opens add campaign dialog when Add Campaign button is clicked', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      const addButton = screen.getByText('Add Campaign');
      fireEvent.click(addButton);

      expect(screen.getByText('Add New Ad Campaign')).toBeInTheDocument();
    });

    it('shows form fields in add campaign dialog', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      const addButton = screen.getByText('Add Campaign');
      fireEvent.click(addButton);

      expect(screen.getByLabelText('Campaign Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Price (PHP)')).toBeInTheDocument();
      expect(screen.getByLabelText('Duration (Days)')).toBeInTheDocument();
      expect(screen.getByLabelText('Social Link (Optional)')).toBeInTheDocument();
      expect(screen.getByLabelText('Campaign is Active')).toBeInTheDocument();
    });

    it('handles form submission for new campaign', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      mockHandleAddAdCampaign.mockResolvedValue({
        error: null,
        message: 'Campaign added successfully',
      });

      render(<AdminAdsPage />);

      const addButton = screen.getByText('Add Campaign');
      fireEvent.click(addButton);

      const nameInput = screen.getByLabelText('Campaign Name');
      const descriptionInput = screen.getByLabelText('Description');
      const priceInput = screen.getByLabelText('Price (PHP)');
      const durationInput = screen.getByLabelText('Duration (Days)');

      fireEvent.change(nameInput, { target: { value: 'New Campaign' } });
      fireEvent.change(descriptionInput, { target: { value: 'New campaign description' } });
      fireEvent.change(priceInput, { target: { value: '1000' } });
      fireEvent.change(durationInput, { target: { value: '30' } });

      const saveButton = screen.getByText('Save changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockHandleAddAdCampaign).toHaveBeenCalledWith(
          {
            name: 'New Campaign',
            description: 'New campaign description',
            price: 1000,
            durationDays: 30,
            isActive: true,
            imageUrl: undefined,
            socialLink: '',
          },
          { id: mockUser.uid, name: mockUser.displayName }
        );
      });
    });
  });

  describe('Edit Campaign Dialog', () => {
    const mockCampaign = {
      id: 'campaign-1',
      name: 'Homepage Feature',
      description: 'Featured placement on homepage',
      price: 500,
      durationDays: 7,
      isActive: true,
      imageUrl: 'https://example.com/image1.jpg',
      socialLink: 'https://facebook.com/page',
      createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
    };

    it('opens edit campaign dialog when Edit button is clicked', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'campaign-1',
            data: () => mockCampaign,
          }],
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(screen.getByText('Edit Ad Campaign')).toBeInTheDocument();
    });

    it('pre-fills form with campaign data when editing', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'campaign-1',
            data: () => mockCampaign,
          }],
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      const nameInput = screen.getByLabelText('Campaign Name');
      const descriptionInput = screen.getByLabelText('Description');
      const priceInput = screen.getByLabelText('Price (PHP)');
      const durationInput = screen.getByLabelText('Duration (Days)');

      expect(nameInput).toHaveValue('Homepage Feature');
      expect(descriptionInput).toHaveValue('Featured placement on homepage');
      expect(priceInput).toHaveValue(500);
      expect(durationInput).toHaveValue(7);
    });

    it('handles form submission for campaign update', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'campaign-1',
            data: () => mockCampaign,
          }],
        });
        return jest.fn();
      });

      mockHandleUpdateAdCampaign.mockResolvedValue({
        error: null,
        message: 'Campaign updated successfully',
      });

      render(<AdminAdsPage />);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      const nameInput = screen.getByLabelText('Campaign Name');
      fireEvent.change(nameInput, { target: { value: 'Updated Campaign' } });

      const saveButton = screen.getByText('Save changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockHandleUpdateAdCampaign).toHaveBeenCalledWith(
          'campaign-1',
          expect.objectContaining({
            name: 'Updated Campaign',
          }),
          { id: mockUser.uid, name: mockUser.displayName }
        );
      });
    });
  });

  describe('Delete Campaign', () => {
    const mockCampaign = {
      id: 'campaign-1',
      name: 'Homepage Feature',
      description: 'Featured placement on homepage',
      price: 500,
      durationDays: 7,
      isActive: true,
      createdAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
    };

    it('shows delete confirmation dialog', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'campaign-1',
            data: () => mockCampaign,
          }],
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone. This will permanently delete the campaign "Homepage Feature".')).toBeInTheDocument();
    });

    it('handles campaign deletion when confirmed', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'campaign-1',
            data: () => mockCampaign,
          }],
        });
        return jest.fn();
      });

      mockHandleDeleteAdCampaign.mockResolvedValue({
        error: null,
        message: 'Campaign deleted successfully',
      });

      render(<AdminAdsPage />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByText('Confirm Deletion');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockHandleDeleteAdCampaign).toHaveBeenCalledWith(
          'campaign-1',
          { id: mockUser.uid, name: mockUser.displayName }
        );
      });
    });
  });

  describe('Image Upload', () => {
    it('handles image file selection', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<AdminAdsPage />);

      const addButton = screen.getByText('Add Campaign');
      fireEvent.click(addButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Should show image preview
      expect(screen.getByText('Change Image')).toBeInTheDocument();
    });

    it('handles image upload during form submission', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      mockUploadBytesResumable.mockResolvedValue({
        ref: { path: 'test-path' },
      } as any);

      mockGetDownloadURL.mockResolvedValue('https://example.com/uploaded-image.jpg');

      mockHandleAddAdCampaign.mockResolvedValue({
        error: null,
        message: 'Campaign added successfully',
      });

      render(<AdminAdsPage />);

      const addButton = screen.getByText('Add Campaign');
      fireEvent.click(addButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      const nameInput = screen.getByLabelText('Campaign Name');
      fireEvent.change(nameInput, { target: { value: 'New Campaign' } });

      const saveButton = screen.getByText('Save changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUploadBytesResumable).toHaveBeenCalled();
        expect(mockGetDownloadURL).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors gracefully', () => {
      mockOnSnapshot.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Firestore error'));
        return jest.fn();
      });

      render(<AdminAdsPage />);

      // Should handle error without crashing
      expect(screen.getByText('Ad Management')).toBeInTheDocument();
    });

    it('handles image upload errors', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      mockUploadBytesResumable.mockRejectedValue(new Error('Upload failed'));

      render(<AdminAdsPage />);

      const addButton = screen.getByText('Add Campaign');
      fireEvent.click(addButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      const nameInput = screen.getByLabelText('Campaign Name');
      fireEvent.change(nameInput, { target: { value: 'New Campaign' } });

      const saveButton = screen.getByText('Save changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUploadBytesResumable).toHaveBeenCalled();
      });
    });

    it('handles unauthenticated user in form submission', async () => {
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

      render(<AdminAdsPage />);

      // Should not show add button for unauthenticated users
      expect(screen.queryByText('Add Campaign')).not.toBeInTheDocument();
    });
  });

  describe('Campaign Expiration', () => {
    it('automatically deactivates expired campaigns', () => {
      const expiredCampaign = {
        id: 'campaign-1',
        name: 'Expired Campaign',
        description: 'This campaign has expired',
        price: 500,
        durationDays: 1,
        isActive: true,
        createdAt: { toDate: () => new Date('2024-01-01T10:00:00Z') }, // Old date
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'campaign-1',
            data: () => expiredCampaign,
          }],
        });
        return jest.fn();
      });

      mockHandleUpdateAdCampaign.mockResolvedValue({
        error: null,
        message: 'Campaign updated',
      });

      render(<AdminAdsPage />);

      // Should call update to deactivate expired campaign
      expect(mockHandleUpdateAdCampaign).toHaveBeenCalledWith(
        'campaign-1',
        { isActive: false },
        { id: mockUser.uid, name: mockUser.displayName }
      );
    });
  });
});
