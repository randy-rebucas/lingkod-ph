"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  User, 
  CreditCard, 
  Smartphone, 
  Building2,
  AlertCircle,
  Calendar,
  DollarSign
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  addDoc
} from "firebase/firestore";

interface SubscriptionPayment {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  planType: 'provider' | 'agency';
  amount: number;
  paymentMethod: 'gcash' | 'maya' | 'bank';
  referenceNumber: string;
  paymentProofUrl: string;
  notes?: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  createdAt: any;
  verifiedAt?: any;
  verifiedBy?: string;
  rejectionReason?: string;
  userEmail?: string;
  userName?: string;
}

export default function AdminSubscriptionPaymentsPage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<SubscriptionPayment | null>(null);
  const [showAllPayments, setShowAllPayments] = useState(false);

  useEffect(() => {
    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }

    console.log('Fetching subscription payments for admin...');

    const paymentsQuery = showAllPayments 
      ? query(
          collection(db, "subscriptionPayments"),
          orderBy("createdAt", "desc")
        )
      : query(
          collection(db, "subscriptionPayments"),
          where("status", "==", "pending_verification"),
          orderBy("createdAt", "desc")
        );

    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      console.log('Subscription payments snapshot:', snapshot.size, 'documents');
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        console.log('Payment document:', doc.id, docData);
        return { 
          id: doc.id, 
          ...docData 
        } as SubscriptionPayment;
      });
      setPayments(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching subscription payments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole, showAllPayments]);

  const handleVerifyPayment = async (payment: SubscriptionPayment) => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Authentication error." });
      return;
    }

    setVerifyingId(payment.id);
    try {
      // Update payment status
      const paymentRef = doc(db, 'subscriptionPayments', payment.id);
      await updateDoc(paymentRef, {
        status: 'verified',
        verifiedAt: serverTimestamp(),
        verifiedBy: user.uid
      });

      // Update user subscription and role
      const userRef = doc(db, 'users', payment.userId);
      await updateDoc(userRef, {
        subscriptionStatus: 'active',
        subscriptionPlanId: payment.planId,
        subscriptionPlanName: payment.planName,
        subscriptionAmount: payment.amount,
        subscriptionPaymentMethod: payment.paymentMethod,
        subscriptionReferenceNumber: payment.referenceNumber,
        subscriptionVerifiedAt: serverTimestamp(),
        subscriptionVerifiedBy: user.uid,
        role: payment.planType, // Upgrade user role (provider/agency)
        // Set subscription renewal date (1 month from now)
        subscriptionRenewsOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Create transaction record
      await setDoc(doc(db, 'transactions', payment.id), {
        type: 'subscription_payment',
        status: 'completed',
        verifiedAt: serverTimestamp(),
        verifiedBy: user.uid,
        paymentId: payment.id,
        userId: payment.userId,
        amount: payment.amount,
        planName: payment.planName,
        planType: payment.planType,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
        createdAt: serverTimestamp()
      });

      // Send notification to user via API
      await fetch('/api/subscription-payments/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          type: 'payment_verified',
          paymentData: {
            type: 'payment_verified',
            userEmail: payment.userEmail || '',
            userName: payment.userName || 'User',
            planName: payment.planName,
            planType: payment.planType,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            referenceNumber: payment.referenceNumber
          }
        })
      });

      toast({ 
        title: "Payment Verified!", 
        description: `The subscription payment for ${payment.userName || payment.userEmail} has been verified. Their account has been upgraded to ${payment.planType} role.` 
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast({ 
        variant: "destructive", 
        title: "Verification Failed", 
        description: "There was an error verifying the payment." 
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRejectPayment = async (payment: SubscriptionPayment) => {
    if (!user || !rejectionReason.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please provide a rejection reason." });
      return;
    }

    setRejectingId(payment.id);
    try {
      // Update payment status
      const paymentRef = doc(db, 'subscriptionPayments', payment.id);
      await updateDoc(paymentRef, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        verifiedAt: serverTimestamp(),
        verifiedBy: user.uid
      });

      // Update user subscription status
      const userRef = doc(db, 'users', payment.userId);
      await updateDoc(userRef, {
        subscriptionStatus: 'rejected',
        subscriptionRejectionReason: rejectionReason.trim(),
        subscriptionRejectedAt: serverTimestamp(),
        subscriptionRejectedBy: user.uid
      });

      // Send notification to user via API
      await fetch('/api/subscription-payments/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          type: 'payment_rejected',
          paymentData: {
            type: 'payment_rejected',
            userEmail: payment.userEmail || '',
            userName: payment.userName || 'User',
            planName: payment.planName,
            planType: payment.planType,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            referenceNumber: payment.referenceNumber,
            rejectionReason: rejectionReason.trim()
          }
        })
      });

      toast({ 
        title: "Payment Rejected", 
        description: `The subscription payment for ${payment.userName || payment.userEmail} has been rejected.` 
      });
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast({ 
        variant: "destructive", 
        title: "Rejection Failed", 
        description: "There was an error rejecting the payment." 
      });
    } finally {
      setRejectingId(null);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'gcash':
        return <Smartphone className="h-4 w-4" />;
      case 'maya':
        return <CreditCard className="h-4 w-4" />;
      case 'bank':
        return <Building2 className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'gcash':
        return 'GCash';
      case 'maya':
        return 'PayMaya';
      case 'bank':
        return 'Bank Transfer';
      default:
        return method;
    }
  };

  if (userRole !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>This page is for administrators only.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Subscription Payment Verification</h1>
          <p className="text-muted-foreground">Review and verify subscription payments.</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline">Subscription Payment Verification</h1>
          <p className="text-muted-foreground">Review and verify subscription payments from users.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={showAllPayments ? "outline" : "default"}
            onClick={() => setShowAllPayments(!showAllPayments)}
            size="sm"
          >
            {showAllPayments ? "Show Pending Only" : "Show All Payments"}
          </Button>
          <Badge variant="outline" className="text-sm">
            {payments.length} {showAllPayments ? "total" : "pending"} payments
          </Badge>
        </div>
      </div>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>User Role:</strong> {userRole}</p>
              <p><strong>Show All Payments:</strong> {showAllPayments ? 'Yes' : 'No'}</p>
              <p><strong>Payments Found:</strong> {payments.length}</p>
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              {payments.length > 0 && (
                <div>
                  <p><strong>Payment Statuses:</strong></p>
                  <ul className="ml-4">
                    {payments.map(payment => (
                      <li key={payment.id}>
                        {payment.id}: {payment.status} - {payment.planName} - ₱{payment.amount}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const testPayment = {
                        userId: user?.uid || 'test-user',
                        planId: 'test-plan',
                        planName: 'Test Provider Plan',
                        planType: 'provider',
                        amount: 500,
                        paymentMethod: 'gcash',
                        referenceNumber: 'TEST-' + Date.now(),
                        paymentProofUrl: 'https://via.placeholder.com/400x300?text=Test+Payment+Proof',
                        notes: 'Test payment for debugging',
                        status: 'pending_verification',
                        createdAt: new Date(),
                        userEmail: user?.email || 'test@example.com',
                        userName: user?.displayName || 'Test User'
                      };
                      
                      await addDoc(collection(db, 'subscriptionPayments'), testPayment);
                      toast({ title: "Test payment created!", description: "A test subscription payment has been added." });
                    } catch (error) {
                      console.error('Error creating test payment:', error);
                      toast({ variant: "destructive", title: "Error", description: "Failed to create test payment." });
                    }
                  }}
                >
                  Create Test Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {payments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Payments</h3>
            <p className="text-muted-foreground">All subscription payments have been processed.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Verification ({payments.length})
            </CardTitle>
            <CardDescription>
              Review payment proofs and verify subscription payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{payment.userName || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground">{payment.userEmail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.planName}</div>
                        <Badge variant="outline" className="text-xs">
                          {payment.planType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ₱{payment.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                        {getPaymentMethodName(payment.paymentMethod)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {payment.referenceNumber}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          payment.status === 'verified' ? 'default' :
                          payment.status === 'rejected' ? 'destructive' :
                          'outline'
                        }
                        className="capitalize"
                      >
                        {payment.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {payment.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Payment Verification</DialogTitle>
                              <DialogDescription>
                                Review payment details and proof for {payment.userName || payment.userEmail}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Plan</Label>
                                  <p className="text-sm text-muted-foreground">{payment.planName}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Amount</Label>
                                  <p className="text-sm text-muted-foreground">₱{payment.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Payment Method</Label>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    {getPaymentMethodIcon(payment.paymentMethod)}
                                    {getPaymentMethodName(payment.paymentMethod)}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Reference Number</Label>
                                  <p className="text-sm text-muted-foreground font-mono">{payment.referenceNumber}</p>
                                </div>
                              </div>
                              
                              {payment.notes && (
                                <div>
                                  <Label className="text-sm font-medium">Notes</Label>
                                  <p className="text-sm text-muted-foreground">{payment.notes}</p>
                                </div>
                              )}

                              <div>
                                <Label className="text-sm font-medium">Payment Proof</Label>
                                <div className="mt-2">
                                  <img
                                    src={payment.paymentProofUrl}
                                    alt="Payment proof"
                                    className="max-w-full h-auto rounded-lg border"
                                  />
                                </div>
                              </div>

                              {payment.status === 'pending_verification' && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      setRejectionReason("");
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        disabled={verifyingId === payment.id}
                                      >
                                        {verifyingId === payment.id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            Verifying...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Verify Payment
                                          </>
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Verify Subscription Payment</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to verify this payment? This will:
                                        </AlertDialogDescription>
                                        <ul className="mt-2 ml-4 space-y-1 text-sm">
                                          <li>• Activate the {payment.planName} subscription</li>
                                          <li>• Upgrade the user's role to {payment.planType}</li>
                                          <li>• Grant access to all premium features</li>
                                          <li>• Send confirmation notification to the user</li>
                                        </ul>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleVerifyPayment(payment)}>
                                          Verify Payment
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                              
                              {payment.status === 'verified' && (
                                <div className="flex justify-end">
                                  <Badge variant="default" className="text-sm">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Payment Verified
                                  </Badge>
                                </div>
                              )}
                              
                              {payment.status === 'rejected' && (
                                <div className="flex justify-end">
                                  <Badge variant="destructive" className="text-sm">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Payment Rejected
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Rejection Dialog */}
      <Dialog open={!!selectedPayment && rejectingId === selectedPayment?.id}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action will notify the user and allow them to resubmit their payment.
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejecting this payment..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPayment(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedPayment && handleRejectPayment(selectedPayment)}
                disabled={!rejectionReason.trim() || rejectingId === selectedPayment?.id}
              >
                {rejectingId === selectedPayment?.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
