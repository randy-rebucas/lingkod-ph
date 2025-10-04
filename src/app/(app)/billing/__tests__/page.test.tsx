import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import BillingPage from '../page';

jest.mock('@/shared/auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('BillingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<BillingPage />);
    expect(screen.getByText(/billing/i)).toBeInTheDocument();
  });

  it('shows loading for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userRole: null,
      loading: true,
    } as any);

    render(<BillingPage />);
    // Should handle loading state
  });
});
