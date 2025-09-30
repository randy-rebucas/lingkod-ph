import { getDb  } from './firebase';
import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { sendEmail } from './email-service';

/**
 * Security event types
 */
export type SecurityEventType = 
  | 'failed_login_attempt'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'data_breach_attempt'
  | 'admin_session_expired'
  | 'admin_session_locked'
  | 'critical_operation_attempt'
  | 'backup_verification_failed'
  | 'system_configuration_change'
  | 'user_privilege_escalation'
  | 'bulk_data_access'
  | 'unusual_login_location'
  | 'multiple_failed_attempts'
  | 'admin_account_compromise'
  | 'system_anomaly';

/**
 * Security event severity levels
 */
export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Security event data structure
 */
export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  title: string;
  description: string;
  details: Record<string, any>;
  adminId?: string;
  adminName?: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: Timestamp;
  resolved: boolean;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
  resolution?: string;
  metadata: Record<string, any>;
}

/**
 * Security notification configuration
 */
export const SECURITY_NOTIFICATION_CONFIG = {
  // Notification channels
  EMAIL_NOTIFICATIONS: true,
  REAL_TIME_ALERTS: true,
  
  // Alert thresholds
  CRITICAL_EVENT_THRESHOLD: 1, // Immediate alert for critical events
  HIGH_EVENT_THRESHOLD: 3, // Alert after 3 high severity events
  MEDIUM_EVENT_THRESHOLD: 10, // Alert after 10 medium severity events
  TIME_WINDOW_MINUTES: 15, // 15 minutes
  
  // Recipients
  CRITICAL_RECIPIENTS: ['admin@localpro.asia'],
  HIGH_RECIPIENTS: ['admin@localpro.asia'],
  MEDIUM_RECIPIENTS: ['admin@localpro.asia'],
  
  // Rate limiting
  MAX_NOTIFICATIONS_PER_HOUR: 50,
  NOTIFICATION_COOLDOWN_MINUTES: 5
};

/**
 * Security notification manager
 */
export class AdminSecurityNotifications {
  private static readonly COLLECTION = 'securityEvents';
  private static readonly NOTIFICATIONS_COLLECTION = 'securityNotifications';
  private static readonly ALERTS_COLLECTION = 'securityAlerts';

