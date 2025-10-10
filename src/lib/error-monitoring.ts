/**
 * Comprehensive Error Monitoring System for Production
 * 
 * This module provides centralized error monitoring, logging, and alerting
 * capabilities for production environments.
 */

import { getAuth } from 'firebase/auth';
import { getDb } from './firebase';

export interface ErrorContext {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'client' | 'server' | 'database' | 'payment' | 'auth' | 'api' | 'unknown';
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private errorQueue: ErrorReport[] = [];
  private isProcessing = false;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly BATCH_SIZE = 10;
  private readonly RETRY_ATTEMPTS = 3;

  private constructor() {
    this.setupGlobalErrorHandlers();
    this.startBatchProcessor();
  }

  public static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  /**
   * Report an error with context
   */
  public async reportError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): Promise<string> {
    try {
      const errorReport: ErrorReport = {
        id: this.generateErrorId(),
        message: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'string' ? undefined : error.stack,
        context: {
          ...context,
          severity: context.severity || 'medium',
          category: context.category || 'unknown',
          timestamp: new Date(),
          userId: this.getCurrentUserId(),
          userRole: this.getCurrentUserRole(),
          sessionId: this.getSessionId(),
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        },
        resolved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to queue for batch processing
      this.addToQueue(errorReport);

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error reported:', errorReport);
      }

      // Send critical errors immediately
      if (errorReport.context.severity === 'critical') {
        await this.sendImmediateAlert(errorReport);
      }

      return errorReport.id;
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      return 'unknown';
    }
  }

  /**
   * Report a client-side error
   */
  public reportClientError(
    error: Error,
    component?: string,
    action?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.reportError(error, {
      category: 'client',
      component,
      action,
      metadata,
      severity: 'medium',
    });
  }

  /**
   * Report a server-side error
   */
  public reportServerError(
    error: Error,
    endpoint?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.reportError(error, {
      category: 'server',
      action: endpoint,
      metadata,
      severity: 'high',
    });
  }

  /**
   * Report a database error
   */
  public reportDatabaseError(
    error: Error,
    operation?: string,
    collection?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.reportError(error, {
      category: 'database',
      action: operation,
      metadata: {
        ...metadata,
        collection,
      },
      severity: 'high',
    });
  }

  /**
   * Report a payment error
   */
  public reportPaymentError(
    error: Error,
    paymentId?: string,
    amount?: number,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.reportError(error, {
      category: 'payment',
      action: 'payment_processing',
      metadata: {
        ...metadata,
        paymentId,
        amount,
      },
      severity: 'critical',
    });
  }

  /**
   * Report an authentication error
   */
  public reportAuthError(
    error: Error,
    action?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.reportError(error, {
      category: 'auth',
      action,
      metadata,
      severity: 'high',
    });
  }

  /**
   * Get error statistics
   */
  public async getErrorStats(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<{
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    criticalCount: number;
    unresolvedCount: number;
  }> {
    try {
      if (!getDb()) {
        throw new Error('Database not initialized');
      }

      const { collection, query, where, getDocs, orderBy, Timestamp } = await import('firebase/firestore');
      
      const cutoffTime = new Date();
      switch (timeframe) {
        case '24h':
          cutoffTime.setHours(cutoffTime.getHours() - 24);
          break;
        case '7d':
          cutoffTime.setDate(cutoffTime.getDate() - 7);
          break;
        case '30d':
          cutoffTime.setDate(cutoffTime.getDate() - 30);
          break;
      }

      const errorsQuery = query(
        collection(getDb(), 'errorReports'),
        where('createdAt', '>=', Timestamp.fromDate(cutoffTime)),
        orderBy('createdAt', 'desc')
      );

      const errorsSnap = await getDocs(errorsQuery);
      const errors = errorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ErrorReport[];

      const stats = {
        total: errors.length,
        byCategory: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
        criticalCount: 0,
        unresolvedCount: 0,
      };

      errors.forEach(error => {
        // Count by category
        stats.byCategory[error.context.category] = (stats.byCategory[error.context.category] || 0) + 1;
        
        // Count by severity
        stats.bySeverity[error.context.severity] = (stats.bySeverity[error.context.severity] || 0) + 1;
        
        // Count critical and unresolved
        if (error.context.severity === 'critical') {
          stats.criticalCount++;
        }
        if (!error.resolved) {
          stats.unresolvedCount++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        total: 0,
        byCategory: {},
        bySeverity: {},
        criticalCount: 0,
        unresolvedCount: 0,
      };
    }
  }

  /**
   * Mark an error as resolved
   */
  public async resolveError(errorId: string, resolvedBy: string, notes?: string): Promise<void> {
    try {
      if (!getDb()) {
        throw new Error('Database not initialized');
      }

      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      
      await updateDoc(doc(getDb(), 'errorReports', errorId), {
        resolved: true,
        resolvedAt: serverTimestamp(),
        resolvedBy,
        notes,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to resolve error:', error);
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.reportError(
          new Error(`Unhandled Promise Rejection: ${event.reason}`),
          {
            category: 'client',
            severity: 'high',
            metadata: { reason: event.reason },
          }
        );
      });

      // Handle global JavaScript errors
      window.addEventListener('error', (event) => {
        this.reportError(
          new Error(`Global Error: ${event.message}`),
          {
            category: 'client',
            severity: 'medium',
            metadata: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
            },
          }
        );
      });
    }
  }

  /**
   * Start batch processor for error reports
   */
  private startBatchProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.errorQueue.length > 0) {
        this.processBatch();
      }
    }, 5000); // Process every 5 seconds
  }

  /**
   * Add error to queue
   */
  private addToQueue(errorReport: ErrorReport): void {
    this.errorQueue.push(errorReport);
    
    // Prevent queue from growing too large
    if (this.errorQueue.length > this.MAX_QUEUE_SIZE) {
      this.errorQueue = this.errorQueue.slice(-this.MAX_QUEUE_SIZE);
    }
  }

  /**
   * Process batch of errors
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const batch = this.errorQueue.splice(0, this.BATCH_SIZE);
      
      for (const errorReport of batch) {
        await this.saveErrorReport(errorReport);
      }
    } catch (error) {
      console.error('Failed to process error batch:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Save error report to database
   */
  private async saveErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      if (!getDb()) {
        throw new Error('Database not initialized');
      }

      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      await addDoc(collection(getDb(), 'errorReports'), {
        ...errorReport,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to save error report:', error);
    }
  }

  /**
   * Send immediate alert for critical errors
   */
  private async sendImmediateAlert(errorReport: ErrorReport): Promise<void> {
    try {
      // In a real implementation, this would send alerts via:
      // - Email notifications
      // - Slack/Discord webhooks
      // - SMS alerts
      // - PagerDuty integration
      
      console.error('CRITICAL ERROR ALERT:', errorReport);
      
      // For now, we'll just log it
      // TODO: Implement actual alerting system
    } catch (error) {
      console.error('Failed to send immediate alert:', error);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string | undefined {
    try {
      const auth = getAuth();
      return auth.currentUser?.uid;
    } catch {
      return undefined;
    }
  }

  /**
   * Get current user role
   */
  private getCurrentUserRole(): string | undefined {
    try {
      // This would typically come from your user context or auth system
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }

    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }
}

// Export singleton instance
export const errorMonitoring = ErrorMonitoringService.getInstance();

// Export convenience functions
export const reportError = (error: Error | string, context?: Partial<ErrorContext>) =>
  errorMonitoring.reportError(error, context);

export const reportClientError = (error: Error, component?: string, action?: string, metadata?: Record<string, any>) =>
  errorMonitoring.reportClientError(error, component, action, metadata);

export const reportServerError = (error: Error, endpoint?: string, metadata?: Record<string, any>) =>
  errorMonitoring.reportServerError(error, endpoint, metadata);

export const reportDatabaseError = (error: Error, operation?: string, collection?: string, metadata?: Record<string, any>) =>
  errorMonitoring.reportDatabaseError(error, operation, collection, metadata);

export const reportPaymentError = (error: Error, paymentId?: string, amount?: number, metadata?: Record<string, any>) =>
  errorMonitoring.reportPaymentError(error, paymentId, amount, metadata);

export const reportAuthError = (error: Error, action?: string, metadata?: Record<string, any>) =>
  errorMonitoring.reportAuthError(error, action, metadata);

export const getErrorStats = (timeframe?: '24h' | '7d' | '30d') =>
  errorMonitoring.getErrorStats(timeframe);

export const resolveError = (errorId: string, resolvedBy: string, notes?: string) =>
  errorMonitoring.resolveError(errorId, resolvedBy, notes);
