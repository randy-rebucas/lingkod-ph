import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import AdminTicketsPage from '../page';

jest.mock('@/shared/auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AdminTicketsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'admin-id' },
      userRole: 'admin',
      loading: false,
    } as any);

    render(<AdminTicketsPage />);
    expect(screen.getByText(/tickets/i)).toBeInTheDocument();
  });

  it('shows access denied for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<AdminTicketsPage />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});
