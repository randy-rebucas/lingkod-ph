"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  Truck,
  CreditCard,
  Wallet
} from 'lucide-react';
import { Cart, CartItem } from '@/lib/marketplace/types';
import { ProductService } from '@/lib/marketplace/product-service';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

interface ShoppingCartProps {
  cart: Cart;
  onCartUpdate: () => void;
  onCheckout: () => void;
}

interface CartItemWithProduct extends CartItem {
  product?: any;
  unitPrice?: number;
  totalPrice?: number;
}

export function ShoppingCartComponent({ cart, onCartUpdate, onCheckout }: ShoppingCartProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadCartItems();
  }, [cart.items]);

  const loadCartItems = async () => {
    setLoading(true);
    try {
      const itemsWithProducts = await Promise.all(
        cart.items.map(async (item) => {
          const product = await ProductService.getProduct(item.productId);
          const unitPrice = product ? ProductService.getBulkPricing(product, item.quantity) : 0;
          return {
            ...item,
            product,
            unitPrice,
            totalPrice: unitPrice * item.quantity
          };
        })
      );
      setCartItems(itemsWithProducts);
    } catch (error) {
      console.error('Error loading cart items:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load cart items'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setUpdating(itemId);
    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`/api/marketplace/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (!response.ok) {
        throw new Error('Failed to update cart item');
      }

      onCartUpdate();
      toast({
        title: 'Cart Updated',
        description: 'Item quantity updated successfully'
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update item quantity'
      });
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`/api/marketplace/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove cart item');
      }

      onCartUpdate();
      toast({
        title: 'Item Removed',
        description: 'Item removed from cart successfully'
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove item from cart'
      });
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/marketplace/cart', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      onCartUpdate();
      toast({
        title: 'Cart Cleared',
        description: 'All items removed from cart'
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear cart'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-4">
            Add some products to get started with your order
          </p>
          <Button asChild>
            <a href="/marketplace">Browse Products</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const shipping = 0; // Free shipping for now
  const total = subtotal + shipping;

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            Shopping Cart ({cart.totalItems} items)
          </CardTitle>
          {cartItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
              {/* Product Image */}
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                {item.product?.images?.[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2">
                  {item.product?.name || 'Product not found'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {item.product?.brand}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-primary">
                    ₱{item.unitPrice?.toLocaleString()}
                  </span>
                  {item.product && ProductService.getBulkPricing(item.product, item.quantity) !== item.product.pricing.partnerPrice && (
                    <Badge variant="secondary" className="text-xs">
                      Bulk Price
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={updating === item.id || item.quantity <= 1}
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={updating === item.id}
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Total Price */}
              <div className="text-right">
                <div className="font-semibold text-sm">
                  ₱{item.totalPrice?.toLocaleString()}
                </div>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                disabled={updating === item.id}
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₱{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Shipping
              </span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₱{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full" 
              size="lg"
              onClick={onCheckout}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Proceed to Checkout
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onCheckout}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Pay with Wallet
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <Package className="h-3 w-3 inline mr-1" />
            Free shipping on all orders • Secure payment processing
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
