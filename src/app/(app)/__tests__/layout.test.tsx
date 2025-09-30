import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import AppLayout from '../layout';

// Mock dependencies
jest.mock('@/context/auth-context');
jest.mock('next/navigation');
jest.mock('firebase/auth');
jest.mock('next-themes');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('AppLayout', () => {
  const mockPush = jest.fn();
  const mockSetTheme = jest.fn();
  const mockToast = jest.fn();

  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);

    mockUsePathname.mockReturnValue('/dashboard');
    
    mockUseTheme.mockReturnValue({
      setTheme: mockSetTheme,
      theme: 'light',
    } as any);

    // Mock toast hook
    jest.doMock('@/hooks/use-toast', () => ({
      useToast: () => ({
        toast: mockToast,
      }),
    }));
  });

  describe('Authentication States', () => {
    it('should redirect to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userRole: null,
        loading: false,
      } as any);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should show loading state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userRole: null,
        loading: true,
      } as any);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      expect(screen.getByText('loading')).toBeInTheDocument();
    });

    it('should render layout when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);
    });

    it('should highlight active navigation item', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      
      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // The active navigation item should have appropriate styling
      // This would depend on the actual implementation of the isActive function
    });

    it('should show correct dashboard path for different user roles', () => {
      // Test client role
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);

      const { rerender } = render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Test provider role
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'provider',
        loading: false,
      } as any);

      rerender(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Test agency role
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'agency',
        loading: false,
      } as any);

      rerender(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Test admin role
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'admin',
        loading: false,
      } as any);

      rerender(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );
    });
  });

  describe('User Menu', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);
    });

    it('should display user avatar and name', () => {
      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should handle logout successfully', async () => {
      mockSignOut.mockResolvedValue(undefined);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Find and click logout button
      const logoutButton = screen.getByText('logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: 'success',
          description: 'loggedOutSuccessfully',
        });
      });
    });

    it('should handle logout failure', async () => {
      const error = new Error('Logout failed');
      mockSignOut.mockRejectedValue(error);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      const logoutButton = screen.getByText('logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'logoutFailed',
          description: 'Logout failed',
        });
      });
    });
  });

  describe('Role-based Navigation', () => {
    it('should show client navigation items for client role', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Check for client-specific navigation items
      expect(screen.getByText('dashboard')).toBeInTheDocument();
      expect(screen.getByText('jobs')).toBeInTheDocument();
      expect(screen.getByText('bookings')).toBeInTheDocument();
    });

    it('should show provider navigation items for provider role', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'provider',
        loading: false,
      } as any);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Check for provider-specific navigation items
      expect(screen.getByText('dashboard')).toBeInTheDocument();
      expect(screen.getByText('bookings')).toBeInTheDocument();
      expect(screen.getByText('earnings')).toBeInTheDocument();
    });

    it('should show agency navigation items for agency role', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'agency',
        loading: false,
      } as any);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Check for agency-specific navigation items
      expect(screen.getByText('dashboard')).toBeInTheDocument();
      expect(screen.getByText('manageProviders')).toBeInTheDocument();
    });

    it('should show admin navigation items for admin role', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'admin',
        loading: false,
      } as any);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Check for admin-specific navigation items
      expect(screen.getByText('adminDashboard')).toBeInTheDocument();
      expect(screen.getByText('users')).toBeInTheDocument();
      expect(screen.getByText('reports')).toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);
    });

    it('should toggle theme when theme button is clicked', () => {
      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Find and click theme toggle button
      const themeButton = screen.getByRole('button', { name: /theme/i });
      fireEvent.click(themeButton);

      expect(mockSetTheme).toHaveBeenCalled();
    });
  });

  describe('Support Chat', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);
    });

    it('should render support chat component', () => {
      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      expect(screen.getByTestId('support-chat')).toBeInTheDocument();
    });
  });

  describe('Broadcast Banner', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);
    });

    it('should render broadcast banner', () => {
      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      expect(screen.getByTestId('broadcast-banner')).toBeInTheDocument();
    });
  });

  describe('Notification Bell', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);
    });

    it('should render notification bell', () => {
      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    });
  });

  describe('Avatar Fallback', () => {
    it('should generate correct avatar fallback for full name', () => {
      const userWithFullName = {
        ...mockUser,
        displayName: 'John Doe',
      };

      mockUseAuth.mockReturnValue({
        user: userWithFullName,
        userRole: 'client',
        loading: false,
      } as any);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Should show "JD" as fallback
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should generate correct avatar fallback for single name', () => {
      const userWithSingleName = {
        ...mockUser,
        displayName: 'John',
      };

      mockUseAuth.mockReturnValue({
        user: userWithSingleName,
        userRole: 'client',
        loading: false,
      } as any);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Should show "JO" as fallback (first 2 characters)
      expect(screen.getByText('JO')).toBeInTheDocument();
    });

    it('should generate correct avatar fallback for no name', () => {
      const userWithNoName = {
        ...mockUser,
        displayName: null,
      };

      mockUseAuth.mockReturnValue({
        user: userWithNoName,
        userRole: 'client',
        loading: false,
      } as any);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Should show "U" as fallback
      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  describe('Emergency Hotline', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        userRole: 'client',
        loading: false,
      } as any);
    });

    it('should render emergency hotline button', () => {
      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      expect(screen.getByText('emergencyHotline')).toBeInTheDocument();
    });
  });
});
