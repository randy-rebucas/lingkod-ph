import { OrderService } from '../order-service';
import { Order, OrderStatus, ShippingAddress } from '../types';

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
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  },
}));

// Mock other services
jest.mock('../cart-service', () => ({
  CartService: {
    validateCart: jest.fn(),
    calculateCartTotals: jest.fn(),
    clearCart: jest.fn(),
  },
}));

jest.mock('../wallet-service', () => ({
  WalletService: {
    hasSufficientBalance: jest.fn(),
  },
}));

jest.mock('../product-service', () => ({
  ProductService: {
    getProduct: jest.fn(),
    getBulkPricing: jest.fn(),
  },
}));

jest.mock('../payment-integration', () => ({
  MarketplacePaymentIntegration: {
    processMarketplacePayment: jest.fn(),
  },
}));

describe('OrderService', () => {
  const mockShippingAddress: ShippingAddress = {
    street: '123 Test Street',
    city: 'Test City',
    province: 'Test Province',
    postalCode: '1234',
  };

  const mockOrder: Order = {
    id: 'order-1',
    userId: 'user-1',
    userRole: 'provider',
    orderType: 'single',
    items: [
      {
        productId: 'product-1',
        quantity: 2,
        unitPrice: 100,
        totalPrice: 200,
      },
    ],
    pricing: {
      subtotal: 200,
      discount: 20,
      shipping: 0,
      total: 180,
      currency: 'PHP',
    },
    status: 'pending',
    payment: {
      method: 'wallet',
      status: 'pending',
    },
    shipping: {
      address: mockShippingAddress,
    },
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { CartService } = require('../cart-service');
    const { WalletService } = require('../wallet-service');
    const { ProductService } = require('../product-service');
    const { MarketplacePaymentIntegration } = require('../payment-integration');

    CartService.validateCart.mockResolvedValue({
      isValid: true,
      errors: [],
      updatedItems: [
        {
          productId: 'product-1',
          quantity: 2,
        },
      ],
    });

    CartService.calculateCartTotals.mockResolvedValue({
      subtotal: 200,
      discount: 20,
      total: 180,
      itemCount: 2,
    });

    WalletService.hasSufficientBalance.mockResolvedValue(true);
    ProductService.getProduct.mockResolvedValue({
      id: 'product-1',
      name: 'Test Product',
    });
    ProductService.getBulkPricing.mockReturnValue(100);
    MarketplacePaymentIntegration.processMarketplacePayment.mockResolvedValue({
      success: true,
      transactionId: 'tx-123',
    });
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const { addDoc } = require('firebase/firestore');
      addDoc.mockResolvedValue({ id: 'order-1' });

      const result = await OrderService.createOrder(
        'user-1',
        'provider',
        mockShippingAddress,
        'wallet'
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.userRole).toBe('provider');
      expect(result.pricing.total).toBe(180);
    });

    it('should throw error for invalid cart', async () => {
      const { CartService } = require('../cart-service');
      CartService.validateCart.mockResolvedValue({
        isValid: false,
        errors: ['Product out of stock'],
        updatedItems: [],
      });

      await expect(
        OrderService.createOrder('user-1', 'provider', mockShippingAddress, 'wallet')
      ).rejects.toThrow('Cart validation failed');
    });

    it('should throw error for insufficient wallet balance', async () => {
      const { WalletService } = require('../wallet-service');
      WalletService.hasSufficientBalance.mockResolvedValue(false);

      await expect(
        OrderService.createOrder('user-1', 'provider', mockShippingAddress, 'wallet')
      ).rejects.toThrow('Insufficient wallet balance');
    });
  });

  describe('getOrder', () => {
    it('should return order by ID', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockOrder,
      });

      const result = await OrderService.getOrder('order-1');

      expect(result).toEqual(mockOrder);
    });

    it('should return null for non-existent order', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await OrderService.getOrder('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserOrders', () => {
    it('should return user orders', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({ id: mockOrder.id, data: () => mockOrder });
        },
      });

      const result = await OrderService.getUserOrders('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });

    it('should filter orders by status', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({ id: mockOrder.id, data: () => mockOrder });
        },
      });

      const result = await OrderService.getUserOrders('user-1', 'pending');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const { updateDoc } = require('firebase/firestore');

      await OrderService.updateOrderStatus('order-1', 'confirmed');

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockOrder,
      });

      await OrderService.cancelOrder('order-1', 'Customer request');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error for already delivered order', async () => {
      const { getDoc } = require('firebase/firestore');
      const deliveredOrder = { ...mockOrder, status: 'delivered' as OrderStatus };
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => deliveredOrder,
      });

      await expect(
        OrderService.cancelOrder('order-1', 'Customer request')
      ).rejects.toThrow('Cannot cancel order in current status');
    });
  });

  describe('getOrderStatistics', () => {
    it('should return order statistics', async () => {
      const { getDocs } = require('firebase/firestore');
      const orders = [
        { ...mockOrder, status: 'delivered' },
        { ...mockOrder, status: 'pending' },
        { ...mockOrder, status: 'delivered' },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          orders.forEach(order => callback({ id: order.id, data: () => order }));
        },
      });

      const result = await OrderService.getOrderStatistics('user-1');

      expect(result.totalOrders).toBe(3);
      expect(result.completedOrders).toBe(2);
      expect(result.pendingOrders).toBe(1);
      expect(result.totalSpent).toBe(540); // 3 * 180
    });
  });
});
