import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import EarningsPage from '../page';

jest.mock('@/shared/auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('EarningsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for provider users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'provider-id' },
      userRole: 'provider',
      loading: false,
    } as any);

    render(<EarningsPage />);
    expect(screen.getByText(/earnings/i)).toBeInTheDocument();
  });

  it('shows access denied for non-provider users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'client-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<EarningsPage />);
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });
});
