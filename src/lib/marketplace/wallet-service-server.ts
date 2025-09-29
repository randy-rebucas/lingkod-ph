import { adminDb } from '../firebase-admin';
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
} from 'firebase-admin/firestore';
import { UserWallet, WalletTransaction } from './types';

export class WalletServiceServer {
  private static readonly WALLET_COLLECTION = 'userWallets';
  private static readonly TRANSACTIONS_COLLECTION = 'walletTransactions';

  /**
   * Get the admin database instance
   */
  private static getDb() {
    return adminDb;
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
        isActive: true,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      const walletRef = await addDoc(collection(this.getDb(), this.WALLET_COLLECTION), walletData);
      
      const walletDoc = await getDoc(walletRef);
      if (!walletDoc.exists()) {
        throw new Error('Failed to create wallet');
      }

      return {
        id: walletDoc.id,
        ...walletDoc.data()
      } as UserWallet;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
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
   * Add balance to wallet
   */
  static async addBalance(
    userId: string,
    amount: number,
    type: string,
    referenceId?: string
  ): Promise<void> {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      const wallet = await this.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Update wallet balance
      await updateDoc(doc(this.getDb(), this.WALLET_COLLECTION, wallet.id), {
        balance: increment(amount),
        updatedAt: serverTimestamp()
      });

      // Create transaction record
      await this.createTransaction(
        userId,
        'credit',
        amount,
        type,
        referenceId
      );
    } catch (error) {
      console.error('Error adding balance:', error);
      throw new Error('Failed to add balance');
    }
  }

  /**
   * Deduct balance from wallet
   */
  static async deductBalance(
    userId: string,
    amount: number,
    type: string,
    referenceId?: string
  ): Promise<void> {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      const wallet = await this.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Update wallet balance
      await updateDoc(doc(this.getDb(), this.WALLET_COLLECTION, wallet.id), {
        balance: increment(-amount),
        updatedAt: serverTimestamp()
      });

      // Create transaction record
      await this.createTransaction(
        userId,
        'debit',
        amount,
        type,
        referenceId
      );
    } catch (error) {
      console.error('Error deducting balance:', error);
      throw new Error('Failed to deduct balance');
    }
  }

  /**
   * Create a wallet transaction
   */
  static async createTransaction(
    userId: string,
    type: 'credit' | 'debit',
    amount: number,
    transactionType: string,
    referenceId?: string
  ): Promise<void> {
    try {
      const transactionData: Omit<WalletTransaction, 'id'> = {
        userId,
        type,
        amount,
        transactionType,
        referenceId: referenceId || null,
        status: 'completed',
        createdAt: serverTimestamp() as Timestamp
      };

      await addDoc(collection(this.getDb(), this.TRANSACTIONS_COLLECTION), transactionData);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  /**
   * Get wallet transactions
   */
  static async getTransactions(
    userId: string,
    limitCount: number = 50
  ): Promise<WalletTransaction[]> {
    try {
      const q = query(
        collection(this.getDb(), this.TRANSACTIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const transactions: WalletTransaction[] = [];

      snapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        } as WalletTransaction);
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Sync wallet with external payment system
   */
  static async syncWallet(userId: string): Promise<void> {
    try {
      // This would integrate with external payment systems
      // For now, just update the last sync timestamp
      const wallet = await this.getWallet(userId);
      if (wallet) {
        await updateDoc(doc(this.getDb(), this.WALLET_COLLECTION, wallet.id), {
          lastSyncAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error syncing wallet:', error);
      throw new Error('Failed to sync wallet');
    }
  }

  /**
   * Get wallet statistics
   */
  static async getWalletStatistics(userId: string): Promise<{
    totalCredits: number;
    totalDebits: number;
    netBalance: number;
    transactionCount: number;
  }> {
    try {
      const transactions = await this.getTransactions(userId, 1000); // Get more for stats
      
      let totalCredits = 0;
      let totalDebits = 0;
      
      transactions.forEach(transaction => {
        if (transaction.type === 'credit') {
          totalCredits += transaction.amount;
        } else {
          totalDebits += transaction.amount;
        }
      });

      const netBalance = totalCredits - totalDebits;

      return {
        totalCredits,
        totalDebits,
        netBalance,
        transactionCount: transactions.length
      };
    } catch (error) {
      console.error('Error fetching wallet statistics:', error);
      throw new Error('Failed to fetch wallet statistics');
    }
  }

  /**
   * Get wallet summary (alias for getWalletStatistics for compatibility)
   */
  static async getWalletSummary(userId: string): Promise<{
    totalCredits: number;
    totalDebits: number;
    netBalance: number;
    transactionCount: number;
  }> {
    return this.getWalletStatistics(userId);
  }
}
