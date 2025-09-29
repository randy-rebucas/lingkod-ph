"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  ArrowLeft,
  CreditCard,
  Wallet,
  Package
} from 'lucide-react';
import { ShoppingCartComponent } from '@/components/marketplace/shopping-cart';
import { Cart } from '@/lib/marketplace/types';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    lastUpdated: new Date() as any
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get auth token
      const token = await user.getIdToken();
      
      // Fetch cart from API
      const response = await fetch('/api/marketplace/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const result = await response.json();
      setCart(result.data?.cart || {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        lastUpdated: new Date() as any
      });
    } catch (error) {
      console.error('Error loading cart:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load cart'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'Please log in to proceed with checkout'
      });
      return;
    }

    if (cart.items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Empty Cart',
        description: 'Please add items to your cart before checkout'
      });
      return;
    }

    // Navigate to checkout page
    router.push('/marketplace/checkout');
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Login Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to view your shopping cart
            </p>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/marketplace">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground">
            Review your items before checkout
          </p>
        </div>
      </div>

      {/* Cart Summary */}
      {cart.items.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'} in cart
                </span>
              </div>
              <Badge variant="secondary" className="text-sm">
                Total: ₱{cart.totalPrice.toLocaleString()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cart Component */}
      <ShoppingCartComponent
        cart={cart}
        onCartUpdate={loadCart}
        onCheckout={handleCheckout}
      />

      {/* Continue Shopping */}
      {cart.items.length > 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-2">Need more supplies?</h3>
            <p className="text-muted-foreground mb-4">
              Continue shopping to add more products to your order
            </p>
            <Button variant="outline" asChild>
              <Link href="/marketplace">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
