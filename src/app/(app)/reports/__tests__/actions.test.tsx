import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import ReportsPage from '../actions';

jest.mock('@/shared/auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ReportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for agency users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'agency-id' },
      userRole: 'agency',
      loading: false,
    } as any);

    render(<ReportsPage />);
    expect(screen.getByText(/reports/i)).toBeInTheDocument();
  });

  it('shows upgrade message for non-agency users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'client-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<ReportsPage />);
    expect(screen.getByText(/upgrade to access reports/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'agency-id' },
      userRole: 'agency',
      loading: true,
    } as any);

    render(<ReportsPage />);
    // Should show loading skeletons
  });
});
