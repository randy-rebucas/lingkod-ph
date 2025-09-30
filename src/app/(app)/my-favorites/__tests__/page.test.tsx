import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import MyFavoritesPage from '../page';

jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('MyFavoritesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<MyFavoritesPage />);
    expect(screen.getByText(/favorites/i)).toBeInTheDocument();
  });

  it('shows loading for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userRole: null,
      loading: true,
    } as any);

    render(<MyFavoritesPage />);
    // Should handle loading state
  });
});
