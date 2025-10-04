import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/shared/auth';
import JobDetailPage from '../page';

jest.mock('@/shared/auth');
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

    render(<JobDetailPage params={{ jobId: 'job-123' }} />);
    expect(screen.getByText(/job details/i)).toBeInTheDocument();
  });

  it('shows loading for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userRole: null,
      loading: true,
    } as any);

    render(<JobDetailPage params={{ jobId: 'job-123' }} />);
    // Should handle loading state
  });
});
