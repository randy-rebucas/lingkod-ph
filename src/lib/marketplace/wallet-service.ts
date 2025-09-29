import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp,
  increment,
  orderBy 
} from 'firebase/firestore';
import { UserWallet, WalletTransaction } from './types';

export class WalletService {
  private static readonly WALLET_COLLECTION = 'userWallets';

  /**
   * Get the appropriate database instance
   */
  private static getDb() {
    // Always use client database for client-side operations
    return db;
  }

  /**
   * Get user's wallet
   */
  static async getWallet(userId: string): Promise<UserWallet | null> {
    try {
      const docRef = doc(this.getDb(), this.WALLET_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as UserWallet;
      }

      // Create wallet if it doesn't exist
      return await this.createWallet(userId);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      throw new Error('Failed to fetch wallet');
    }
  }

  /**
   * Create a new wallet for user
   */
  static async createWallet(userId: string): Promise<UserWallet> {
    try {
      const walletData: Omit<UserWallet, 'id'> = {
        userId,
        balance: 0,
        currency: 'PHP',
        transactions: [],
        lastUpdated: serverTimestamp() as Timestamp
      };

      const docRef = await addDoc(collection(this.getDb(), this.WALLET_COLLECTION), walletData);
      
      return {
        id: docRef.id,
        ...walletData
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  /**
   * Add funds to wallet (from earnings)
   */
  static async addFunds(
    userId: string, 
    amount: number, 
    description: string,
    orderId?: string
  ): Promise<void> {
    try {
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const transaction: WalletTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'earnings',
        amount,
        description,
        orderId,
        timestamp: Timestamp.now()
      };

      // Update wallet balance and add transaction
      const docRef = doc(this.getDb(), this.WALLET_COLLECTION, userId);
      await updateDoc(docRef, {
        balance: increment(amount),
        transactions: [...wallet.transactions, transaction],
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding funds to wallet:', error);
      throw new Error('Failed to add funds to wallet');
    }
  }

  /**
   * Deduct funds from wallet (for purchases)
   */
  static async deductFunds(
    userId: string, 
    amount: number, 
    description: string,
    orderId?: string
  ): Promise<void> {
    try {
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.balance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      const transaction: WalletTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'purchase',
        amount: -amount, // Negative amount for deduction
        description,
        orderId,
        timestamp: Timestamp.now()
      };

      // Update wallet balance and add transaction
      const docRef = doc(this.getDb(), this.WALLET_COLLECTION, userId);
      await updateDoc(docRef, {
        balance: increment(-amount),
        transactions: [...wallet.transactions, transaction],
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deducting funds from wallet:', error);
      throw new Error('Failed to deduct funds from wallet');
    }
  }

  /**
   * Process refund to wallet
   */
  static async processRefund(
    userId: string, 
    amount: number, 
    description: string,
    orderId?: string
  ): Promise<void> {
    try {
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const transaction: WalletTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'refund',
        amount,
        description,
        orderId,
        timestamp: Timestamp.now()
      };

      // Update wallet balance and add transaction
      const docRef = doc(this.getDb(), this.WALLET_COLLECTION, userId);
      await updateDoc(docRef, {
        balance: increment(amount),
        transactions: [...wallet.transactions, transaction],
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Get wallet balance
   */
  static async getBalance(userId: string): Promise<number> {
    try {
      const wallet = await this.getWallet(userId);
      return wallet?.balance || 0;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  }

  /**
   * Get wallet transactions
   */
  static async getTransactions(
    userId: string, 
    limit: number = 50
  ): Promise<WalletTransaction[]> {
    try {
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        return [];
      }

      // Sort transactions by timestamp (newest first) and limit
      return wallet.transactions
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw new Error('Failed to fetch wallet transactions');
    }
  }

  /**
   * Check if user has sufficient balance
   */
  static async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance(userId);
      return balance >= amount;
    } catch (error) {
      console.error('Error checking wallet balance:', error);
      return false;
    }
  }

  /**
   * Get wallet summary
   */
  static async getWalletSummary(userId: string): Promise<{
    balance: number;
    totalEarnings: number;
    totalSpent: number;
    transactionCount: number;
    lastTransaction?: WalletTransaction;
  }> {
    try {
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        return {
          balance: 0,
          totalEarnings: 0,
          totalSpent: 0,
          transactionCount: 0
        };
      }

      let totalEarnings = 0;
      let totalSpent = 0;

      wallet.transactions.forEach(transaction => {
        if (transaction.type === 'earnings' || transaction.type === 'refund') {
          totalEarnings += transaction.amount;
        } else if (transaction.type === 'purchase') {
          totalSpent += Math.abs(transaction.amount);
        }
      });

      const sortedTransactions = wallet.transactions
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

      return {
        balance: wallet.balance,
        totalEarnings,
        totalSpent,
        transactionCount: wallet.transactions.length,
        lastTransaction: sortedTransactions[0]
      };
    } catch (error) {
      console.error('Error getting wallet summary:', error);
      throw new Error('Failed to get wallet summary');
    }
  }

  /**
   * Sync wallet with earnings from completed bookings
   */
  static async syncWithEarnings(userId: string): Promise<void> {
    try {
      // This would integrate with the existing earnings system
      // For now, we'll implement a basic version
      
      // Query completed bookings for the user
      const bookingsQuery = query(
        collection(this.getDb(), 'bookings'),
        where('providerId', '==', userId),
        where('status', '==', 'Completed')
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const wallet = await this.getWallet(userId);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check for bookings that haven't been added to wallet yet
      const existingOrderIds = wallet.transactions
        .filter(tx => tx.orderId)
        .map(tx => tx.orderId);

      for (const bookingDoc of bookingsSnapshot.docs) {
        const booking = bookingDoc.data();
        
        // Skip if already processed
        if (existingOrderIds.includes(bookingDoc.id)) {
          continue;
        }

        // Add earnings to wallet
        await this.addFunds(
          userId,
          booking.price * 0.8, // 80% to provider, 20% platform fee
          `Earnings from booking: ${booking.serviceName}`,
          bookingDoc.id
        );
      }
    } catch (error) {
      console.error('Error syncing wallet with earnings:', error);
      throw new Error('Failed to sync wallet with earnings');
    }
  }
}
