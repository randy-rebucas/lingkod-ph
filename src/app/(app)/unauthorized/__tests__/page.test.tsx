import React from 'react';
import { render, screen } from '@testing-library/react';
import UnauthorizedPage from '../page';

describe('UnauthorizedPage', () => {
  it('renders unauthorized message', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
  });

  it('shows access denied message', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });
});