  /**
   * Create a security event
   */
  static async createSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<{
    success: boolean;
    eventId?: string;
    error?: string;
  }> {
    try {
      const eventId = `security_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullEvent: SecurityEvent = {
        ...event,
        id: eventId,
        timestamp: serverTimestamp() as Timestamp,
        resolved: false
      };

      await setDoc(doc(getDb(), this.COLLECTION, eventId), fullEvent);

      // Check if notification should be sent
      await this.checkAndSendNotification(fullEvent);

      return { success: true, eventId };
    } catch (error) {
      console.error('Error creating security event:', error);
      return { success: false, error: 'Failed to create security event' };
    }
  }

  /**
   * Get security events with filtering
   */
  static async getSecurityEvents(filters: {
    eventType?: SecurityEventType;
    severity?: SecurityEventSeverity;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<SecurityEvent[]> {
    // This would typically use Firestore queries with proper filtering
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Resolve a security event
   */
  static async resolveSecurityEvent(
    eventId: string,
    resolvedBy: string,
    resolution: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await setDoc(doc(getDb(), this.COLLECTION, eventId), {
        resolved: true,
        resolvedAt: serverTimestamp() as Timestamp,
        resolvedBy,
        resolution
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error('Error resolving security event:', error);
      return { success: false, error: 'Failed to resolve security event' };
    }
  }

  /**
   * Get security event statistics
   */
  static async getSecurityStatistics(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<{
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecurityEventSeverity, number>;
    resolvedEvents: number;
    unresolvedEvents: number;
    criticalEvents: number;
    recentEvents: SecurityEvent[];
  }> {
    try {
      // This would typically query the events collection
      // For now, return default structure
      return {
        totalEvents: 0,
        eventsByType: {} as Record<SecurityEventType, number>,
        eventsBySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        resolvedEvents: 0,
        unresolvedEvents: 0,
        criticalEvents: 0,
        recentEvents: []
      };
    } catch (error) {
      console.error('Error getting security statistics:', error);
      return {
        totalEvents: 0,
        eventsByType: {} as Record<SecurityEventType, number>,
        eventsBySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        resolvedEvents: 0,
        unresolvedEvents: 0,
        criticalEvents: 0,
        recentEvents: []
      };
    }
  }

  /**
   * Check and send notification based on event
   */
  private static async checkAndSendNotification(event: SecurityEvent): Promise<void> {
    try {
      // Check if notification should be sent based on severity and thresholds
      const shouldNotify = await this.shouldSendNotification(event);
      
      if (shouldNotify) {
        await this.sendSecurityNotification(event);
      }
    } catch (error) {
      console.error('Error checking and sending notification:', error);
    }
  }

  /**
   * Determine if notification should be sent
   */
  private static async shouldSendNotification(event: SecurityEvent): Promise<boolean> {
    try {
      // Always notify for critical events
      if (event.severity === 'critical') {
        return true;
      }

      // Check rate limiting
      const recentNotifications = await this.getRecentNotifications(event.eventType);
      if (recentNotifications >= SECURITY_NOTIFICATION_CONFIG.MAX_NOTIFICATIONS_PER_HOUR) {
        return false;
      }

      // Check thresholds based on severity
      const recentEvents = await this.getRecentEvents(event.eventType, event.severity);
      
      switch (event.severity) {
        case 'high':
          return recentEvents >= SECURITY_NOTIFICATION_CONFIG.HIGH_EVENT_THRESHOLD;
        case 'medium':
          return recentEvents >= SECURITY_NOTIFICATION_CONFIG.MEDIUM_EVENT_THRESHOLD;
        case 'low':
          return false; // Don't notify for low severity events
        default:
          return false;
      }
    } catch (error) {
      console.error('Error determining notification need:', error);
      return false;
    }
  }

  /**
   * Send security notification
   */
  private static async sendSecurityNotification(event: SecurityEvent): Promise<void> {
    try {
      const recipients = this.getNotificationRecipients(event.severity);
      
      if (recipients.length === 0) {
        return;
      }

      const subject = `Security Alert: ${event.title}`;
      const html = this.generateNotificationHTML(event);

      for (const recipient of recipients) {
        await sendEmail({
          to: recipient,
          subject,
          html
        });
      }

      // Log the notification
      await this.logNotification(event, recipients);
    } catch (error) {
      console.error('Error sending security notification:', error);
    }
  }

  /**
   * Get notification recipients based on severity
   */
  private static getNotificationRecipients(severity: SecurityEventSeverity): string[] {
    switch (severity) {
      case 'critical':
        return SECURITY_NOTIFICATION_CONFIG.CRITICAL_RECIPIENTS;
      case 'high':
        return SECURITY_NOTIFICATION_CONFIG.HIGH_RECIPIENTS;
      case 'medium':
        return SECURITY_NOTIFICATION_CONFIG.MEDIUM_RECIPIENTS;
      case 'low':
        return [];
      default:
        return [];
    }
  }

  /**
   * Generate notification HTML
   */
  private static generateNotificationHTML(event: SecurityEvent): string {
    const severityColor = {
      critical: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#6c757d'
    }[event.severity];

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${severityColor}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Security Alert</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Severity: ${event.severity.toUpperCase()}</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #333; margin-top: 0;">${event.title}</h2>
          <p style="color: #666; line-height: 1.6;">${event.description}</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Event Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Event Type:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${event.eventType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Timestamp:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${event.timestamp.toDate().toLocaleString()}</td>
              </tr>
              ${event.adminId ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Admin:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${event.adminName || event.adminId}</td>
                </tr>
              ` : ''}
              ${event.userId ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">User:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${event.userName || event.userId}</td>
                </tr>
              ` : ''}
              ${event.ipAddress ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">IP Address:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${event.ipAddress}</td>
                </tr>
              ` : ''}
              ${event.sessionId ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Session ID:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-family: monospace; font-size: 12px;">${event.sessionId}</td>
                </tr>
              ` : ''}
            </table>
          </div>

          ${Object.keys(event.details).length > 0 ? `
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Additional Details</h3>
              <pre style="background-color: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; font-size: 12px;">
${JSON.stringify(event.details, null, 2)}
              </pre>
            </div>
          ` : ''}

          <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Recommended Actions</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${this.getRecommendedActions(event).map(action => `<li>${action}</li>`).join('')}
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/security-logs" 
               style="background-color: ${severityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Security Logs
            </a>
          </div>
        </div>
        
        <hr>
        <p style="color: #666; font-size: 12px; text-align: center;">
          This is an automated security alert from LocalPro Admin Panel.<br>
          If you believe this is an error, please contact the system administrator.
        </p>
      </div>
    `;
  }

  /**
   * Get recommended actions for security event
   */
  private static getRecommendedActions(event: SecurityEvent): string[] {
    const actions: string[] = [];

    switch (event.eventType) {
      case 'failed_login_attempt':
        actions.push('Review login attempt details');
        actions.push('Check if account is compromised');
        actions.push('Consider implementing additional security measures');
        break;
      case 'suspicious_activity':
        actions.push('Investigate the suspicious activity');
        actions.push('Review user permissions and access logs');
        actions.push('Consider temporary account suspension if necessary');
        break;
      case 'rate_limit_exceeded':
        actions.push('Review rate limiting configuration');
        actions.push('Check for potential abuse or automated attacks');
        break;
      case 'unauthorized_access':
        actions.push('Immediately revoke unauthorized access');
        actions.push('Review and update access controls');
        actions.push('Investigate how unauthorized access was obtained');
        break;
      case 'admin_session_expired':
        actions.push('Verify admin session management');
        actions.push('Check for potential security issues');
        break;
      case 'critical_operation_attempt':
        actions.push('Verify the critical operation was authorized');
        actions.push('Review operation logs and details');
        actions.push('Consider implementing additional approval processes');
        break;
      case 'backup_verification_failed':
        actions.push('Immediately investigate backup integrity');
        actions.push('Create new backup if necessary');
        actions.push('Review backup verification process');
        break;
      default:
        actions.push('Review event details and take appropriate action');
        actions.push('Monitor for similar events');
    }

    return actions;
  }

  /**
   * Log notification
   */
  private static async logNotification(event: SecurityEvent, recipients: string[]): Promise<void> {
    try {
      const notificationId = `notification_${event.id}_${Date.now()}`;
      
      await setDoc(doc(getDb(), this.NOTIFICATIONS_COLLECTION, notificationId), {
        eventId: event.id,
        eventType: event.eventType,
        severity: event.severity,
        recipients,
        sentAt: serverTimestamp() as Timestamp,
        notificationType: 'email'
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Get recent notifications count
   */
  private static async getRecentNotifications(eventType: SecurityEventType): Promise<number> {
    // This would typically query the notifications collection
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Get recent events count
   */
  private static async getRecentEvents(eventType: SecurityEventType, severity: SecurityEventSeverity): Promise<number> {
    // This would typically query the events collection
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Create real-time security alert
   */
  static async createRealTimeAlert(event: SecurityEvent): Promise<void> {
    try {
      if (!SECURITY_NOTIFICATION_CONFIG.REAL_TIME_ALERTS) {
        return;
      }

      // TODO: Implement real-time alert integration
      // This would typically integrate with real-time notification systems
      // like WebSocket, Server-Sent Events, or push notifications
      console.log('Real-time security alert:', event);
    } catch (error) {
      console.error('Error creating real-time alert:', error);
    }
  }
}

/**
 * Security event logger utility
 */
export class SecurityEventLogger {
  /**
   * Log security event with automatic severity determination
   */
  static async log(
    eventType: SecurityEventType,
    title: string,
    description: string,
    details: Record<string, any> = {},
    options: {
      adminId?: string;
      adminName?: string;
      userId?: string;
      userName?: string;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const severity = this.getEventSeverity(eventType);
    
    await AdminSecurityNotifications.createSecurityEvent({
      eventType,
      severity,
      title,
      description,
      details,
      adminId: options.adminId,
      adminName: options.adminName,
      userId: options.userId,
      userName: options.userName,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      sessionId: options.sessionId,
      metadata: options.metadata || {}
    });
  }

  /**
   * Get event severity based on event type
   */
  private static getEventSeverity(eventType: SecurityEventType): SecurityEventSeverity {
    const severityMap: Record<SecurityEventType, SecurityEventSeverity> = {
      'admin_account_compromise': 'critical',
      'data_breach_attempt': 'critical',
      'backup_verification_failed': 'critical',
      'system_anomaly': 'critical',
      
      'unauthorized_access': 'high',
      'user_privilege_escalation': 'high',
      'critical_operation_attempt': 'high',
      'admin_session_locked': 'high',
      'bulk_data_access': 'high',
      
      'suspicious_activity': 'medium',
      'rate_limit_exceeded': 'medium',
      'multiple_failed_attempts': 'medium',
      'unusual_login_location': 'medium',
      'system_configuration_change': 'medium',
      
      'failed_login_attempt': 'low',
      'admin_session_expired': 'low'
    };

    return severityMap[eventType] || 'medium';
  }
}
