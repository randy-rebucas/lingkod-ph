'use server';

import { getDb } from './firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { sendEmail } from './email-service';
import { User } from '../types';

export interface SystemNotificationData {
  type: 'maintenance' | 'system_update' | 'security_alert' | 'feature_announcement' | 'service_outage' | 'policy_update';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience?: 'all' | 'clients' | 'providers' | 'agencies' | 'admins';
  scheduledFor?: Date;
  duration?: number; // in hours
  actionUrl?: string;
  actionText?: string;
}

export class SystemNotificationService {
  /**
   * Send system maintenance notification
   */
  static async sendMaintenanceNotification(data: SystemNotificationData) {
    try {
      const subject = `Scheduled Maintenance - LocalPro`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Scheduled Maintenance 🔧</h2>
          <p>Dear LocalPro User,</p>
          <p>We want to inform you about scheduled maintenance that will affect our services.</p>
          
          <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #f59e0b;">Maintenance Details</h3>
            <p><strong>Title:</strong> ${data.title}</p>
            <p><strong>Message:</strong> ${data.message}</p>
            ${data.scheduledFor ? `<p><strong>Scheduled For:</strong> ${data.scheduledFor.toLocaleString()}</p>` : ''}
            ${data.duration ? `<p><strong>Expected Duration:</strong> ${data.duration} hours</p>` : ''}
          </div>
          
          <p>During this time, some features may be temporarily unavailable. We apologize for any inconvenience.</p>
          
          ${data.actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" 
                 style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                ${data.actionText || 'Learn More'}
              </a>
            </div>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for your patience and understanding.<br>LocalPro Team
          </p>
        </div>
      `;

      await this.sendToTargetAudience(data, subject, html);
      console.log(`Maintenance notification sent: ${data.title}`);
    } catch (error) {
      console.error('Error sending maintenance notification:', error);
    }
  }

  /**
   * Send system update notification
   */
  static async sendSystemUpdateNotification(data: SystemNotificationData) {
    try {
      const subject = `System Update - LocalPro`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">System Update 🚀</h2>
          <p>Dear LocalPro User,</p>
          <p>We're excited to share some updates and improvements to our platform.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #059669;">Update Details</h3>
            <p><strong>Title:</strong> ${data.title}</p>
            <p><strong>Message:</strong> ${data.message}</p>
          </div>
          
          <p>These updates are designed to improve your experience and add new features to help you get the most out of LocalPro.</p>
          
          ${data.actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" 
                 style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                ${data.actionText || 'Learn More'}
              </a>
            </div>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for using LocalPro!<br>LocalPro Team
          </p>
        </div>
      `;

      await this.sendToTargetAudience(data, subject, html);
      console.log(`System update notification sent: ${data.title}`);
    } catch (error) {
      console.error('Error sending system update notification:', error);
    }
  }

  /**
   * Send security alert notification
   */
  static async sendSecurityAlertNotification(data: SystemNotificationData) {
    try {
      const subject = `Security Alert - LocalPro`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Security Alert ⚠️</h2>
          <p>Dear LocalPro User,</p>
          <p>We want to inform you about an important security matter.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #dc2626;">Security Alert Details</h3>
            <p><strong>Title:</strong> ${data.title}</p>
            <p><strong>Message:</strong> ${data.message}</p>
            <p><strong>Priority:</strong> ${data.priority.toUpperCase()}</p>
          </div>
          
          <p>Please take any recommended actions immediately to ensure the security of your account.</p>
          
          ${data.actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                ${data.actionText || 'Take Action'}
              </a>
            </div>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 14px;">
            If you have any concerns, please contact our support team immediately.<br>LocalPro Security Team
          </p>
        </div>
      `;

      await this.sendToTargetAudience(data, subject, html);
      console.log(`Security alert notification sent: ${data.title}`);
    } catch (error) {
      console.error('Error sending security alert notification:', error);
    }
  }

  /**
   * Send feature announcement notification
   */
  static async sendFeatureAnnouncementNotification(data: SystemNotificationData) {
    try {
      const subject = `New Feature Announcement - LocalPro`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">New Feature! ✨</h2>
          <p>Dear LocalPro User,</p>
          <p>We're excited to announce a new feature that will enhance your LocalPro experience.</p>
          
          <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
            <h3 style="margin-top: 0; color: #7c3aed;">Feature Details</h3>
            <p><strong>Title:</strong> ${data.title}</p>
            <p><strong>Description:</strong> ${data.message}</p>
          </div>
          
          <p>This new feature is designed to make your experience on LocalPro even better.</p>
          
          ${data.actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" 
                 style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                ${data.actionText || 'Try It Now'}
              </a>
            </div>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 14px;">
            We hope you enjoy this new feature!<br>LocalPro Team
          </p>
        </div>
      `;

      await this.sendToTargetAudience(data, subject, html);
      console.log(`Feature announcement notification sent: ${data.title}`);
    } catch (error) {
      console.error('Error sending feature announcement notification:', error);
    }
  }

  /**
   * Send service outage notification
   */
  static async sendServiceOutageNotification(data: SystemNotificationData) {
    try {
      const subject = `Service Outage - LocalPro`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Service Outage 🚨</h2>
          <p>Dear LocalPro User,</p>
          <p>We're experiencing technical difficulties that are affecting our services.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #dc2626;">Outage Details</h3>
            <p><strong>Issue:</strong> ${data.title}</p>
            <p><strong>Description:</strong> ${data.message}</p>
            <p><strong>Priority:</strong> ${data.priority.toUpperCase()}</p>
          </div>
          
          <p>Our technical team is working to resolve this issue as quickly as possible. We apologize for any inconvenience.</p>
          
          ${data.actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                ${data.actionText || 'Check Status'}
              </a>
            </div>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 14px;">
            We'll keep you updated on our progress.<br>LocalPro Technical Team
          </p>
        </div>
      `;

      await this.sendToTargetAudience(data, subject, html);
      console.log(`Service outage notification sent: ${data.title}`);
    } catch (error) {
      console.error('Error sending service outage notification:', error);
    }
  }

  /**
   * Send policy update notification
   */
  static async sendPolicyUpdateNotification(data: SystemNotificationData) {
    try {
      const subject = `Policy Update - LocalPro`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Policy Update 📋</h2>
          <p>Dear LocalPro User,</p>
          <p>We want to inform you about important updates to our policies.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #2563eb;">Policy Update Details</h3>
            <p><strong>Title:</strong> ${data.title}</p>
            <p><strong>Summary:</strong> ${data.message}</p>
          </div>
          
          <p>Please review the updated policies to understand any changes that may affect your use of LocalPro.</p>
          
          ${data.actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                ${data.actionText || 'Review Policy'}
              </a>
            </div>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for your attention to this important matter.<br>LocalPro Legal Team
          </p>
        </div>
      `;

      await this.sendToTargetAudience(data, subject, html);
      console.log(`Policy update notification sent: ${data.title}`);
    } catch (error) {
      console.error('Error sending policy update notification:', error);
    }
  }

  /**
   * Send notification to target audience
   */
  private static async sendToTargetAudience(
    data: SystemNotificationData, 
    subject: string, 
    html: string
  ) {
    try {
      if (!getDb()) {
        console.warn('Firebase not initialized, skipping system notification');
        return;
      }

      const targetAudience = data.targetAudience || 'all';
      let userQuery;

      if (targetAudience === 'all') {
        userQuery = query(collection(getDb(), 'users'));
      } else {
        userQuery = query(
          collection(getDb(), 'users'),
          where('role', '==', targetAudience.slice(0, -1)) // Remove 's' from plural
        );
      }

      const userSnapshot = await getDocs(userQuery);
      const users = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User & { id: string }));

      // Send email notifications
      for (const user of users) {
        if (user.email) {
          try {
            await sendEmail({
              to: user.email,
              subject,
              html: html.replace('Dear LocalPro User,', `Dear ${user.displayName || 'LocalPro User'},`)
            });
          } catch (error) {
            console.error(`Error sending email to ${user.email}:`, error);
          }
        }

        // Create in-app notification
        await this.createInAppNotification(user.id, {
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority,
          actionUrl: data.actionUrl,
          actionText: data.actionText
        });
      }

      console.log(`System notification sent to ${users.length} users`);
    } catch (error) {
      console.error('Error sending to target audience:', error);
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
      priority: string;
      actionUrl?: string;
      actionText?: string;
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
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        actionText: notification.actionText,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating in-app notification:', error);
    }
  }

  /**
   * Send urgent system-wide notification
   */
  static async sendUrgentNotification(data: SystemNotificationData) {
    try {
      // Force priority to urgent
      data.priority = 'urgent';
      
      // Send immediately to all users
      await this.sendToTargetAudience(data, `URGENT: ${data.title}`, `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626; background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
            URGENT NOTICE 🚨
          </h2>
          <p>Dear LocalPro User,</p>
          <p><strong>${data.title}</strong></p>
          <p>${data.message}</p>
          
          ${data.actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                ${data.actionText || 'Take Action Now'}
              </a>
            </div>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 14px;">
            LocalPro Team
          </p>
        </div>
      `);

      console.log(`Urgent notification sent: ${data.title}`);
    } catch (error) {
      console.error('Error sending urgent notification:', error);
    }
  }
}
