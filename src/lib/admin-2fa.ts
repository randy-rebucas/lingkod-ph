import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { sendEmail } from './email-service';

/**
 * 2FA configuration for admin accounts
 */
export const ADMIN_2FA_CONFIG = {
  CODE_LENGTH: 6,
  CODE_EXPIRY: 10 * 60 * 1000, // 10 minutes
  MAX_ATTEMPTS: 3,
  LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes
  BACKUP_CODES_COUNT: 10,
  REQUIRED_FOR_ADMIN: true
};

/**
 * 2FA methods available for admin accounts
 */
export type Admin2FAMethod = 'email' | 'sms' | 'totp' | 'backup_code';

/**
 * Admin 2FA data structure
 */
export interface Admin2FAData {
  adminId: string;
  isEnabled: boolean;
  methods: Admin2FAMethod[];
  emailVerified: boolean;
  phoneVerified: boolean;
  totpSecret?: string;
  backupCodes: string[];
  usedBackupCodes: string[];
  lastUsed: Timestamp;
  failedAttempts: number;
  lockedUntil?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 2FA verification attempt
 */
export interface Admin2FAAttempt {
  adminId: string;
  method: Admin2FAMethod;
  code: string;
  timestamp: Timestamp;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Admin 2FA manager
 */
export class Admin2FAManager {
  private static readonly COLLECTION = 'admin2FA';
  private static readonly ATTEMPTS_COLLECTION = 'admin2FAAttempts';

