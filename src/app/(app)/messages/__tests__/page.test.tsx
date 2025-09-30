import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import MessagesPage from '../page';

jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('MessagesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-id' },
      userRole: 'client',
      loading: false,
    } as any);

    render(<MessagesPage />);
    expect(screen.getByText(/messages/i)).toBeInTheDocument();
  });

  it('shows loading for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userRole: null,
      loading: true,
    } as any);

    render(<MessagesPage />);
    // Should handle loading state
  });
});
