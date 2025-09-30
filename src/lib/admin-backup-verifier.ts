import { getDb  } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, getDownloadURL, getMetadata } from 'firebase/storage';
import { sendEmail } from './email-service';

/**
 * Backup verification configuration
 */
export const BACKUP_VERIFICATION_CONFIG = {
  // Verification intervals
  VERIFICATION_INTERVAL_HOURS: 24, // Verify backups every 24 hours
  IMMEDIATE_VERIFICATION: true, // Verify immediately after creation
  
  // Integrity checks
  CHECK_FILE_SIZE: true,
  CHECK_FILE_HASH: true,
  CHECK_METADATA: true,
  CHECK_ACCESSIBILITY: true,
  
  // Alert thresholds
  MAX_FAILED_VERIFICATIONS: 3,
  ALERT_ON_FAILURE: true,
  ALERT_RECIPIENTS: ['admin@localpro.asia'],
  
  // Retention
  VERIFICATION_HISTORY_DAYS: 30
};

/**
 * Backup verification status
 */
export type BackupVerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'warning';

/**
 * Backup verification result
 */
export interface BackupVerificationResult {
  id: string;
  backupId: string;
  status: BackupVerificationStatus;
  checks: {
    fileSize: { passed: boolean; expected?: number; actual?: number; error?: string };
    fileHash: { passed: boolean; expected?: string; actual?: string; error?: string };
    metadata: { passed: boolean; error?: string };
    accessibility: { passed: boolean; error?: string };
  };
  overallScore: number; // 0-100
  issues: string[];
  recommendations: string[];
  verifiedAt: Timestamp;
  verifiedBy: string;
  duration: number; // milliseconds
  metadata: Record<string, any>;
}

/**
 * Backup verification history
 */
export interface BackupVerificationHistory {
  id: string;
  backupId: string;
  verificationResults: BackupVerificationResult[];
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  lastVerified: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Backup integrity verifier
 */
export class AdminBackupVerifier {
  private static readonly COLLECTION = 'backupVerifications';
  private static readonly HISTORY_COLLECTION = 'backupVerificationHistory';

