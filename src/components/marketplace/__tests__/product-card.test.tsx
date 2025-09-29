import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../product-card';
import { Product } from '@/lib/marketplace/types';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: 'product-1',
    name: 'Test Product',
    description: 'A test product description',
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

  const mockOnAddToCart = jest.fn();
  const mockOnToggleFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render product information correctly', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('TestBrand')).toBeInTheDocument();
    expect(screen.getByText('₱80')).toBeInTheDocument();
    expect(screen.getByText('Save ₱20')).toBeInTheDocument();
    expect(screen.getByText('50 in stock')).toBeInTheDocument();
  });

  it('should show featured badge for featured products', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('should show savings badge when there are savings', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByText('Save 20%')).toBeInTheDocument();
  });

  it('should show bulk pricing when available', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByText('Buy 10+ for ₱70 each')).toBeInTheDocument();
  });

  it('should call onAddToCart when add to cart button is clicked', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
      />
    );

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith('product-1');
  });

  it('should call onToggleFavorite when favorite button is clicked', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const favoriteButton = screen.getByRole('button');
    fireEvent.click(favoriteButton);

    expect(mockOnToggleFavorite).toHaveBeenCalledWith('product-1');
  });

  it('should show out of stock when product has no stock', () => {
    const outOfStockProduct = {
      ...mockProduct,
      inventory: {
        ...mockProduct.inventory,
        stock: 0,
      },
    };

    render(
      <ProductCard
        product={outOfStockProduct}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('should disable add to cart button when out of stock', () => {
    const outOfStockProduct = {
      ...mockProduct,
      inventory: {
        ...mockProduct.inventory,
        stock: 0,
      },
    };

    render(
      <ProductCard
        product={outOfStockProduct}
        onAddToCart={mockOnAddToCart}
      />
    );

    const addToCartButton = screen.getByText('Out of Stock');
    expect(addToCartButton).toBeDisabled();
  });

  it('should not show add to cart button when showAddToCart is false', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        showAddToCart={false}
      />
    );

    expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument();
  });

  it('should show favorite button as filled when isFavorite is true', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={true}
      />
    );

    const heartIcon = screen.getByRole('button').querySelector('svg');
    expect(heartIcon).toHaveClass('fill-red-500');
  });
});
