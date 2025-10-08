'use server';

import { getDb } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc, query, where, getDocs, limit, deleteDoc } from 'firebase/firestore';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getUserSettings, updateUserSettings } from './user-settings-service';
import { sendVerificationCode } from './sms-service';
import { sendEmail } from './email-service';
import crypto from 'crypto';

export interface TwoFactorSetup {
  userId: string;
  method: 'sms' | 'email' | 'app';
  secret?: string; // For TOTP apps
  backupCodes: string[];
  isEnabled: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export interface LoginAttempt {
  userId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  location?: string;
  deviceInfo?: string;
}

export interface SecurityEvent {
  userId: string;
  eventType: 'login' | 'logout' | 'password_change' | '2fa_enabled' | '2fa_disabled' | 'suspicious_activity' | 'account_locked';
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PasswordStrengthResult {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export class SecurityService {
  private static readonly TWO_FACTOR_COLLECTION = 'twoFactorAuth';
  private static readonly LOGIN_ATTEMPTS_COLLECTION = 'loginAttempts';
  private static readonly SECURITY_EVENTS_COLLECTION = 'securityEvents';
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Setup two-factor authentication
   */
  static async setupTwoFactor(userId: string, method: 'sms' | 'email' | 'app'): Promise<{
    success: boolean;
    secret?: string;
    qrCode?: string;
    backupCodes?: string[];
    error?: string;
  }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      // Check if 2FA is already enabled
      const existingSetup = await this.getTwoFactorSetup(userId);
      if (existingSetup?.isEnabled) {
        return { success: false, error: 'Two-factor authentication is already enabled' };
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      let secret: string | undefined;
      let qrCode: string | undefined;

      if (method === 'app') {
        // Generate TOTP secret
        secret = this.generateTOTPSecret();
        qrCode = this.generateQRCode(userId, secret);
      }

      // Create 2FA setup
      const twoFactorSetup: TwoFactorSetup = {
        userId,
        method,
        secret,
        backupCodes,
        isEnabled: false,
        createdAt: new Date()
      };

      await setDoc(doc(getDb(), this.TWO_FACTOR_COLLECTION, userId), {
        ...twoFactorSetup,
        createdAt: serverTimestamp()
      });

      // Send verification code
      if (method === 'sms') {
        const userSettings = await getUserSettings(userId);
        if (!userSettings.notifications.sms.phoneVerified) {
          return { success: false, error: 'Phone number not verified' };
        }
        
        const verificationCode = this.generateVerificationCode();
        await this.sendSMSVerificationCode(userSettings.notifications.sms.phoneNumber!, verificationCode);
        await this.storeVerificationCode(userId, verificationCode);
      } else if (method === 'email') {
        const userSettings = await getUserSettings(userId);
        const verificationCode = this.generateVerificationCode();
        await this.sendEmailVerificationCode(userSettings.account.email, verificationCode);
        await this.storeVerificationCode(userId, verificationCode);
      }

      return {
        success: true,
        secret,
        qrCode,
        backupCodes
      };

    } catch (error) {
      console.error('Error setting up two-factor authentication:', error);
      return { success: false, error: 'Failed to setup two-factor authentication' };
    }
  }

  /**
   * Verify and enable two-factor authentication
   */
  static async verifyAndEnableTwoFactor(
    userId: string,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      // Verify the code
      const isValid = await this.verifyTwoFactorCode(userId, verificationCode);
      if (!isValid) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Enable 2FA
      await updateDoc(doc(getDb(), this.TWO_FACTOR_COLLECTION, userId), {
        isEnabled: true,
        enabledAt: serverTimestamp()
      });

      // Update user settings
      const currentSettings = await getUserSettings(userId);
      if (currentSettings) {
        await updateUserSettings(userId, {
          account: {
            ...currentSettings.account,
            security: {
              ...currentSettings.account.security,
              twoFactorEnabled: true
            }
          }
        });
      }

      // Log security event
      await this.logSecurityEvent(userId, '2fa_enabled', 'Two-factor authentication enabled');

      return { success: true };

    } catch (error) {
      console.error('Error verifying two-factor authentication:', error);
      return { success: false, error: 'Failed to verify two-factor authentication' };
    }
  }

