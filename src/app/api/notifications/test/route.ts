'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { NotificationDeliveryService } from '@/lib/notification-delivery-service';
import { getUserSettings } from '@/lib/user-settings-service';

export async function POST(request: NextRequest) {
  try {
    const { type, category = 'system' } = await request.json();
    
    // Get user from Firebase Auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user settings to check if notification type is enabled
    const userSettings = await getUserSettings(userId);
    
    // Check if the notification type is enabled
    const isEnabled = checkNotificationEnabled(userSettings, type, category);
    if (!isEnabled) {
      return NextResponse.json({ 
        error: `${type} notifications are not enabled for ${category} category` 
      }, { status: 400 });
    }

    // Create test notification data
    const testData = {
      userId,
      type,
      category,
      title: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
      message: `This is a test ${type} notification from LocalPro. Your ${type} notifications are working correctly!`,
      priority: 'medium' as const,
      actionUrl: '/settings/notifications',
      actionText: 'Manage Notifications',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    // Send the test notification
    const result = await NotificationDeliveryService.sendNotification(testData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test ${type} notification sent successfully`,
        deliveryId: result.deliveryId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send test notification'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

function checkNotificationEnabled(userSettings: any, type: string, category: string): boolean {
  if (!userSettings?.notifications) return false;

  switch (type) {
    case 'email':
      if (!userSettings.notifications.email.enabled) return false;
      return isCategoryEnabled(userSettings.notifications.email, category);
    case 'sms':
      if (!userSettings.notifications.sms.enabled || !userSettings.notifications.sms.phoneVerified) return false;
      return isCategoryEnabled(userSettings.notifications.sms, category);
    case 'in_app':
      if (!userSettings.notifications.inApp.enabled) return false;
      return isCategoryEnabled(userSettings.notifications.inApp, category);
    case 'push':
      if (!userSettings.notifications.push.enabled) return false;
      return isCategoryEnabled(userSettings.notifications.push, category);
    default:
      return false;
  }
}

function isCategoryEnabled(notificationSettings: any, category: string): boolean {
  switch (category) {
    case 'booking':
      return notificationSettings.bookingUpdates || false;
    case 'payment':
      return notificationSettings.paymentUpdates || false;
    case 'message':
      return notificationSettings.newMessages || false;
    case 'system':
      return notificationSettings.systemUpdates || false;
    case 'security':
      return notificationSettings.securityAlerts || false;
    case 'promotional':
      return notificationSettings.promotionalEmails || false;
    default:
      return false;
  }
}
