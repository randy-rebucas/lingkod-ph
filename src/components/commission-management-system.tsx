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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Building, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  RefreshCw,
  Calendar,
  FileText,
  Banknote,
  CreditCard,
  Star,
  Award,
  BarChart3,
  PieChart
} from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy, addDoc } from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

interface Commission {
  id: string;
  type: 'partner_commission' | 'localpro_commission';
  recipientId: string;
  recipientName: string;
  bookingId: string;
  paymentTransactionId: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  paymentMethod?: 'bank_transfer' | 'gcash' | 'paymaya' | 'check';
  paymentDetails?: {
    accountNumber?: string;
    accountName?: string;
    reference?: string;
  };
  notes?: string;
  approvedBy?: string;
  approvedAt?: any;
  paidAt?: any;
  createdAt: any;
  updatedAt: any;
}

interface ProviderEarning {
  id: string;
  providerId: string;
  providerName: string;
  bookingId: string;
  paymentTransactionId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: any;
  updatedAt: any;
}

interface CommissionSummary {
  totalCommissions: number;
  pendingCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
}

export function CommissionManagementSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [providerEarnings, setProviderEarnings] = useState<ProviderEarning[]>([]);
  const [summary, setSummary] = useState<CommissionSummary>({
    totalCommissions: 0,
    pendingCommissions: 0,
    approvedCommissions: 0,
    paidCommissions: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
  });
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [showCommissionDetails, setShowCommissionDetails] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch commissions
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(getDb(), 'commissions'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commission[];
      
      setCommissions(commissionsData);
      calculateSummary(commissionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch provider earnings
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(getDb(), 'providerEarnings'),
      where('providerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const earningsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProviderEarning[];
      
      setProviderEarnings(earningsData);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const calculateSummary = (commissionsData: Commission[]) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalCommissions = commissionsData.reduce((sum, c) => sum + c.amount, 0);
    const pendingCommissions = commissionsData
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);
    const approvedCommissions = commissionsData
      .filter(c => c.status === 'approved')
      .reduce((sum, c) => sum + c.amount, 0);
    const paidCommissions = commissionsData
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);

    const thisMonthCommissions = commissionsData
      .filter(c => {
        const createdAt = c.createdAt?.toDate ? c.createdAt.toDate() : new Date();
        return createdAt >= thisMonth;
      })
      .reduce((sum, c) => sum + c.amount, 0);

    const lastMonthCommissions = commissionsData
      .filter(c => {
        const createdAt = c.createdAt?.toDate ? c.createdAt.toDate() : new Date();
        return createdAt >= lastMonth && createdAt <= lastMonthEnd;
      })
      .reduce((sum, c) => sum + c.amount, 0);

    setSummary({
      totalCommissions,
      pendingCommissions,
      approvedCommissions,
      paidCommissions,
      totalEarnings: totalCommissions,
      thisMonthEarnings: thisMonthCommissions,
      lastMonthEarnings: lastMonthCommissions,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'partner_commission': return Building;
      case 'localpro_commission': return Award;
      default: return DollarSign;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'partner_commission': return 'Partner Commission';
      case 'localpro_commission': return 'LocalPro Commission';
      default: return type;
    }
  };

  const approveCommission = async () => {
    if (!selectedCommission) return;

    setIsProcessing(true);
    try {
      const commissionRef = doc(getDb(), 'commissions', selectedCommission.id);
      
      await updateDoc(commissionRef, {
        status: 'approved',
        approvedBy: user?.uid,
        approvedAt: serverTimestamp(),
        notes: approvalNotes,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Commission Approved",
        description: `Commission of ₱${selectedCommission.amount.toFixed(2)} has been approved.`,
      });

      setShowApprovalDialog(false);
      setSelectedCommission(null);
      setApprovalNotes('');
    } catch (error) {
      console.error('Error approving commission:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve commission',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectCommission = async () => {
    if (!selectedCommission) return;

    setIsProcessing(true);
    try {
      const commissionRef = doc(getDb(), 'commissions', selectedCommission.id);
      
      await updateDoc(commissionRef, {
        status: 'rejected',
        approvedBy: user?.uid,
        approvedAt: serverTimestamp(),
        notes: approvalNotes,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Commission Rejected",
        description: `Commission of ₱${selectedCommission.amount.toFixed(2)} has been rejected.`,
      });

      setShowApprovalDialog(false);
      setSelectedCommission(null);
      setApprovalNotes('');
    } catch (error) {
      console.error('Error rejecting commission:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject commission',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openCommissionDetails = (commission: Commission) => {
    setSelectedCommission(commission);
    setShowCommissionDetails(true);
  };

  const openApprovalDialog = (commission: Commission) => {
    setSelectedCommission(commission);
    setShowApprovalDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading commission information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commission Management</h2>
          <p className="text-muted-foreground">Track and manage your commissions and earnings</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            ₱{summary.totalEarnings.toFixed(2)} total
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commissions</p>
                <p className="text-2xl font-bold">₱{summary.totalCommissions.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">₱{summary.pendingCommissions.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">₱{summary.approvedCommissions.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Banknote className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold">₱{summary.paidCommissions.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Monthly Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">This Month</h3>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-primary">₱{summary.thisMonthEarnings.toFixed(2)}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Last Month</h3>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-muted-foreground">₱{summary.lastMonthEarnings.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="earnings">Provider Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Commission History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No commissions yet</h3>
                  <p className="text-muted-foreground">Your commission history will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commissions.map((commission) => {
                    const TypeIcon = getTypeIcon(commission.type);
                    const commissionDate = commission.createdAt?.toDate ? commission.createdAt.toDate() : new Date();
                    
                    return (
                      <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <TypeIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{getTypeLabel(commission.type)}</h3>
                            <p className="text-sm text-muted-foreground">
                              Booking ID: {commission.bookingId} • {format(commissionDate, 'MMM dd, yyyy')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Transaction ID: {commission.paymentTransactionId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">₱{commission.amount.toFixed(2)}</p>
                            <Badge className={getStatusColor(commission.status)}>
                              {commission.status}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCommissionDetails(commission)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {commission.status === 'pending' && user?.role === 'admin' && (
                              <Button
                                size="sm"
                                onClick={() => openApprovalDialog(commission)}
                              >
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Provider Earnings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {providerEarnings.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No earnings yet</h3>
                  <p className="text-muted-foreground">Your provider earnings will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {providerEarnings.map((earning) => {
                    const earningDate = earning.createdAt?.toDate ? earning.createdAt.toDate() : new Date();
                    
                    return (
                      <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Provider Earnings</h3>
                            <p className="text-sm text-muted-foreground">
                              Booking ID: {earning.bookingId} • {format(earningDate, 'MMM dd, yyyy')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Transaction ID: {earning.paymentTransactionId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">₱{earning.amount.toFixed(2)}</p>
                          <Badge className={getStatusColor(earning.status)}>
                            {earning.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Commission Details Dialog */}
      <Dialog open={showCommissionDetails} onOpenChange={setShowCommissionDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commission Details</DialogTitle>
            <DialogDescription>
              Complete information for commission #{selectedCommission?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCommission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <p className="font-medium">{getTypeLabel(selectedCommission.type)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedCommission.status)}>
                    {selectedCommission.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="font-medium text-primary">₱{selectedCommission.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Booking ID</Label>
                  <p className="font-medium">{selectedCommission.bookingId}</p>
                </div>
              </div>
              
              {selectedCommission.paymentMethod && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{selectedCommission.paymentMethod}</p>
                </div>
              )}
              
              {selectedCommission.paymentDetails && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Payment Details</Label>
                  {selectedCommission.paymentDetails.accountNumber && (
                    <p className="text-sm">Account: {selectedCommission.paymentDetails.accountNumber}</p>
                  )}
                  {selectedCommission.paymentDetails.reference && (
                    <p className="text-sm">Reference: {selectedCommission.paymentDetails.reference}</p>
                  )}
                </div>
              )}
              
              {selectedCommission.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedCommission.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommissionDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Commission</DialogTitle>
            <DialogDescription>
              Approve or reject commission for booking #{selectedCommission?.bookingId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCommission && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{getTypeLabel(selectedCommission.type)}</h3>
                  <Badge className={getStatusColor(selectedCommission.status)}>
                    {selectedCommission.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Booking ID: {selectedCommission.bookingId}
                </p>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-bold text-primary">₱{selectedCommission.amount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  placeholder="Add notes about your decision..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={rejectCommission}
              disabled={isProcessing}
            >
              {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject
            </Button>
            <Button 
              onClick={approveCommission}
              disabled={isProcessing}
            >
              {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
