import { GET } from '../wallet/route';
import { NextRequest } from 'next/server';

// Mock auth utils
jest.mock('@/lib/auth-utils', () => ({
  verifyTokenAndGetRole: jest.fn(),
}));

// Mock WalletService
jest.mock('@/lib/marketplace/wallet-service', () => ({
  WalletService: {
    getWallet: jest.fn(),
    getWalletSummary: jest.fn(),
  },
}));

describe('/api/marketplace/wallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return wallet data successfully', async () => {
    const { verifyTokenAndGetRole } = require('@/lib/auth-utils');
    const { WalletService } = require('@/lib/marketplace/wallet-service');

    verifyTokenAndGetRole.mockResolvedValue({ uid: 'user-1', role: 'provider' });
    WalletService.getWallet.mockResolvedValue({
      id: 'wallet-1',
      userId: 'user-1',
      balance: 1000,
      currency: 'PHP',
    });
    WalletService.getWalletSummary.mockResolvedValue({
      balance: 1000,
      totalEarnings: 2000,
      totalSpent: 1000,
      transactionCount: 5,
    });

    const request = new NextRequest('http://localhost:3000/api/marketplace/wallet', {
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.wallet).toBeDefined();
    expect(data.data.summary).toBeDefined();
  });

  it('should return 401 for missing token', async () => {
    const request = new NextRequest('http://localhost:3000/api/marketplace/wallet');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Authentication required');
  });

  it('should return 401 for invalid token', async () => {
    const { verifyTokenAndGetRole } = require('@/lib/auth-utils');
    verifyTokenAndGetRole.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/marketplace/wallet', {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid token');
  });

  it('should handle service errors', async () => {
    const { verifyTokenAndGetRole } = require('@/lib/auth-utils');
    const { WalletService } = require('@/lib/marketplace/wallet-service');

    verifyTokenAndGetRole.mockResolvedValue({ uid: 'user-1', role: 'provider' });
    WalletService.getWallet.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/marketplace/wallet', {
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch wallet');
  });
});
