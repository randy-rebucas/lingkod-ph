"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Star, Package } from 'lucide-react';
import { Product } from '@/lib/marketplace/types';
import { ProductService } from '@/lib/marketplace/product-service';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: boolean;
  showAddToCart?: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  showAddToCart = true
}: ProductCardProps) {
  const savings = ProductService.calculateSavings(product);
  const isInStock = ProductService.isInStock(product);
  const isBulkEligible = product.pricing.bulkPrice !== undefined;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-soft hover:shadow-glow transition-all duration-300 bg-background/80 backdrop-blur-sm">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.images[0] || '/placeholder-product.jpg'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isFeatured && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-sm">
              Featured
            </Badge>
          )}
          {savings.percentage > 0 && (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm">
              Save {savings.percentage}%
            </Badge>
          )}
          {isBulkEligible && (
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm">
              Bulk Available
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={() => onToggleFavorite(product.id)}
          >
            <Heart 
              className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
            />
          </Button>
        )}

        {/* Stock Status */}
        {!isInStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Brand */}
        <div className="text-xs text-muted-foreground mb-1 font-medium">
          {product.brand}
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          <Link href={`/marketplace/products/${product.id}`}>
            {product.name}
          </Link>
        </h3>

        {/* Features */}
        {product.features.length > 0 && (
          <div className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {product.features.slice(0, 2).join(' • ')}
          </div>
        )}

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              ₱{product.pricing.partnerPrice.toLocaleString()}
            </span>
            {savings.amount > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                ₱{product.pricing.marketPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          {savings.amount > 0 && (
            <div className="text-xs text-green-600 font-medium">
              Save ₱{savings.amount.toLocaleString()}
            </div>
          )}

          {isBulkEligible && (
            <div className="text-xs text-blue-600 font-medium">
              Buy 10+ for ₱{product.pricing.bulkPrice!.toLocaleString()} each
            </div>
          )}
        </div>

        {/* Stock Info */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <Package className="h-3 w-3" />
          <span>{isInStock ? `${product.inventory.stock} in stock` : 'Out of stock'}</span>
        </div>
      </CardContent>

      {showAddToCart && (
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            disabled={!isInStock}
            onClick={() => onAddToCart?.(product.id)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isInStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
