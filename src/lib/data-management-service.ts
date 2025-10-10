'use server';

import { getDb, getStorageInstance } from './firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, writeBatch, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getUserSettings } from './user-settings-service';

export interface DataExportRequest {
  id?: string;
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  fileSize?: number;
  error?: string;
}

export interface DataDeletionRequest {
  id?: string;
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledFor?: Date;
  error?: string;
  confirmationCode?: string;
}

export interface UserDataExport {
  user: {
    id: string;
    email: string;
    displayName: string;
    createdAt: Date;
    lastLoginAt: Date;
  };
  settings: any;
  profile: any;
  bookings: any[];
  messages: any[];
  reviews: any[];
  payments: any[];
  notifications: any[];
  auditLogs: any[];
  exportedAt: Date;
  version: string;
}

export class DataManagementService {
  private static readonly EXPORT_REQUESTS_COLLECTION = 'dataExportRequests';
  private static readonly DELETION_REQUESTS_COLLECTION = 'dataDeletionRequests';
  private static readonly EXPORT_EXPIRY_DAYS = 7;
  private static readonly DELETION_GRACE_PERIOD_DAYS = 30;

  /**
   * Request data export
   */
  static async requestDataExport(userId: string): Promise<{
    success: boolean;
    requestId?: string;
    error?: string;
  }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      // Check if user already has a pending request
      const existingRequest = await this.getPendingExportRequest(userId);
      if (existingRequest) {
        return { success: false, error: 'You already have a pending export request' };
      }

