"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2 } from 'lucide-react';

interface MayaCheckoutButtonProps {
  amount: number;
  type: 'booking' | 'subscription';
  bookingId?: string;
  planId?: string;
  onSuccess?: (checkoutId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function MayaCheckoutButton({
  amount,
  type,
  bookingId,
  planId,
  onSuccess,
  onError,
  className,
  children
}: MayaCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleMayaCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to proceed with payment.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'booking' && !bookingId) {
      toast({
        title: "Booking ID Required",
        description: "Booking ID is required for booking payments.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'subscription' && !planId) {
      toast({
        title: "Plan ID Required",
        description: "Plan ID is required for subscription payments.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/payments/maya/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          type,
          bookingId,
          planId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create Maya checkout');
      }

      // Redirect to Maya Checkout
      if (result.data?.redirectUrl) {
        window.location.href = result.data.redirectUrl;
        onSuccess?.(result.data.checkoutId);
      } else {
        throw new Error('No redirect URL received from Maya');
      }

    } catch (error) {
      console.error('Maya checkout error:', error);
      let errorMessage = 'Failed to process payment';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages for common issues
        if (error.message.includes('configuration is invalid')) {
          errorMessage = 'Payment system is not properly configured. Please contact support.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('amount')) {
          errorMessage = 'Invalid payment amount. Please try again.';
        } else if (error.message.includes('QR') || error.message.includes('GCash')) {
          errorMessage = 'QR code payment failed. Please try using a different payment method or contact support.';
        }
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleMayaCheckout}
      disabled={isLoading}
      className={className}
      variant="outline"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {children || 'Pay with Maya'}
        </>
      )}
    </Button>
  );
}
