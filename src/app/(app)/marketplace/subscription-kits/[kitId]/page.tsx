"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  ShoppingCart,
  Star,
  CheckCircle,
  Truck,
  Clock
} from 'lucide-react';
import { SubscriptionKit } from '@/lib/marketplace/types';
import { SubscriptionService } from '@/lib/marketplace/subscription-service';
import { CartService } from '@/lib/marketplace/cart-service';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SubscriptionKitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [kit, setKit] = useState<SubscriptionKit | null>(null);
  const [productDetails, setProductDetails] = useState<any>(null);
  const [savings, setSavings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const kitId = params.kitId as string;

  useEffect(() => {
    if (kitId) {
      loadKitDetails();
    }
  }, [kitId]);

  const loadKitDetails = async () => {
    setLoading(true);
    try {
      const [kitData, productData, savingsData] = await Promise.all([
        SubscriptionService.getSubscriptionKit(kitId),
        SubscriptionService.getKitProductDetails(kitId as any),
        SubscriptionService.calculateKitSavings(kitId as any)
      ]);

      if (!kitData) {
        toast({
          variant: 'destructive',
          title: 'Kit Not Found',
          description: 'The requested subscription kit could not be found'
        });
        router.push('/marketplace/subscription-kits');
        return;
      }

      setKit(kitData);
      setProductDetails(productData);
      setSavings(savingsData);
    } catch (error) {
      console.error('Error loading kit details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load kit details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'Please log in to add items to cart'
      });
      return;
    }

    if (!kit) return;

    setAddingToCart(true);
    try {
      // Add each product in the kit to cart
      for (const kitProduct of kit.products) {
        await CartService.addToCart(user.uid, kitProduct.productId, kitProduct.quantity);
      }
      
      toast({
        title: 'Kit Added to Cart',
        description: 'Subscription kit added to cart successfully'
      });
    } catch (error) {
      console.error('Error adding kit to cart:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add kit to cart'
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const getDeliveryScheduleLabel = (schedule: string) => {
    switch (schedule) {
      case 'monthly':
        return 'Monthly Delivery';
      case 'quarterly':
        return 'Quarterly Delivery';
      case 'custom':
        return 'Custom Schedule';
      default:
        return 'Monthly Delivery';
    }
  };

  const getDeliveryScheduleIcon = (schedule: string) => {
    switch (schedule) {
      case 'monthly':
        return '📅';
      case 'quarterly':
        return '🗓️';
      case 'custom':
        return '⚙️';
      default:
        return '📅';
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

  if (!kit) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Kit Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The requested subscription kit could not be found
            </p>
            <Button asChild>
              <Link href="/marketplace/subscription-kits">Browse Kits</Link>
            </Button>
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
          <Link href="/marketplace/subscription-kits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{kit.name}</h1>
          <p className="text-muted-foreground">
            Subscription Kit Details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Kit Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {kit.featured && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <Badge variant="outline">{kit.category}</Badge>
                  </div>
                  <CardTitle className="text-2xl">{kit.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{kit.description}</p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{getDeliveryScheduleIcon(kit.deliverySchedule)} {getDeliveryScheduleLabel(kit.deliverySchedule)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Products in Kit */}
          <Card>
            <CardHeader>
              <CardTitle>Products in This Kit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {productDetails?.products?.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                    {item.product?.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product?.name || 'Product not found'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.product?.brand}
                    </p>
                    <p className="text-sm">
                      Quantity: {item.kitProduct.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">
                        ₱{item.kitProduct.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        ₱{item.product?.pricing?.marketPrice?.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      Save ₱{item.savings.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Why Choose This Kit?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Professional Quality</h4>
                    <p className="text-sm text-muted-foreground">
                      All products are selected for professional use
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Significant Savings</h4>
                    <p className="text-sm text-muted-foreground">
                      Save up to {savings?.oneTimeSavingsPercentage}% compared to retail
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Convenient Delivery</h4>
                    <p className="text-sm text-muted-foreground">
                      Never run out of supplies with regular deliveries
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Time Saving</h4>
                    <p className="text-sm text-muted-foreground">
                      No need to shop for individual items
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-3xl font-bold text-primary">
                    ₱{kit.pricing.monthlyPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  One-time purchase: ₱{kit.pricing.oneTimePrice.toLocaleString()}
                </div>
              </div>

              {savings && savings.monthlySavings > 0 && (
                <div className="text-center">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                    Save ₱{savings.monthlySavings.toLocaleString()} ({savings.monthlySavingsPercentage}%)
                  </Badge>
                </div>
              )}

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Individual Value</span>
                  <span>₱{productDetails?.totalValue?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kit Price</span>
                  <span>₱{kit.pricing.monthlyPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>You Save</span>
                  <span className="text-green-600">₱{savings?.monthlySavings?.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
              </Button>
              
              <Button variant="outline" className="w-full" asChild>
                <Link href="/marketplace/cart">
                  View Cart
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {getDeliveryScheduleLabel(kit.deliverySchedule)}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• Free shipping on all subscription kits</p>
                <p>• Cancel or modify anytime</p>
                <p>• Skip deliveries when needed</p>
                <p>• Professional packaging</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
