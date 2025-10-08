'use server';

// import { Twilio } from 'twilio';

// Mock Twilio client for development
// const twilioClient = new Twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// Mock Twilio client interface
interface MockTwilioClient {
  messages: {
    create: (options: any) => Promise<any>;
    (messageId: string): {
      fetch: () => Promise<any>;
    };
  };
}

const twilioClient: MockTwilioClient = {
  messages: Object.assign(
    async (options: any) => {
      console.log('Mock SMS sent:', options);
      return { sid: 'mock_sid_' + Date.now() };
    },
    {
      create: async (options: any) => {
        console.log('Mock SMS sent:', options);
        return { sid: 'mock_sid_' + Date.now() };
      }
    }
  ) as any
};

export interface SMSNotificationData {
  type: 'booking_update' | 'payment_update' | 'account_update' | 'system_alert' | 'verification_code' | 'booking_reminder';
  phoneNumber: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SMSDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

// Constants
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const MAX_MESSAGE_LENGTH = 1600; // Twilio's limit
const COST_PER_SMS = 0.0075; // Approximate cost in USD

/**
 * Send SMS notification
 */
export async function sendSMS(data: SMSNotificationData): Promise<SMSDeliveryResult> {
  try {
    if (!FROM_NUMBER) {
      throw new Error('Twilio phone number not configured');
    }

    // Validate phone number format
    const formattedNumber = formatPhoneNumber(data.phoneNumber);
    if (!formattedNumber) {
      throw new Error('Invalid phone number format');
    }

    // Truncate message if too long
    const message = data.message.length > MAX_MESSAGE_LENGTH 
      ? data.message.substring(0, MAX_MESSAGE_LENGTH - 3) + '...'
      : data.message;

    // Send SMS via Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: formattedNumber,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/sms/status`
    });

    // Log SMS delivery
    await logSMSDelivery({
      messageId: result.sid,
      phoneNumber: formattedNumber,
      message: message,
      type: data.type,
      priority: data.priority,
      cost: COST_PER_SMS,
      status: 'sent'
    });

