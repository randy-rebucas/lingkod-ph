import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Admin session configuration
 */
export const ADMIN_SESSION_CONFIG = {
  // Admin sessions are shorter than regular user sessions
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes (vs 2 hours for regular users)
  WARNING_TIME: 5 * 60 * 1000, // 5 minutes before timeout
  MAX_INACTIVE_TIME: 15 * 60 * 1000, // 15 minutes of inactivity
  EXTEND_ON_ACTIVITY: true, // Extend session on admin activity
  REQUIRE_REAUTH_FOR_CRITICAL: true // Require re-authentication for critical operations
};

/**
 * Admin session data structure
 */
export interface AdminSession {
  adminId: string;
  sessionId: string;
  createdAt: Timestamp;
  lastActivity: Timestamp;
  expiresAt: Timestamp;
  isActive: boolean;
  ipAddress?: string;
  userAgent?: string;
  criticalOperationsCount: number;
  lastCriticalOperation?: Timestamp;
  requiresReauth: boolean;
}

/**
 * Admin session activity types
 */
export type AdminActivityType = 
  | 'login'
  | 'logout'
  | 'page_view'
  | 'user_management'
  | 'financial_operation'
  | 'system_configuration'
  | 'content_moderation'
  | 'critical_operation'
  | 'session_extended'
  | 'session_warning'
  | 'session_timeout';

/**
 * Admin session manager for enhanced security
 */
export class AdminSessionManager {
  private static readonly COLLECTION = 'adminSessions';
  private static readonly SESSION_PREFIX = 'admin_session_';

