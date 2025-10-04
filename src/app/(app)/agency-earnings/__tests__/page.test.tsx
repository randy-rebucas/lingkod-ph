import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import AgencyEarningsPage from '../page';

jest.mock('@/shared/auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AgencyEarningsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for agency users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'agency-id' },
      userRole: 'agency',
      loading: false,
    } as any);

    render(<AgencyEarningsPage />);
    expect(screen.getByText(/earnings/i)).toBeInTheDocument();
  });

  it('shows access denied for non-agency users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'client-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<AgencyEarningsPage />);
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });
});
