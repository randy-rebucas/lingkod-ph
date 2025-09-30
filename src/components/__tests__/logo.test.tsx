import React from 'react';
import { render, screen } from '@testing-library/react';
import { Logo } from '../logo';

describe('Logo', () => {
  it('renders logo component', () => {
    render(<Logo />);
    expect(screen.getByText('LocalPro')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<Logo className="custom-class" />);
    const logo = screen.getByText('LocalPro').closest('div')?.parentElement;
    expect(logo).toHaveClass('custom-class');
  });
});
