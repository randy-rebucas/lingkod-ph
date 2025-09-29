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
  MapPin,
  CreditCard,
  Calendar,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { OrderTracking } from '@/components/marketplace/order-tracking';
import { Order, OrderTracking as OrderTrackingType } from '@/lib/marketplace/types';
import { ProductService } from '@/lib/marketplace/product-service';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTrackingType[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const orderId = params.orderId as string;

  useEffect(() => {
    if (user && orderId) {
      loadOrderDetails();
    }
  }, [user, orderId]);

  const loadOrderDetails = async () => {
    if (!user || !orderId) return;
    
    setLoading(true);
    try {
      // Get auth token
      const token = await user.getIdToken();
      
      // Fetch order details from API
      const response = await fetch(`/api/marketplace/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            variant: 'destructive',
            title: 'Order Not Found',
            description: 'The requested order could not be found'
          });
          router.push('/marketplace/orders');
          return;
        }
        throw new Error('Failed to fetch order details');
      }

      const result = await response.json();
      const orderData = result.data?.order;
      const trackingData = result.data?.tracking || [];

      if (!orderData) {
        toast({
          variant: 'destructive',
          title: 'Order Not Found',
          description: 'The requested order could not be found'
        });
        router.push('/marketplace/orders');
        return;
      }

      setOrder(orderData);
      setTracking(trackingData);

      // Load product details for order items
      const itemsWithProducts = await Promise.all(
        orderData.items.map(async (item: any) => {
          const product = await ProductService.getProduct(item.productId);
          return {
            ...item,
            product
          };
        })
      );
      setOrderItems(itemsWithProducts);
    } catch (error) {
      console.error('Error loading order details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load order details'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-cyan-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-cyan-100 text-cyan-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    return timestamp.toDate().toLocaleString();
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

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The requested order could not be found
            </p>
            <Button asChild>
              <Link href="/marketplace/orders">Back to Orders</Link>
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
          <Link href="/marketplace/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-muted-foreground">
            Order #{order.id.slice(-8)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge className={`${getStatusColor(order.status)} text-sm`}>
                  {order.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Updated {formatDate(order.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderItems.map((item, index) => (
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
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ₱{item.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ₱{item.unitPrice.toLocaleString()} each
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Tracking */}
          <OrderTracking tracking={tracking} orderId={order.id} />
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₱{order.pricing.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount</span>
                  <span className="text-green-600">-₱{order.pricing.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₱{order.pricing.total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p>{order.shipping.address.street}</p>
                <p>{order.shipping.address.city}, {order.shipping.address.province}</p>
                <p>{order.shipping.address.postalCode}</p>
              </div>
              {order.shipping.trackingNumber && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Tracking Number</p>
                  <p className="text-sm text-muted-foreground">{order.shipping.trackingNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Payment Method</span>
                <span className="capitalize">{order.payment.method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Payment Status</span>
                <Badge variant={order.payment.status === 'paid' ? 'default' : 'secondary'}>
                  {order.payment.status}
                </Badge>
              </div>
              {order.payment.paidAt && (
                <div className="flex justify-between text-sm">
                  <span>Paid On</span>
                  <span>{formatDate(order.payment.paidAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Order Placed</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Updated</span>
                <span>{formatDate(order.updatedAt)}</span>
              </div>
              {order.shipping.estimatedDelivery && (
                <div className="flex justify-between text-sm">
                  <span>Estimated Delivery</span>
                  <span>{formatDate(order.shipping.estimatedDelivery)}</span>
                </div>
              )}
              {order.shipping.deliveredAt && (
                <div className="flex justify-between text-sm">
                  <span>Delivered On</span>
                  <span>{formatDate(order.shipping.deliveredAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
