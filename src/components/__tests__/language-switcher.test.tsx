import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '../language-switcher';

describe('LanguageSwitcher', () => {
  it('renders language switcher', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles language change', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    // Should handle language switching
  });
});
