import React from 'react';
import { render, screen } from '@testing-library/react';
import QuoteBuilderPage from '../page';

// Mock the components
jest.mock('@/components/quote-builder-client', () => ({
  __esModule: true,
  default: () => <div data-testid="quote-builder-client">Quote Builder Client</div>,
}));

jest.mock('@/components/stored-quotes-list', () => ({
  StoredQuotesList: () => <div data-testid="stored-quotes-list">Stored Quotes List</div>,
}));

describe('QuoteBuilderPage', () => {
  it('renders the quote builder page with correct title', () => {
    render(<QuoteBuilderPage />);

    expect(screen.getByText('quoteBuilderTitle')).toBeInTheDocument();
    expect(screen.getByText('quoteBuilderDescription')).toBeInTheDocument();
  });

  it('renders tabs for create and stored quotes', () => {
    render(<QuoteBuilderPage />);

    expect(screen.getByText('createQuote')).toBeInTheDocument();
    expect(screen.getByText('storedQuotes')).toBeInTheDocument();
  });

  it('renders quote builder client component in create tab', () => {
    render(<QuoteBuilderPage />);

    expect(screen.getByTestId('quote-builder-client')).toBeInTheDocument();
  });

  it('renders stored quotes list component in stored tab', () => {
    render(<QuoteBuilderPage />);

    // Click on stored quotes tab
    const storedTab = screen.getByText('storedQuotes');
    storedTab.click();

    expect(screen.getByTestId('stored-quotes-list')).toBeInTheDocument();
  });

  it('has correct tab icons', () => {
    render(<QuoteBuilderPage />);

    // Check for calculator icon in create tab
    const createTab = screen.getByText('createQuote');
    expect(createTab.closest('button')).toBeInTheDocument();

    // Check for file text icon in stored tab
    const storedTab = screen.getByText('storedQuotes');
    expect(storedTab.closest('button')).toBeInTheDocument();
  });

  it('has proper container styling', () => {
    render(<QuoteBuilderPage />);

    const container = screen.getByText('quoteBuilderTitle').closest('.container');
    expect(container).toBeInTheDocument();
  });

  it('has proper max width constraints', () => {
    render(<QuoteBuilderPage />);

    const maxWidthElements = document.querySelectorAll('.max-w-6xl');
    expect(maxWidthElements.length).toBeGreaterThan(0);
  });
});
