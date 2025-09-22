
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Eye, XCircle, AlertTriangle, CreditCard, Users, DollarSign, Clock, Search, Filter, Download, RefreshCw, TrendingUp, TrendingDown, Edit, MoreHorizontal, Check, X, AlertCircle, Receipt, Users2, Settings, BarChart2, Calendar, MessageSquare, Bell, Briefcase, Heart, Star, FileText, Calculator, Megaphone, Handshake, Gift, Shield, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TransactionService } from "@/lib/transaction-service";
import { TransactionAction, TransactionStatus, PaymentMethod, TransactionEntity } from "@/lib/transaction-types";
import { isBookingTransaction, isSubscriptionTransaction, isPayoutTransaction } from "@/lib/transaction-models";



// All Transactions Component - Shows all types of transactions
function AllTransactionsList() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [entityFilter, setEntityFilter] = useState<string>("all");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
    const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");
    const [amountRangeFilter, setAmountRangeFilter] = useState<string>("all");
    const [transactionStats, setTransactionStats] = useState<any>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
        isOpen: boolean;
        transactionId: string;
        currentStatus: string;
        newStatus: string;
        transaction: any;
    }>({
        isOpen: false,
        transactionId: '',
        currentStatus: '',
        newStatus: '',
        transaction: null
    });

    useEffect(() => {
        loadAllTransactions();
    }, []);

    // Handle status update
    const handleStatusUpdate = async (transactionId: string, newStatus: string) => {
        try {
            setUpdatingStatus(transactionId);
            
            // Update the transaction status using TransactionService
            await TransactionService.updateTransaction(transactionId, {
                status: newStatus as TransactionStatus,
                processedBy: user?.uid || 'admin'
            });

            // Update local state
            setTransactions(prev => prev.map(transaction => 
                transaction.id === transactionId 
                    ? { ...transaction, status: newStatus }
                    : transaction
            ));

            toast({
                title: "Status Updated",
                description: `Transaction status updated to ${newStatus}`,
            });

            // Reload statistics to reflect changes
            const stats = await TransactionService.getTransactionStats({});
            setTransactionStats(stats);

        } catch (error) {
            console.error('Error updating transaction status:', error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Failed to update transaction status",
            });
        } finally {
            setUpdatingStatus(null);
            setStatusUpdateDialog({
                isOpen: false,
                transactionId: '',
                currentStatus: '',
                newStatus: '',
                transaction: null
            });
        }
    };

    // Open status update dialog
    const openStatusUpdateDialog = (transaction: any, newStatus: string) => {
        setStatusUpdateDialog({
            isOpen: true,
            transactionId: transaction.id,
            currentStatus: transaction.status,
            newStatus: newStatus,
            transaction: transaction
        });
    };

    // Get available status options based on current status
    const getAvailableStatusOptions = (currentStatus: string) => {
        const allStatuses = [
            { value: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-600' },
            { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
            { value: 'verified', label: 'Verified', icon: Check, color: 'text-blue-600' },
            { value: 'failed', label: 'Failed', icon: X, color: 'text-red-600' },
            { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-gray-600' },
            { value: 'rejected', label: 'Rejected', icon: AlertCircle, color: 'text-red-700' }
        ];

        // Filter out current status and return available options
        return allStatuses.filter(status => status.value !== currentStatus);
    };

    // Export transactions to CSV
    const exportTransactions = (transactionsToExport: any[]) => {
        try {
            const csvHeaders = [
                'Transaction ID',
                'Entity',
                'Action',
                'Status',
                'User ID',
                'User Name',
                'User Email',
                'Amount',
                'Currency',
                'Payment Method',
                'Created At',
                'Reference Number'
            ];

            const csvData = transactionsToExport.map(transaction => {
                const userData = transaction.userData;
                const userName = userData?.name || userData?.displayName || 'Unknown User';
                const userEmail = userData?.email || 'No Email';
                
                return [
                    transaction.id,
                    transaction.entity,
                    transaction.action,
                    transaction.status,
                    transaction.userId || 'N/A',
                    userName,
                    userEmail,
                    transaction.amount || 0,
                    transaction.currency || 'PHP',
                    transaction.paymentMethod,
                    transaction.createdAt?.toDate?.()?.toISOString() || 'Unknown',
                    transaction.metadata?.referenceNumber || transaction.id
                ];
            });

            const csvContent = [csvHeaders, ...csvData]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Export Successful",
                description: `Exported ${transactionsToExport.length} transactions to CSV`
            });
        } catch (error) {
            console.error('Error exporting transactions:', error);
            toast({
                variant: "destructive",
                title: "Export Failed",
                description: "Failed to export transactions"
            });
        }
    };

    const loadAllTransactions = async () => {
        try {
            setLoading(true);
            // Load all transactions and statistics in parallel
            const [result, stats] = await Promise.all([
                TransactionService.getTransactions({}, 500), // Load up to 500 transactions
                TransactionService.getTransactionStats({}) // Get comprehensive statistics
            ]);
            
            // Enhance transactions with additional data from related collections
            const enhancedTransactions = await Promise.all(
                result.transactions.map(async (transaction) => {
                    try {
                        // Get user data if userId exists
                        let userData = null;
                        if ('userId' in transaction && transaction.userId) {
                            const userDoc = await getDoc(doc(db, 'users', transaction.userId));
                            if (userDoc.exists()) {
                                userData = userDoc.data();
                            }
                        }

                        // Get additional metadata based on transaction type
                        let additionalData = {};
                        if (isBookingTransaction(transaction) && transaction.bookingId) {
                            const bookingDoc = await getDoc(doc(db, 'bookings', transaction.bookingId));
                            if (bookingDoc.exists()) {
                                additionalData = { bookingData: bookingDoc.data() };
                            }
                        } else if (isSubscriptionTransaction(transaction) && transaction.planId) {
                            // Get subscription plan details
                            additionalData = { 
                                planDetails: {
                                    planId: transaction.planId,
                                    planName: transaction.planName,
                                    planType: transaction.planType
                                }
                            };
                        } else if (isPayoutTransaction(transaction) && transaction.payoutId) {
                            // Get payout details
                            const payoutDoc = await getDoc(doc(db, 'payouts', transaction.payoutId));
                            if (payoutDoc.exists()) {
                                additionalData = { payoutData: payoutDoc.data() };
                            }
                        }

                        return {
                            ...transaction,
                            userData,
                            ...additionalData
                        };
                    } catch (error) {
                        console.error(`Error enhancing transaction ${transaction.id}:`, error);
                        return transaction;
                    }
                })
            );

            setTransactions(enhancedTransactions);
            setTransactionStats(stats);
        } catch (error) {
            console.error('Error loading all transactions:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load transactions"
            });
        } finally {
            setLoading(false);
        }
    };

    // Filter transactions based on search and filters
    const filteredTransactions = transactions.filter(transaction => {
        const userId = 'userId' in transaction ? transaction.userId : 'unknown';
        const userData = transaction.userData;
        const userName = userData?.name || userData?.displayName || 'Unknown User';
        const userEmail = userData?.email || 'No Email';
        
        const matchesSearch = searchTerm === "" || 
            userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.amount?.toString().includes(searchTerm) ||
            transaction.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.action?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
        const matchesEntity = entityFilter === "all" || transaction.entity === entityFilter;
        const matchesPaymentMethod = paymentMethodFilter === "all" || transaction.paymentMethod === paymentMethodFilter;
        
        // Date range filter
        let matchesDateRange = true;
        if (dateRangeFilter !== "all") {
            const transactionDate = transaction.createdAt?.toDate?.();
            if (transactionDate) {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                
                switch (dateRangeFilter) {
                    case "today":
                        matchesDateRange = transactionDate >= today;
                        break;
                    case "yesterday":
                        matchesDateRange = transactionDate >= yesterday && transactionDate < today;
                        break;
                    case "week":
                        matchesDateRange = transactionDate >= weekAgo;
                        break;
                    case "month":
                        matchesDateRange = transactionDate >= monthAgo;
                        break;
                }
            }
        }
        
        // Amount range filter
        let matchesAmountRange = true;
        if (amountRangeFilter !== "all") {
            const amount = transaction.amount || 0;
            switch (amountRangeFilter) {
                case "0-100":
                    matchesAmountRange = amount >= 0 && amount <= 100;
                    break;
                case "100-500":
                    matchesAmountRange = amount > 100 && amount <= 500;
                    break;
                case "500-1000":
                    matchesAmountRange = amount > 500 && amount <= 1000;
                    break;
                case "1000+":
                    matchesAmountRange = amount > 1000;
                    break;
            }
        }
        
        return matchesSearch && matchesStatus && matchesEntity && matchesPaymentMethod && matchesDateRange && matchesAmountRange;
    });

    if (loading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 w-32" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            
            <Card>
                <CardHeader>
                    
                    {/* Redesigned Search and Filter Controls */}
                    <div className="bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">Search & Filters</h3>
                            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{filteredTransactions.length} of {transactions.length} transactions</span>
                            </div>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search by user name, email, amount, payment method, transaction ID, entity, or action..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 text-base border-2 focus:border-primary/50 transition-colors"
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        
                        {/* Filter Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {/* Status Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-blue-500" />
                                    Status
                                </label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-10 border-2 focus:border-primary/50 transition-colors">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                Pending
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="completed">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                Completed
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="verified">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                Verified
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="failed">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                Failed
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                                Cancelled
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="rejected">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                                Rejected
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Entity Type Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-purple-500" />
                                    Type
                                </label>
                                <Select value={entityFilter} onValueChange={setEntityFilter}>
                                    <SelectTrigger className="h-10 border-2 focus:border-primary/50 transition-colors">
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="booking">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Booking
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="subscription">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" />
                                                Subscription
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="payout">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Payout
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="advertisement">
                                            <div className="flex items-center gap-2">
                                                <Megaphone className="h-4 w-4" />
                                                Advertisement
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="commission">
                                            <div className="flex items-center gap-2">
                                                <Handshake className="h-4 w-4" />
                                                Commission
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="refund">
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="h-4 w-4" />
                                                Refund
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="loyalty">
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4" />
                                                Loyalty
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="penalty">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                Penalty
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="bonus">
                                            <div className="flex items-center gap-2">
                                                <Gift className="h-4 w-4" />
                                                Bonus
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="system">
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                System
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Payment Method Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-green-500" />
                                    Payment Method
                                </label>
                                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                    <SelectTrigger className="h-10 border-2 focus:border-primary/50 transition-colors">
                                        <SelectValue placeholder="All Methods" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Methods</SelectItem>
                                        <SelectItem value="gcash">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" />
                                                GCash
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="maya">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" />
                                                Maya
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="bank_transfer">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" />
                                                Bank Transfer
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="paypal">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" />
                                                PayPal
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="credit_card">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" />
                                                Credit Card
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="debit_card">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" />
                                                Debit Card
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="cash">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Cash
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="manual_verification">
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                Manual Verification
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="system_credit">
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                System Credit
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="loyalty_points">
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4" />
                                                Loyalty Points
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Range Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-orange-500" />
                                    Date Range
                                </label>
                                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                                    <SelectTrigger className="h-10 border-2 focus:border-primary/50 transition-colors">
                                        <SelectValue placeholder="All Time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Time</SelectItem>
                                        <SelectItem value="today">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Today
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="yesterday">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Yesterday
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="week">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Last 7 Days
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="month">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Last 30 Days
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Amount Range Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-emerald-500" />
                                    Amount Range
                                </label>
                                <Select value={amountRangeFilter} onValueChange={setAmountRangeFilter}>
                                    <SelectTrigger className="h-10 border-2 focus:border-primary/50 transition-colors">
                                        <SelectValue placeholder="All Amounts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Amounts</SelectItem>
                                        <SelectItem value="0-100">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                ₱0 - ₱100
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="100-500">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                ₱100 - ₱500
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="500-1000">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                ₱500 - ₱1,000
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="1000+">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                ₱1,000+
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {/* Active Filters & Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 pt-4 border-t">
                            <div className="flex flex-wrap gap-2">
                                {searchTerm && (
                                    <Badge variant="secondary" className="gap-1">
                                        Search: "{searchTerm}"
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSearchTerm("")}
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                                {statusFilter !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        Status: {statusFilter}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setStatusFilter("all")}
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                                {entityFilter !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        Type: {entityFilter}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEntityFilter("all")}
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                                {paymentMethodFilter !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        Method: {paymentMethodFilter}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setPaymentMethodFilter("all")}
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                                {dateRangeFilter !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        Date: {dateRangeFilter}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDateRangeFilter("all")}
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                                {amountRangeFilter !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        Amount: {amountRangeFilter}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setAmountRangeFilter("all")}
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                            </div>
                            
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("all");
                                        setEntityFilter("all");
                                        setPaymentMethodFilter("all");
                                        setDateRangeFilter("all");
                                        setAmountRangeFilter("all");
                                    }}
                                    className="gap-2"
                                >
                                    <Filter className="h-4 w-4" />
                                    Clear All Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                        <TableBody>
                            {filteredTransactions.length > 0 ? filteredTransactions.map((transaction) => {
                                const userId = 'userId' in transaction ? transaction.userId : 'unknown';
                                const userData = transaction.userData;
                                const userName = userData?.name || userData?.displayName || 'Unknown User';
                                const userEmail = userData?.email || 'No Email';
                                
                                return (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {transaction.entity}
                                                </Badge>
                                                {transaction.action && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {transaction.action.replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="font-medium text-sm">{userName}</div>
                                                <div className="text-xs text-muted-foreground">{userEmail}</div>
                                                <div className="font-mono text-xs text-muted-foreground">{userId}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="font-medium">₱{transaction.amount?.toLocaleString() || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground">{transaction.currency || 'PHP'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">{transaction.paymentMethod}</TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={transaction.status === 'completed' ? 'default' : 
                                                        transaction.status === 'pending' ? 'secondary' : 
                                                        transaction.status === 'verified' ? 'default' :
                                                        'destructive'}
                                            >
                                                {transaction.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-muted-foreground">
                                                {transaction.action?.replace(/_/g, ' ') || 'N/A'}
                                            </div>
                                        </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                disabled={updatingStatus === transaction.id}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                {updatingStatus === transaction.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                                                Update Status
                                                            </div>
                                                            <DropdownMenuSeparator />
                                                            {getAvailableStatusOptions(transaction.status).map((statusOption) => {
                                                                const IconComponent = statusOption.icon;
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={statusOption.value}
                                                                        onClick={() => openStatusUpdateDialog(transaction, statusOption.value)}
                                                                        className="flex items-center gap-2"
                                                                    >
                                                                        <IconComponent className={`h-4 w-4 ${statusOption.color}`} />
                                                                        <span>Mark as {statusOption.label}</span>
                                                                    </DropdownMenuItem>
                                                                );
                                                            })}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    // View transaction details - you can implement this
                                                                    toast({
                                                                        title: "View Details",
                                                                        description: `Viewing details for transaction ${transaction.id}`,
                                                                    });
                                                                }}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                <span>View Details</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-32">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-3 bg-muted rounded-full">
                                                <Search className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium text-muted-foreground">
                                                    {transactions.length === 0 
                                                        ? "No transactions found" 
                                                        : "No transactions match your search criteria"}
                                                </p>
                                                {transactions.length > 0 && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Try adjusting your search or filter settings
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Status Update Confirmation Dialog */}
            <AlertDialog open={statusUpdateDialog.isOpen} onOpenChange={(open) => {
                if (!open) {
                    setStatusUpdateDialog({
                        isOpen: false,
                        transactionId: '',
                        currentStatus: '',
                        newStatus: '',
                        transaction: null
                    });
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Update Transaction Status
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to update this transaction status?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    {statusUpdateDialog.transaction && (
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-muted-foreground">Transaction ID:</span>
                                    <p className="font-mono text-xs">{statusUpdateDialog.transactionId}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Amount:</span>
                                    <p>₱{statusUpdateDialog.transaction.amount?.toLocaleString() || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Current Status:</span>
                                    <div className="flex items-center gap-2">
                                        <Badge 
                                            variant={
                                                statusUpdateDialog.currentStatus === 'completed' || statusUpdateDialog.currentStatus === 'verified' ? 'default' : 
                                                statusUpdateDialog.currentStatus === 'pending' ? 'secondary' : 
                                                ['failed', 'cancelled', 'rejected'].includes(statusUpdateDialog.currentStatus) ? 'destructive' :
                                                'secondary'
                                            }
                                        >
                                            {statusUpdateDialog.currentStatus}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">New Status:</span>
                                    <div className="flex items-center gap-2">
                                        <Badge 
                                            variant={
                                                statusUpdateDialog.newStatus === 'completed' || statusUpdateDialog.newStatus === 'verified' ? 'default' : 
                                                statusUpdateDialog.newStatus === 'pending' ? 'secondary' : 
                                                ['failed', 'cancelled', 'rejected'].includes(statusUpdateDialog.newStatus) ? 'destructive' :
                                                'secondary'
                                            }
                                        >
                                            {statusUpdateDialog.newStatus}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleStatusUpdate(statusUpdateDialog.transactionId, statusUpdateDialog.newStatus)}
                            className="bg-primary hover:bg-primary/90"
                        >
                            Update Status
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


export default function AdminPaymentVerificationPage() {
    const { userRole } = useAuth();

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

    return (
        <div className="space-y-8">
            {/* Enhanced Header */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Transaction Management
                        </h1>
                        <p className="text-lg text-muted-foreground mt-2">
                            Review, verify, and manage all payment transactions across the platform
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export All
                        </Button>
                        <Button size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* All Transactions Section */}
            <AllTransactionsList />
        </div>
    )
}
