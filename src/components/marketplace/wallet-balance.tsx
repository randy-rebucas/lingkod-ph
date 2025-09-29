"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  History,
  RefreshCw
} from 'lucide-react';
import { UserWallet, WalletTransaction } from '@/lib/marketplace/types';
import { WalletService } from '@/lib/marketplace/wallet-service';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

interface WalletBalanceProps {
  showTransactions?: boolean;
  compact?: boolean;
}

export function WalletBalanceComponent({ 
  showTransactions = true, 
  compact = false 
}: WalletBalanceProps) {
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
      const [walletData, transactionData] = await Promise.all([
        WalletService.getWallet(user.uid),
        showTransactions ? WalletService.getTransactions(user.uid, 10) : Promise.resolve([])
      ]);
      
      setWallet(walletData);
      setTransactions(transactionData);
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
      await WalletService.syncWithEarnings(user.uid);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No wallet found</h3>
          <p className="text-muted-foreground mb-4">
            Your wallet will be created when you make your first transaction
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-xl font-bold">₱{wallet.balance.toLocaleString()}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={syncWithEarnings}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Wallet Balance</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={syncWithEarnings}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold">₱{wallet.balance.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Available Balance</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-lg font-semibold text-green-600">
                ₱{transactions
                  .filter(t => t.type === 'earnings' || t.type === 'refund')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-lg font-semibold text-red-600">
                ₱{transactions
                  .filter(t => t.type === 'purchase')
                  .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {showTransactions && transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-muted rounded-full">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.timestamp.toDate().toLocaleString()}
                    </p>
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
            
            {transactions.length > 5 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  View All Transactions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
