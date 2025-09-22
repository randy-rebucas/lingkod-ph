"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Eye,
  CheckSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionPaymentProcessor, SubscriptionPayment } from "@/lib/subscription-payment-processor";

interface SubscriptionStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  totalRevenue: number;
}

export function AdminSubscriptionProcessor() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    totalRevenue: 0
  });
  const [pendingPayments, setPendingPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }

    loadData();
  }, [userRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, paymentsData] = await Promise.all([
        SubscriptionPaymentProcessor.getSubscriptionPaymentStats(),
        SubscriptionPaymentProcessor.getPendingSubscriptionPayments()
      ]);
      
      setStats(statsData);
      setPendingPayments(paymentsData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load subscription data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    if (!user) return;

    setProcessing(true);
    try {
      const result = await SubscriptionPaymentProcessor.verifySubscriptionPayment(
        paymentId, 
        user.uid
      );

      if (result.success) {
        toast({
          title: "Payment Verified",
          description: result.message
        });
        await loadData(); // Refresh data
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.message
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify payment"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPayment = async (paymentId: string, reason: string) => {
    if (!user || !reason.trim()) return;

    setProcessing(true);
    try {
      const result = await SubscriptionPaymentProcessor.rejectSubscriptionPayment(
        paymentId, 
        user.uid, 
        reason
      );

      if (result.success) {
        toast({
          title: "Payment Rejected",
          description: result.message
        });
        await loadData(); // Refresh data
      } else {
        toast({
          variant: "destructive",
          title: "Rejection Failed",
          description: result.message
        });
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject payment"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchProcess = async () => {
    if (!user) return;

    setProcessing(true);
    try {
      const result = await SubscriptionPaymentProcessor.processPendingPayments(
        user.uid,
        false // Don't auto-verify, just mark as reviewed
      );

      toast({
        title: "Batch Processing Complete",
        description: `Processed ${result.processed} payments. ${result.errors.length} errors.`
      });

      if (result.errors.length > 0) {
        console.error('Batch processing errors:', result.errors);
      }

      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error in batch processing:', error);
      toast({
        variant: "destructive",
        title: "Batch Processing Failed",
        description: "Failed to process payments"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (userRole !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>This component is for administrators only.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Subscription Payment Processor</h2>
          <p className="text-muted-foreground">
            Manage and verify subscription payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleBatchProcess}
            disabled={processing || pendingPayments.length === 0}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Batch Process
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₱{stats.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Progress */}
      {processing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Processing Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={66} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              Please wait while we process the payments...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending Payments */}
      {pendingPayments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Verification ({pendingPayments.length})
            </CardTitle>
            <CardDescription>
              Review and verify subscription payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{payment.userName || payment.userEmail}</h4>
                      <Badge variant="outline">{payment.planType}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Plan:</strong> {payment.planName}</p>
                      <p><strong>Amount:</strong> ₱{payment.amount.toLocaleString()}</p>
                      <p><strong>Method:</strong> {payment.paymentMethod}</p>
                      <p><strong>Reference:</strong> {payment.referenceNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // You can implement a modal to view payment proof here
                        window.open(payment.paymentProofUrl, '_blank');
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Proof
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) {
                          handleRejectPayment(payment.id, reason);
                        }
                      }}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleVerifyPayment(payment.id)}
                      disabled={processing}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Payments</h3>
            <p className="text-muted-foreground">
              All subscription payments have been processed.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for subscription payment management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => window.open('/admin/subscription-payments', '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Payments
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/admin/transactions', '_blank')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Transactions
            </Button>
            <Button
              variant="outline"
              onClick={loadData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
