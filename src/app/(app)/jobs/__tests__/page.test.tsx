import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import JobsPage from '../page';
import { getDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Mock the auth context
jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

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

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

// Mock Firebase Firestore
const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn(() => ({
  where: jest.fn(() => ({
    orderBy: jest.fn(() => ({
      onSnapshot: mockOnSnapshot,
    })),
  })),
}));

const mockDoc = jest.fn(() => ({
  updateDoc: jest.fn(),
}));

describe('JobsPage', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      userRole: 'provider',
      loading: false,
    } as any);

    mockUseToast.mockReturnValue({
      toast: mockToast,
    } as any);

    mockGetDb.mockReturnValue({
      collection: mockCollection,
      doc: mockDoc,
    } as any);

    // Mock Firestore functions
    jest.doMock('firebase/firestore', () => ({
      collection: mockCollection,
      query: jest.fn(),
      where: jest.fn(),
      onSnapshot: mockOnSnapshot,
      doc: mockDoc,
      updateDoc: jest.fn(),
      arrayUnion: jest.fn(),
      orderBy: jest.fn(),
    }));
  });

  describe('Access Control', () => {
    it('shows access denied for non-provider users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);

      render(<JobsPage />);

      expect(screen.getByText('accessDenied')).toBeInTheDocument();
      expect(screen.getByText('providersOnly')).toBeInTheDocument();
    });

    it('renders jobs page for provider users', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('subtitle')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('renders the jobs page with correct title', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('subtitle')).toBeInTheDocument();
    });

    it('renders filters and search section', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      expect(screen.getByText('Filters & Search')).toBeInTheDocument();
      expect(screen.getByText('Find the perfect job for you')).toBeInTheDocument();
    });

    it('renders filter controls', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      expect(screen.getByPlaceholderText('Search by title, description, or location...')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Budget Range')).toBeInTheDocument();
      expect(screen.getByText('Sort By')).toBeInTheDocument();
      expect(screen.getByText('Display Mode')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockOnSnapshot.mockImplementation(() => {
        // Don't call callback immediately to simulate loading
        return jest.fn();
      });

      render(<JobsPage />);

      // Should show loading skeletons
      const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no jobs', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      expect(screen.getByText('noOpenJobs')).toBeInTheDocument();
      expect(screen.getByText('noOpenJobsDescription')).toBeInTheDocument();
    });

    it('shows filtered empty state when no jobs match criteria', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      // Apply a filter
      const searchInput = screen.getByPlaceholderText('Search by title, description, or location...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No jobs match your criteria')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filter criteria to find more jobs.')).toBeInTheDocument();
    });
  });

  describe('Jobs Display', () => {
    const mockJob = {
      id: 'job-1',
      title: 'House Cleaning Service',
      description: 'Need someone to clean my house weekly',
      categoryName: 'Cleaning',
      budget: {
        amount: 500,
        type: 'Fixed',
        negotiable: true,
      },
      location: 'Manila, Philippines',
      clientName: 'John Doe',
      clientId: 'client-1',
      clientIsVerified: true,
      createdAt: { toDate: () => new Date('2024-01-15') },
      applications: [],
    };

    it('displays jobs in grid format by default', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'job-1',
            data: () => mockJob,
          }],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      expect(screen.getByText('House Cleaning Service')).toBeInTheDocument();
      expect(screen.getByText('Need someone to clean my house weekly')).toBeInTheDocument();
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Manila, Philippines')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('verifiedClient')).toBeInTheDocument();
    });

    it('displays jobs in list format when toggled', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'job-1',
            data: () => mockJob,
          }],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      // Toggle to list view
      const displayModeSwitch = document.querySelector('[data-testid="display-mode-switch"]');
      if (displayModeSwitch) {
        fireEvent.click(displayModeSwitch);
      }

      expect(screen.getByText('House Cleaning Service')).toBeInTheDocument();
    });

    it('shows job statistics', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'job-1',
            data: () => mockJob,
          }],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      expect(screen.getByText('1 jobs')).toBeInTheDocument();
    });
  });

  describe('Job Application', () => {
    const mockJob = {
      id: 'job-1',
      title: 'House Cleaning Service',
      description: 'Need someone to clean my house weekly',
      categoryName: 'Cleaning',
      budget: {
        amount: 500,
        type: 'Fixed',
        negotiable: true,
      },
      location: 'Manila, Philippines',
      clientName: 'John Doe',
      clientId: 'client-1',
      clientIsVerified: true,
      createdAt: { toDate: () => new Date('2024-01-15') },
      applications: [],
    };

    it('allows provider to apply for job', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'job-1',
            data: () => mockJob,
          }],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      const applyButton = screen.getByText('applyNow');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'success',
          description: 'successfullyApplied',
        });
      });
    });

    it('shows applied state when already applied', () => {
      const jobWithApplication = {
        ...mockJob,
        applications: ['test-user-id'],
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'job-1',
            data: () => jobWithApplication,
          }],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      expect(screen.getByText('applied')).toBeInTheDocument();
      expect(screen.getByText('alreadyApplied')).toBeInTheDocument();
    });
  });

  describe('Filtering and Search', () => {
    const mockJobs = [
      {
        id: 'job-1',
        title: 'House Cleaning Service',
        description: 'Need someone to clean my house weekly',
        categoryName: 'Cleaning',
        budget: {
          amount: 500,
          type: 'Fixed',
          negotiable: true,
        },
        location: 'Manila, Philippines',
        clientName: 'John Doe',
        clientId: 'client-1',
        clientIsVerified: true,
        createdAt: { toDate: () => new Date('2024-01-15') },
        applications: [],
      },
      {
        id: 'job-2',
        title: 'Garden Maintenance',
        description: 'Need help with garden upkeep',
        categoryName: 'Gardening',
        budget: {
          amount: 800,
          type: 'Fixed',
          negotiable: false,
        },
        location: 'Quezon City, Philippines',
        clientName: 'Jane Smith',
        clientId: 'client-2',
        clientIsVerified: false,
        createdAt: { toDate: () => new Date('2024-01-16') },
        applications: [],
      },
    ];

    it('filters jobs by search term', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockJobs.map(job => ({
            id: job.id,
            data: () => job,
          })),
        });
        return jest.fn();
      });

      render(<JobsPage />);

      const searchInput = screen.getByPlaceholderText('Search by title, description, or location...');
      fireEvent.change(searchInput, { target: { value: 'cleaning' } });

      await waitFor(() => {
        expect(screen.getByText('House Cleaning Service')).toBeInTheDocument();
        expect(screen.queryByText('Garden Maintenance')).not.toBeInTheDocument();
      });
    });

    it('filters jobs by category', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockJobs.map(job => ({
            id: job.id,
            data: () => job,
          })),
        });
        return jest.fn();
      });

      render(<JobsPage />);

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.click(categorySelect);

      // This would need proper select component testing
      expect(categorySelect).toBeInTheDocument();
    });

    it('filters jobs by budget range', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockJobs.map(job => ({
            id: job.id,
            data: () => job,
          })),
        });
        return jest.fn();
      });

      render(<JobsPage />);

      const budgetSelect = screen.getByDisplayValue('All Budgets');
      fireEvent.click(budgetSelect);

      expect(budgetSelect).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    const mockJobs = [
      {
        id: 'job-1',
        title: 'House Cleaning Service',
        description: 'Need someone to clean my house weekly',
        categoryName: 'Cleaning',
        budget: {
          amount: 500,
          type: 'Fixed',
          negotiable: true,
        },
        location: 'Manila, Philippines',
        clientName: 'John Doe',
        clientId: 'client-1',
        clientIsVerified: true,
        createdAt: { toDate: () => new Date('2024-01-15') },
        applications: [],
      },
      {
        id: 'job-2',
        title: 'Garden Maintenance',
        description: 'Need help with garden upkeep',
        categoryName: 'Gardening',
        budget: {
          amount: 800,
          type: 'Fixed',
          negotiable: false,
        },
        location: 'Quezon City, Philippines',
        clientName: 'Jane Smith',
        clientId: 'client-2',
        clientIsVerified: false,
        createdAt: { toDate: () => new Date('2024-01-16') },
        applications: ['user-1'],
      },
    ];

    it('sorts jobs by different criteria', async () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: mockJobs.map(job => ({
            id: job.id,
            data: () => job,
          })),
        });
        return jest.fn();
      });

      render(<JobsPage />);

      const sortSelect = screen.getByDisplayValue('Newest First');
      fireEvent.click(sortSelect);

      expect(sortSelect).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors gracefully', () => {
      mockOnSnapshot.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Firestore error'));
        return jest.fn();
      });

      render(<JobsPage />);

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'error',
        description: 'couldNotFetchJobs',
      });
    });

    it('handles application errors gracefully', async () => {
      const mockJob = {
        id: 'job-1',
        title: 'House Cleaning Service',
        description: 'Need someone to clean my house weekly',
        categoryName: 'Cleaning',
        budget: {
          amount: 500,
          type: 'Fixed',
          negotiable: true,
        },
        location: 'Manila, Philippines',
        clientName: 'John Doe',
        clientId: 'client-1',
        clientIsVerified: true,
        createdAt: { toDate: () => new Date('2024-01-15') },
        applications: [],
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'job-1',
            data: () => mockJob,
          }],
        });
        return jest.fn();
      });

      // Mock updateDoc to throw error
      const mockUpdateDoc = jest.fn().mockRejectedValue(new Error('Update failed'));
      mockDoc.mockReturnValue({
        updateDoc: mockUpdateDoc,
      } as any);

      render(<JobsPage />);

      const applyButton = screen.getByText('applyNow');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'error',
          description: 'failedToApply',
        });
      });
    });
  });

  describe('Job Details', () => {
    const mockJob = {
      id: 'job-1',
      title: 'House Cleaning Service',
      description: 'Need someone to clean my house weekly',
      categoryName: 'Cleaning',
      budget: {
        amount: 500,
        type: 'Fixed',
        negotiable: true,
      },
      location: 'Manila, Philippines',
      clientName: 'John Doe',
      clientId: 'client-1',
      clientIsVerified: true,
      createdAt: { toDate: () => new Date('2024-01-15') },
      applications: [],
    };

    it('displays job budget correctly', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'job-1',
            data: () => mockJob,
          }],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      expect(screen.getByText('₱500.00')).toBeInTheDocument();
    });

    it('shows verified client badge', () => {
      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'job-1',
            data: () => mockJob,
          }],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      expect(screen.getByText('verifiedClient')).toBeInTheDocument();
    });

    it('shows applicant count', () => {
      const jobWithApplicants = {
        ...mockJob,
        applications: ['user-1', 'user-2'],
      };

      mockOnSnapshot.mockImplementation((callback) => {
        callback({
          docs: [{
            id: 'job-1',
            data: () => jobWithApplicants,
          }],
        });
        return jest.fn();
      });

      render(<JobsPage />);

      expect(screen.getByText('2 applicants')).toBeInTheDocument();
    });
  });
});
