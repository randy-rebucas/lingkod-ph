import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/context/theme-provider';
import { AuthProvider } from '@/context/auth-context';

// Mock auth context for testing
const mockAuthContext = {
  user: null,
  loading: false,
  userRole: null,
  verificationStatus: null,
  getIdToken: global.jest?.fn?.()?.mockResolvedValue?.('mock-token') || (() => Promise.resolve('mock-token')),
};

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider value={mockAuthContext}>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com',
  role: 'provider',
  accountStatus: 'active',
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  id: 'test-booking-id',
  clientId: 'test-client-id',
  providerId: 'test-provider-id',
  serviceId: 'test-service-id',
  date: new Date(),
  time: '10:00',
  duration: 2,
  price: 100,
  status: 'pending',
  ...overrides,
});

export const createMockService = (overrides = {}) => ({
  id: 'test-service-id',
  name: 'Test Service',
  description: 'Test service description',
  category: 'test-category',
  price: 50,
  duration: 1,
  isActive: true,
  providerId: 'test-provider-id',
  ...overrides,
});
