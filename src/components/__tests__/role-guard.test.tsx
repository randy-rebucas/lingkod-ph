import React from 'react';
import { render, screen } from '@testing-library/react';
import { RoleGuard } from '../role-guard';

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('@/shared/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('RoleGuard', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user-id', email: 'test@example.com' },
      loading: false,
      userRole: 'admin',
    });
  });

  it('renders children for allowed role', () => {
    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Admin Content</div>
      </RoleGuard>
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('does not render children for disallowed role', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user-id', email: 'test@example.com' },
      loading: false,
      userRole: 'client',
    });

    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Admin Content</div>
      </RoleGuard>
    );
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders fallback for disallowed role', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user-id', email: 'test@example.com' },
      loading: false,
      userRole: 'client',
    });

    render(
      <RoleGuard allowedRoles={['admin']} fallback={<div>Access Denied</div>}>
        <div>Admin Content</div>
      </RoleGuard>
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});
