"use client";

import { PayPalProvider } from './paypal-provider';

interface ProvidersWrapperProps {
  children: React.ReactNode;
}

export function ProvidersWrapper({ children }: ProvidersWrapperProps) {
  return (
    <PayPalProvider>
      {children}
    </PayPalProvider>
  );
}
