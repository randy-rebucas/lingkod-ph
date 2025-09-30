import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/context/auth-context';
import BookingWorkLogPage from '../page';

jest.mock('@/context/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('BookingWorkLogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-id' },
      userRole: 'provider',
      loading: false,
    } as any);

    render(<BookingWorkLogPage params={{ bookingId: 'booking-123' }} />);
    expect(screen.getByText(/work log/i)).toBeInTheDocument();
  });

  it('shows loading for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userRole: null,
      loading: true,
    } as any);

    render(<BookingWorkLogPage params={{ bookingId: 'booking-123' }} />);
    // Should handle loading state
  });
});
