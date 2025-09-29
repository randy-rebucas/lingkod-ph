import { GET, POST } from '../cart/route';
import { NextRequest } from 'next/server';

// Mock auth utils
jest.mock('@/lib/auth-utils', () => ({
  verifyTokenAndGetRole: jest.fn(),
}));

// Mock CartService
jest.mock('@/lib/marketplace/cart-service', () => ({
  CartService: {
    getCart: jest.fn(),
    calculateCartTotals: jest.fn(),
    addToCart: jest.fn(),
  },
}));

describe('/api/marketplace/cart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return cart data successfully', async () => {
      const { verifyTokenAndGetRole } = require('@/lib/auth-utils');
      const { CartService } = require('@/lib/marketplace/cart-service');

      verifyTokenAndGetRole.mockResolvedValue({ uid: 'user-1', role: 'provider' });
      CartService.getCart.mockResolvedValue({
        items: [
          {
            id: 'cart-item-1',
            productId: 'product-1',
            quantity: 2,
          },
        ],
        totalItems: 2,
        totalPrice: 200,
      });
      CartService.calculateCartTotals.mockResolvedValue({
        subtotal: 200,
        discount: 20,
        total: 180,
        itemCount: 2,
      });

      const request = new NextRequest('http://localhost:3000/api/marketplace/cart', {
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.cart).toBeDefined();
      expect(data.data.totals).toBeDefined();
    });

    it('should return 401 for missing token', async () => {
      const request = new NextRequest('http://localhost:3000/api/marketplace/cart');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('POST', () => {
    it('should add item to cart successfully', async () => {
      const { verifyTokenAndGetRole } = require('@/lib/auth-utils');
      const { CartService } = require('@/lib/marketplace/cart-service');

      verifyTokenAndGetRole.mockResolvedValue({ uid: 'user-1', role: 'provider' });
      CartService.addToCart.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/marketplace/cart', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          productId: 'product-1',
          quantity: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Item added to cart successfully');
      expect(CartService.addToCart).toHaveBeenCalledWith('user-1', 'product-1', 2);
    });

    it('should return 400 for missing productId', async () => {
      const { verifyTokenAndGetRole } = require('@/lib/auth-utils');
      verifyTokenAndGetRole.mockResolvedValue({ uid: 'user-1', role: 'provider' });

      const request = new NextRequest('http://localhost:3000/api/marketplace/cart', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          quantity: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Product ID is required');
    });

    it('should handle service errors', async () => {
      const { verifyTokenAndGetRole } = require('@/lib/auth-utils');
      const { CartService } = require('@/lib/marketplace/cart-service');

      verifyTokenAndGetRole.mockResolvedValue({ uid: 'user-1', role: 'provider' });
      CartService.addToCart.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/marketplace/cart', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          productId: 'product-1',
          quantity: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to add item to cart');
    });
  });
});
