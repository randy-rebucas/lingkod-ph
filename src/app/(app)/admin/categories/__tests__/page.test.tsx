import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import AdminCategoriesPage from '../page';

jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AdminCategoriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'admin-id' },
      userRole: 'admin',
      loading: false,
    } as any);

    render(<AdminCategoriesPage />);
    expect(screen.getByText(/categories/i)).toBeInTheDocument();
  });

  it('shows access denied for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<AdminCategoriesPage />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});
