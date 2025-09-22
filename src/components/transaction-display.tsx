/**
 * Transaction Display Component
 * 
 * This component provides a comprehensive way to display transactions
 * with support for both legacy and new transaction formats.
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, where, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye, Download, RefreshCw, Filter, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionService } from "@/lib/transaction-service";
import { 
  TransactionEntity, 
  TransactionAction, 
  TransactionStatus, 
  PaymentMethod,
  getTransactionEntityDisplayName,
  getTransactionActionDisplayName,
  getTransactionStatusDisplayName,
  getPaymentMethodDisplayName
} from "@/lib/transaction-types";
import { Transaction, TransactionFilters } from "@/lib/transaction-models";

interface TransactionDisplayProps {
  userId?: string;
  showFilters?: boolean;
  limit?: number;
  title?: string;
  description?: string;
  showDetails?: boolean;
  showActions?: boolean;
}

type DisplayTransaction = Transaction & {
  // Legacy fields for backward compatibility
  type?: string;
  clientId?: string;
  providerId?: string;
  bookingId?: string;
  subscriptionId?: string;
  payoutId?: string;
  advertisementId?: string;
  commissionId?: string;
  refundId?: string;
  paypalOrderId?: string;
  payerEmail?: string;
  verifiedAt?: Timestamp;
  verifiedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  rejectionReason?: string;
};

export default function TransactionDisplay({
  userId,
  showFilters = true,
  limit = 50,
  title = "Transaction History",
  description = "View all your transaction history",
  showDetails = true,
  showActions = true
}: TransactionDisplayProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredTransactions, setFilteredTransactions] = useState<DisplayTransaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Use provided userId or current user's ID
  const targetUserId = userId || user?.uid;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", targetUserId),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as DisplayTransaction));
      setTransactions(data);
      setFilteredTransactions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transactions"
      });
    });

    return () => unsubscribe();
  }, [targetUserId, toast]);

  // Apply filters
  useEffect(() => {
    let filtered = transactions;

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.metadata?.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply entity filter
    if (filters.entity) {
      filtered = filtered.filter(transaction => transaction.entity === filters.entity);
    }

    // Apply action filter
    if (filters.action) {
      filtered = filtered.filter(transaction => transaction.action === filters.action);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(transaction => transaction.status === filters.status);
    }

    // Apply payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(transaction => transaction.paymentMethod === filters.paymentMethod);
    }

    // Apply amount filters
    if (filters.amountMin) {
      filtered = filtered.filter(transaction => transaction.amount >= filters.amountMin!);
    }
    if (filters.amountMax) {
      filtered = filtered.filter(transaction => transaction.amount <= filters.amountMax!);
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(transaction => {
        const transactionDate = transaction.createdAt?.toDate?.() || new Date();
        return transactionDate >= filters.dateFrom!;
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(transaction => {
        const transactionDate = transaction.createdAt?.toDate?.() || new Date();
        return transactionDate <= filters.dateTo!;
      });
    }

    setFilteredTransactions(filtered.slice(0, limit));
  }, [transactions, filters, searchTerm, limit]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      'completed': { variant: "default", className: "bg-green-100 text-green-800" },
      'pending': { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      'rejected': { variant: "destructive" },
      'failed': { variant: "destructive" },
      'cancelled': { variant: "outline" },
      'refunded': { variant: "outline" },
      'processing': { variant: "secondary" },
      'verified': { variant: "default", className: "bg-blue-100 text-blue-800" },
      'expired': { variant: "outline" }
    };

    const config = statusMap[status] || { variant: "outline" as const };
    return (
      <Badge variant={config.variant} className={config.className}>
        {getTransactionStatusDisplayName(status as TransactionStatus)}
      </Badge>
    );
  };

  const getTypeLabel = (transaction: DisplayTransaction) => {
    // Handle new transaction format
    if (transaction.entity && transaction.action) {
      return getTransactionEntityDisplayName(transaction.entity);
    }
    
    // Handle legacy transaction format
    switch (transaction.type) {
      case 'booking_payment':
        return 'Service Payment';
      case 'subscription_payment':
        return 'Subscription';
      case 'payout_request':
        return 'Payout Request';
      case 'refund':
        return 'Refund';
      default:
        return transaction.type || 'Unknown';
    }
  };

  const getActionLabel = (transaction: DisplayTransaction) => {
    if (transaction.action) {
      return getTransactionActionDisplayName(transaction.action);
    }
    return 'Payment';
  };

  const getPaymentMethodLabel = (method: string) => {
    return getPaymentMethodDisplayName(method as PaymentMethod);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Entity</label>
                <Select value={filters.entity || ""} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, entity: value as TransactionEntity || undefined }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All entities</SelectItem>
                    {Object.values(TransactionEntity).map(entity => (
                      <SelectItem key={entity} value={entity}>
                        {getTransactionEntityDisplayName(entity)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status || ""} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, status: value as TransactionStatus || undefined }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {Object.values(TransactionStatus).map(status => (
                      <SelectItem key={status} value={status}>
                        {getTransactionStatusDisplayName(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={filters.paymentMethod || ""} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, paymentMethod: value as PaymentMethod || undefined }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All methods</SelectItem>
                    {Object.values(PaymentMethod).map(method => (
                      <SelectItem key={method} value={method}>
                        {getPaymentMethodDisplayName(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                {showActions && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? filteredTransactions.map(transaction => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-sm">
                    {transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getTypeLabel(transaction)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {getActionLabel(transaction)}
                  </TableCell>
                  <TableCell>
                    {transaction.currency === 'POINTS' ? 
                      `${transaction.amount} points` : 
                      `₱${transaction.amount.toFixed(2)}`
                    }
                  </TableCell>
                  <TableCell className="text-sm">
                    {getPaymentMethodLabel(transaction.paymentMethod)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transaction.status)}
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      {showDetails && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Transaction Details</DialogTitle>
                              <DialogDescription>
                                Transaction ID: {transaction.id}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                                  <p className="text-sm">{getTypeLabel(transaction)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Action</label>
                                  <p className="text-sm">{getActionLabel(transaction)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                                  <p className="text-sm">
                                    {transaction.currency === 'POINTS' ? 
                                      `${transaction.amount} points` : 
                                      `₱${transaction.amount.toFixed(2)}`
                                    }
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                                  <p className="text-sm">{getPaymentMethodLabel(transaction.paymentMethod)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                                  <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                                  <p className="text-sm">
                                    {transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                                  </p>
                                </div>
                              </div>
                              
                              {transaction.referenceNumber && (
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                  <label className="text-sm font-medium text-gray-800">Reference Number</label>
                                  <p className="text-sm text-gray-800 mt-1 font-mono">{transaction.referenceNumber}</p>
                                </div>
                              )}

                              {transaction.paypalOrderId && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                  <label className="text-sm font-medium text-blue-800">PayPal Order ID</label>
                                  <p className="text-sm text-blue-800 mt-1 font-mono">{transaction.paypalOrderId}</p>
                                  {transaction.payerEmail && (
                                    <>
                                      <label className="text-sm font-medium text-blue-800 mt-2 block">Payer Email</label>
                                      <p className="text-sm text-blue-800 mt-1">{transaction.payerEmail}</p>
                                    </>
                                  )}
                                </div>
                              )}

                              {transaction.rejectionReason && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                  <label className="text-sm font-medium text-red-800">Rejection Reason</label>
                                  <p className="text-sm text-red-800 mt-1">{transaction.rejectionReason}</p>
                                </div>
                              )}

                              {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                  <label className="text-sm font-medium text-gray-800">Additional Information</label>
                                  <div className="mt-2 space-y-1">
                                    {Object.entries(transaction.metadata).map(([key, value]) => (
                                      <div key={key} className="flex justify-between text-sm">
                                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                        <span className="text-gray-800">{String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={showActions ? 7 : 6} className="text-center h-24">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