      // Create export request
      const exportRequest: DataExportRequest = {
        userId,
        requestedAt: new Date(),
        status: 'pending',
        expiresAt: new Date(Date.now() + this.EXPORT_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      };

      const docRef = await addDoc(collection(getDb(), this.EXPORT_REQUESTS_COLLECTION), {
        ...exportRequest,
        createdAt: serverTimestamp()
      });

      // Send confirmation email
      await this.sendExportConfirmationEmail(userId, docRef.id);

      // Log the request
      await this.logDataRequest(userId, 'export_requested', { requestId: docRef.id });

      return { success: true, requestId: docRef.id };

    } catch (error) {
      console.error('Error requesting data export:', error);
      return { success: false, error: 'Failed to request data export' };
    }
  }

  /**
   * Request data deletion
   */
  static async requestDataDeletion(userId: string): Promise<{
    success: boolean;
    requestId?: string;
    error?: string;
  }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      // Check if user already has a pending request
      const existingRequest = await this.getPendingDeletionRequest(userId);
      if (existingRequest) {
        return { success: false, error: 'You already have a pending deletion request' };
      }

      // Generate confirmation code
      const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Create deletion request
      const deletionRequest: DataDeletionRequest = {
        userId,
        requestedAt: new Date(),
        status: 'pending',
        scheduledFor: new Date(Date.now() + this.DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000),
        confirmationCode
      };

      const docRef = await addDoc(collection(getDb(), this.DELETION_REQUESTS_COLLECTION), {
        ...deletionRequest,
        createdAt: serverTimestamp()
      });

      // Send confirmation email
      await this.sendDeletionConfirmationEmail(userId, docRef.id, confirmationCode);

      // Log the request
      await this.logDataRequest(userId, 'deletion_requested', { requestId: docRef.id });

      return { success: true, requestId: docRef.id };

    } catch (error) {
      console.error('Error requesting data deletion:', error);
      return { success: false, error: 'Failed to request data deletion' };
    }
  }

  /**
   * Confirm data deletion
   */
  static async confirmDataDeletion(userId: string, confirmationCode: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      // Get deletion request
      const deletionRequest = await this.getPendingDeletionRequest(userId);
      if (!deletionRequest) {
        return { success: false, error: 'No pending deletion request found' };
      }

      // Verify confirmation code
      if (deletionRequest.confirmationCode !== confirmationCode) {
        return { success: false, error: 'Invalid confirmation code' };
      }

      // Update request status
      await this.updateDeletionRequestStatus(deletionRequest.id!, 'processing');

      // Schedule actual deletion
      await this.scheduleDataDeletion(userId, deletionRequest.scheduledFor!);

      return { success: true };

    } catch (error) {
      console.error('Error confirming data deletion:', error);
      return { success: false, error: 'Failed to confirm data deletion' };
    }
  }

  /**
   * Process data export
   */
  static async processDataExport(requestId: string): Promise<{
    success: boolean;
    downloadUrl?: string;
    error?: string;
  }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      // Get export request
      const exportRequest = await this.getExportRequest(requestId);
      if (!exportRequest) {
        return { success: false, error: 'Export request not found' };
      }

      // Update status to processing
      await this.updateExportRequestStatus(requestId, 'processing');

      try {
        // Collect user data
        const userData = await this.collectUserData(exportRequest.userId);
        
        // Generate export file
        const exportFile = await this.generateExportFile(userData);
        
        // Upload to storage (this would typically be AWS S3, Google Cloud Storage, etc.)
        const downloadUrl = await this.uploadExportFile(exportFile, requestId);
        
        // Update request with download URL
        await this.updateExportRequestStatus(requestId, 'completed', { downloadUrl });
        
        // Send completion email
        await this.sendExportCompletionEmail(exportRequest.userId, downloadUrl);
        
        return { success: true, downloadUrl };
        
      } catch (error) {
        // Update status to failed
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        await this.updateExportRequestStatus(requestId, 'failed', { error: errorMessage });
        return { success: false, error: 'Failed to process export' };
      }

    } catch (error) {
      console.error('Error processing data export:', error);
      return { success: false, error: 'Failed to process data export' };
    }
  }

  /**
   * Process data deletion
   */
  static async processDataDeletion(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      // Get deletion request
      const deletionRequest = await this.getPendingDeletionRequest(userId);
      if (!deletionRequest) {
        return { success: false, error: 'No deletion request found' };
      }

      // Update status to processing
      await this.updateDeletionRequestStatus(deletionRequest.id!, 'processing');

      try {
        // Delete user data
        await this.deleteUserData(userId);
        
        // Update request status
        await this.updateDeletionRequestStatus(deletionRequest.id!, 'completed');
        
        // Send completion email
        await this.sendDeletionCompletionEmail(userId);
        
        return { success: true };
        
      } catch (error) {
        // Update status to failed
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        await this.updateDeletionRequestStatus(deletionRequest.id!, 'failed', { error: errorMessage });
        return { success: false, error: 'Failed to process deletion' };
      }

    } catch (error) {
      console.error('Error processing data deletion:', error);
      return { success: false, error: 'Failed to process data deletion' };
    }
  }

  /**
   * Get export request status
   */
  static async getExportRequestStatus(requestId: string): Promise<{
    success: boolean;
    status?: string;
    downloadUrl?: string;
    error?: string;
  }> {
    try {
      const exportRequest = await this.getExportRequest(requestId);
      if (!exportRequest) {
        return { success: false, error: 'Export request not found' };
      }

      return {
        success: true,
        status: exportRequest.status,
        downloadUrl: exportRequest.downloadUrl,
        error: exportRequest.error
      };

    } catch (error) {
      console.error('Error getting export request status:', error);
      return { success: false, error: 'Failed to get export status' };
    }
  }

  /**
   * Get deletion request status
   */
  static async getDeletionRequestStatus(userId: string): Promise<{
    success: boolean;
    status?: string;
    scheduledFor?: Date;
    error?: string;
  }> {
    try {
      const deletionRequest = await this.getPendingDeletionRequest(userId);
      if (!deletionRequest) {
        return { success: false, error: 'No deletion request found' };
      }

      return {
        success: true,
        status: deletionRequest.status,
        scheduledFor: deletionRequest.scheduledFor,
        error: deletionRequest.error
      };

    } catch (error) {
      console.error('Error getting deletion request status:', error);
      return { success: false, error: 'Failed to get deletion status' };
    }
  }

  /**
   * Cancel data deletion request
   */
  static async cancelDataDeletion(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      const deletionRequest = await this.getPendingDeletionRequest(userId);
      if (!deletionRequest) {
        return { success: false, error: 'No deletion request found' };
      }

      // Update status to cancelled
      await this.updateDeletionRequestStatus(deletionRequest.id!, 'cancelled');

      // Send cancellation email
      await this.sendDeletionCancellationEmail(userId);

      return { success: true };

    } catch (error) {
      console.error('Error cancelling data deletion:', error);
      return { success: false, error: 'Failed to cancel deletion request' };
    }
  }

  /**
   * Collect user data for export
   */
  private static async collectUserData(userId: string): Promise<UserDataExport> {
    try {
      // Get user settings
      const settings = await getUserSettings(userId);
      
      // Get user profile data
      const profile = await this.getUserProfileData(userId);
      
      // Get user bookings
      const bookings = await this.getUserBookings(userId);
      
      // Get user messages
      const messages = await this.getUserMessages(userId);
      
      // Get user reviews
      const reviews = await this.getUserReviews(userId);
      
      // Get user payments
      const payments = await this.getUserPayments(userId);
      
      // Get user notifications
      const notifications = await this.getUserNotifications(userId);
      
      // Get audit logs
      const auditLogs = await this.getUserAuditLogs(userId);
      
      return {
        user: {
          id: userId,
          email: profile?.email || '',
          displayName: profile?.displayName || '',
          createdAt: profile?.createdAt || new Date(),
          lastLoginAt: profile?.lastLoginAt || new Date()
        },
        settings,
        profile,
        bookings,
        messages,
        reviews,
        payments,
        notifications,
        auditLogs,
        exportedAt: new Date(),
        version: '1.0.0'
      };
      
    } catch (error) {
      console.error('Error collecting user data:', error);
      throw error;
    }
  }

  /**
   * Generate export file
   */
  private static async generateExportFile(userData: UserDataExport): Promise<Buffer> {
    try {
      // Convert to JSON
      const jsonData = JSON.stringify(userData, null, 2);
      
      // Create ZIP file (this would typically use a library like archiver)
      // For now, return the JSON as Buffer
      return Buffer.from(jsonData, 'utf-8');
      
    } catch (error) {
      console.error('Error generating export file:', error);
      throw error;
    }
  }

  /**
   * Upload export file
   */
  private static async uploadExportFile(file: Buffer, requestId: string): Promise<string> {
    try {
      // Upload to Firebase Storage (production-ready implementation)
      const storage = getStorageInstance();
      const storageRef = ref(storage, `exports/${requestId}.zip`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      
      return downloadUrl;
      
    } catch (error) {
      console.error('Error uploading export file:', error);
      throw error;
    }
  }

  /**
   * Delete user data
   */
  private static async deleteUserData(userId: string): Promise<void> {
    try {
      if (!getDb()) {
        throw new Error('Database not initialized');
      }

      const batch = writeBatch(getDb());
      
      // Delete user settings
      const settingsRef = doc(getDb(), 'userSettings', userId);
      batch.delete(settingsRef);
      
      // Delete user profile
      const profileRef = doc(getDb(), 'users', userId);
      batch.delete(profileRef);
      
      // Delete user bookings
      const bookingsQuery = query(
        collection(getDb(), 'bookings'),
        where('clientId', '==', userId)
      );
      const bookingsSnap = await getDocs(bookingsQuery);
      bookingsSnap.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete user messages
      const messagesQuery = query(
        collection(getDb(), 'messages'),
        where('senderId', '==', userId)
      );
      const messagesSnap = await getDocs(messagesQuery);
      messagesSnap.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete user reviews
      const reviewsQuery = query(
        collection(getDb(), 'reviews'),
        where('reviewerId', '==', userId)
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      reviewsSnap.docs.forEach(doc => batch.delete(doc.ref));
      
      // Commit batch
      await batch.commit();
      
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  /**
   * Get pending export request
   */
  private static async getPendingExportRequest(userId: string): Promise<DataExportRequest | null> {
    try {
      if (!getDb()) return null;
      
      const exportQuery = query(
        collection(getDb(), this.EXPORT_REQUESTS_COLLECTION),
        where('userId', '==', userId),
        where('status', 'in', ['pending', 'processing'])
      );
      
      const exportSnap = await getDocs(exportQuery);
      if (exportSnap.empty) return null;
      
      const doc = exportSnap.docs[0];
      return { id: doc.id, ...doc.data() } as DataExportRequest;
      
    } catch (error) {
      console.error('Error getting pending export request:', error);
      return null;
    }
  }

  /**
   * Get pending deletion request
   */
  private static async getPendingDeletionRequest(userId: string): Promise<DataDeletionRequest | null> {
    try {
      if (!getDb()) return null;
      
      const deletionQuery = query(
        collection(getDb(), this.DELETION_REQUESTS_COLLECTION),
        where('userId', '==', userId),
        where('status', 'in', ['pending', 'processing'])
      );
      
      const deletionSnap = await getDocs(deletionQuery);
      if (deletionSnap.empty) return null;
      
      const doc = deletionSnap.docs[0];
      return { id: doc.id, ...doc.data() } as DataDeletionRequest;
      
    } catch (error) {
      console.error('Error getting pending deletion request:', error);
      return null;
    }
  }

  /**
   * Get export request
   */
  private static async getExportRequest(requestId: string): Promise<DataExportRequest | null> {
    try {
      if (!getDb()) return null;
      
      const exportDoc = await getDoc(doc(getDb(), this.EXPORT_REQUESTS_COLLECTION, requestId));
      if (!exportDoc.exists()) return null;
      
      return { id: exportDoc.id, ...exportDoc.data() } as DataExportRequest;
      
    } catch (error) {
      console.error('Error getting export request:', error);
      return null;
    }
  }

  /**
   * Update export request status
   */
  private static async updateExportRequestStatus(
    requestId: string,
    status: string,
    updates: any = {}
  ): Promise<void> {
    try {
      if (!getDb()) return;
      
      const exportRef = doc(getDb(), this.EXPORT_REQUESTS_COLLECTION, requestId);
      await updateDoc(exportRef, {
        status,
        ...updates,
        updatedAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error updating export request status:', error);
    }
  }

  /**
   * Update deletion request status
   */
  private static async updateDeletionRequestStatus(
    requestId: string,
    status: string,
    updates: any = {}
  ): Promise<void> {
    try {
      if (!getDb()) return;
      
      const deletionRef = doc(getDb(), this.DELETION_REQUESTS_COLLECTION, requestId);
      await updateDoc(deletionRef, {
        status,
        ...updates,
        updatedAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error updating deletion request status:', error);
    }
  }

  /**
   * Schedule data deletion
   */
  private static async scheduleDataDeletion(userId: string, scheduledFor: Date): Promise<void> {
    try {
      if (!getDb()) {
        throw new Error('Database not initialized');
      }
      
      // Store the scheduled deletion in Firestore
      await setDoc(doc(getDb(), 'scheduledDeletions', userId), {
        userId,
        scheduledFor,
        status: 'scheduled',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`Data deletion scheduled for user ${userId} at ${scheduledFor}`);
      
    } catch (error) {
      console.error('Error scheduling data deletion:', error);
      throw error;
    }
  }

  /**
   * Log data request
   */
  private static async logDataRequest(userId: string, action: string, data: any): Promise<void> {
    try {
      if (!getDb()) return;
      
      await addDoc(collection(getDb(), 'dataRequestLogs'), {
        userId,
        action,
        data,
        timestamp: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error logging data request:', error);
    }
  }

  // Email notification methods
  private static async sendExportConfirmationEmail(userId: string, requestId: string): Promise<void> {
    try {
      // Get user email from profile
      const userProfile = await this.getUserProfileData(userId);
      if (!userProfile?.email) {
        console.error('User email not found for export confirmation');
        return;
      }

      // Send email using the existing email system
      const { sendEmail } = await import('./email-service');
      await sendEmail({
        to: userProfile.email,
        subject: 'Data Export Request Confirmed',
        html: `
          <h2>Data Export Request Confirmed</h2>
          <p>Your data export request has been received and is being processed.</p>
          <p><strong>Request ID:</strong> ${requestId}</p>
          <p><strong>Estimated completion time:</strong> 24-48 hours</p>
          <p>You will receive another email once your data export is ready for download.</p>
        `
      });
    } catch (error) {
      console.error('Error sending export confirmation email:', error);
    }
  }

  private static async sendExportCompletionEmail(userId: string, downloadUrl: string): Promise<void> {
    try {
      const userProfile = await this.getUserProfileData(userId);
      if (!userProfile?.email) {
        console.error('User email not found for export completion');
        return;
      }

      const { sendEmail } = await import('./email-service');
      await sendEmail({
        to: userProfile.email,
        subject: 'Your Data Export is Ready',
        html: `
          <h2>Your Data Export is Ready</h2>
          <p>Your data export has been completed and is ready for download.</p>
          <p><a href="${downloadUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Your Data</a></p>
          <p><strong>Note:</strong> This download link will expire in 7 days.</p>
        `
      });
    } catch (error) {
      console.error('Error sending export completion email:', error);
    }
  }

  private static async sendDeletionConfirmationEmail(userId: string, requestId: string, confirmationCode: string): Promise<void> {
    try {
      const userProfile = await this.getUserProfileData(userId);
      if (!userProfile?.email) {
        console.error('User email not found for deletion confirmation');
        return;
      }

      const { sendEmail } = await import('./email-service');
      await sendEmail({
        to: userProfile.email,
        subject: 'Data Deletion Request - Confirmation Required',
        html: `
          <h2>Data Deletion Request - Confirmation Required</h2>
          <p>You have requested to delete your account and all associated data.</p>
          <p><strong>Request ID:</strong> ${requestId}</p>
          <p><strong>Confirmation Code:</strong> ${confirmationCode}</p>
          <p><strong>Scheduled Deletion Date:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          <p>If you did not request this deletion, please contact support immediately.</p>
        `
      });
    } catch (error) {
      console.error('Error sending deletion confirmation email:', error);
    }
  }

  private static async sendDeletionCompletionEmail(userId: string): Promise<void> {
    try {
      const userProfile = await this.getUserProfileData(userId);
      if (!userProfile?.email) {
        console.error('User email not found for deletion completion');
        return;
      }

      const { sendEmail } = await import('./email-service');
      await sendEmail({
        to: userProfile.email,
        subject: 'Your Data Has Been Deleted',
        html: `
          <h2>Your Data Has Been Deleted</h2>
          <p>Your account and all associated data have been permanently deleted as requested.</p>
          <p><strong>Deletion Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p>Thank you for using our service.</p>
        `
      });
    } catch (error) {
      console.error('Error sending deletion completion email:', error);
    }
  }

  private static async sendDeletionCancellationEmail(userId: string): Promise<void> {
    try {
      const userProfile = await this.getUserProfileData(userId);
      if (!userProfile?.email) {
        console.error('User email not found for deletion cancellation');
        return;
      }

      const { sendEmail } = await import('./email-service');
      await sendEmail({
        to: userProfile.email,
        subject: 'Data Deletion Request Cancelled',
        html: `
          <h2>Data Deletion Request Cancelled</h2>
          <p>Your data deletion request has been cancelled.</p>
          <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p>Your account and data remain active. If you have any questions, please contact support.</p>
        `
      });
    } catch (error) {
      console.error('Error sending deletion cancellation email:', error);
    }
  }

  // Data retrieval methods
  private static async getUserProfileData(userId: string): Promise<any> {
    try {
      if (!getDb()) return null;
      
      const userDoc = await getDoc(doc(getDb(), 'users', userId));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Error getting user profile data:', error);
      return null;
    }
  }

  private static async getUserBookings(userId: string): Promise<any[]> {
    try {
      if (!getDb()) return [];
      
      const bookingsQuery = query(
        collection(getDb(), 'bookings'),
        where('clientId', '==', userId)
      );
      const bookingsSnap = await getDocs(bookingsQuery);
      return bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user bookings:', error);
      return [];
    }
  }

  private static async getUserMessages(userId: string): Promise<any[]> {
    try {
      if (!getDb()) return [];
      
      const messagesQuery = query(
        collection(getDb(), 'messages'),
        where('senderId', '==', userId)
      );
      const messagesSnap = await getDocs(messagesQuery);
      return messagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user messages:', error);
      return [];
    }
  }

  private static async getUserReviews(userId: string): Promise<any[]> {
    try {
      if (!getDb()) return [];
      
      const reviewsQuery = query(
        collection(getDb(), 'reviews'),
        where('clientId', '==', userId)
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      return reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user reviews:', error);
      return [];
    }
  }

  private static async getUserPayments(userId: string): Promise<any[]> {
    try {
      if (!getDb()) return [];
      
      const paymentsQuery = query(
        collection(getDb(), 'payments'),
        where('userId', '==', userId)
      );
      const paymentsSnap = await getDocs(paymentsQuery);
      return paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user payments:', error);
      return [];
    }
  }

  private static async getUserNotifications(userId: string): Promise<any[]> {
    try {
      if (!getDb()) return [];
      
      const notificationsQuery = query(
        collection(getDb(), 'notifications'),
        where('userId', '==', userId)
      );
      const notificationsSnap = await getDocs(notificationsQuery);
      return notificationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  private static async getUserAuditLogs(userId: string): Promise<any[]> {
    try {
      if (!getDb()) return [];
      
      const auditLogsQuery = query(
        collection(getDb(), 'auditLogs'),
        where('userId', '==', userId)
      );
      const auditLogsSnap = await getDocs(auditLogsQuery);
      return auditLogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user audit logs:', error);
      return [];
    }
  }
}