    return {
      success: true,
      messageId: result.sid,
      cost: COST_PER_SMS
    };

  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Log failed SMS delivery
    await logSMSDelivery({
      phoneNumber: data.phoneNumber,
      message: data.message,
      type: data.type,
      priority: data.priority,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
}

/**
 * Send verification code SMS
 */
export async function sendVerificationCode(phoneNumber: string, code: string): Promise<SMSDeliveryResult> {
  const message = `Your LocalPro verification code is: ${code}. This code will expire in 10 minutes. Do not share this code with anyone.`;
  
  return sendSMS({
    type: 'verification_code',
    phoneNumber,
    message,
    priority: 'high'
  });
}

/**
 * Send booking update SMS
 */
export async function sendBookingUpdateSMS(phoneNumber: string, bookingDetails: {
  serviceName: string;
  status: string;
  date?: string;
  time?: string;
}): Promise<SMSDeliveryResult> {
  const message = `LocalPro: Your booking for "${bookingDetails.serviceName}" has been ${bookingDetails.status.toLowerCase()}.${bookingDetails.date ? ` Scheduled for ${bookingDetails.date}${bookingDetails.time ? ` at ${bookingDetails.time}` : ''}.` : ''} View details: ${process.env.NEXT_PUBLIC_APP_URL}/bookings`;
  
  return sendSMS({
    type: 'booking_update',
    phoneNumber,
    message,
    priority: 'medium'
  });
}

/**
 * Send payment update SMS
 */
export async function sendPaymentUpdateSMS(phoneNumber: string, paymentDetails: {
  amount: number;
  status: string;
  serviceName: string;
}): Promise<SMSDeliveryResult> {
  const message = `LocalPro: Your payment of ₱${paymentDetails.amount.toFixed(2)} for "${paymentDetails.serviceName}" has been ${paymentDetails.status.toLowerCase()}. View details: ${process.env.NEXT_PUBLIC_APP_URL}/payments`;
  
  return sendSMS({
    type: 'payment_update',
    phoneNumber,
    message,
    priority: 'high'
  });
}

/**
 * Send booking reminder SMS
 */
export async function sendBookingReminderSMS(phoneNumber: string, bookingDetails: {
  serviceName: string;
  date: string;
  time: string;
  providerName: string;
}): Promise<SMSDeliveryResult> {
  const message = `LocalPro Reminder: You have "${bookingDetails.serviceName}" with ${bookingDetails.providerName} scheduled for ${bookingDetails.date} at ${bookingDetails.time}. Prepare for your service!`;
  
  return sendSMS({
    type: 'booking_reminder',
    phoneNumber,
    message,
    priority: 'medium'
  });
}

/**
 * Send system alert SMS
 */
export async function sendSystemAlertSMS(phoneNumber: string, alertDetails: {
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}): Promise<SMSDeliveryResult> {
  const priorityPrefix = alertDetails.priority === 'urgent' ? '🚨 URGENT: ' : 
                        alertDetails.priority === 'high' ? '⚠️ IMPORTANT: ' : '';
  
  const message = `LocalPro ${priorityPrefix}${alertDetails.title}: ${alertDetails.message}`;
  
  return sendSMS({
    type: 'system_alert',
    phoneNumber,
    message,
    priority: alertDetails.priority
  });
}

/**
 * Format phone number for international use
 */
function formatPhoneNumber(phoneNumber: string): string | null {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle Philippine numbers
  if (digits.startsWith('09') && digits.length === 11) {
    return `+63${digits.substring(1)}`;
  }
  
  // Handle numbers that already have country code
  if (digits.startsWith('63') && digits.length === 12) {
    return `+${digits}`;
  }
  
  // Handle international numbers
  if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`;
  }
  
  // If it's already formatted with +
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  return null;
}

/**
 * Log SMS delivery for tracking and analytics
 */
async function logSMSDelivery(data: {
  messageId?: string;
  phoneNumber: string;
  message: string;
  type: string;
  priority?: string;
  cost?: number;
  status: 'sent' | 'delivered' | 'failed' | 'undelivered';
  error?: string;
}): Promise<void> {
  try {
    // This would typically log to your database
    // For now, we'll just log to console
    console.log('SMS Delivery Log:', {
      ...data,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Implement database logging
    // await addDoc(collection(getDb(), 'smsLogs'), {
    //   ...data,
    //   timestamp: serverTimestamp()
    // });
    
  } catch (error) {
    console.error('Error logging SMS delivery:', error);
  }
}

/**
 * Get SMS delivery status
 */
export async function getSMSStatus(messageId: string): Promise<{
  status: string;
  errorCode?: string;
  errorMessage?: string;
}> {
  try {
    const message = await twilioClient.messages(messageId).fetch();
    
    return {
      status: message.status,
      errorCode: message.errorCode?.toString(),
      errorMessage: message.errorMessage
    };
  } catch (error) {
    console.error('Error fetching SMS status:', error);
    return {
      status: 'unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get SMS usage statistics
 */
export async function getSMSUsageStats(timeRange: 'day' | 'week' | 'month' = 'month'): Promise<{
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalCost: number;
  averageDeliveryTime: number;
}> {
  try {
    // This would typically query your SMS logs database
    // For now, return placeholder data
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalCost: 0,
      averageDeliveryTime: 0
    };
  } catch (error) {
    console.error('Error getting SMS usage stats:', error);
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalCost: 0,
      averageDeliveryTime: 0
    };
  }
}

/**
 * Validate phone number format
 */
export async function validatePhoneNumber(phoneNumber: string): Promise<{
  valid: boolean;
  formatted?: string;
  error?: string;
}> {
  try {
    const formatted = formatPhoneNumber(phoneNumber);
    
    if (!formatted) {
      return {
        valid: false,
        error: 'Invalid phone number format. Please enter a valid phone number.'
      };
    }
    
    return {
      valid: true,
      formatted
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Error validating phone number'
    };
  }
}

/**
 * Check if SMS notifications are enabled for user
 */
export async function isSMSEnabledForUser(userId: string): Promise<boolean> {
  try {
    // This would typically check user settings from database
    // For now, return true as default
    return true;
  } catch (error) {
    console.error('Error checking SMS settings for user:', error);
    return false;
  }
}

/**
 * Get estimated SMS cost for a message
 */
export async function getEstimatedCost(message: string): Promise<number> {
  // Twilio charges per SMS segment
  // Each segment is 160 characters for GSM-7 encoding
  const segments = Math.ceil(message.length / 160);
  return segments * COST_PER_SMS;
}
