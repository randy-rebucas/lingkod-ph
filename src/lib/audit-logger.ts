import { getDb } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface AuditLogEntry {
  id?: string;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_AUDIT_LOGS === 'true';
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    if (!this.isEnabled) {
      console.log('[AUDIT]', entry);
      return;
    }

    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: serverTimestamp() as any
      };

      await addDoc(collection(getDb(), 'auditLogs'), auditEntry);
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Fallback to console logging
      console.log('[AUDIT]', entry);
    }
  }

  // Add missing logAction method for compatibility
  async logAction(action: string, userId: string, resource: string, details: Record<string, unknown> = {}) {
    await this.log({
      userId,
      userRole: (details.userRole as string) || 'unknown',
      action,
      resource,
      details,
      severity: 'low',
      success: true
    });
  }

  // Convenience methods for common audit events
  async logAuthentication(userId: string, userRole: string, success: boolean, details: any = {}) {
    await this.log({
      userId,
      userRole,
      action: 'authentication',
      resource: 'user',
      resourceId: userId,
      details,
      severity: success ? 'low' : 'medium',
      success
    });
  }

  async logBookingCreation(userId: string, userRole: string, bookingId: string, details: any = {}) {
    await this.log({
      userId,
      userRole,
      action: 'create',
      resource: 'booking',
      resourceId: bookingId,
      details,
      severity: 'medium',
      success: true
    });
  }

  async logBookingUpdate(userId: string, userRole: string, bookingId: string, details: any = {}) {
    await this.log({
      userId,
      userRole,
      action: 'update',
      resource: 'booking',
      resourceId: bookingId,
      details,
      severity: 'medium',
      success: true
    });
  }

  async logBookingCancellation(userId: string, userRole: string, bookingId: string, details: any = {}) {
    await this.log({
      userId,
      userRole,
      action: 'cancel',
      resource: 'booking',
      resourceId: bookingId,
      details,
      severity: 'medium',
      success: true
    });
  }

  async logJobPosting(userId: string, userRole: string, jobId: string, details: any = {}) {
    await this.log({
      userId,
      userRole,
      action: 'create',
      resource: 'job',
      resourceId: jobId,
      details,
      severity: 'medium',
      success: true
    });
  }

  async logMessageSent(userId: string, userRole: string, conversationId: string, details: any = {}) {
    await this.log({
      userId,
      userRole,
      action: 'send_message',
      resource: 'conversation',
      resourceId: conversationId,
      details,
      severity: 'low',
      success: true
    });
  }

  async logProfileUpdate(userId: string, userRole: string, details: any = {}) {
    await this.log({
      userId,
      userRole,
      action: 'update',
      resource: 'profile',
      resourceId: userId,
      details,
      severity: 'low',
      success: true
    });
  }

  async logPaymentAttempt(userId: string, userRole: string, bookingId: string, details: any = {}) {
    await this.log({
      userId,
      userRole,
      action: 'payment_attempt',
      resource: 'booking',
      resourceId: bookingId,
      details,
      severity: 'high',
      success: true
    });
  }

  async logSecurityEvent(userId: string, userRole: string, action: string, details: any = {}) {
    await this.log({
      userId,
      userRole,
      action,
      resource: 'security',
      details,
      severity: 'high',
      success: false
    });
  }

  async logDataAccess(userId: string, userRole: string, resource: string, resourceId: string, details: any = {}) {
    await this.log({
      userId,
      userRole,
      action: 'access',
      resource,
      resourceId,
      details,
      severity: 'low',
      success: true
    });
  }

  async logError(userId: string, userRole: string, action: string, error: Error, details: any = {}) {
    await this.log({
      userId,
      userRole,
      action,
      resource: 'system',
      details: {
        ...details,
        errorMessage: error.message,
        errorStack: error.stack
      },
      severity: 'medium',
      success: false,
      errorMessage: error.message
    });
  }

  // Method to retrieve audit logs (admin only)
  async getAuditLogs(
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      severity?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<AuditLogEntry[]> {
    try {
      let q = query(collection(getDb(), 'auditLogs'), orderBy('timestamp', 'desc'));

      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.action) {
        q = query(q, where('action', '==', filters.action));
      }
      if (filters.resource) {
        q = query(q, where('resource', '==', filters.resource));
      }
      if (filters.severity) {
        q = query(q, where('severity', '==', filters.severity));
      }

      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditLogEntry));
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Helper function to extract request metadata
export function extractRequestMetadata(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  const headers = request.headers;
  return {
    ipAddress: headers.get('x-forwarded-for') || 
               headers.get('x-real-ip') || 
               headers.get('cf-connecting-ip') ||
               'unknown',
    userAgent: headers.get('user-agent') || 'unknown'
  };
}