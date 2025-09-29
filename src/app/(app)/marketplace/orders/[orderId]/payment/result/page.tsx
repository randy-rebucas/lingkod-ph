"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  Package
} from 'lucide-react';
import { OrderService } from '@/lib/marketplace/order-service';
import { MarketplacePaymentIntegration } from '@/lib/marketplace/payment-integration';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function PaymentResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.orderId as string;
  const resultCode = searchParams.get('resultCode');
  const pspReference = searchParams.get('pspReference');

  useEffect(() => {
    if (user && orderId) {
      handlePaymentResult();
    }
  }, [user, orderId, resultCode, pspReference]);

  const handlePaymentResult = async () => {
    if (!user || !orderId) return;
    
    setLoading(true);
    try {
      // Get the order
      const orderData = await OrderService.getOrder(orderId);
      if (!orderData) {
        setError('Order not found');
        setLoading(false);
        return;
      }

      setOrder(orderData);

      // Verify payment status
      if (resultCode && pspReference) {
        const verificationResult = await MarketplacePaymentIntegration.verifyPaymentStatus(
          orderId,
          pspReference,
          orderData.payment.method
        );

        if (verificationResult.success) {
          if (verificationResult.status === 'paid') {
            setPaymentStatus('success');
            
            // Update order payment status
            await OrderService.updateOrderPayment(orderId, {
              ...orderData.payment,
              status: 'paid',
              transactionId: pspReference,
              paidAt: new Date() as any
            });

            // Update order status
            await OrderService.updateOrderStatus(orderId, 'confirmed');

            toast({
              title: 'Payment Successful',
              description: 'Your payment has been processed successfully'
            });
          } else {
            setPaymentStatus('failed');
            setError(verificationResult.error || 'Payment verification failed');
          }
        } else {
          setPaymentStatus('failed');
          setError(verificationResult.error || 'Payment verification failed');
        }
      } else {
        // No payment result parameters, check current order status
        if (orderData.payment.status === 'paid') {
          setPaymentStatus('success');
        } else if (orderData.payment.status === 'failed') {
          setPaymentStatus('failed');
        } else {
          setPaymentStatus('pending');
        }
      }
    } catch (error) {
      console.error('Error handling payment result:', error);
      setPaymentStatus('failed');
      setError('An error occurred while processing your payment');
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: 'An error occurred while processing your payment'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      default:
        return <Package className="h-16 w-16 text-muted-foreground" />;
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      default:
        return 'Payment Status';
    }
  };

  const getStatusDescription = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Your payment has been processed successfully. Your order is being prepared.';
      case 'failed':
        return error || 'Your payment could not be processed. Please try again.';
      case 'pending':
        return 'Your payment is being processed. You will be notified once it is confirmed.';
      default:
        return 'Checking payment status...';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/marketplace/orders/${orderId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Payment Result</h1>
          <p className="text-muted-foreground">
            Order #{orderId.slice(-8)}
          </p>
        </div>
      </div>

      {/* Payment Status */}
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            {getStatusIcon()}
            
            <div>
              <h2 className="text-2xl font-bold mb-2">{getStatusTitle()}</h2>
              <p className="text-muted-foreground mb-4">{getStatusDescription()}</p>
              <Badge className={getStatusColor()}>
                {paymentStatus.toUpperCase()}
              </Badge>
            </div>

            {order && (
              <div className="mt-6 p-4 bg-muted rounded-lg w-full">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Order Total</span>
                  <span className="text-lg font-bold">₱{order.pricing.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Payment Method</span>
                  <span className="text-sm capitalize">{order.payment.method}</span>
                </div>
                {order.payment.transactionId && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Transaction ID</span>
                    <span className="text-sm font-mono">{order.payment.transactionId}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link href={`/marketplace/orders/${orderId}`}>
            View Order Details
          </Link>
        </Button>
        
        {paymentStatus === 'failed' && (
          <Button variant="outline" asChild className="flex-1">
            <Link href={`/marketplace/orders/${orderId}`}>
              Try Again
            </Link>
          </Button>
        )}
        
        <Button variant="outline" asChild className="flex-1">
          <Link href="/marketplace/orders">
            View All Orders
          </Link>
        </Button>
      </div>

      {/* Additional Information */}
      {paymentStatus === 'success' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Order Confirmation</p>
                <p className="text-sm text-muted-foreground">
                  Your order has been confirmed and is being processed
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Preparation</p>
                <p className="text-sm text-muted-foreground">
                  Your items are being prepared for shipping
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Shipping</p>
                <p className="text-sm text-muted-foreground">
                  You'll receive tracking information once your order ships
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
