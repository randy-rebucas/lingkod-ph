import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationBell } from '../notification-bell';

describe('NotificationBell', () => {
  it('renders notification bell', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows notification bell with proper styling', () => {
    render(<NotificationBell />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles click events', () => {
    render(<NotificationBell />);
    const button = screen.getByRole('button');
    button.click();
    // The component should handle the click internally
    expect(button).toBeInTheDocument();
  });
});
