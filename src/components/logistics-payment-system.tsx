"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  RefreshCw,
  DollarSign,
  User,
  Truck,
  Package,
  Home,
  MapPin,
  Clock,
  Star,
  Shield,
  FileText,
  Camera,
  QrCode
} from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy, addDoc } from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

interface PaymentTransaction {
  id: string;
  bookingId: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  providerEarnings: number;
  partnerCommission: number;
  localProCommission: number;
  paymentMethod: 'cash' | 'gcash' | 'paymaya' | 'bank_transfer' | 'card';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentProof?: string;
  paymentDetails?: {
    reference?: string;
    transactionId?: string;
    accountNumber?: string;
    accountName?: string;
  };
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

interface LogisticsBooking {
  id: string;
  partnerId: string;
  partnerName: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
  serviceType: string;
  logisticsSubType: 'transport' | 'delivery' | 'moving';
  status: string;
  trackingStatus: string;
  price: number;
  commission: {
    partnerCommission: number;
    localProCommission: number;
    providerEarnings: number;
  };
  pickupAddress: string;
  deliveryAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  specialRequests: any;
  additionalStops?: any[];
  notes?: string;
  estimatedDuration: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  statusHistory: any[];
  createdAt: any;
  updatedAt: any;
}

export function LogisticsPaymentSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completedBookings, setCompletedBookings] = useState<LogisticsBooking[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<LogisticsBooking | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'paymaya' | 'bank_transfer' | 'card'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch completed logistics bookings
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(getDb(), 'logisticsBookings'),
      where('trackingStatus', '==', 'delivered'),
      where('status', '==', 'completed'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogisticsBooking[];
      
      setCompletedBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch payment transactions
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(getDb(), 'paymentTransactions'),
      where('providerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PaymentTransaction[];
      
      setPaymentTransactions(transactionsData);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'transport': return User;
      case 'delivery': return Package;
      case 'moving': return Home;
      default: return Truck;
    }
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'transport': return 'Transport (People)';
      case 'delivery': return 'Delivery (Goods)';
      case 'moving': return 'Moving (Furniture/Household)';
      default: return serviceType;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return Banknote;
      case 'gcash': return Smartphone;
      case 'paymaya': return Smartphone;
      case 'bank_transfer': return CreditCard;
      case 'card': return CreditCard;
      default: return DollarSign;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'gcash': return 'GCash';
      case 'paymaya': return 'PayMaya';
      case 'bank_transfer': return 'Bank Transfer';
      case 'card': return 'Credit/Debit Card';
      default: return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const processPayment = async () => {
    if (!selectedBooking) return;

    setIsProcessing(true);
    try {
      // Create payment transaction
      const paymentData = {
        bookingId: selectedBooking.id,
        clientId: selectedBooking.clientId,
        clientName: selectedBooking.clientName,
        providerId: selectedBooking.providerId,
        providerName: selectedBooking.providerName,
        partnerId: selectedBooking.partnerId,
        partnerName: selectedBooking.partnerName,
        amount: selectedBooking.price,
        providerEarnings: selectedBooking.commission.providerEarnings,
        partnerCommission: selectedBooking.commission.partnerCommission,
        localProCommission: selectedBooking.commission.localProCommission,
        paymentMethod: paymentMethod,
        status: 'completed',
        paymentDetails: {
          reference: paymentReference,
          transactionId: `TXN-${Date.now()}`,
        },
        notes: paymentNotes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const paymentRef = await addDoc(collection(getDb(), 'paymentTransactions'), paymentData);

      // Update booking with payment information
      const bookingRef = doc(getDb(), 'logisticsBookings', selectedBooking.id);
      await updateDoc(bookingRef, {
        paymentStatus: 'completed',
        paymentTransactionId: paymentRef.id,
        paymentMethod: paymentMethod,
        paymentReference: paymentReference,
        updatedAt: serverTimestamp(),
      });

      // Create commission records
      await addDoc(collection(getDb(), 'commissions'), {
        type: 'partner_commission',
        recipientId: selectedBooking.partnerId,
        recipientName: selectedBooking.partnerName,
        bookingId: selectedBooking.id,
        paymentTransactionId: paymentRef.id,
        amount: selectedBooking.commission.partnerCommission,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(getDb(), 'commissions'), {
        type: 'localpro_commission',
        recipientId: 'localpro',
        recipientName: 'LocalPro',
        bookingId: selectedBooking.id,
        paymentTransactionId: paymentRef.id,
        amount: selectedBooking.commission.localProCommission,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Create provider earnings record
      await addDoc(collection(getDb(), 'providerEarnings'), {
        providerId: selectedBooking.providerId,
        providerName: selectedBooking.providerName,
        bookingId: selectedBooking.id,
        paymentTransactionId: paymentRef.id,
        amount: selectedBooking.commission.providerEarnings,
        status: 'completed',
        createdAt: serverTimestamp(),
      });

      // Create notifications
      await addDoc(collection(getDb(), 'notifications'), {
        type: 'payment_completed',
        recipientId: selectedBooking.clientId,
        recipientType: 'client',
        title: 'Payment Completed',
        message: `Payment of ₱${selectedBooking.price.toFixed(2)} has been completed for your ${selectedBooking.logisticsSubType} service`,
        data: {
          bookingId: selectedBooking.id,
          amount: selectedBooking.price,
          paymentMethod: paymentMethod,
        },
        read: false,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(getDb(), 'notifications'), {
        type: 'payment_completed',
        recipientId: selectedBooking.partnerId,
        recipientType: 'partner',
        title: 'Payment Received',
        message: `Payment of ₱${selectedBooking.price.toFixed(2)} has been received for booking ${selectedBooking.id}`,
        data: {
          bookingId: selectedBooking.id,
          amount: selectedBooking.price,
          commission: selectedBooking.commission.partnerCommission,
        },
        read: false,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Payment Processed",
        description: `Payment of ₱${selectedBooking.price.toFixed(2)} has been successfully processed.`,
      });

      setShowPaymentDialog(false);
      setSelectedBooking(null);
      setPaymentMethod('cash');
      setPaymentReference('');
      setPaymentNotes('');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process payment',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openPaymentDialog = (booking: LogisticsBooking) => {
    setSelectedBooking(booking);
    setShowPaymentDialog(true);
  };

  const openPaymentDetails = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setShowPaymentDetails(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading payment information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Processing</h2>
          <p className="text-muted-foreground">Process payments for completed logistics services</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {completedBookings.length} completed
          </Badge>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {paymentTransactions.length} payments
          </Badge>
        </div>
      </div>

      {/* Completed Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Completed Services - Awaiting Payment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedBookings.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No completed services</h3>
              <p className="text-muted-foreground">Completed services will appear here for payment processing.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedBookings.map((booking) => {
                const ServiceIcon = getServiceTypeIcon(booking.logisticsSubType);
                const bookingDate = booking.updatedAt?.toDate ? booking.updatedAt.toDate() : new Date();
                
                return (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ServiceIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{getServiceTypeLabel(booking.logisticsSubType)}</h3>
                        <p className="text-sm text-muted-foreground">
                          From {booking.clientName} • {format(bookingDate, 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.pickupAddress} → {booking.deliveryAddress}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">₱{booking.price.toFixed(2)}</p>
                        <p className="text-sm text-green-600">Your earnings: ₱{booking.commission.providerEarnings.toFixed(2)}</p>
                      </div>
                      <Button onClick={() => openPaymentDialog(booking)}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Process Payment
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No payment history</h3>
              <p className="text-muted-foreground">Processed payments will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentTransactions.map((transaction) => {
                const PaymentIcon = getPaymentMethodIcon(transaction.paymentMethod);
                const transactionDate = transaction.createdAt?.toDate ? transaction.createdAt.toDate() : new Date();
                
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <PaymentIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{getPaymentMethodLabel(transaction.paymentMethod)}</h3>
                        <p className="text-sm text-muted-foreground">
                          From {transaction.clientName} • {format(transactionDate, 'MMM dd, yyyy h:mm a')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Booking ID: {transaction.bookingId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">₱{transaction.amount.toFixed(2)}</p>
                        <p className="text-sm text-green-600">Earned: ₱{transaction.providerEarnings.toFixed(2)}</p>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                      <Button variant="outline" onClick={() => openPaymentDetails(transaction)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Record payment for completed logistics service
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{getServiceTypeLabel(selectedBooking.logisticsSubType)}</h3>
                  <Badge variant="outline">{selectedBooking.priority}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  From {selectedBooking.clientName}
                </p>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-bold text-primary">₱{selectedBooking.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Earnings:</span>
                  <span className="font-bold text-green-600">₱{selectedBooking.commission.providerEarnings.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="paymaya">PayMaya</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {paymentMethod !== 'cash' && (
                <div className="space-y-2">
                  <Label>Payment Reference/Transaction ID</Label>
                  <Input
                    placeholder="Enter payment reference or transaction ID"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any additional notes about the payment..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={processPayment} disabled={isProcessing}>
              {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete information for payment transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{getPaymentMethodLabel(selectedTransaction.paymentMethod)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedTransaction.status)}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                  <p className="font-medium text-primary">₱{selectedTransaction.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Your Earnings</Label>
                  <p className="font-medium text-green-600">₱{selectedTransaction.providerEarnings.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Commission Breakdown</Label>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Partner Commission:</span>
                    <span>₱{selectedTransaction.partnerCommission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>LocalPro Commission:</span>
                    <span>₱{selectedTransaction.localProCommission.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {selectedTransaction.paymentDetails?.reference && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Reference</Label>
                  <p className="font-medium">{selectedTransaction.paymentDetails.reference}</p>
                </div>
              )}
              
              {selectedTransaction.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
