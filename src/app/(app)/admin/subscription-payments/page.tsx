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
  addDoc,
  getDoc
} from "firebase/firestore";
import { SubscriptionPaymentProcessor, TransactionRecord } from "@/lib/subscription-payment-processor";

interface SubscriptionTransaction extends TransactionRecord {
  userEmail?: string;
  userName?: string;
  paymentProofUrl?: string;
  notes?: string;
}

export default function AdminSubscriptionPaymentsPage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<SubscriptionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] = useState<SubscriptionTransaction | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  useEffect(() => {
    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }


    const transactionsQuery = showAllTransactions 
      ? query(
          collection(db, "transactions"),
          where("type", "==", "subscription_payment"),
          orderBy("createdAt", "desc")
        )
      : query(
          collection(db, "transactions"),
          where("type", "==", "subscription_payment"),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc")
        );

    const unsubscribe = onSnapshot(transactionsQuery, async (snapshot) => {
      const data = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
        const docData = docSnapshot.data();
        
        // Get user information if userId exists
        let userEmail = '';
        let userName = '';
        if (docData.userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', docData.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data() as any;
              userEmail = userData.email || '';
              userName = userData.displayName || userData.name || '';
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }

        return { 
          id: docSnapshot.id, 
          ...docData,
          userEmail,
          userName
        } as SubscriptionTransaction;
      }));
      setTransactions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching subscription transactions:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole, showAllTransactions]);

  const handleVerifyPayment = async (transaction: SubscriptionTransaction) => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Authentication error." });
      return;
    }

    setVerifyingId(transaction.id);
    try {
      // Use the enhanced SubscriptionPaymentProcessor for comprehensive updates
      const result = await SubscriptionPaymentProcessor.verifySubscriptionPayment(
        transaction.id, 
        user.uid
      );

      if (result.success) {
        toast({ 
          title: "Payment Verified!", 
          description: result.message
        });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Verification Failed", 
          description: result.message
        });
      }
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

  const handleRejectPayment = async (transaction: SubscriptionTransaction) => {
    if (!user || !rejectionReason.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please provide a rejection reason." });
      return;
    }

    setRejectingId(transaction.id);
    try {
      // Use the enhanced SubscriptionPaymentProcessor for comprehensive rejection handling
      const result = await SubscriptionPaymentProcessor.rejectSubscriptionPayment(
        transaction.id,
        user.uid,
        rejectionReason.trim()
      );

      if (result.success) {
        toast({ 
          title: "Payment Rejected", 
          description: result.message
        });
        setRejectionReason("");
      } else {
        toast({ 
          variant: "destructive", 
          title: "Rejection Failed", 
          description: result.message
        });
      }
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
            variant={showAllTransactions ? "outline" : "default"}
            onClick={() => setShowAllTransactions(!showAllTransactions)}
            size="sm"
          >
            {showAllTransactions ? "Show Pending Only" : "Show All Transactions"}
          </Button>
          <Badge variant="outline" className="text-sm">
            {transactions.length} {showAllTransactions ? "total" : "pending"} transactions
          </Badge>
        </div>
      </div>


      {transactions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Transactions</h3>
            <p className="text-muted-foreground">All subscription transactions have been processed.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Verification ({transactions.length})
            </CardTitle>
            <CardDescription>
              Review and verify subscription transactions
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
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{transaction.userName || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground">{transaction.userEmail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.planName || 'N/A'}</div>
                        {transaction.planType && (
                          <Badge variant="outline" className="text-xs">
                            {transaction.planType}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ₱{transaction.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(transaction.paymentMethod)}
                        {getPaymentMethodName(transaction.paymentMethod)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {transaction.referenceNumber || 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'failed' ? 'destructive' :
                          'outline'
                        }
                        className="capitalize"
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Transaction Verification</DialogTitle>
                              <DialogDescription>
                                Review transaction details for {transaction.userName || transaction.userEmail}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Plan</Label>
                                  <p className="text-sm text-muted-foreground">{transaction.planName || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Amount</Label>
                                  <p className="text-sm text-muted-foreground">₱{transaction.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Payment Method</Label>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    {getPaymentMethodIcon(transaction.paymentMethod)}
                                    {getPaymentMethodName(transaction.paymentMethod)}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Reference Number</Label>
                                  <p className="text-sm text-muted-foreground font-mono">{transaction.referenceNumber || 'N/A'}</p>
                                </div>
                              </div>
                              
                              {transaction.notes && (
                                <div>
                                  <Label className="text-sm font-medium">Notes</Label>
                                  <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                                </div>
                              )}

                              {transaction.paymentProofUrl && (
                                <div>
                                  <Label className="text-sm font-medium">Payment Proof</Label>
                                  <div className="mt-2">
                                    <img
                                      src={transaction.paymentProofUrl}
                                      alt="Payment proof"
                                      className="max-w-full h-auto rounded-lg border"
                                    />
                                  </div>
                                </div>
                              )}

                              {transaction.status === 'pending' && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedTransaction(transaction);
                                      setRejectionReason("");
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        disabled={verifyingId === transaction.id}
                                      >
                                        {verifyingId === transaction.id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            Verifying...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Verify Transaction
                                          </>
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Verify Subscription Transaction</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to verify this transaction? This will:
                                        </AlertDialogDescription>
                                        <ul className="mt-2 ml-4 space-y-1 text-sm">
                                          <li>• Activate the {transaction.planName || 'subscription'} subscription</li>
                                          {transaction.planType && <li>• Upgrade the user's role to {transaction.planType}</li>}
                                          <li>• Grant access to all premium features</li>
                                          <li>• Send confirmation notification to the user</li>
                                        </ul>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleVerifyPayment(transaction)}>
                                          Verify Transaction
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                              
                              {transaction.status === 'completed' && (
                                <div className="flex justify-end">
                                  <Badge variant="default" className="text-sm">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Transaction Verified
                                  </Badge>
                                </div>
                              )}
                              
                              {transaction.status === 'failed' && (
                                <div className="flex justify-end">
                                  <Badge variant="destructive" className="text-sm">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Transaction Rejected
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
      <Dialog open={!!selectedTransaction && rejectingId === selectedTransaction?.id}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transaction</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this transaction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action will notify the user and mark the transaction as failed.
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejecting this transaction..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTransaction(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedTransaction && handleRejectPayment(selectedTransaction)}
                disabled={!rejectionReason.trim() || rejectingId === selectedTransaction?.id}
              >
                {rejectingId === selectedTransaction?.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Transaction
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