  /**
   * Create a new admin session
   */
  static async createSession(
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AdminSession> {
    const sessionId = `${this.SESSION_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ADMIN_SESSION_CONFIG.SESSION_TIMEOUT);

    const session: AdminSession = {
      adminId,
      sessionId,
      createdAt: serverTimestamp() as Timestamp,
      lastActivity: serverTimestamp() as Timestamp,
      expiresAt: Timestamp.fromDate(expiresAt),
      isActive: true,
      ipAddress,
      userAgent,
      criticalOperationsCount: 0,
      requiresReauth: false
    };

    await setDoc(doc(db, this.COLLECTION, sessionId), session);
    return session;
  }

  /**
   * Update session activity
   */
  static async updateActivity(
    sessionId: string,
    activityType: AdminActivityType,
    extendSession: boolean = false
  ): Promise<{ success: boolean; session?: AdminSession; warning?: boolean }> {
    try {
      const sessionRef = doc(db, this.COLLECTION, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        return { success: false };
      }

      const session = sessionDoc.data() as AdminSession;
      const now = new Date();
      const currentTime = Timestamp.fromDate(now);

      // Check if session is expired
      if (now > session.expiresAt.toDate()) {
        await this.invalidateSession(sessionId);
        return { success: false };
      }

      // Check for critical operations
      if (activityType === 'critical_operation') {
        session.criticalOperationsCount++;
        session.lastCriticalOperation = currentTime;
        
        // Require re-authentication after 5 critical operations
        if (session.criticalOperationsCount >= 5) {
          session.requiresReauth = true;
        }
      }

      // Update last activity
      session.lastActivity = currentTime;

      // Extend session if requested and within limits
      if (extendSession && ADMIN_SESSION_CONFIG.EXTEND_ON_ACTIVITY) {
        const newExpiresAt = new Date(now.getTime() + ADMIN_SESSION_CONFIG.SESSION_TIMEOUT);
        session.expiresAt = Timestamp.fromDate(newExpiresAt);
      }

      // Check if session needs warning
      const timeUntilExpiry = session.expiresAt.toDate().getTime() - now.getTime();
      const needsWarning = timeUntilExpiry <= ADMIN_SESSION_CONFIG.WARNING_TIME;

      await updateDoc(sessionRef, {
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        criticalOperationsCount: session.criticalOperationsCount,
        lastCriticalOperation: session.lastCriticalOperation,
        requiresReauth: session.requiresReauth
      });

      return { 
        success: true, 
        session: { ...session, lastActivity: currentTime, expiresAt: session.expiresAt },
        warning: needsWarning
      };
    } catch (error) {
      console.error('Error updating admin session activity:', error);
      return { success: false };
    }
  }

  /**
   * Validate admin session
   */
  static async validateSession(sessionId: string): Promise<{
    valid: boolean;
    session?: AdminSession;
    reason?: string;
  }> {
    try {
      const sessionRef = doc(db, this.COLLECTION, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        return { valid: false, reason: 'Session not found' };
      }

      const session = sessionDoc.data() as AdminSession;
      const now = new Date();

      // Check if session is active
      if (!session.isActive) {
        return { valid: false, reason: 'Session inactive' };
      }

      // Check if session is expired
      if (now > session.expiresAt.toDate()) {
        await this.invalidateSession(sessionId);
        return { valid: false, reason: 'Session expired' };
      }

      // Check for inactivity timeout
      const timeSinceLastActivity = now.getTime() - session.lastActivity.toDate().getTime();
      if (timeSinceLastActivity > ADMIN_SESSION_CONFIG.MAX_INACTIVE_TIME) {
        await this.invalidateSession(sessionId);
        return { valid: false, reason: 'Session inactive too long' };
      }

      return { valid: true, session };
    } catch (error) {
      console.error('Error validating admin session:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Invalidate admin session
   */
  static async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      const sessionRef = doc(db, this.COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        isActive: false,
        lastActivity: serverTimestamp() as Timestamp
      });
      return true;
    } catch (error) {
      console.error('Error invalidating admin session:', error);
      return false;
    }
  }

  /**
   * Get active admin sessions
   */
  static async getActiveSessions(adminId: string): Promise<AdminSession[]> {
    try {
      // This would typically use a query, but for simplicity we'll get all sessions
      // In production, you'd want to use a proper query with where clauses
      const sessions: AdminSession[] = [];
      // Implementation would depend on your specific needs
      return sessions;
    } catch (error) {
      console.error('Error getting active admin sessions:', error);
      return [];
    }
  }

  /**
   * Require re-authentication for critical operations
   */
  static async requireReauth(sessionId: string): Promise<boolean> {
    try {
      const sessionRef = doc(db, this.COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        requiresReauth: true,
        lastActivity: serverTimestamp() as Timestamp
      });
      return true;
    } catch (error) {
      console.error('Error setting reauth requirement:', error);
      return false;
    }
  }

  /**
   * Clear re-authentication requirement
   */
  static async clearReauthRequirement(sessionId: string): Promise<boolean> {
    try {
      const sessionRef = doc(db, this.COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        requiresReauth: false,
        criticalOperationsCount: 0,
        lastActivity: serverTimestamp() as Timestamp
      });
      return true;
    } catch (error) {
      console.error('Error clearing reauth requirement:', error);
      return false;
    }
  }

  /**
   * Get session time remaining
   */
  static getTimeRemaining(session: AdminSession): number {
    const now = new Date();
    const expiresAt = session.expiresAt.toDate();
    return Math.max(0, expiresAt.getTime() - now.getTime());
  }

  /**
   * Check if session needs warning
   */
  static needsWarning(session: AdminSession): boolean {
    const timeRemaining = this.getTimeRemaining(session);
    return timeRemaining <= ADMIN_SESSION_CONFIG.WARNING_TIME;
  }

  /**
   * Extend session
   */
  static async extendSession(sessionId: string): Promise<boolean> {
    try {
      const sessionRef = doc(db, this.COLLECTION, sessionId);
      const now = new Date();
      const newExpiresAt = new Date(now.getTime() + ADMIN_SESSION_CONFIG.SESSION_TIMEOUT);

      await updateDoc(sessionRef, {
        expiresAt: Timestamp.fromDate(newExpiresAt),
        lastActivity: serverTimestamp() as Timestamp
      });

      return true;
    } catch (error) {
      console.error('Error extending admin session:', error);
      return false;
    }
  }
}

/**
 * Admin session middleware for API routes
 */
export async function validateAdminSession(request: Request): Promise<{
  valid: boolean;
  session?: AdminSession;
  adminId?: string;
  error?: string;
}> {
  try {
    const sessionId = request.headers.get('x-admin-session-id');
    
    if (!sessionId) {
      return { valid: false, error: 'Admin session ID required' };
    }

    const validation = await AdminSessionManager.validateSession(sessionId);
    
    if (!validation.valid) {
      return { valid: false, error: validation.reason };
    }

    // Update activity
    await AdminSessionManager.updateActivity(sessionId, 'page_view');

    return {
      valid: true,
      session: validation.session,
      adminId: validation.session?.adminId
    };
  } catch (error) {
    console.error('Error validating admin session:', error);
    return { valid: false, error: 'Session validation failed' };
  }
}
