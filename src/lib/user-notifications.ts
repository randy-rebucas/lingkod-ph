'use server';

import { getDb } from './firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendEmail } from './email-service';

export interface UserNotificationData {
  type: 'account_created' | 'account_verified' | 'account_suspended' | 'account_activated' | 'password_changed' | 'profile_updated' | 'verification_required' | 'welcome';
  userEmail: string;
  userName: string;
  userId: string;
  reason?: string;
  adminName?: string;
  additionalInfo?: Record<string, any>;
}

export class UserNotificationService {
  /**
   * Send welcome notification for new user registration
   */
  static async sendWelcomeNotification(data: UserNotificationData) {
    try {
      const subject = `Welcome to LocalPro, ${data.userName}!`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Welcome to LocalPro! 🎉</h2>
          <p>Dear ${data.userName},</p>
          <p>Thank you for joining LocalPro! We're excited to have you as part of our community.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Getting Started</h3>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Complete your profile to get verified</li>
              <li>Browse available services and providers</li>
              <li>Post a job if you need specific help</li>
              <li>Connect with local service providers</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Your Profile
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      `;

      await sendEmail({
        to: data.userEmail,
        subject,
        html
      });

      // Create in-app notification
      await this.createInAppNotification(data.userId, {
        type: 'welcome',
        title: 'Welcome to LocalPro!',
        message: 'Your account has been created successfully. Complete your profile to get started.',
        link: '/profile'
      });

      console.log(`Welcome notification sent to ${data.userEmail}`);
    } catch (error) {
      console.error('Error sending welcome notification:', error);
    }
  }

  /**
   * Send account verification notification
   */
  static async sendAccountVerificationNotification(data: UserNotificationData) {
    try {
      const subject = `Account Verified - Welcome to LocalPro!`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Account Verified! ✅</h2>
          <p>Dear ${data.userName},</p>
          <p>Great news! Your account has been successfully verified and is now active.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #059669;">Verification Complete</h3>
            <p>Your account is now fully verified and you can access all features of LocalPro.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for choosing LocalPro!
          </p>
        </div>
      `;

      await sendEmail({
        to: data.userEmail,
        subject,
        html
      });

      // Create in-app notification
      await this.createInAppNotification(data.userId, {
        type: 'success',
        title: 'Account Verified',
        message: 'Your account has been successfully verified and is now active.',
        link: '/dashboard'
      });

      console.log(`Account verification notification sent to ${data.userEmail}`);
    } catch (error) {
      console.error('Error sending account verification notification:', error);
    }
  }

  /**
   * Send account suspension notification
   */
  static async sendAccountSuspensionNotification(data: UserNotificationData) {
    try {
      const subject = `Account Suspended - LocalPro`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Account Suspended</h2>
          <p>Dear ${data.userName},</p>
          <p>We're writing to inform you that your LocalPro account has been suspended.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #dc2626;">Reason for Suspension</h3>
            <p>${data.reason || 'Your account has been suspended due to a violation of our terms of service.'}</p>
          </div>
          
          <p>If you believe this suspension is in error, please contact our support team to appeal this decision.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Contact Support
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            LocalPro Support Team
          </p>
        </div>
      `;

      await sendEmail({
        to: data.userEmail,
        subject,
        html
      });

      // Create in-app notification
      await this.createInAppNotification(data.userId, {
        type: 'warning',
        title: 'Account Suspended',
        message: data.reason || 'Your account has been suspended. Please contact support for more information.',
        link: '/contact'
      });

      console.log(`Account suspension notification sent to ${data.userEmail}`);
    } catch (error) {
      console.error('Error sending account suspension notification:', error);
    }
  }

  /**
   * Send account activation notification
   */
  static async sendAccountActivationNotification(data: UserNotificationData) {
    try {
      const subject = `Account Reactivated - Welcome Back!`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Account Reactivated! 🎉</h2>
          <p>Dear ${data.userName},</p>
          <p>Great news! Your LocalPro account has been reactivated and you can now access all features again.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #059669;">Welcome Back</h3>
            <p>Your account is now active and you can continue using LocalPro services.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for your patience. We're glad to have you back!
          </p>
        </div>
      `;

      await sendEmail({
        to: data.userEmail,
        subject,
        html
      });

      // Create in-app notification
      await this.createInAppNotification(data.userId, {
        type: 'success',
        title: 'Account Reactivated',
        message: 'Your account has been reactivated and is now active.',
        link: '/dashboard'
      });

      console.log(`Account activation notification sent to ${data.userEmail}`);
    } catch (error) {
      console.error('Error sending account activation notification:', error);
    }
  }

  /**
   * Send password change notification
   */
  static async sendPasswordChangeNotification(data: UserNotificationData) {
    try {
      const subject = `Password Changed - LocalPro`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Password Changed Successfully</h2>
          <p>Dear ${data.userName},</p>
          <p>This is to confirm that your password has been successfully changed.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Security Information</h3>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Account:</strong> ${data.userEmail}</p>
          </div>
          
          <p>If you did not make this change, please contact our support team immediately.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Contact Support
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated security notification from LocalPro.
          </p>
        </div>
      `;

      await sendEmail({
        to: data.userEmail,
        subject,
        html
      });

      // Create in-app notification
      await this.createInAppNotification(data.userId, {
        type: 'info',
        title: 'Password Changed',
        message: 'Your password has been successfully changed.',
        link: '/settings'
      });

      console.log(`Password change notification sent to ${data.userEmail}`);
    } catch (error) {
      console.error('Error sending password change notification:', error);
    }
  }

  /**
   * Send verification required notification
   */
  static async sendVerificationRequiredNotification(data: UserNotificationData) {
    try {
      const subject = `Verification Required - LocalPro`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Verification Required</h2>
          <p>Dear ${data.userName},</p>
          <p>To continue using LocalPro, please complete your account verification.</p>
          
          <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #f59e0b;">Action Required</h3>
            <p>Please upload the required documents to verify your identity and complete your profile.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" 
               style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Verification
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Verification helps us maintain a safe and trustworthy community.
          </p>
        </div>
      `;

      await sendEmail({
        to: data.userEmail,
        subject,
        html
      });

      // Create in-app notification
      await this.createInAppNotification(data.userId, {
        type: 'warning',
        title: 'Verification Required',
        message: 'Please complete your account verification to continue using LocalPro.',
        link: '/profile'
      });

      console.log(`Verification required notification sent to ${data.userEmail}`);
    } catch (error) {
      console.error('Error sending verification required notification:', error);
    }
  }

  /**
   * Create in-app notification
   */
  private static async createInAppNotification(
    userId: string, 
    notification: {
      type: string;
      title: string;
      message: string;
      link: string;
    }
  ) {
    try {
      if (!getDb()) {
        console.warn('Firebase not initialized, skipping in-app notification');
        return;
      }

      const notificationsRef = collection(getDb(), `users/${userId}/notifications`);
      await addDoc(notificationsRef, {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating in-app notification:', error);
    }
  }

  /**
   * Get user email from user ID
   */
  static async getUserEmail(userId: string): Promise<string | null> {
    try {
      if (!getDb()) return null;
      
      const userDoc = await getDoc(doc(getDb(), 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData?.email || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  }
}
