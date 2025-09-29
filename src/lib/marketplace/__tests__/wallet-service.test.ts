import { WalletService } from '../wallet-service';
import { UserWallet, WalletTransaction } from '../types';

// Mock Firebase
jest.mock('../../firebase', () => ({
  db: {},
  adminDb: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  },
  increment: jest.fn(),
}));

describe('WalletService', () => {
  const mockWallet: UserWallet = {
    id: 'test-wallet-1',
    userId: 'test-user-1',
    balance: 1000,
    currency: 'PHP',
    transactions: [],
    lastUpdated: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  };

  const mockTransaction: WalletTransaction = {
    id: 'tx-1',
    type: 'earnings',
    amount: 500,
    description: 'Test earnings',
    timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWallet', () => {
    it('should return existing wallet', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockWallet,
      });

      const result = await WalletService.getWallet('test-user-1');

      expect(result).toEqual(mockWallet);
    });

    it('should create new wallet if not exists', async () => {
      const { getDoc, addDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => false,
      });
      addDoc.mockResolvedValue({ id: 'new-wallet-id' });

      const result = await WalletService.getWallet('test-user-1');

      expect(addDoc).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('addFunds', () => {
    it('should add funds to wallet', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockWallet,
      });

      await WalletService.addFunds('test-user-1', 100, 'Test earnings');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error if wallet not found', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(
        WalletService.addFunds('test-user-1', 100, 'Test earnings')
      ).rejects.toThrow('Wallet not found');
    });
  });

  describe('deductFunds', () => {
    it('should deduct funds from wallet', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockWallet,
      });

      await WalletService.deductFunds('test-user-1', 100, 'Test purchase');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error for insufficient balance', async () => {
      const { getDoc } = require('firebase/firestore');
      const lowBalanceWallet = { ...mockWallet, balance: 50 };
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => lowBalanceWallet,
      });

      await expect(
        WalletService.deductFunds('test-user-1', 100, 'Test purchase')
      ).rejects.toThrow('Insufficient wallet balance');
    });
  });

  describe('getBalance', () => {
    it('should return wallet balance', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockWallet,
      });

      const balance = await WalletService.getBalance('test-user-1');

      expect(balance).toBe(1000);
    });

    it('should return 0 if wallet not found', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const balance = await WalletService.getBalance('test-user-1');

      expect(balance).toBe(0);
    });
  });

  describe('hasSufficientBalance', () => {
    it('should return true for sufficient balance', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockWallet,
      });

      const hasBalance = await WalletService.hasSufficientBalance('test-user-1', 500);

      expect(hasBalance).toBe(true);
    });

    it('should return false for insufficient balance', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockWallet,
      });

      const hasBalance = await WalletService.hasSufficientBalance('test-user-1', 1500);

      expect(hasBalance).toBe(false);
    });
  });

  describe('getWalletSummary', () => {
    it('should return wallet summary', async () => {
      const { getDoc } = require('firebase/firestore');
      const walletWithTransactions = {
        ...mockWallet,
        transactions: [
          { ...mockTransaction, type: 'earnings', amount: 500 },
          { ...mockTransaction, type: 'purchase', amount: -200 },
        ],
      };
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => walletWithTransactions,
      });

      const summary = await WalletService.getWalletSummary('test-user-1');

      expect(summary.balance).toBe(1000);
      expect(summary.totalEarnings).toBe(500);
      expect(summary.totalSpent).toBe(200);
      expect(summary.transactionCount).toBe(2);
    });
  });
});
