import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationBell } from '../notification-bell';

describe('NotificationBell', () => {
  it('renders notification bell', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows notification count', () => {
    render(<NotificationBell count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const mockOnClick = jest.fn();
    render(<NotificationBell onClick={mockOnClick} />);
    const button = screen.getByRole('button');
    button.click();
    expect(mockOnClick).toHaveBeenCalled();
  });
});
