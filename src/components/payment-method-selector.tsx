"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MayaCheckoutButton } from '@/components/maya-checkout-button';
import { PayPalCheckoutButton } from '@/components/paypal-checkout-button';
import { CreditCard, Smartphone, Building2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodSelectorProps {
  amount: number;
  type: 'booking' | 'subscription';
  bookingId?: string;
  planId?: string;
  onPaymentSuccess?: (method: string, transactionId?: string) => void;
  onPaymentError?: (method: string, error: string) => void;
}

export function PaymentMethodSelector({
  amount,
  type,
  bookingId,
  planId,
  onPaymentSuccess,
  onPaymentError
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const { toast } = useToast();

  const paymentMethods = [
    {
      id: 'maya',
      name: 'Maya Checkout',
      description: 'Pay with credit/debit cards, e-wallets, or QR codes',
      icon: <CreditCard className="h-6 w-6" />,
      features: ['Credit/Debit Cards', 'GCash', 'GrabPay', 'QR Codes'],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      available: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay securely with your PayPal account',
      icon: <Smartphone className="h-6 w-6" />,
      features: ['PayPal Balance', 'Credit/Debit Cards', 'Bank Transfer'],
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      available: true
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Manual bank transfer with proof of payment',
      icon: <Building2 className="h-6 w-6" />,
      features: ['BPI', 'BDO', 'Metrobank', 'GCash'],
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      available: true
    }
  ];

  const handleMayaSuccess = (checkoutId: string) => {
    onPaymentSuccess?.('maya', checkoutId);
    toast({
      title: "Redirecting to Maya",
      description: "You will be redirected to Maya Checkout to complete your payment.",
    });
  };

  const handleMayaError = (error: string) => {
    onPaymentError?.('maya', error);
  };

  const handlePayPalSuccess = (transactionId?: string) => {
    onPaymentSuccess?.('paypal', transactionId);
    toast({
      title: "Payment Successful!",
      description: "Your PayPal payment has been processed successfully.",
    });
  };

  const handlePayPalError = (error: string) => {
    onPaymentError?.('paypal', error);
  };

  const handleBankTransfer = () => {
    // Bank transfer flow would go here
    toast({
      title: "Bank Transfer",
      description: "Bank transfer instructions will be shown here.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">Choose Payment Method</h3>
        <p className="text-muted-foreground">
          Select your preferred payment method to complete your payment of ₱{amount.toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedMethod === method.id
                ? `${method.borderColor} border-2 shadow-md`
                : 'border-border hover:border-primary/50'
            } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => method.available && setSelectedMethod(method.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${method.bgColor}`}>
                    <div className={method.color}>
                      {method.icon}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{method.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {method.description}
                    </CardDescription>
                  </div>
                </div>
                {selectedMethod === method.id && (
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Selected
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 mb-4">
                {method.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
              
              {selectedMethod === method.id && (
                <div className="mt-4">
                  {method.id === 'maya' && (
                    <MayaCheckoutButton
                      amount={amount}
                      type={type}
                      bookingId={bookingId}
                      planId={planId}
                      onSuccess={handleMayaSuccess}
                      onError={handleMayaError}
                      className="w-full"
                    >
                      Pay with Maya
                    </MayaCheckoutButton>
                  )}
                  
                  {method.id === 'paypal' && bookingId && (
                    <PayPalCheckoutButton
                      bookingId={bookingId}
                      amount={amount}
                      serviceName={`${type === 'booking' ? 'Booking' : 'Subscription'} Payment`}
                      onPaymentSuccess={handlePayPalSuccess}
                      onPaymentError={handlePayPalError}
                      className="w-full"
                    />
                  )}
                  
                  {method.id === 'bank' && (
                    <Button
                      onClick={handleBankTransfer}
                      className="w-full"
                      variant="outline"
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Bank Transfer Instructions
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>All payments are processed securely. Your payment information is encrypted and protected.</p>
      </div>
    </div>
  );
}
