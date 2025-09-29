"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  CreditCard,
  Wallet,
  MapPin,
  Package,
  CheckCircle
} from 'lucide-react';
import { Cart, ShippingAddress } from '@/lib/marketplace/types';
import { CartService } from '@/lib/marketplace/cart-service';
import { WalletService } from '@/lib/marketplace/wallet-service';
import { OrderService } from '@/lib/marketplace/order-service';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    lastUpdated: new Date() as any
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Form state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    province: '',
    postalCode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'gcash' | 'paypal' | 'bank-transfer'>('wallet');

  useEffect(() => {
    if (user) {
      loadCheckoutData();
    } else {
      router.push('/login');
    }
  }, [user, router]);

  const loadCheckoutData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [cartData, balance] = await Promise.all([
        CartService.getCart(user.uid),
        WalletService.getBalance(user.uid)
      ]);
      
      setCart(cartData);
      setWalletBalance(balance);
      
      if (cartData.items.length === 0) {
        router.push('/marketplace/cart');
        return;
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load checkout data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof ShippingAddress)[] = ['street', 'city', 'province', 'postalCode'];
    
    for (const field of requiredFields) {
      if (!shippingAddress[field].trim()) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: `Please fill in the ${field} field`
        });
        return false;
      }
    }

    if (paymentMethod === 'wallet' && walletBalance < cart.totalPrice) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: 'Your wallet balance is insufficient for this order'
      });
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!user || !validateForm()) return;
    
    setProcessing(true);
    try {
      // Get user role from auth context or API
      const token = await user.getIdToken();
      const response = await fetch('/api/auth/user-role', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let userRole = 'provider'; // default fallback
      if (response.ok) {
        const result = await response.json();
        userRole = result.role || 'provider';
      }

      const order = await OrderService.createOrder(
        user.uid,
        userRole as 'provider' | 'agency',
        shippingAddress,
        paymentMethod
      );

      toast({
        title: 'Order Placed Successfully',
        description: `Your order #${order.id.slice(-8)} has been placed`
      });

      router.push(`/marketplace/orders/${order.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: error instanceof Error ? error.message : 'Failed to place order'
      });
    } finally {
      setProcessing(false);
    }
  };

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
          <Link href="/marketplace/cart">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            Complete your order
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checkout Form */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  placeholder="123 Main Street"
                  value={shippingAddress.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Makati"
                    value={shippingAddress.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    placeholder="Metro Manila"
                    value={shippingAddress.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="1234"
                  value={shippingAddress.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('wallet')}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">Wallet Balance</div>
                      <div className="text-sm text-muted-foreground">
                        Available: ₱{walletBalance.toLocaleString()}
                      </div>
                    </div>
                    {paymentMethod === 'wallet' && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>

                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'gcash' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('gcash')}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium">GCash</div>
                      <div className="text-sm text-muted-foreground">
                        Pay with GCash
                      </div>
                    </div>
                    {paymentMethod === 'gcash' && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>

                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'paypal' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium">PayPal</div>
                      <div className="text-sm text-muted-foreground">
                        Pay with PayPal
                      </div>
                    </div>
                    {paymentMethod === 'paypal' && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>

                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'bank-transfer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('bank-transfer')}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    <div className="flex-1">
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-sm text-muted-foreground">
                        Bank transfer payment
                      </div>
                    </div>
                    {paymentMethod === 'bank-transfer' && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({cart.totalItems} items)</span>
                  <span>₱{cart.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₱{cart.totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePlaceOrder}
                disabled={processing || cart.items.length === 0}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Place Order
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                By placing this order, you agree to our terms and conditions
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