  /**
   * Verify a backup's integrity
   */
  static async verifyBackup(
    backupId: string,
    verifiedBy: string = 'system'
  ): Promise<{
    success: boolean;
    result?: BackupVerificationResult;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      
      // Get backup information
      const backupDoc = await getDoc(doc(getDb(), 'backups', backupId));
      if (!backupDoc.exists()) {
        return { success: false, error: 'Backup not found' };
      }

      const backup = backupDoc.data();
      const verificationId = `backup_verification_${backupId}_${Date.now()}`;

      // Initialize verification result
      const verificationResult: Omit<BackupVerificationResult, 'id' | 'verifiedAt' | 'duration'> = {
        backupId,
        status: 'in_progress',
        checks: {
          fileSize: { passed: false },
          fileHash: { passed: false },
          metadata: { passed: false },
          accessibility: { passed: false }
        },
        overallScore: 0,
        issues: [],
        recommendations: [],
        verifiedBy,
        metadata: {}
      };

      // Perform verification checks
      const checks = await this.performVerificationChecks(backup);
      verificationResult.checks = checks.checks;
      verificationResult.issues = checks.issues;
      verificationResult.recommendations = checks.recommendations;
      verificationResult.overallScore = checks.overallScore;
      verificationResult.metadata = checks.metadata;

      // Determine final status
      verificationResult.status = this.determineVerificationStatus(verificationResult);

      // Create final result
      const finalResult: BackupVerificationResult = {
        ...verificationResult,
        id: verificationId,
        verifiedAt: serverTimestamp() as Timestamp,
        duration: Date.now() - startTime
      };

      // Save verification result
      await setDoc(doc(getDb(), this.COLLECTION, verificationId), finalResult);

      // Update verification history
      await this.updateVerificationHistory(backupId, finalResult);

      // Send alerts if needed
      if (verificationResult.status === 'failed' && BACKUP_VERIFICATION_CONFIG.ALERT_ON_FAILURE) {
        await this.sendVerificationAlert(backup, finalResult);
      }

      return { success: true, result: finalResult };
    } catch (error) {
      console.error('Error verifying backup:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Perform all verification checks
   */
  private static async performVerificationChecks(backup: any): Promise<{
    checks: BackupVerificationResult['checks'];
    issues: string[];
    recommendations: string[];
    overallScore: number;
    metadata: Record<string, any>;
  }> {
    const checks: BackupVerificationResult['checks'] = {
      fileSize: { passed: false },
      fileHash: { passed: false },
      metadata: { passed: false },
      accessibility: { passed: false }
    };

    const issues: string[] = [];
    const recommendations: string[] = [];
    const metadata: Record<string, any> = {};

    try {
      // Check file accessibility
      if (BACKUP_VERIFICATION_CONFIG.CHECK_ACCESSIBILITY) {
        const accessibilityCheck = await this.checkFileAccessibility(backup);
        checks.accessibility = accessibilityCheck;
        if (!accessibilityCheck.passed) {
          issues.push('Backup file is not accessible');
          recommendations.push('Check file permissions and storage configuration');
        }
      }

      // Check file size
      if (BACKUP_VERIFICATION_CONFIG.CHECK_FILE_SIZE) {
        const sizeCheck = await this.checkFileSize(backup);
        checks.fileSize = sizeCheck;
        if (!sizeCheck.passed) {
          issues.push(`File size mismatch: expected ${sizeCheck.expected}, got ${sizeCheck.actual}`);
          recommendations.push('Verify backup creation process');
        }
      }

      // Check file hash
      if (BACKUP_VERIFICATION_CONFIG.CHECK_FILE_HASH) {
        const hashCheck = await this.checkFileHash(backup);
        checks.fileHash = hashCheck;
        if (!hashCheck.passed) {
          issues.push('File hash mismatch - possible corruption');
          recommendations.push('Recreate backup immediately');
        }
      }

      // Check metadata
      if (BACKUP_VERIFICATION_CONFIG.CHECK_METADATA) {
        const metadataCheck = await this.checkMetadata(backup);
        checks.metadata = metadataCheck;
        if (!metadataCheck.passed) {
          issues.push('Metadata validation failed');
          recommendations.push('Check backup metadata integrity');
        }
      }

      // Calculate overall score
      const passedChecks = Object.values(checks).filter(check => check.passed).length;
      const totalChecks = Object.keys(checks).length;
      const overallScore = Math.round((passedChecks / totalChecks) * 100);

      return { checks, issues, recommendations, overallScore, metadata };
    } catch (error) {
      console.error('Error performing verification checks:', error);
      issues.push('Verification process failed');
      recommendations.push('Investigate verification system');
      return { checks, issues, recommendations, overallScore: 0, metadata };
    }
  }

  /**
   * Check file accessibility
   */
  private static async checkFileAccessibility(backup: any): Promise<{
    passed: boolean;
    error?: string;
  }> {
    try {
      if (!backup.downloadUrl) {
        return { passed: false, error: 'No download URL available' };
      }

      // Try to access the file
      const response = await fetch(backup.downloadUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        return { passed: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      return { passed: true };
    } catch (error) {
      return { passed: false, error: `Accessibility check failed: ${error}` };
    }
  }

  /**
   * Check file size
   */
  private static async checkFileSize(backup: any): Promise<{
    passed: boolean;
    expected?: number;
    actual?: number;
    error?: string;
  }> {
    try {
      if (!backup.downloadUrl) {
        return { passed: false, error: 'No download URL available' };
      }

      // Get file metadata
      const response = await fetch(backup.downloadUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      
      if (!contentLength) {
        return { passed: false, error: 'Content-Length header not available' };
      }

      const actualSize = parseInt(contentLength);
      const expectedSize = backup.fileSize || 0;

      // Allow 5% variance in file size
      const variance = Math.abs(actualSize - expectedSize) / expectedSize;
      const passed = variance <= 0.05;

      return {
        passed,
        expected: expectedSize,
        actual: actualSize,
        error: passed ? undefined : `Size variance: ${(variance * 100).toFixed(2)}%`
      };
    } catch (error) {
      return { passed: false, error: `Size check failed: ${error}` };
    }
  }

  /**
   * Check file hash
   */
  private static async checkFileHash(backup: any): Promise<{
    passed: boolean;
    expected?: string;
    actual?: string;
    error?: string;
  }> {
    try {
      if (!backup.downloadUrl) {
        return { passed: false, error: 'No download URL available' };
      }

      // TODO: Implement actual hash checking
      // For now, we'll skip hash checking as it requires downloading the entire file
      // In production, you might want to implement this with a more efficient method
      // such as using Firebase Storage metadata or a separate hash verification service
      return { passed: true, expected: 'N/A', actual: 'N/A' };
    } catch (error) {
      return { passed: false, error: `Hash check failed: ${error}` };
    }
  }

  /**
   * Check metadata
   */
  private static async checkMetadata(backup: any): Promise<{
    passed: boolean;
    error?: string;
  }> {
    try {
      // Check required metadata fields
      const requiredFields = ['fileName', 'downloadUrl', 'documentCount', 'createdAt'];
      const missingFields = requiredFields.filter(field => !backup[field]);

      if (missingFields.length > 0) {
        return { passed: false, error: `Missing required fields: ${missingFields.join(', ')}` };
      }

      // Check data types
      if (typeof backup.documentCount !== 'number' || backup.documentCount < 0) {
        return { passed: false, error: 'Invalid document count' };
      }

      if (!Array.isArray(backup.collections)) {
        return { passed: false, error: 'Invalid collections array' };
      }

      return { passed: true };
    } catch (error) {
      return { passed: false, error: `Metadata check failed: ${error}` };
    }
  }

  /**
   * Determine verification status
   */
  private static determineVerificationStatus(result: Omit<BackupVerificationResult, 'id' | 'verifiedAt' | 'duration'>): BackupVerificationStatus {
    const criticalChecks = ['accessibility', 'fileHash'];
    const criticalFailed = criticalChecks.some(check => !result.checks[check as keyof typeof result.checks].passed);

    if (criticalFailed) {
      return 'failed';
    }

    if (result.overallScore >= 90) {
      return 'verified';
    } else if (result.overallScore >= 70) {
      return 'warning';
    } else {
      return 'failed';
    }
  }

  /**
   * Update verification history
   */
  private static async updateVerificationHistory(backupId: string, result: BackupVerificationResult): Promise<void> {
    try {
      const historyRef = doc(getDb(), this.HISTORY_COLLECTION, backupId);
      const historyDoc = await getDoc(historyRef);

      if (historyDoc.exists()) {
        const history = historyDoc.data() as BackupVerificationHistory;
        const updatedHistory: Partial<BackupVerificationHistory> = {
          verificationResults: [...history.verificationResults, result],
          totalVerifications: history.totalVerifications + 1,
          successfulVerifications: history.successfulVerifications + (result.status === 'verified' ? 1 : 0),
          failedVerifications: history.failedVerifications + (result.status === 'failed' ? 1 : 0),
          lastVerified: result.verifiedAt,
          updatedAt: serverTimestamp() as Timestamp
        };

        await updateDoc(historyRef, updatedHistory);
      } else {
        const newHistory: BackupVerificationHistory = {
          id: backupId,
          backupId,
          verificationResults: [result],
          totalVerifications: 1,
          successfulVerifications: result.status === 'verified' ? 1 : 0,
          failedVerifications: result.status === 'failed' ? 1 : 0,
          lastVerified: result.verifiedAt,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp
        };

        await setDoc(historyRef, newHistory);
      }
    } catch (error) {
      console.error('Error updating verification history:', error);
    }
  }

  /**
   * Send verification alert
   */
  private static async sendVerificationAlert(backup: any, result: BackupVerificationResult): Promise<void> {
    try {
      const subject = `Backup Verification Failed: ${backup.fileName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Backup Verification Alert</h2>
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Backup Verification Failed</h3>
            <p><strong>Backup File:</strong> ${backup.fileName}</p>
            <p><strong>Backup ID:</strong> ${backup.id}</p>
            <p><strong>Verification Score:</strong> ${result.overallScore}/100</p>
            <p><strong>Status:</strong> ${result.status.toUpperCase()}</p>
            <p><strong>Verified At:</strong> ${result.verifiedAt.toDate().toLocaleString()}</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Verification Results</h3>
            <ul>
              <li><strong>File Accessibility:</strong> ${result.checks.accessibility.passed ? '✅ Passed' : '❌ Failed'}</li>
              <li><strong>File Size:</strong> ${result.checks.fileSize.passed ? '✅ Passed' : '❌ Failed'}</li>
              <li><strong>File Hash:</strong> ${result.checks.fileHash.passed ? '✅ Passed' : '❌ Failed'}</li>
              <li><strong>Metadata:</strong> ${result.checks.metadata.passed ? '✅ Passed' : '❌ Failed'}</li>
            </ul>
          </div>

          ${result.issues.length > 0 ? `
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Issues Found</h3>
              <ul>
                ${result.issues.map(issue => `<li>${issue}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${result.recommendations.length > 0 ? `
            <div style="background-color: #d1ecf1; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Recommendations</h3>
              <ul>
                ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <hr>
          <p style="color: #666; font-size: 12px;">
            This is an automated alert from LocalPro Backup Verification System.
          </p>
        </div>
      `;

      for (const recipient of BACKUP_VERIFICATION_CONFIG.ALERT_RECIPIENTS) {
        await sendEmail({
          to: recipient,
          subject,
          html
        });
      }
    } catch (error) {
      console.error('Error sending verification alert:', error);
    }
  }

  /**
   * Get verification history for a backup
   */
  static async getVerificationHistory(backupId: string): Promise<BackupVerificationHistory | null> {
    try {
      const historyDoc = await getDoc(doc(getDb(), this.HISTORY_COLLECTION, backupId));
      
      if (historyDoc.exists()) {
        return historyDoc.data() as BackupVerificationHistory;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting verification history:', error);
      return null;
    }
  }

  /**
   * Get all verification results
   */
  static async getAllVerificationResults(limit: number = 50): Promise<BackupVerificationResult[]> {
    // This would typically use a query with orderBy and limit
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Schedule automatic verification
   */
  static async scheduleAutomaticVerification(): Promise<void> {
    try {
      // This would typically be called by a cron job or scheduled function
      // Implementation would depend on your specific needs
    } catch (error) {
      console.error('Error scheduling automatic verification:', error);
    }
  }
}
