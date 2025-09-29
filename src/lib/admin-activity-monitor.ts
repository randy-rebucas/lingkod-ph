import { getDb  } from './firebase';
import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { sendEmail } from './email-service';

/**
 * Admin activity types
 */
export type AdminActivityType = 
  | 'login'
  | 'logout'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_status_changed'
  | 'payout_processed'
  | 'payment_verified'
  | 'settings_updated'
  | 'category_created'
  | 'category_updated'
  | 'category_deleted'
  | 'broadcast_sent'
  | 'email_campaign_sent'
  | 'backup_created'
  | 'report_processed'
  | 'job_managed'
  | 'booking_managed'
  | 'critical_operation'
  | 'security_event'
  | 'system_configuration'
  | 'data_export'
  | 'data_import';

/**
 * Admin activity severity levels
 */
export type AdminActivitySeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Admin activity data structure
 */
export interface AdminActivity {
  id: string;
  adminId: string;
  adminName: string;
  activityType: AdminActivityType;
  severity: AdminActivitySeverity;
  description: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
  sessionId?: string;
  targetUserId?: string;
  targetResourceId?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Admin activity alert configuration
 */
export interface AdminActivityAlert {
  id: string;
  activityType: AdminActivityType;
  severity: AdminActivitySeverity;
  enabled: boolean;
  emailNotification: boolean;
  threshold?: number; // For rate-based alerts
  timeWindow?: number; // In minutes
  recipients: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Admin activity monitoring configuration
 */
export const ADMIN_ACTIVITY_CONFIG = {
  // Activity retention
  RETENTION_DAYS: 90,
  
  // Alert thresholds
  CRITICAL_ACTIVITY_THRESHOLD: 5, // 5 critical activities in time window
  HIGH_ACTIVITY_THRESHOLD: 10, // 10 high activities in time window
  TIME_WINDOW_MINUTES: 15, // 15 minutes
  
  // Rate limiting for activity logging
  MAX_ACTIVITIES_PER_MINUTE: 100,
  
  // Alert recipients (admin emails)
  DEFAULT_ALERT_RECIPIENTS: ['admin@localpro.asia']
};

/**
 * Admin activity monitor
 */
export class AdminActivityMonitor {
  private static readonly COLLECTION = 'adminActivities';
  private static readonly ALERTS_COLLECTION = 'adminActivityAlerts';
  private static readonly METRICS_COLLECTION = 'adminActivityMetrics';

  /**
   * Log admin activity
   */
  static async logActivity(activity: Omit<AdminActivity, 'id' | 'timestamp'>): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const activityId = `admin_activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullActivity: AdminActivity = {
        ...activity,
        id: activityId,
        timestamp: serverTimestamp() as Timestamp
      };

      await setDoc(doc(getDb(), this.COLLECTION, activityId), fullActivity);

      // Check for alerts
      await this.checkAlerts(fullActivity);

      // Update metrics
      await this.updateMetrics(fullActivity);

      return { success: true };
    } catch (error) {
      console.error('Error logging admin activity:', error);
      return { success: false, error: 'Failed to log activity' };
    }
  }

  /**
   * Get admin activities with filtering
   */
  static async getActivities(filters: {
    adminId?: string;
    activityType?: AdminActivityType;
    severity?: AdminActivitySeverity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AdminActivity[]> {
    try {
      // This would typically use Firestore queries with proper filtering
      // For now, we'll return an empty array as a placeholder
      // In production, implement proper querying based on filters
      return [];
    } catch (error) {
      console.error('Error getting admin activities:', error);
      return [];
    }
  }

  /**
   * Get activity metrics for dashboard
   */
  static async getActivityMetrics(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<{
    totalActivities: number;
    activitiesByType: Record<AdminActivityType, number>;
    activitiesBySeverity: Record<AdminActivitySeverity, number>;
    topAdmins: Array<{ adminId: string; adminName: string; count: number }>;
    criticalActivities: number;
    failedActivities: number;
  }> {
    try {
      // This would typically query the metrics collection
      // For now, return default structure
      return {
        totalActivities: 0,
        activitiesByType: {} as Record<AdminActivityType, number>,
        activitiesBySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        topAdmins: [],
        criticalActivities: 0,
        failedActivities: 0
      };
    } catch (error) {
      console.error('Error getting activity metrics:', error);
      return {
        totalActivities: 0,
        activitiesByType: {} as Record<AdminActivityType, number>,
        activitiesBySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        topAdmins: [],
        criticalActivities: 0,
        failedActivities: 0
      };
    }
  }

  /**
   * Create activity alert
   */
  static async createAlert(alert: Omit<AdminActivityAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean;
    alertId?: string;
    error?: string;
  }> {
    try {
      const alertId = `admin_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullAlert: AdminActivityAlert = {
        ...alert,
        id: alertId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(doc(getDb(), this.ALERTS_COLLECTION, alertId), fullAlert);

      return { success: true, alertId };
    } catch (error) {
      console.error('Error creating activity alert:', error);
      return { success: false, error: 'Failed to create alert' };
    }
  }