  /**
   * Disable two-factor authentication
   */
  static async disableTwoFactor(userId: string, password: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Verify password
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || user.uid !== userId) {
        return { success: false, error: 'User not authenticated' };
      }

      if (!user.email) {
        return { success: false, error: 'User email not found' };
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Disable 2FA
      await updateDoc(doc(getDb(), this.TWO_FACTOR_COLLECTION, userId), {
        isEnabled: false,
        disabledAt: serverTimestamp()
      });

      // Update user settings
      const currentSettings = await getUserSettings(userId);
      if (currentSettings) {
        await updateUserSettings(userId, {
          account: {
            ...currentSettings.account,
            security: {
              ...currentSettings.account.security,
              twoFactorEnabled: false
            }
          }
        });
      }

      // Log security event
      await this.logSecurityEvent(userId, '2fa_disabled', 'Two-factor authentication disabled');

      return { success: true };

    } catch (error) {
      console.error('Error disabling two-factor authentication:', error);
      return { success: false, error: 'Failed to disable two-factor authentication' };
    }
  }

  /**
   * Verify two-factor authentication code
   */
  static async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    try {
      if (!getDb()) {
        return false;
      }

      // Get 2FA setup
      const twoFactorSetup = await this.getTwoFactorSetup(userId);
      if (!twoFactorSetup || !twoFactorSetup.isEnabled) {
        return false;
      }

      // Check backup codes first
      if (twoFactorSetup.backupCodes.includes(code)) {
        // Remove used backup code
        const updatedBackupCodes = twoFactorSetup.backupCodes.filter(c => c !== code);
        await updateDoc(doc(getDb(), this.TWO_FACTOR_COLLECTION, userId), {
          backupCodes: updatedBackupCodes,
          lastUsed: serverTimestamp()
        });
        return true;
      }

      // Verify based on method
      switch (twoFactorSetup.method) {
        case 'sms':
        case 'email':
          return await this.verifyVerificationCode(userId, code);
        case 'app':
          return this.verifyTOTPCode(twoFactorSetup.secret!, code);
        default:
          return false;
      }

    } catch (error) {
      console.error('Error verifying two-factor code:', error);
      return false;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user || user.uid !== userId) {
        return { success: false, error: 'User not authenticated' };
      }

      if (!user.email) {
        return { success: false, error: 'User email not found' };
      }

