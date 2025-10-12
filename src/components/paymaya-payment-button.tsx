"use client";

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, QrCode } from 'lucide-react';

interface PayMayaPaymentButtonProps {
  planId: string;
  planName: string;
  price: number;
  onPaymentStart?: () => void;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  showQRCode?: boolean;
}

export function PayMayaPaymentButton({
  planId,
  planName,
  price,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  className = '',
  showQRCode = false,
}: PayMayaPaymentButtonProps) {
  const { user, getIdToken } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if PayMaya is configured
  const [isPayMayaConfigured, setIsPayMayaConfigured] = useState(false);

  useEffect(() => {
    setIsPayMayaConfigured(!!(
      process.env.NEXT_PUBLIC_PAYMAYA_PUBLIC_KEY && 
      process.env.PAYMAYA_SECRET_KEY
    ));
  }, []);

  // Memoize the payment handler to prevent unnecessary re-renders
  const handlePayMayaPayment = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    if (!isPayMayaConfigured) {
      toast({
        title: "Payment Service Unavailable",
        description: "PayMaya is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // Reset previous states
    setErrorMessage(null);
    setPaymentId(null);
    setQrCode(null);

    try {
      setIsProcessing(true);
      setPaymentStatus('processing');
      onPaymentStart?.();

      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Create payment via API
      const response = await fetch('/api/payments/paymaya/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          planName,
          price,
          currency: 'PHP',
          userId: user.uid,
          userEmail: user.email,
          description: `Subscription to ${planName} plan`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment');
      }

      if (result.success) {
        setPaymentId(result.paymentId);
        
        if (showQRCode && result.qrCode) {
          // Show QR code for scanning
          setQrCode(result.qrCode);
          setPaymentStatus('processing');
          toast({
            title: "QR Code Generated",
            description: "Please scan the QR code with your PayMaya app to complete payment.",
          });
        } else if (result.checkoutUrl) {
          // Redirect to PayMaya checkout
          toast({
            title: "Redirecting to PayMaya",
            description: "You will be redirected to complete your payment.",
          });
          window.location.href = result.checkoutUrl;
        } else {
          throw new Error('No payment method available');
        }
      } else {
        throw new Error(result.error || 'Payment creation failed');
      }
    } catch (error) {
      console.error('PayMaya payment error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Payment failed';
      
      setErrorMessage(errorMsg);
      setPaymentStatus('error');
      onPaymentError?.(errorMsg);
      
      toast({
        title: "Payment Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user, planId, planName, price, getIdToken, onPaymentStart, onPaymentError, toast, isPayMayaConfigured, showQRCode]);

  if (!isPayMayaConfigured) {
    return (
      <Button
        disabled
        className={`w-full ${className}`}
        variant="outline"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        PayMaya Not Configured
      </Button>
    );
  }

  if (qrCode && showQRCode) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Scan QR Code to Pay</h3>
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
            <img 
              src={qrCode} 
              alt="PayMaya QR Code" 
              className="w-48 h-48 mx-auto"
              onError={(e) => {
                console.error('QR code failed to load');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-sm text-muted-foreground">
              Open your PayMaya app and scan this QR code to complete payment
            </p>
            {paymentId && (
              <p className="text-xs text-muted-foreground">
                Payment ID: {paymentId}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Waiting for payment...</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setQrCode(null);
              setPaymentStatus('idle');
            }}
            variant="outline"
            className="flex-1"
          >
            Cancel Payment
          </Button>
          <Button
            onClick={() => {
              // Refresh QR code or retry payment
              handlePayMayaPayment();
            }}
            variant="outline"
            className="flex-1"
          >
            Refresh QR
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handlePayMayaPayment}
      disabled={disabled || isProcessing || !user}
      className={`w-full ${className}`}
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {showQRCode ? (
            <>
              <QrCode className="mr-2 h-4 w-4" />
              Pay with QR Code
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay with PayMaya
            </>
          )}
        </>
      )}
    </Button>
  );
}
