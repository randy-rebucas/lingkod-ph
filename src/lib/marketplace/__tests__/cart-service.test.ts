import { CartService } from '../cart-service';
import { CartItem, Cart } from '../types';

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
  deleteDoc: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  },
}));

// Mock ProductService
jest.mock('../product-service', () => ({
  ProductService: {
    getProduct: jest.fn(),
    getBulkPricing: jest.fn(),
    isInStock: jest.fn(),
  },
}));

describe('CartService', () => {
  const mockCartItem: CartItem = {
    id: 'cart-item-1',
    productId: 'product-1',
    quantity: 2,
    addedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  };

  const mockProduct = {
    id: 'product-1',
    name: 'Test Product',
    pricing: {
      partnerPrice: 100,
      bulkPrice: 90,
    },
    inventory: {
      stock: 10,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { ProductService } = require('../product-service');
    ProductService.getProduct.mockResolvedValue(mockProduct);
    ProductService.getBulkPricing.mockReturnValue(100);
    ProductService.isInStock.mockReturnValue(true);
  });

  describe('getCart', () => {
    it('should return cart with items', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({ id: mockCartItem.id, data: () => mockCartItem });
        },
      });

      const result = await CartService.getCart('test-user-1');

      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(2);
      expect(result.totalPrice).toBe(200);
    });

    it('should return empty cart when no items', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {},
      });

      const result = await CartService.getCart('test-user-1');

      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPrice).toBe(0);
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      const { getDocs, addDoc } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {},
      });

      await CartService.addToCart('test-user-1', 'product-1', 1);

      expect(addDoc).toHaveBeenCalled();
    });

    it('should update quantity for existing item', async () => {
      const { getDocs, updateDoc } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({ id: mockCartItem.id, data: () => mockCartItem });
        },
      });

      await CartService.addToCart('test-user-1', 'product-1', 1);

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const { deleteDoc } = require('firebase/firestore');

      await CartService.removeFromCart('test-user-1', 'cart-item-1');

      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update item quantity', async () => {
      const { updateDoc } = require('firebase/firestore');

      await CartService.updateCartItemQuantity('test-user-1', 'cart-item-1', 5);

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should remove item when quantity is 0', async () => {
      const { deleteDoc } = require('firebase/firestore');

      await CartService.updateCartItemQuantity('test-user-1', 'cart-item-1', 0);

      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const { getDocs, deleteDoc } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        docs: [
          { ref: 'doc1' },
          { ref: 'doc2' },
        ],
      });

      await CartService.clearCart('test-user-1');

      expect(deleteDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateCart', () => {
    it('should validate cart items', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({ id: mockCartItem.id, data: () => mockCartItem });
        },
      });

      const result = await CartService.validateCart('test-user-1');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.updatedItems).toHaveLength(1);
    });

    it('should detect out of stock items', async () => {
      const { getDocs } = require('firebase/firestore');
      const { ProductService } = require('../product-service');
      
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({ id: mockCartItem.id, data: () => mockCartItem });
        },
      });
      
      ProductService.isInStock.mockReturnValue(false);

      const result = await CartService.validateCart('test-user-1');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('calculateCartTotals', () => {
    it('should calculate cart totals', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({ id: mockCartItem.id, data: () => mockCartItem });
        },
      });

      const result = await CartService.calculateCartTotals('test-user-1');

      expect(result.subtotal).toBe(200);
      expect(result.itemCount).toBe(2);
      expect(result.total).toBe(200);
    });
  });
});
