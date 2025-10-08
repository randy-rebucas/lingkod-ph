'use server';

import { getDb } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendEmail } from './email-service';

export interface BookingNotificationData {
  type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'booking_completed' | 'booking_reminder' | 'booking_rescheduled';
  bookingId: string;
  clientId: string;
  providerId: string;
  clientName: string;
  providerName: string;
  clientEmail: string;
  providerEmail: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  location?: string;
  reason?: string;
  rescheduledDate?: string;
  rescheduledTime?: string;
}

export class BookingNotificationService {
  /**
   * Send booking created notification
   */
  static async sendBookingCreatedNotification(data: BookingNotificationData) {
    try {
      // Notify provider
      const providerSubject = `New Booking Request: ${data.serviceName}`;
      const providerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Booking Request! 📅</h2>
          <p>Hello ${data.providerName},</p>
          <p>You have received a new booking request for your service.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Client:</strong> ${data.clientName}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Price:</strong> ₱${data.price.toFixed(2)}</p>
            ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
          </div>
          
          <p>Please review and confirm this booking as soon as possible.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Booking
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>LocalPro Team
          </p>
        </div>
      `;

      await sendEmail({
        to: data.providerEmail,
        subject: providerSubject,
        html: providerHtml
      });

      // Notify client
      const clientSubject = `Booking Request Sent: ${data.serviceName}`;
      const clientHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Booking Request Sent! 📅</h2>
          <p>Dear ${data.clientName},</p>
          <p>Your booking request has been sent to the service provider.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Provider:</strong> ${data.providerName}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Price:</strong> ₱${data.price.toFixed(2)}</p>
            ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
          </div>
          
          <p>The provider will review your request and get back to you soon.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View My Bookings
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>LocalPro Team
          </p>
        </div>
      `;

      await sendEmail({
        to: data.clientEmail,
        subject: clientSubject,
        html: clientHtml
      });

      // Create in-app notifications
      await this.createInAppNotification(data.providerId, {
        type: 'booking_update',
        title: 'New Booking Request',
        message: `You have a new booking request from ${data.clientName} for "${data.serviceName}".`,
        link: `/bookings/${data.bookingId}`
      });

      await this.createInAppNotification(data.clientId, {
        type: 'booking_update',
        title: 'Booking Request Sent',
        message: `Your booking request for "${data.serviceName}" has been sent to ${data.providerName}.`,
        link: `/bookings/${data.bookingId}`
      });

      console.log(`Booking created notifications sent for booking ${data.bookingId}`);
    } catch (error) {
      console.error('Error sending booking created notification:', error);
    }
  }

