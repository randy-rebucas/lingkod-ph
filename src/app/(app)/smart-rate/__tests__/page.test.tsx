import React from 'react';
import { render, screen } from '@testing-library/react';
import SmartRatePage from '../page';

// Mock the smart rate client component
jest.mock('@/components/smart-rate-client', () => ({
  __esModule: true,
  default: () => <div data-testid="smart-rate-client">Smart Rate Client</div>,
}));

describe('SmartRatePage', () => {
  it('renders the smart rate page with correct title', () => {
    render(<SmartRatePage />);

    expect(screen.getByText('smartRateTitle')).toBeInTheDocument();
    expect(screen.getByText('smartRateDescription')).toBeInTheDocument();
  });

  it('renders the smart rate client component', () => {
    render(<SmartRatePage />);

    expect(screen.getByTestId('smart-rate-client')).toBeInTheDocument();
  });

  it('has proper container styling', () => {
    render(<SmartRatePage />);

    const container = screen.getByText('smartRateTitle').closest('.container');
    expect(container).toBeInTheDocument();
  });

  it('has proper spacing between elements', () => {
    render(<SmartRatePage />);

    const spaceYElements = document.querySelectorAll('.space-y-8');
    expect(spaceYElements.length).toBeGreaterThan(0);
  });

  it('has proper max width constraints', () => {
    render(<SmartRatePage />);

    const maxWidthElements = document.querySelectorAll('.');
    expect(maxWidthElements.length).toBeGreaterThan(0);
  });

  it('has proper text styling for title', () => {
    render(<SmartRatePage />);

    const title = screen.getByText('smartRateTitle');
    expect(title).toHaveClass('text-3xl', 'font-bold', 'font-headline');
  });

  it('has proper text styling for description', () => {
    render(<SmartRatePage />);

    const description = screen.getByText('smartRateDescription');
    expect(description).toHaveClass('text-muted-foreground');
  });
});
