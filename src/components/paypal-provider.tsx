"use client";

import React, { useEffect, useState } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

interface PayPalProviderProps {
  children: React.ReactNode;
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const [clientId, setClientId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setClientId(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '');
  }, []);

  // Don't render PayPal provider if not on client side or client ID is not available
  if (!isClient || !clientId) {
    return <>{children}</>;
  }

  return (
    <PayPalScriptProvider 
      options={{
        clientId: clientId,
        currency: "PHP",
        intent: "capture",
        components: "buttons",
        enableFunding: "paypal,venmo,card",
        disableFunding: "credit,paylater",
        dataSdkIntegrationSource: "integrationbuilder_ac"
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}
