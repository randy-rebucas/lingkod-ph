'use server';

import { adminDb as db } from '../db/server';
import { sendEmail } from './email-service';

export interface PaymentNotificationData {
  userId: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
}

export type NotificationType = 'payment_success' | 'payment_failed' | 'payment_pending';

export async function sendPaymentNotification(
  type: NotificationType,
  data: PaymentNotificationData
): Promise<boolean> {
  try {
    // Get user details
    const userDoc = await db.collection('users').doc(data.userId).get();
    if (!userDoc.exists) {
      console.error('User not found:', data.userId);
      return false;
    }

    const user = userDoc.data();
    if (!user?.email) {
      console.error('User email not found:', data.userId);
      return false;
    }

    // Prepare email content based on notification type
    let subject: string;
    let htmlContent: string;

    switch (type) {
      case 'payment_success':
        subject = 'Payment Successful - LocalPro';
        htmlContent = `
          <h2>Payment Successful!</h2>
          <p>Your payment of ₱${data.amount.toLocaleString()} has been processed successfully.</p>
          <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p>Thank you for using LocalPro!</p>
        `;
        break;

      case 'payment_failed':
        subject = 'Payment Failed - LocalPro';
        htmlContent = `
          <h2>Payment Failed</h2>
          <p>We were unable to process your payment of ₱${data.amount.toLocaleString()}.</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p>Please try again or contact support if the issue persists.</p>
        `;
        break;

      case 'payment_pending':
        subject = 'Payment Pending - LocalPro';
        htmlContent = `
          <h2>Payment Pending</h2>
          <p>Your payment of ₱${data.amount.toLocaleString()} is being processed.</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p>You will receive another notification once the payment is confirmed.</p>
        `;
        break;

      default:
        console.error('Unknown notification type:', type);
        return false;
    }

    // Send email
    const emailSent = await sendEmail({
      to: user.email,
      subject,
      html: htmlContent,
    });

    if (emailSent) {
      // Log notification in database
      await db.collection('notifications').add({
        userId: data.userId,
        type,
        data,
        sentAt: new Date(),
        status: 'sent',
      });
    }

    return emailSent;
  } catch (error) {
    console.error('Error sending payment notification:', error);
    return false;
  }
}
