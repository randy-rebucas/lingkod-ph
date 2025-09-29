import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletBalanceComponent } from '../wallet-balance';
import { UserWallet, WalletTransaction } from '@/lib/marketplace/types';

// Mock the auth context
jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-1',
    },
  }),
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock WalletService
jest.mock('@/lib/marketplace/wallet-service', () => ({
  WalletService: {
    getWallet: jest.fn(),
    getTransactions: jest.fn(),
    syncWithEarnings: jest.fn(),
  },
}));

describe('WalletBalanceComponent', () => {
  const mockWallet: UserWallet = {
    id: 'wallet-1',
    userId: 'test-user-1',
    balance: 1000,
    currency: 'PHP',
    transactions: [],
    lastUpdated: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  };

  const mockTransactions: WalletTransaction[] = [
    {
      id: 'tx-1',
      type: 'earnings',
      amount: 500,
      description: 'Service earnings',
      timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    },
    {
      id: 'tx-2',
      type: 'purchase',
      amount: -200,
      description: 'Marketplace purchase',
      timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const { WalletService } = require('@/lib/marketplace/wallet-service');
    WalletService.getWallet.mockResolvedValue(mockWallet);
    WalletService.getTransactions.mockResolvedValue(mockTransactions);
    WalletService.syncWithEarnings.mockResolvedValue(undefined);
  });

  it('should render wallet balance correctly', async () => {
    render(<WalletBalanceComponent />);

    await waitFor(() => {
      expect(screen.getByText('₱1,000')).toBeInTheDocument();
      expect(screen.getByText('Available Balance')).toBeInTheDocument();
    });
  });

  it('should render compact version when compact prop is true', async () => {
    render(<WalletBalanceComponent compact />);

    await waitFor(() => {
      expect(screen.getByText('₱1,000')).toBeInTheDocument();
      expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
    });
  });

  it('should show transaction summary', async () => {
    render(<WalletBalanceComponent />);

    await waitFor(() => {
      expect(screen.getByText('₱500')).toBeInTheDocument(); // Total earnings
      expect(screen.getByText('₱200')).toBeInTheDocument(); // Total spent
    });
  });

  it('should show recent transactions when showTransactions is true', async () => {
    render(<WalletBalanceComponent showTransactions />);

    await waitFor(() => {
      expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
      expect(screen.getByText('Service earnings')).toBeInTheDocument();
      expect(screen.getByText('Marketplace purchase')).toBeInTheDocument();
    });
  });

  it('should not show transactions when showTransactions is false', async () => {
    render(<WalletBalanceComponent showTransactions={false} />);

    await waitFor(() => {
      expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
    });
  });

  it('should call syncWithEarnings when sync button is clicked', async () => {
    const { WalletService } = require('@/lib/marketplace/wallet-service');
    
    render(<WalletBalanceComponent />);

    await waitFor(() => {
      const syncButton = screen.getByText('Sync');
      fireEvent.click(syncButton);
    });

    expect(WalletService.syncWithEarnings).toHaveBeenCalledWith('test-user-1');
  });

  it('should show loading state initially', () => {
    const { WalletService } = require('@/lib/marketplace/wallet-service');
    WalletService.getWallet.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<WalletBalanceComponent />);

    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('should show no wallet message when wallet is null', async () => {
    const { WalletService } = require('@/lib/marketplace/wallet-service');
    WalletService.getWallet.mockResolvedValue(null);

    render(<WalletBalanceComponent />);

    await waitFor(() => {
      expect(screen.getByText('No wallet found')).toBeInTheDocument();
      expect(screen.getByText('Your wallet will be created when you make your first transaction')).toBeInTheDocument();
    });
  });

  it('should handle sync errors gracefully', async () => {
    const { WalletService } = require('@/lib/marketplace/wallet-service');
    WalletService.syncWithEarnings.mockRejectedValue(new Error('Sync failed'));

    render(<WalletBalanceComponent />);

    await waitFor(() => {
      const syncButton = screen.getByText('Sync');
      fireEvent.click(syncButton);
    });

    // Should not crash the component
    expect(screen.getByText('₱1,000')).toBeInTheDocument();
  });

  it('should display transaction icons correctly', async () => {
    render(<WalletBalanceComponent showTransactions />);

    await waitFor(() => {
      // Check that transaction types are displayed
      expect(screen.getByText('earnings')).toBeInTheDocument();
      expect(screen.getByText('purchase')).toBeInTheDocument();
    });
  });
});
