import { GET } from '../products/route';
import { NextRequest } from 'next/server';

// Mock ProductService
jest.mock('@/lib/marketplace/product-service', () => ({
  ProductService: {
    getProducts: jest.fn(),
  },
}));

describe('/api/marketplace/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return products successfully', async () => {
    const { ProductService } = require('@/lib/marketplace/product-service');
    const mockProducts = {
      items: [
        {
          id: 'product-1',
          name: 'Test Product',
          pricing: { partnerPrice: 100 },
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    };

    ProductService.getProducts.mockResolvedValue(mockProducts);

    const request = new NextRequest('http://localhost:3000/api/marketplace/products');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockProducts);
  });

  it('should handle query parameters', async () => {
    const { ProductService } = require('@/lib/marketplace/product-service');
    ProductService.getProducts.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, hasMore: false });

    const request = new NextRequest('http://localhost:3000/api/marketplace/products?category=cleaning&page=2&limit=10');
    const response = await GET(request);

    expect(ProductService.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'cleaning',
      }),
      2,
      10
    );
    expect(response.status).toBe(200);
  });

  it('should handle errors', async () => {
    const { ProductService } = require('@/lib/marketplace/product-service');
    ProductService.getProducts.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/marketplace/products');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch products');
  });
});
