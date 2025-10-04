import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import MyJobPostsPage from '../page';

jest.mock('@/shared/auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('MyJobPostsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for client users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'client-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<MyJobPostsPage />);
    expect(screen.getByText(/my job posts/i)).toBeInTheDocument();
  });

  it('shows access denied for non-client users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'provider-id' },
      userRole: 'provider',
      loading: false,
    } as any);

    render(<MyJobPostsPage />);
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });
});
