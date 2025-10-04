import { adminDb as db } from '../db/server';
import { sendEmail } from '../notifications/email-service';

export interface PaymentNotificationData {
  type: 'payment_approved' | 'payment_rejected' | 'payment_uploaded' | 'refund_processed' | 'payment_completed_automated';
  clientEmail: string;
  clientName: string;
  amount: number;
  serviceName: string;
  bookingId: string;
  rejectionReason?: string;
  refundReason?: string;
  paymentMethod?: string;
}

export class PaymentNotificationService {
  /**
   * Send payment approval notification
   */
  static async sendPaymentApprovalNotification(data: PaymentNotificationData) {
    try {
      const subject = `Payment Confirmed - ${data.serviceName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Payment Confirmed! 🎉</h2>
          <p>Dear ${data.clientName},</p>
          <p>Great news! Your payment has been confirmed and your booking is now active.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Amount:</strong> ₱${data.amount.toFixed(2)}</p>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          </div>
          
          <p>Your service provider will contact you soon to confirm the details of your appointment.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View My Bookings
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      `;

      await sendEmail({
        to: data.clientEmail,
        subject,
        html
      });

      console.log(`Payment approval notification sent to ${data.clientEmail}`);
    } catch (error) {
      console.error('Error sending payment approval notification:', error);
    }
  }

  /**
   * Send payment rejection notification
   */
  static async sendPaymentRejectionNotification(data: PaymentNotificationData) {
    try {
      const subject = `Payment Rejected - ${data.serviceName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Payment Rejected</h2>
          <p>Dear ${data.clientName},</p>
          <p>We're sorry to inform you that your payment has been rejected.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #dc2626;">Rejection Reason</h3>
            <p>${data.rejectionReason}</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Amount:</strong> ₱${data.amount.toFixed(2)}</p>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          </div>
          
          <p>Please upload a new payment proof or contact our support team for assistance.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${data.bookingId}/payment" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Upload New Payment
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you need help, please contact our support team.
          </p>
        </div>
      `;

      await sendEmail({
        to: data.clientEmail,
        subject,
        html
      });

      console.log(`Payment rejection notification sent to ${data.clientEmail}`);
    } catch (error) {
      console.error('Error sending payment rejection notification:', error);
    }
  }

  /**
   * Send payment upload confirmation
   */
  static async sendPaymentUploadNotification(data: PaymentNotificationData) {
    try {
      const subject = `Payment Proof Received - ${data.serviceName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Payment Proof Received</h2>
          <p>Dear ${data.clientName},</p>
          <p>Thank you for uploading your payment proof. We have received it and our team will verify it shortly.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Amount:</strong> ₱${data.amount.toFixed(2)}</p>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          </div>
          
          <p>You will receive another email once your payment is verified and your booking is confirmed.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View My Bookings
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      `;

      await sendEmail({
        to: data.clientEmail,
        subject,
        html
      });

      console.log(`Payment upload notification sent to ${data.clientEmail}`);
    } catch (error) {
      console.error('Error sending payment upload notification:', error);
    }
  }

  /**
   * Send refund notification
   */
  static async sendRefundNotification(data: PaymentNotificationData) {
    try {
      const subject = `Refund Processed - ${data.serviceName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Refund Processed</h2>
          <p>Dear ${data.clientName},</p>
          <p>Your refund has been processed successfully.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <h3 style="margin-top: 0; color: #0ea5e9;">Refund Details</h3>
            <p><strong>Amount Refunded:</strong> ₱${data.amount.toFixed(2)}</p>
            <p><strong>Reason:</strong> ${data.refundReason}</p>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          </div>
          
          <p>The refund will be processed back to your original payment method within 3-5 business days.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/payments" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Payment History
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions about this refund, please contact our support team.
          </p>
        </div>
      `;

      await sendEmail({
        to: data.clientEmail,
        subject,
        html
      });

      console.log(`Refund notification sent to ${data.clientEmail}`);
    } catch (error) {
      console.error('Error sending refund notification:', error);
    }
  }

  /**
   * Send automated payment completion notification
   */
  static async sendAutomatedPaymentNotification(data: PaymentNotificationData) {
    try {
      const subject = `Payment Confirmed - ${data.serviceName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Payment Confirmed! 🎉</h2>
          <p>Dear ${data.clientName},</p>
          <p>Great news! Your ${data.paymentMethod || 'GCash'} payment has been processed successfully and your booking is now confirmed.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Amount:</strong> ₱${data.amount.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${data.paymentMethod || 'GCash'}</p>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          </div>
          
          <p>Your service provider will contact you soon to confirm the details of your appointment.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View My Bookings
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      `;

      await sendEmail({
        to: data.clientEmail,
        subject,
        html
      });

      console.log(`Automated payment notification sent to ${data.clientEmail}`);
    } catch (error) {
      console.error('Error sending automated payment notification:', error);
    }
  }

  /**
   * Get user email from user ID
   */
  static async getUserEmail(userId: string): Promise<string | null> {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
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