  /**
   * Send booking confirmed notification
   */
  static async sendBookingConfirmedNotification(data: BookingNotificationData) {
    try {
      // Notify client
      const clientSubject = `Booking Confirmed: ${data.serviceName}`;
      const clientHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Booking Confirmed! ✅</h2>
          <p>Dear ${data.clientName},</p>
          <p>Great news! Your booking has been confirmed by the service provider.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #059669;">Confirmed Booking Details</h3>
            <p><strong>Provider:</strong> ${data.providerName}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Price:</strong> ₱${data.price.toFixed(2)}</p>
            ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
          </div>
          
          <p>The provider will contact you soon to confirm the final details.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${data.bookingId}" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Booking Details
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>LocalPro Team
          </p>
        </div>
      `;

      await sendEmail({
        to: data.clientEmail,
        subject: clientSubject,
        html: clientHtml
      });

      // Create in-app notification
      await this.createInAppNotification(data.clientId, {
        type: 'success',
        title: 'Booking Confirmed',
        message: `Your booking for "${data.serviceName}" has been confirmed by ${data.providerName}.`,
        link: `/bookings/${data.bookingId}`
      });

      console.log(`Booking confirmed notification sent for booking ${data.bookingId}`);
    } catch (error) {
      console.error('Error sending booking confirmed notification:', error);
    }
  }

  /**
   * Send booking cancelled notification
   */
  static async sendBookingCancelledNotification(data: BookingNotificationData) {
    try {
      // Notify both parties
      const subject = `Booking Cancelled: ${data.serviceName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Booking Cancelled</h2>
          <p>Dear [RECIPIENT_NAME],</p>
          <p>This is to inform you that the following booking has been cancelled.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #dc2626;">Cancelled Booking Details</h3>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Price:</strong> ₱${data.price.toFixed(2)}</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          </div>
          
          <p>If you have any questions about this cancellation, please contact our support team.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Bookings
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>LocalPro Team
          </p>
        </div>
      `;

      // Send to client
      await sendEmail({
        to: data.clientEmail,
        subject,
        html: html.replace('[RECIPIENT_NAME]', data.clientName)
      });

      // Send to provider
      await sendEmail({
        to: data.providerEmail,
        subject,
        html: html.replace('[RECIPIENT_NAME]', data.providerName)
      });

      // Create in-app notifications
      await this.createInAppNotification(data.clientId, {
        type: 'warning',
        title: 'Booking Cancelled',
        message: `Your booking for "${data.serviceName}" has been cancelled.`,
        link: `/bookings/${data.bookingId}`
      });

      await this.createInAppNotification(data.providerId, {
        type: 'warning',
        title: 'Booking Cancelled',
        message: `The booking for "${data.serviceName}" has been cancelled.`,
        link: `/bookings/${data.bookingId}`
      });

      console.log(`Booking cancelled notifications sent for booking ${data.bookingId}`);
    } catch (error) {
      console.error('Error sending booking cancelled notification:', error);
    }
  }

  /**
   * Send booking completed notification
   */
  static async sendBookingCompletedNotification(data: BookingNotificationData) {
    try {
      // Notify client
      const clientSubject = `Service Completed: ${data.serviceName}`;
      const clientHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Service Completed! 🎉</h2>
          <p>Dear ${data.clientName},</p>
          <p>Great news! Your service has been completed successfully.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #059669;">Completed Service Details</h3>
            <p><strong>Provider:</strong> ${data.providerName}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Price:</strong> ₱${data.price.toFixed(2)}</p>
          </div>
          
          <p>Please take a moment to rate and review your experience with the service provider.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${data.bookingId}/review" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Leave a Review
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for using LocalPro!
          </p>
        </div>
      `;

      await sendEmail({
        to: data.clientEmail,
        subject: clientSubject,
        html: clientHtml
      });

      // Create in-app notification
      await this.createInAppNotification(data.clientId, {
        type: 'success',
        title: 'Service Completed',
        message: `Your service "${data.serviceName}" has been completed by ${data.providerName}.`,
        link: `/bookings/${data.bookingId}/review`
      });

      console.log(`Booking completed notification sent for booking ${data.bookingId}`);
    } catch (error) {
      console.error('Error sending booking completed notification:', error);
    }
  }

  /**
   * Send booking reminder notification
   */
  static async sendBookingReminderNotification(data: BookingNotificationData) {
    try {
      // Notify both parties
      const subject = `Reminder: Upcoming Service - ${data.serviceName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Service Reminder ⏰</h2>
          <p>Dear [RECIPIENT_NAME],</p>
          <p>This is a friendly reminder about your upcoming service.</p>
          
          <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #f59e0b;">Upcoming Service Details</h3>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Price:</strong> ₱${data.price.toFixed(2)}</p>
            ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
          </div>
          
          <p>Please ensure you're prepared for the service. If you need to make any changes, please contact the other party as soon as possible.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${data.bookingId}" 
               style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Booking Details
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>LocalPro Team
          </p>
        </div>
      `;

      // Send to client
      await sendEmail({
        to: data.clientEmail,
        subject,
        html: html.replace('[RECIPIENT_NAME]', data.clientName)
      });

      // Send to provider
      await sendEmail({
        to: data.providerEmail,
        subject,
        html: html.replace('[RECIPIENT_NAME]', data.providerName)
      });

      // Create in-app notifications
      await this.createInAppNotification(data.clientId, {
        type: 'info',
        title: 'Service Reminder',
        message: `Reminder: You have a service "${data.serviceName}" scheduled for ${data.date} at ${data.time}.`,
        link: `/bookings/${data.bookingId}`
      });

      await this.createInAppNotification(data.providerId, {
        type: 'info',
        title: 'Service Reminder',
        message: `Reminder: You have a service "${data.serviceName}" scheduled for ${data.date} at ${data.time}.`,
        link: `/bookings/${data.bookingId}`
      });

      console.log(`Booking reminder notifications sent for booking ${data.bookingId}`);
    } catch (error) {
      console.error('Error sending booking reminder notification:', error);
    }
  }

  /**
   * Send booking rescheduled notification
   */
  static async sendBookingRescheduledNotification(data: BookingNotificationData) {
    try {
      // Notify both parties
      const subject = `Booking Rescheduled: ${data.serviceName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Booking Rescheduled 📅</h2>
          <p>Dear [RECIPIENT_NAME],</p>
          <p>The following booking has been rescheduled.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Service Details</h3>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Previous Date:</strong> ${data.date}</p>
            <p><strong>Previous Time:</strong> ${data.time}</p>
            <p><strong>New Date:</strong> ${data.rescheduledDate}</p>
            <p><strong>New Time:</strong> ${data.rescheduledTime}</p>
            <p><strong>Price:</strong> ₱${data.price.toFixed(2)}</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          </div>
          
          <p>Please update your calendar with the new date and time.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${data.bookingId}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Updated Booking
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>LocalPro Team
          </p>
        </div>
      `;

      // Send to client
      await sendEmail({
        to: data.clientEmail,
        subject,
        html: html.replace('[RECIPIENT_NAME]', data.clientName)
      });

      // Send to provider
      await sendEmail({
        to: data.providerEmail,
        subject,
        html: html.replace('[RECIPIENT_NAME]', data.providerName)
      });

      // Create in-app notifications
      await this.createInAppNotification(data.clientId, {
        type: 'info',
        title: 'Booking Rescheduled',
        message: `Your booking for "${data.serviceName}" has been rescheduled to ${data.rescheduledDate} at ${data.rescheduledTime}.`,
        link: `/bookings/${data.bookingId}`
      });

      await this.createInAppNotification(data.providerId, {
        type: 'info',
        title: 'Booking Rescheduled',
        message: `The booking for "${data.serviceName}" has been rescheduled to ${data.rescheduledDate} at ${data.rescheduledTime}.`,
        link: `/bookings/${data.bookingId}`
      });

      console.log(`Booking rescheduled notifications sent for booking ${data.bookingId}`);
    } catch (error) {
      console.error('Error sending booking rescheduled notification:', error);
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
}
