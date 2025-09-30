import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import ManageProvidersPage from '../page';

jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ManageProvidersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for agency users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'agency-id' },
      userRole: 'agency',
      loading: false,
    } as any);

    render(<ManageProvidersPage />);
    expect(screen.getByText(/manage providers/i)).toBeInTheDocument();
  });

  it('shows access denied for non-agency users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'client-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<ManageProvidersPage />);
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });
});
