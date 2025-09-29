"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CreditCard,
  History
} from 'lucide-react';
import { WalletBalanceComponent } from '@/components/marketplace/wallet-balance';
import { UserWallet, WalletTransaction } from '@/lib/marketplace/types';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = await user.getIdToken();
      
      const [walletResponse, transactionsResponse] = await Promise.all([
        fetch('/api/marketplace/wallet', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/marketplace/wallet/transactions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!walletResponse.ok || !transactionsResponse.ok) {
        throw new Error('Failed to fetch wallet data');
      }

      const walletResult = await walletResponse.json();
      const transactionsResult = await transactionsResponse.json();
      
      setWallet(walletResult.data?.wallet || null);
      setTransactions(transactionsResult.data?.transactions || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load wallet data'
      });
    } finally {
      setLoading(false);
    }
  };

  const syncWithEarnings = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/marketplace/wallet/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to sync wallet');
      }

      await loadWalletData();
      toast({
        title: 'Wallet Synced',
        description: 'Wallet has been synced with your latest earnings'
      });
    } catch (error) {
      console.error('Error syncing wallet:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sync wallet with earnings'
      });
    } finally {
      setSyncing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earnings':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-red-500" />;
      case 'refund':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'payout':
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      default:
        return <Wallet className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earnings':
      case 'refund':
        return 'text-green-600';
      case 'purchase':
        return 'text-red-600';
      case 'payout':
        return 'text-orange-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatDate = (timestamp: any) => {
    return timestamp.toDate().toLocaleString();
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Login Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to view your wallet
            </p>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/marketplace">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">My Wallet</h1>
          <p className="text-muted-foreground">
            Manage your LocalPro wallet balance and transactions
          </p>
        </div>
      </div>

      {/* Wallet Balance */}
      <WalletBalanceComponent showTransactions={false} />

      {/* Wallet Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={syncWithEarnings}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync with Earnings
            </Button>
            <Button variant="outline" asChild>
              <Link href="/marketplace">
                <CreditCard className="h-4 w-4 mr-2" />
                Shop Now
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-4">
                Your transaction history will appear here
              </p>
              <Button asChild>
                <Link href="/marketplace">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="p-2 bg-muted rounded-full">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.timestamp)}
                    </p>
                    {transaction.orderId && (
                      <p className="text-xs text-muted-foreground">
                        Order: #{transaction.orderId.slice(-8)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.amount > 0 ? '+' : ''}₱{transaction.amount.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {transaction.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Your Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Earnings</h4>
              <p className="text-sm text-green-700">
                Your earnings from completed services are automatically added to your wallet
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Purchases</h4>
              <p className="text-sm text-blue-700">
                Use your wallet balance to purchase supplies from the marketplace
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Refunds</h4>
              <p className="text-sm text-purple-700">
                Refunds for cancelled orders are automatically credited to your wallet
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">Payouts</h4>
              <p className="text-sm text-orange-700">
                Request payouts to transfer your wallet balance to your bank account
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