      // Validate new password strength
      const strengthResult = this.checkPasswordStrength(newPassword);
      if (!strengthResult.isStrong) {
        return { success: false, error: `Password is too weak: ${strengthResult.feedback.join(', ')}` };
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Log security event
      await this.logSecurityEvent(userId, 'password_change', 'Password changed successfully');

      return { success: true };

    } catch (error: any) {
      console.error('Error changing password:', error);
      
      if (error.code === 'auth/wrong-password') {
        return { success: false, error: 'Current password is incorrect' };
      } else if (error.code === 'auth/weak-password') {
        return { success: false, error: 'New password is too weak' };
      } else if (error.code === 'auth/requires-recent-login') {
        return { success: false, error: 'Please log in again to change your password' };
      }
      
      return { success: false, error: 'Failed to change password' };
    }
  }

  /**
   * Record login attempt
   */
  static async recordLoginAttempt(
    userId: string,
    success: boolean,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      if (!getDb()) return;

      const loginAttempt: LoginAttempt = {
        userId,
        ipAddress,
        userAgent,
        success,
        timestamp: new Date(),
        location: await this.getLocationFromIP(ipAddress),
        deviceInfo: this.parseUserAgent(userAgent)
      };

      await addDoc(collection(getDb(), this.LOGIN_ATTEMPTS_COLLECTION), {
        ...loginAttempt,
        timestamp: serverTimestamp()
      });

      // Check for suspicious activity
      if (!success) {
        await this.checkSuspiciousActivity(userId, ipAddress);
      }

    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  }

  /**
   * Check if account is locked
   */
  static async isAccountLocked(userId: string): Promise<{
    locked: boolean;
    unlockTime?: Date;
    reason?: string;
  }> {
    try {
      if (!getDb()) {
        return { locked: false };
      }

      // Get recent failed login attempts
      const recentAttempts = await this.getRecentLoginAttempts(userId, 5);
      const failedAttempts = recentAttempts.filter(attempt => !attempt.success);

      if (failedAttempts.length >= this.MAX_LOGIN_ATTEMPTS) {
        const lastAttempt = failedAttempts[failedAttempts.length - 1];
        const lockoutEnd = new Date(lastAttempt.timestamp.getTime() + this.LOCKOUT_DURATION);
        
        if (new Date() < lockoutEnd) {
          return {
            locked: true,
            unlockTime: lockoutEnd,
            reason: 'Too many failed login attempts'
          };
        }
      }

      return { locked: false };

    } catch (error) {
      console.error('Error checking account lock status:', error);
      return { locked: false };
    }
  }

  /**
   * Get security events for user
   */
  static async getSecurityEvents(userId: string, limitCount: number = 50): Promise<SecurityEvent[]> {
    try {
      if (!getDb()) {
        return [];
      }

      const eventsQuery = query(
        collection(getDb(), this.SECURITY_EVENTS_COLLECTION),
        where('userId', '==', userId),
        limit(limitCount)
      );

      const eventsSnap = await getDocs(eventsQuery);
      return eventsSnap.docs.map(doc => ({
        ...doc.data()
      } as SecurityEvent));

    } catch (error) {
      console.error('Error getting security events:', error);
      return [];
    }
  }

  /**
   * Check password strength
   */
  static checkPasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score++;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Password should contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('Password should contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('Password should contain at least one number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score++;
    } else {
      feedback.push('Password should contain at least one special character');
    }

    return {
      score,
      feedback,
      isStrong: score >= 4
    };
  }

  /**
   * Get two-factor setup
   */
  private static async getTwoFactorSetup(userId: string): Promise<TwoFactorSetup | null> {
    try {
      if (!getDb()) return null;
      
      const twoFactorDoc = await getDoc(doc(getDb(), this.TWO_FACTOR_COLLECTION, userId));
      if (!twoFactorDoc.exists()) return null;
      
      return twoFactorDoc.data() as TwoFactorSetup;
      
    } catch (error) {
      console.error('Error getting two-factor setup:', error);
      return null;
    }
  }

  /**
   * Generate backup codes
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }

  /**
   * Generate TOTP secret
   */
  private static generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * Generate QR code for TOTP
   */
  private static generateQRCode(userId: string, secret: string): string {
    // This would typically use a QR code library
    // For now, return a placeholder
    return `otpauth://totp/LocalPro:${userId}?secret=${secret}&issuer=LocalPro`;
  }

  /**
   * Verify TOTP code
   */
  private static verifyTOTPCode(_secret: string, _code: string): boolean {
    // This would typically use a TOTP library like speakeasy
    // For now, return true for demonstration
    return true;
  }

  /**
   * Generate verification code
   */
  private static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store verification code
   */
  private static async storeVerificationCode(userId: string, code: string): Promise<void> {
    try {
      if (!getDb()) return;
      
      await setDoc(doc(getDb(), 'verificationCodes', userId), {
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        createdAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error storing verification code:', error);
    }
  }

  /**
   * Verify verification code
   */
  private static async verifyVerificationCode(userId: string, code: string): Promise<boolean> {
    try {
      if (!getDb()) return false;
      
      const codeDoc = await getDoc(doc(getDb(), 'verificationCodes', userId));
      if (!codeDoc.exists()) return false;
      
      const codeData = codeDoc.data();
      if (codeData.code !== code) return false;
      
      if (new Date() > codeData.expiresAt.toDate()) return false;
      
      // Delete used code
      await deleteDoc(doc(getDb(), 'verificationCodes', userId));
      
      return true;
      
    } catch (error) {
      console.error('Error verifying verification code:', error);
      return false;
    }
  }

  /**
   * Send SMS verification code
   */
  private static async sendSMSVerificationCode(phoneNumber: string, code: string): Promise<void> {
    try {
      await sendVerificationCode(phoneNumber, code);
    } catch (error) {
      console.error('Error sending SMS verification code:', error);
    }
  }

  /**
   * Send email verification code
   */
  private static async sendEmailVerificationCode(email: string, code: string): Promise<void> {
    try {
      await sendEmail({
        to: email,
        subject: 'Two-Factor Authentication Verification Code',
        html: `
          <h2>Two-Factor Authentication Verification Code</h2>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `
      });
    } catch (error) {
      console.error('Error sending email verification code:', error);
    }
  }

  /**
   * Log security event
   */
  private static async logSecurityEvent(
    userId: string,
    eventType: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      if (!getDb()) return;
      
      const securityEvent: SecurityEvent = {
        userId,
        eventType: eventType as any,
        description,
        ipAddress: 'unknown', // Would be populated by middleware
        userAgent: 'unknown', // Would be populated by middleware
        timestamp: new Date(),
        metadata
      };
      
      await addDoc(collection(getDb(), this.SECURITY_EVENTS_COLLECTION), {
        ...securityEvent,
        timestamp: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Get recent login attempts
   */
  private static async getRecentLoginAttempts(userId: string, limitCount: number): Promise<LoginAttempt[]> {
    try {
      if (!getDb()) return [];
      
      const attemptsQuery = query(
        collection(getDb(), this.LOGIN_ATTEMPTS_COLLECTION),
        where('userId', '==', userId),
        limit(limitCount)
      );
      
      const attemptsSnap = await getDocs(attemptsQuery);
      return attemptsSnap.docs.map(doc => doc.data() as LoginAttempt);
      
    } catch (error) {
      console.error('Error getting recent login attempts:', error);
      return [];
    }
  }

  /**
   * Check for suspicious activity
   */
  private static async checkSuspiciousActivity(userId: string, _ipAddress: string): Promise<void> {
    try {
      // Check for multiple failed attempts from different IPs
      const recentAttempts = await this.getRecentLoginAttempts(userId, 10);
      const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
      
      if (failedAttempts.length >= 3) {
        const uniqueIPs = new Set(failedAttempts.map(attempt => attempt.ipAddress));
        if (uniqueIPs.size > 1) {
          await this.logSecurityEvent(
            userId,
            'suspicious_activity',
            'Multiple failed login attempts from different IP addresses',
            { ipAddresses: Array.from(uniqueIPs) }
          );
        }
      }
      
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
    }
  }

  /**
   * Get location from IP address
   */
  private static async getLocationFromIP(_ipAddress: string): Promise<string> {
    try {
      // This would typically use a geolocation service
      // For now, return a placeholder
      return 'Unknown Location';
    // eslint-disable-next-line no-unreachable
    } catch (error) {
      console.error('Error getting location from IP:', error);
      return 'Unknown Location';
    }
  }

  /**
   * Parse user agent string
   */
  private static parseUserAgent(userAgent: string): string {
    try {
      // This would typically use a user agent parser library
      // For now, return a simplified version
      if (userAgent.includes('Chrome')) return 'Chrome Browser';
      if (userAgent.includes('Firefox')) return 'Firefox Browser';
      if (userAgent.includes('Safari')) return 'Safari Browser';
      if (userAgent.includes('Mobile')) return 'Mobile Device';
      return 'Unknown Device';
    } catch (error) {
      console.error('Error parsing user agent:', error);
      return 'Unknown Device';
    }
  }
}
