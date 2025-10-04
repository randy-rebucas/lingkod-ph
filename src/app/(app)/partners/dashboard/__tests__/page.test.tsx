import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import PartnersDashboardPage from '../page';

jest.mock('@/shared/auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('PartnersDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for partner users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'partner-id' },
      userRole: 'partner',
      loading: false,
    } as any);

    render(<PartnersDashboardPage />);
    expect(screen.getByText(/partner/i)).toBeInTheDocument();
  });

  it('shows access denied for non-partner users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'client-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<PartnersDashboardPage />);
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });
});
