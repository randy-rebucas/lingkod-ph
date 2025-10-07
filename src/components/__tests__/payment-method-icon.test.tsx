import React from 'react';
import { render, screen } from '@testing-library/react';
import { PaymentMethodIcon } from '../payment-method-icon';

describe('PaymentMethodIcon', () => {
  it('renders wallet icon for coins', () => {
    render(<PaymentMethodIcon method="coins" />);
    expect(screen.getByLabelText('Payment method: coins')).toBeInTheDocument();
  });

  it('renders bank icon', () => {
    render(<PaymentMethodIcon method="bdo" />);
    expect(screen.getByLabelText('Payment method: bdo')).toBeInTheDocument();
  });

  it('renders store icon', () => {
    render(<PaymentMethodIcon method="7-eleven" />);
    expect(screen.getByLabelText('Payment method: 7-eleven')).toBeInTheDocument();
  });

  it('renders default icon for unknown method', () => {
    render(<PaymentMethodIcon method="unknown" />);
    expect(screen.getByLabelText('Payment method: unknown')).toBeInTheDocument();
  });
});
