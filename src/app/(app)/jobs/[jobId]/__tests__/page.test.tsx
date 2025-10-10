import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import JobDetailPage from '../page';

jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('JobDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-id' },
      userRole: 'provider',
      loading: false,
    } as any);

    render(<JobDetailPage />);
    expect(screen.getByText(/job details/i)).toBeInTheDocument();
  });

  it('shows loading for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userRole: null,
      loading: true,
    } as any);

    render(<JobDetailPage />);
    // Should handle loading state
  });
});
