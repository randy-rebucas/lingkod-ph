"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  Star,
  ArrowRight,
  Filter
} from 'lucide-react';
import { ProductCard } from '@/components/marketplace/product-card';
import { SubscriptionKitCard } from '@/components/marketplace/subscription-kit-card';
import { ProductFiltersComponent } from '@/components/marketplace/product-filters';
import { WalletBalanceComponent } from '@/components/marketplace/wallet-balance';
import { Product, ProductCategoryData, ProductFilters, SubscriptionKit } from '@/lib/marketplace/types';
import { ProductService } from '@/lib/marketplace/product-service';
import { SubscriptionService } from '@/lib/marketplace/subscription-service';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function MarketplacePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [subscriptionKits, setSubscriptionKits] = useState<SubscriptionKit[]>([]);
  const [categories, setCategories] = useState<ProductCategoryData[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load cart count
  useEffect(() => {
    if (user) {
      loadCartCount();
    }
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [
        productsData,
        featuredData,
        kitsData,
        categoriesData,
        brandsData
      ] = await Promise.all([
        ProductService.getProducts({}, 1, 12),
        ProductService.getFeaturedProducts(6),
        SubscriptionService.getFeaturedKits(3),
        ProductService.getCategories(),
        ProductService.getBrands()
      ]);

      setProducts(productsData.items);
      setFeaturedProducts(featuredData);
      setSubscriptionKits(kitsData);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load marketplace data'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/marketplace/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCartItemCount(result.data?.cart?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'Please log in to add items to cart'
      });
      return;
    }

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/marketplace/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }

      await loadCartCount();
      toast({
        title: 'Added to Cart',
        description: 'Product added to cart successfully'
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add product to cart'
      });
    }
  };

  const handleAddKitToCart = async (kitId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'Please log in to add items to cart'
      });
      return;
    }

    try {
      const kit = await SubscriptionService.getSubscriptionKit(kitId);
      if (kit) {
        const token = await user.getIdToken();
        
        // Add each product in the kit to cart
        for (const kitProduct of kit.products) {
          const response = await fetch('/api/marketplace/cart', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              productId: kitProduct.productId,
              quantity: kitProduct.quantity
            })
          });

          if (!response.ok) {
            throw new Error('Failed to add kit product to cart');
          }
        }
        
        await loadCartCount();
        toast({
          title: 'Kit Added to Cart',
          description: 'Subscription kit added to cart successfully'
        });
      }
    } catch (error) {
      console.error('Error adding kit to cart:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add kit to cart'
      });
    }
  };

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    // In a real implementation, you would fetch filtered products here
  };

  const handleSearch = () => {
    handleFiltersChange({
      ...filters,
      searchQuery: searchQuery || undefined
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            LocalPro Marketplace
          </h1>
          <p className="text-muted-foreground mt-2">
            Get professional supplies at partner prices
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/marketplace/cart" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart
              {cartItemCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {cartItemCount}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, brands, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <ProductFiltersComponent
            categories={categories}
            brands={brands}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={() => setFilters({})}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Wallet Balance (for providers/agencies) */}
          {user && user.role && ['provider', 'agency'].includes(user.role) && (
            <WalletBalanceComponent compact />
          )}

          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                  Featured Products
                </h2>
                <Button variant="outline" asChild>
                  <Link href="/marketplace/products?featured=true">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Subscription Kits */}
          {subscriptionKits.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-500" />
                  Subscription Kits
                </h2>
                <Button variant="outline" asChild>
                  <Link href="/marketplace/subscription-kits">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptionKits.map((kit) => (
                  <SubscriptionKitCard
                    key={kit.id}
                    kit={kit}
                    onAddToCart={handleAddKitToCart}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Products */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-500" />
                All Products
              </h2>
              <Button variant="outline" asChild>
                <Link href="/marketplace/products">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