  /**
   * Initialize 2FA for an admin account
   */
  static async initialize2FA(adminId: string): Promise<{
    success: boolean;
    backupCodes?: string[];
    totpSecret?: string;
    error?: string;
  }> {
    try {
      // Check if 2FA is already enabled
      const existing = await this.get2FAData(adminId);
      if (existing?.isEnabled) {
        return { success: false, error: '2FA is already enabled' };
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Generate TOTP secret (for future TOTP implementation)
      const totpSecret = this.generateTOTPSecret();

      const twoFAData: Admin2FAData = {
        adminId,
        isEnabled: false, // Will be enabled after verification
        methods: ['email', 'backup_code'],
        emailVerified: false,
        phoneVerified: false,
        totpSecret,
        backupCodes,
        usedBackupCodes: [],
        lastUsed: serverTimestamp() as Timestamp,
        failedAttempts: 0,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(doc(db, this.COLLECTION, adminId), twoFAData);

      return {
        success: true,
        backupCodes,
        totpSecret
      };
    } catch (error) {
      console.error('Error initializing admin 2FA:', error);
      return { success: false, error: 'Failed to initialize 2FA' };
    }
  }

  /**
   * Send 2FA code via email
   */
  static async sendEmailCode(adminId: string, adminEmail: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + ADMIN_2FA_CONFIG.CODE_EXPIRY);

      // Store the code temporarily (in production, use a secure storage)
      await setDoc(doc(db, `admin2FA/${adminId}/codes`, 'email'), {
        code,
        expiresAt: Timestamp.fromDate(expiresAt),
        attempts: 0,
        createdAt: serverTimestamp()
      });

      // Send email
      const emailResult = await sendEmail({
        to: adminEmail,
        subject: 'Admin 2FA Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Admin 2FA Verification</h2>
            <p>Your verification code is:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please contact your system administrator immediately.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              This is an automated message from LocalPro Admin Panel.
            </p>
          </div>
        `
      });

      if (!emailResult.success) {
        return { success: false, error: 'Failed to send email' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending admin 2FA email code:', error);
      return { success: false, error: 'Failed to send verification code' };
    }
  }

  /**
   * Verify 2FA code
   */
  static async verifyCode(
    adminId: string,
    code: string,
    method: Admin2FAMethod = 'email',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    error?: string;
    locked?: boolean;
  }> {
    try {
      // Check if account is locked
      const twoFAData = await this.get2FAData(adminId);
      if (!twoFAData) {
        return { success: false, error: '2FA not initialized' };
      }

      if (twoFAData.lockedUntil && new Date() < twoFAData.lockedUntil.toDate()) {
        return { success: false, error: 'Account temporarily locked', locked: true };
      }

      // Verify the code based on method
      let isValid = false;

      if (method === 'email') {
        isValid = await this.verifyEmailCode(adminId, code);
      } else if (method === 'backup_code') {
        isValid = await this.verifyBackupCode(adminId, code);
      } else if (method === 'totp') {
        isValid = await this.verifyTOTPCode(adminId, code);
      }

      // Log the attempt
      await this.logAttempt(adminId, method, code, isValid, ipAddress, userAgent);

      if (isValid) {
        // Reset failed attempts and update last used
        await updateDoc(doc(db, this.COLLECTION, adminId), {
          failedAttempts: 0,
          lastUsed: serverTimestamp(),
          lockedUntil: null,
          updatedAt: serverTimestamp()
        });

        return { success: true };
      } else {
        // Increment failed attempts
        const newFailedAttempts = twoFAData.failedAttempts + 1;
        const updates: any = {
          failedAttempts: newFailedAttempts,
          updatedAt: serverTimestamp()
        };

        // Lock account if max attempts reached
        if (newFailedAttempts >= ADMIN_2FA_CONFIG.MAX_ATTEMPTS) {
          const lockUntil = new Date(Date.now() + ADMIN_2FA_CONFIG.LOCKOUT_TIME);
          updates.lockedUntil = Timestamp.fromDate(lockUntil);
        }

        await updateDoc(doc(db, this.COLLECTION, adminId), updates);

        return { 
          success: false, 
          error: `Invalid code. ${ADMIN_2FA_CONFIG.MAX_ATTEMPTS - newFailedAttempts} attempts remaining.`,
          locked: newFailedAttempts >= ADMIN_2FA_CONFIG.MAX_ATTEMPTS
        };
      }
    } catch (error) {
      console.error('Error verifying admin 2FA code:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Enable 2FA after successful verification
   */
  static async enable2FA(adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, this.COLLECTION, adminId), {
        isEnabled: true,
        emailVerified: true,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error enabling admin 2FA:', error);
      return { success: false, error: 'Failed to enable 2FA' };
    }
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, this.COLLECTION, adminId), {
        isEnabled: false,
        emailVerified: false,
        phoneVerified: false,
        totpSecret: null,
        backupCodes: [],
        usedBackupCodes: [],
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error disabling admin 2FA:', error);
      return { success: false, error: 'Failed to disable 2FA' };
    }
  }

  /**
   * Check if 2FA is required for admin
   */
  static async is2FARequired(adminId: string): Promise<boolean> {
    if (!ADMIN_2FA_CONFIG.REQUIRED_FOR_ADMIN) {
      return false;
    }

    const twoFAData = await this.get2FAData(adminId);
    return twoFAData?.isEnabled || false;
  }

  /**
   * Get 2FA data for admin
   */
  static async get2FAData(adminId: string): Promise<Admin2FAData | null> {
    try {
      const docRef = doc(db, this.COLLECTION, adminId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as Admin2FAData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting admin 2FA data:', error);
      return null;
    }
  }

  /**
   * Generate new backup codes
   */
  static async generateNewBackupCodes(adminId: string): Promise<{
    success: boolean;
    backupCodes?: string[];
    error?: string;
  }> {
    try {
      const backupCodes = this.generateBackupCodes();
      
      await updateDoc(doc(db, this.COLLECTION, adminId), {
        backupCodes,
        usedBackupCodes: [],
        updatedAt: serverTimestamp()
      });

      return { success: true, backupCodes };
    } catch (error) {
      console.error('Error generating new backup codes:', error);
      return { success: false, error: 'Failed to generate backup codes' };
    }
  }

  /**
   * Private helper methods
   */
  private static generateCode(): string {
    // Note: In production, consider using a cryptographically secure random generator
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < ADMIN_2FA_CONFIG.BACKUP_CODES_COUNT; i++) {
      // Note: In production, consider using a cryptographically secure random generator
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }

  private static generateTOTPSecret(): string {
    // Generate a random base32 secret for TOTP
    // Note: In production, consider using a cryptographically secure random generator
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private static async verifyEmailCode(adminId: string, code: string): Promise<boolean> {
    try {
      const codeDoc = await getDoc(doc(db, `admin2FA/${adminId}/codes`, 'email'));
      
      if (!codeDoc.exists()) {
        return false;
      }

      const codeData = codeDoc.data();
      const now = new Date();

      // Check if code is expired
      if (now > codeData.expiresAt.toDate()) {
        return false;
      }

      // Check if code matches
      return codeData.code === code;
    } catch (error) {
      console.error('Error verifying email code:', error);
      return false;
    }
  }

  private static async verifyBackupCode(adminId: string, code: string): Promise<boolean> {
    try {
      const twoFAData = await this.get2FAData(adminId);
      if (!twoFAData) {
        return false;
      }

      // Check if code is in backup codes and not used
      const isValidCode = twoFAData.backupCodes.includes(code.toUpperCase());
      const isNotUsed = !twoFAData.usedBackupCodes.includes(code.toUpperCase());

      if (isValidCode && isNotUsed) {
        // Mark code as used
        await updateDoc(doc(db, this.COLLECTION, adminId), {
          usedBackupCodes: [...twoFAData.usedBackupCodes, code.toUpperCase()],
          updatedAt: serverTimestamp()
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return false;
    }
  }

  private static async verifyTOTPCode(adminId: string, code: string): Promise<boolean> {
    // TODO: Implement TOTP verification
    // TOTP verification would be implemented here using a library like 'otplib'
    // For now, return false as TOTP is not fully implemented
    return false;
  }

  private static async logAttempt(
    adminId: string,
    method: Admin2FAMethod,
    code: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const attempt: Admin2FAAttempt = {
        adminId,
        method,
        code: success ? code : '***', // Don't log actual failed codes
        timestamp: serverTimestamp() as Timestamp,
        success,
        ipAddress,
        userAgent
      };

      await setDoc(doc(db, this.ATTEMPTS_COLLECTION, `${adminId}_${Date.now()}`), attempt);
    } catch (error) {
      console.error('Error logging 2FA attempt:', error);
    }
  }
}

/**
 * Admin 2FA middleware for API routes
 */
export async function requireAdmin2FA(adminId: string): Promise<{
  required: boolean;
  verified: boolean;
  error?: string;
}> {
  try {
    const isRequired = await Admin2FAManager.is2FARequired(adminId);
    
    if (!isRequired) {
      return { required: false, verified: true };
    }

    const twoFAData = await Admin2FAManager.get2FAData(adminId);
    
    if (!twoFAData?.isEnabled) {
      return { required: true, verified: false, error: '2FA not enabled' };
    }

    // Check if account is locked
    if (twoFAData.lockedUntil && new Date() < twoFAData.lockedUntil.toDate()) {
      return { required: true, verified: false, error: 'Account locked due to failed attempts' };
    }

    return { required: true, verified: true };
  } catch (error) {
    console.error('Error checking admin 2FA requirement:', error);
    return { required: false, verified: false, error: '2FA check failed' };
  }
}
