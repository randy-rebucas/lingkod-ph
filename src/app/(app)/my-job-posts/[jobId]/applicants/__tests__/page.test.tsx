import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import JobApplicantsPage from '../page';

jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('JobApplicantsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for client users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'client-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<JobApplicantsPage />);
    expect(screen.getByText(/applicants/i)).toBeInTheDocument();
  });

  it('shows access denied for non-client users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'provider-id' },
      userRole: 'provider',
      loading: false,
    } as any);

    render(<JobApplicantsPage />);
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });
});