  /**
   * Get activity alerts
   */
  static async getAlerts(): Promise<AdminActivityAlert[]> {
    try {
      // This would typically query the alerts collection
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting activity alerts:', error);
      return [];
    }
  }

  /**
   * Update activity alert
   */
  static async updateAlert(alertId: string, updates: Partial<AdminActivityAlert>): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await setDoc(doc(getDb(), this.ALERTS_COLLECTION, alertId), {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error('Error updating activity alert:', error);
      return { success: false, error: 'Failed to update alert' };
    }
  }

  /**
   * Delete activity alert
   */
  static async deleteAlert(alertId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, you'd use deleteDoc
      // await deleteDoc(doc(getDb(), this.ALERTS_COLLECTION, alertId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting activity alert:', error);
      return { success: false, error: 'Failed to delete alert' };
    }
  }

  /**
   * Check for alerts based on activity
   */
  private static async checkAlerts(activity: AdminActivity): Promise<void> {
    try {
      // Get relevant alerts
      const alerts = await this.getAlerts();
      
      for (const alert of alerts) {
        if (!alert.enabled) continue;
        
        // Check if activity matches alert criteria
        if (this.activityMatchesAlert(activity, alert)) {
          await this.triggerAlert(activity, alert);
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Check if activity matches alert criteria
   */
  private static activityMatchesAlert(activity: AdminActivity, alert: AdminActivityAlert): boolean {
    // Check activity type
    if (alert.activityType !== activity.activityType) {
      return false;
    }

    // Check severity
    if (alert.severity !== activity.severity) {
      return false;
    }

    // For rate-based alerts, check threshold
    if (alert.threshold && alert.timeWindow) {
      // This would check if the threshold is exceeded in the time window
      // Implementation would depend on your specific needs
    }

    return true;
  }

  /**
   * Trigger alert notification
   */
  private static async triggerAlert(activity: AdminActivity, alert: AdminActivityAlert): Promise<void> {
    try {
      if (alert.emailNotification && alert.recipients.length > 0) {
        await this.sendAlertEmail(activity, alert);
      }
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  /**
   * Send alert email
   */
  private static async sendAlertEmail(activity: AdminActivity, alert: AdminActivityAlert): Promise<void> {
    try {
      const subject = `Admin Activity Alert: ${activity.activityType}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Admin Activity Alert</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Activity Details</h3>
            <p><strong>Admin:</strong> ${activity.adminName} (${activity.adminId})</p>
            <p><strong>Activity:</strong> ${activity.activityType}</p>
            <p><strong>Severity:</strong> ${activity.severity.toUpperCase()}</p>
            <p><strong>Description:</strong> ${activity.description}</p>
            <p><strong>Timestamp:</strong> ${activity.timestamp.toDate().toLocaleString()}</p>
            <p><strong>IP Address:</strong> ${activity.ipAddress || 'Unknown'}</p>
            <p><strong>Success:</strong> ${activity.success ? 'Yes' : 'No'}</p>
            ${activity.errorMessage ? `<p><strong>Error:</strong> ${activity.errorMessage}</p>` : ''}
          </div>
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px;">
            <h4>Additional Details</h4>
            <pre style="background-color: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto;">
${JSON.stringify(activity.details, null, 2)}
            </pre>
          </div>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is an automated alert from LocalPro Admin Activity Monitor.
          </p>
        </div>
      `;

      for (const recipient of alert.recipients) {
        await sendEmail({
          to: recipient,
          subject,
          html
        });
      }
    } catch (error) {
      console.error('Error sending alert email:', error);
    }
  }

  /**
   * Update activity metrics
   */
  private static async updateMetrics(activity: AdminActivity): Promise<void> {
    try {
      // This would update real-time metrics
      // Implementation would depend on your specific needs
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  /**
   * Get activity severity for activity type
   */
  static getActivitySeverity(activityType: AdminActivityType): AdminActivitySeverity {
    const severityMap: Record<AdminActivityType, AdminActivitySeverity> = {
      // Critical operations
      'user_deleted': 'critical',
      'payout_processed': 'critical',
      'settings_updated': 'critical',
      'backup_created': 'critical',
      'system_configuration': 'critical',
      'data_export': 'critical',
      'data_import': 'critical',
      
      // High severity
      'user_created': 'high',
      'user_status_changed': 'high',
      'payment_verified': 'high',
      'broadcast_sent': 'high',
      'email_campaign_sent': 'high',
      'critical_operation': 'high',
      'security_event': 'high',
      
      // Medium severity
      'user_updated': 'medium',
      'category_created': 'medium',
      'category_updated': 'medium',
      'category_deleted': 'medium',
      'report_processed': 'medium',
      'job_managed': 'medium',
      'booking_managed': 'medium',
      
      // Low severity
      'login': 'low',
      'logout': 'low'
    };

    return severityMap[activityType] || 'low';
  }

  /**
   * Get activity description
   */
  static getActivityDescription(activityType: AdminActivityType, details: Record<string, any>): string {
    const descriptions: Record<AdminActivityType, string> = {
      'login': 'Admin logged in',
      'logout': 'Admin logged out',
      'user_created': `Created user: ${details.userName || details.email || 'Unknown'}`,
      'user_updated': `Updated user: ${details.userName || details.email || 'Unknown'}`,
      'user_deleted': `Deleted user: ${details.userName || details.email || 'Unknown'}`,
      'user_status_changed': `Changed user status: ${details.userName || 'Unknown'} to ${details.newStatus || 'Unknown'}`,
      'payout_processed': `Processed payout: ₱${details.amount || '0'} for ${details.providerName || 'Unknown'}`,
      'payment_verified': `Verified payment: ₱${details.amount || '0'} for ${details.clientName || 'Unknown'}`,
      'settings_updated': `Updated platform settings: ${details.settingType || 'General'}`,
      'category_created': `Created category: ${details.categoryName || 'Unknown'}`,
      'category_updated': `Updated category: ${details.categoryName || 'Unknown'}`,
      'category_deleted': `Deleted category: ${details.categoryName || 'Unknown'}`,
      'broadcast_sent': `Sent broadcast: ${details.messageLength || 0} characters`,
      'email_campaign_sent': `Sent email campaign: ${details.recipientCount || 0} recipients`,
      'backup_created': `Created backup: ${details.backupSize || 'Unknown size'}`,
      'report_processed': `Processed report: ${details.reportType || 'Unknown'}`,
      'job_managed': `Managed job: ${details.jobTitle || 'Unknown'}`,
      'booking_managed': `Managed booking: ${details.bookingId || 'Unknown'}`,
      'critical_operation': `Critical operation: ${details.operationType || 'Unknown'}`,
      'security_event': `Security event: ${details.eventType || 'Unknown'}`,
      'system_configuration': `System configuration: ${details.configType || 'Unknown'}`,
      'data_export': `Data export: ${details.exportType || 'Unknown'}`,
      'data_import': `Data import: ${details.importType || 'Unknown'}`
    };

    return descriptions[activityType] || `Admin activity: ${activityType}`;
  }
}

/**
 * Admin activity logging utility
 */
export class AdminActivityLogger {
  /**
   * Log admin activity with automatic severity and description
   */
  static async log(
    adminId: string,
    adminName: string,
    activityType: AdminActivityType,
    details: Record<string, any> = {},
    options: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      targetUserId?: string;
      targetResourceId?: string;
      success?: boolean;
      errorMessage?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const severity = AdminActivityMonitor.getActivitySeverity(activityType);
    const description = AdminActivityMonitor.getActivityDescription(activityType, details);

    await AdminActivityMonitor.logActivity({
      adminId,
      adminName,
      activityType,
      severity,
      description,
      details,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      sessionId: options.sessionId,
      targetUserId: options.targetUserId,
      targetResourceId: options.targetResourceId,
      success: options.success ?? true,
      errorMessage: options.errorMessage,
      metadata: options.metadata
    });
  }
}
