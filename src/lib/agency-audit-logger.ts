import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

export interface AgencyAuditLogEntry {
  id?: string;
  agencyId: string;
  agencyName: string;
  action: AgencyAction;
  targetType: 'provider' | 'booking' | 'job' | 'payout' | 'subscription' | 'profile' | 'system';
  targetId?: string;
  targetName?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'management' | 'financial' | 'security' | 'system' | 'compliance';
}

export type AgencyAction = 
  | 'provider_invited'
  | 'provider_removed'
  | 'provider_status_changed'
  | 'booking_created'
  | 'booking_updated'
  | 'booking_cancelled'
  | 'job_posted'
  | 'job_updated'
  | 'job_deleted'
  | 'payout_processed'
  | 'payout_rejected'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'subscription_cancelled'
  | 'profile_updated'
  | 'settings_changed'
  | 'data_exported'
  | 'security_event'
  | 'compliance_check'
  | 'system_access';

export class AgencyAuditLogger {
  private agencyId: string;
  private agencyName: string;

  constructor(agencyId: string, agencyName: string) {
    this.agencyId = agencyId;
    this.agencyName = agencyName;
  }

  /**
   * Log an agency action with comprehensive details
   */
  async logAction(
    action: AgencyAction,
    targetType: AgencyAuditLogEntry['targetType'],
    details: Record<string, any>,
    options: {
      targetId?: string;
      targetName?: string;
      severity?: AgencyAuditLogEntry['severity'];
      category?: AgencyAuditLogEntry['category'];
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<void> {
    try {
      const logEntry: Omit<AgencyAuditLogEntry, 'id'> = {
        agencyId: this.agencyId,
        agencyName: this.agencyName,
        action,
        targetType,
        targetId: options.targetId,
        targetName: options.targetName,
        details,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        timestamp: serverTimestamp() as Timestamp,
        severity: options.severity || this.getDefaultSeverity(action),
        category: options.category || this.getDefaultCategory(action),
      };

      await addDoc(collection(db, 'agencyAuditLogs'), logEntry);
    } catch (error) {
      console.error('Failed to log agency action:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log provider management actions
   */
  async logProviderAction(
    action: 'provider_invited' | 'provider_removed' | 'provider_status_changed',
    providerId: string,
    providerName: string,
    details: Record<string, any>,
    options: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    await this.logAction(
      action,
      'provider',
      details,
      {
        targetId: providerId,
        targetName: providerName,
        severity: action === 'provider_removed' ? 'high' : 'medium',
        category: 'management',
        ...options,
      }
    );
  }

  /**
   * Log financial operations
   */
  async logFinancialAction(
    action: 'payout_processed' | 'payout_rejected',
    targetId: string,
    targetName: string,
    amount: number,
    details: Record<string, any>,
    options: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    await this.logAction(
      action,
      'payout',
      { ...details, amount },
      {
        targetId,
        targetName,
        severity: 'high',
        category: 'financial',
        ...options,
      }
    );
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    action: 'security_event',
    details: Record<string, any>,
    severity: 'medium' | 'high' | 'critical' = 'medium',
    options: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    await this.logAction(
      action,
      'system',
      details,
      {
        severity,
        category: 'security',
        ...options,
      }
    );
  }

  /**
   * Log subscription changes
   */
  async logSubscriptionChange(
    action: 'subscription_upgraded' | 'subscription_downgraded' | 'subscription_cancelled',
    fromPlan: string,
    toPlan: string,
    details: Record<string, any>,
    options: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    await this.logAction(
      action,
      'subscription',
      { ...details, fromPlan, toPlan },
      {
        severity: 'high',
        category: 'system',
        ...options,
      }
    );
  }

  /**
   * Get audit logs for the agency
   */
  async getAuditLogs(
    filters: {
      action?: AgencyAction;
      targetType?: AgencyAuditLogEntry['targetType'];
      severity?: AgencyAuditLogEntry['severity'];
      category?: AgencyAuditLogEntry['category'];
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<AgencyAuditLogEntry[]> {
    try {
      let q = query(
        collection(db, 'agencyAuditLogs'),
        where('agencyId', '==', this.agencyId),
        orderBy('timestamp', 'desc')
      );

      if (filters.action) {
        q = query(q, where('action', '==', filters.action));
      }

      if (filters.targetType) {
        q = query(q, where('targetType', '==', filters.targetType));
      }

      if (filters.severity) {
        q = query(q, where('severity', '==', filters.severity));
      }

      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AgencyAuditLogEntry[];
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Get security events for the agency
   */
  async getSecurityEvents(limit: number = 50): Promise<AgencyAuditLogEntry[]> {
    return this.getAuditLogs({
      category: 'security',
      limit,
    });
  }

  /**
   * Get financial audit trail
   */
  async getFinancialAuditTrail(limit: number = 100): Promise<AgencyAuditLogEntry[]> {
    return this.getAuditLogs({
      category: 'financial',
      limit,
    });
  }

  /**
   * Get provider management history
   */
  async getProviderManagementHistory(limit: number = 100): Promise<AgencyAuditLogEntry[]> {
    return this.getAuditLogs({
      targetType: 'provider',
      limit,
    });
  }

  /**
   * Get default severity for an action
   */
  private getDefaultSeverity(action: AgencyAction): AgencyAuditLogEntry['severity'] {
    const severityMap: Record<AgencyAction, AgencyAuditLogEntry['severity']> = {
      provider_invited: 'low',
      provider_removed: 'high',
      provider_status_changed: 'medium',
      booking_created: 'low',
      booking_updated: 'low',
      booking_cancelled: 'medium',
      job_posted: 'low',
      job_updated: 'low',
      job_deleted: 'medium',
      payout_processed: 'high',
      payout_rejected: 'high',
      subscription_upgraded: 'high',
      subscription_downgraded: 'high',
      subscription_cancelled: 'critical',
      profile_updated: 'low',
      settings_changed: 'medium',
      data_exported: 'medium',
      security_event: 'high',
      compliance_check: 'medium',
      system_access: 'low',
    };

    return severityMap[action] || 'low';
  }

  /**
   * Get default category for an action
   */
  private getDefaultCategory(action: AgencyAction): AgencyAuditLogEntry['category'] {
    const categoryMap: Record<AgencyAction, AgencyAuditLogEntry['category']> = {
      provider_invited: 'management',
      provider_removed: 'management',
      provider_status_changed: 'management',
      booking_created: 'system',
      booking_updated: 'system',
      booking_cancelled: 'system',
      job_posted: 'system',
      job_updated: 'system',
      job_deleted: 'system',
      payout_processed: 'financial',
      payout_rejected: 'financial',
      subscription_upgraded: 'system',
      subscription_downgraded: 'system',
      subscription_cancelled: 'system',
      profile_updated: 'system',
      settings_changed: 'system',
      data_exported: 'compliance',
      security_event: 'security',
      compliance_check: 'compliance',
      system_access: 'system',
    };

    return categoryMap[action] || 'system';
  }

  /**
   * Extract request metadata for logging
   */
  static extractRequestMetadata(request: Request): {
    ipAddress?: string;
    userAgent?: string;
  } {
    return {
      ipAddress: request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };
  }
}
