import { ProductService } from '../product-service';
import { Product, ProductCategoryData } from '../types';

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
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

describe('ProductService', () => {
  const mockProduct: Product = {
    id: 'test-product-1',
    name: 'Test Product',
    description: 'A test product',
    category: 'cleaning',
    subcategory: 'detergents',
    brand: 'TestBrand',
    sku: 'TEST-001',
    images: ['https://example.com/image.jpg'],
    pricing: {
      marketPrice: 100,
      partnerPrice: 80,
      bulkPrice: 70,
      currency: 'PHP',
      savings: 20,
      savingsPercentage: 20,
    },
    inventory: {
      stock: 50,
      location: 'Warehouse A',
      supplier: 'Test Supplier',
      lastRestocked: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    },
    features: ['Feature 1', 'Feature 2'],
    isActive: true,
    isFeatured: true,
    tags: ['test', 'cleaning'],
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return products with pagination', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({ id: mockProduct.id, data: () => mockProduct });
        },
      });

      const result = await ProductService.getProducts({}, 1, 10);

      expect(result).toEqual({
        items: [mockProduct],
        total: 1,
        page: 1,
        limit: 10,
        hasMore: false,
      });
    });

    it('should filter products by category', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({ id: mockProduct.id, data: () => mockProduct });
        },
      });

      const result = await ProductService.getProducts({ category: 'cleaning' }, 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].category).toBe('cleaning');
    });

    it('should filter products by search query', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({ id: mockProduct.id, data: () => mockProduct });
        },
      });

      const result = await ProductService.getProducts({ searchQuery: 'test' }, 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name.toLowerCase()).toContain('test');
    });
  });

  describe('getProduct', () => {
    it('should return a single product by ID', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProduct,
      });

      const result = await ProductService.getProduct('test-product-1');

      expect(result).toEqual(mockProduct);
    });

    it('should return null for non-existent product', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await ProductService.getProduct('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({ id: mockProduct.id, data: () => mockProduct });
        },
      });

      const result = await ProductService.getFeaturedProducts(5);

      expect(result).toHaveLength(1);
      expect(result[0].isFeatured).toBe(true);
    });
  });

  describe('calculateSavings', () => {
    it('should calculate correct savings', () => {
      const savings = ProductService.calculateSavings(mockProduct);

      expect(savings.amount).toBe(20);
      expect(savings.percentage).toBe(20);
    });
  });

  describe('isInStock', () => {
    it('should return true for products with stock', () => {
      const inStock = ProductService.isInStock(mockProduct);
      expect(inStock).toBe(true);
    });

    it('should return false for products without stock', () => {
      const outOfStockProduct = { ...mockProduct, inventory: { ...mockProduct.inventory, stock: 0 } };
      const inStock = ProductService.isInStock(outOfStockProduct);
      expect(inStock).toBe(false);
    });
  });

  describe('getBulkPricing', () => {
    it('should return bulk price for quantities >= 10', () => {
      const price = ProductService.getBulkPricing(mockProduct, 10);
      expect(price).toBe(70);
    });

    it('should return partner price for quantities < 10', () => {
      const price = ProductService.getBulkPricing(mockProduct, 5);
      expect(price).toBe(80);
    });
  });
});
