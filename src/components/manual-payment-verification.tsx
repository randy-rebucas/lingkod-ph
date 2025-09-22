"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  QrCode,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaymentConfig } from "@/lib/payment-config";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import { getPlanIdFromName } from "@/lib/subscription-utils";

interface ManualPaymentVerificationProps {
  plan: {
    id: string;
    name: string;
    price: number;
    type: 'provider' | 'agency';
  };
  onPaymentSubmitted?: () => void;
}

type PaymentMethod = 'gcash' | 'maya' | 'bank';

export function ManualPaymentVerification({ plan, onPaymentSubmitted }: ManualPaymentVerificationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('Subscription');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  console.log(plan);
  const paymentMethods = {
    gcash: {
      name: 'GCash',
      icon: Smartphone,
      accountName: PaymentConfig.GCASH.accountName,
      accountNumber: PaymentConfig.GCASH.accountNumber,
      color: 'bg-green-500',
      instructions: [
        'Open your GCash app',
        'Tap "Send Money"',
        'Enter the account number above',
        'Enter the exact amount: ₱' + plan.price.toLocaleString(),
        'Add reference: ' + plan.name + ' Subscription',
        'Complete the transaction',
        'Take a screenshot of the receipt'
      ]
    },
    maya: {
      name: 'PayMaya',
      icon: CreditCard,
      accountName: PaymentConfig.MAYA.accountName,
      accountNumber: PaymentConfig.MAYA.accountNumber,
      color: 'bg-blue-500',
      instructions: [
        'Open your PayMaya app',
        'Tap "Send Money"',
        'Enter the account number above',
        'Enter the exact amount: ₱' + plan.price.toLocaleString(),
        'Add reference: ' + plan.name + ' Subscription',
        'Complete the transaction',
        'Take a screenshot of the receipt'
      ]
    },
    bank: {
      name: 'Bank Transfer (BPI)',
      icon: Building2,
      accountName: PaymentConfig.BANK.accountName,
      accountNumber: PaymentConfig.BANK.accountNumber,
      bankName: PaymentConfig.BANK.bankName,
      color: 'bg-red-500',
      instructions: [
        'Go to your BPI online banking or mobile app',
        'Select "Transfer" or "Send Money"',
        'Enter the account details above',
        'Enter the exact amount: ₱' + plan.price.toLocaleString(),
        'Add reference: ' + plan.name + ' Subscription',
        'Complete the transaction',
        'Take a screenshot of the receipt'
      ]
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, or WebP image file."
        });
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload an image smaller than 5MB."
        });
        return;
      }

      setPaymentProof(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Account number copied to clipboard."
    });
  };

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SUB-${timestamp}-${random}`;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please log in to submit payment."
      });
      return;
    }

    if (!paymentProof) {
      toast({
        variant: "destructive",
        title: "Missing payment proof",
        description: "Please upload a screenshot of your payment receipt."
      });
      return;
    }

    if (!referenceNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Missing reference number",
        description: "Please enter your payment reference number."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload payment proof to Firebase Storage
      const storageRef = ref(storage, `subscription-payments/${user.uid}/${Date.now()}-${paymentProof.name}`);
      const uploadResult = await uploadBytes(storageRef, paymentProof);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Convert plan name to correct plan ID
      const correctPlanId = getPlanIdFromName(plan.name, plan.type);

      // Create subscription payment record
      const paymentData = {
        userId: user.uid,
        planId: correctPlanId,
        planName: plan.name,
        planType: plan.type,
        amount: plan.price,
        paymentMethod: selectedMethod,
        referenceNumber: referenceNumber.trim(),
        paymentProofUrl: downloadURL,
        notes: notes.trim(),
        status: 'pending_verification',
        createdAt: serverTimestamp(),
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null
      };

      await addDoc(collection(db, 'subscriptionPayments'), paymentData);

      // Update user subscription status
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        subscription: {
          planId: correctPlanId,
          status: 'pending_verification',
          planName: plan.name,
          amount: plan.price,
          paymentMethod: selectedMethod,
          referenceNumber: referenceNumber.trim(),
          submittedAt: serverTimestamp(),
          type: plan.type
        },
        subscriptionStatus: 'pending_verification',
        subscriptionPlanId: correctPlanId,
        subscriptionPlanName: plan.name,
        subscriptionAmount: plan.price,
        subscriptionPaymentMethod: selectedMethod,
        subscriptionReferenceNumber: referenceNumber.trim(),
        subscriptionSubmittedAt: serverTimestamp()
      });

      // Send notifications via API
      const notificationData = {
        type: 'payment_submitted',
        userEmail: user.email || '',
        userName: user.displayName || 'User',
        planName: plan.name,
        planType: plan.type,
        amount: plan.price,
        paymentMethod: getPaymentMethodName(selectedMethod),
        referenceNumber: referenceNumber.trim()
      };

      // Send user notification
      await fetch('/api/subscription-payments/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          type: 'payment_submitted',
          paymentData: notificationData
        })
      });

      // Send admin notification
      await fetch('/api/subscription-payments/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          type: 'admin_notification',
          paymentData: paymentData
        })
      });

      toast({
        title: "Payment submitted successfully!",
        description: "Your payment proof has been submitted for verification. You'll be notified once it's reviewed."
      });

      onPaymentSubmitted?.();
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "There was an error submitting your payment. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMethod = paymentMethods[selectedMethod];

  const getPaymentMethodName = (method: PaymentMethod) => {
    return paymentMethods[method].name;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Manual Payment Verification</h3>
        <p className="text-muted-foreground">
          Complete your payment and upload proof for verification
        </p>
      </div>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Payment Method</CardTitle>
          <CardDescription>Select your preferred payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gcash" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                GCash
              </TabsTrigger>
              <TabsTrigger value="maya" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                PayMaya
              </TabsTrigger>
              <TabsTrigger value="bank" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Bank
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedMethod} className="mt-6">
              <div className="space-y-4">
                {/* Account Details */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Account Details</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAccountDetails(!showAccountDetails)}
                    >
                      {showAccountDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">Account Name</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={currentMethod.accountName}
                          readOnly
                          className="bg-background"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(currentMethod.accountName)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Account Number</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={showAccountDetails ? currentMethod.accountNumber : '••••••••••'}
                          readOnly
                          className="bg-background"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(currentMethod.accountNumber)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {selectedMethod === 'bank' && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Bank Name</Label>
                        <Input
                          value={(currentMethod as typeof paymentMethods.bank).bankName}
                          readOnly
                          className="bg-background"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Payment Instructions</h4>
                  <ol className="space-y-2 text-sm">
                    {currentMethod.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          {index + 1}
                        </Badge>
                        <span className="text-muted-foreground">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Amount Display */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Please send exactly <strong>₱{plan.price.toLocaleString()}</strong> for the {plan.name} subscription.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Provide your payment information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reference Number */}
          <div>
            <Label htmlFor="reference">Payment Reference Number *</Label>
            <div className="flex gap-2">
              <Input
                id="reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter your payment reference number"
                required
              />
              <Button
                variant="outline"
                onClick={() => setReferenceNumber(generateReferenceNumber())}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This is the reference number from your payment receipt
            </p>
          </div>

          {/* Payment Proof Upload */}
          <div>
            <Label>Payment Proof (Screenshot/Receipt) *</Label>
            <div className="mt-2">
              {paymentProof ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">{paymentProof.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPaymentProof(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload payment proof
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG, or WebP (max 5MB)
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about your payment..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !paymentProof || !referenceNumber.trim()}
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit Payment Proof
            </>
          )}
        </Button>
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Verification Process:</strong> Your payment will be reviewed within 24 hours. 
          You'll receive an email notification once your subscription is activated.
        </AlertDescription>
      </Alert>
    </div>
  );
}
