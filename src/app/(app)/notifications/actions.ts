'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'joinedAt', 'lastActiveAt', 'birthdate', 'lastMessageAt', 'timestamp'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');
const NotificationIdSchema = z.string().min(1, 'Notification ID is required');
const NotificationTypeSchema = z.enum([
  'booking_update', 'new_message', 'agency_invite', 'info', 'renewal_reminder', 
  'new_review', 'new_job', 'payment_received', 'payment_failed', 'system_alert', 
  'maintenance', 'security', 'promotion', 'newsletter', 'reminder', 'deadline', 
  'achievement', 'warning', 'error', 'success'
]);
const NotificationPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// Types
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type NotificationType = 'booking_update' | 'new_message' | 'agency_invite' | 'info' | 'renewal_reminder' | 'new_review' | 'new_job' | 'payment_received' | 'payment_failed' | 'system_alert' | 'maintenance' | 'security' | 'promotion' | 'newsletter' | 'reminder' | 'deadline' | 'achievement' | 'warning' | 'error' | 'success';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  link: string;
  read: boolean;
  createdAt: Date;
  inviteId?: string;
  agencyId?: string;
  agencyName?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
}

// Get user notifications
export async function getUserNotifications(userId: string): Promise<ActionResult<Notification[]>> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    const notifsRef = collection(getDb(), `users/${validatedUserId}/notifications`);
    const q = query(notifsRef, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    return {
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notifications',
      message: 'Could not retrieve notifications'
    };
  }
}

// Mark notification as read
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<ActionResult<any>> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedNotificationId = NotificationIdSchema.parse(notificationId);
    
    const notificationRef = doc(getDb(), `users/${validatedUserId}/notifications`, validatedNotificationId);
    await updateDoc(notificationRef, { read: true });
    
    return {
      success: true,
      message: 'Notification marked as read'
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark notification as read',
      message: 'Could not mark notification as read'
    };
  }
}

// Delete notification
export async function deleteNotification(userId: string, notificationId: string): Promise<ActionResult<any>> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedNotificationId = NotificationIdSchema.parse(notificationId);
    
    const notificationRef = doc(getDb(), `users/${validatedUserId}/notifications`, validatedNotificationId);
    await deleteDoc(notificationRef);
    
    return {
      success: true,
      message: 'Notification deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete notification',
      message: 'Could not delete notification'
    };
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<ActionResult<any>> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    // First get all unread notifications
    const result = await getUserNotifications(validatedUserId);
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to get notifications',
        message: 'Could not retrieve notifications'
      };
    }
    
    const unreadNotifications = result.data.filter(n => !n.read);
    
    if (unreadNotifications.length === 0) {
      return {
        success: true,
        message: 'No unread notifications to mark'
      };
    }
    
    // Update all unread notifications
    const promises = unreadNotifications.map(notif => 
      updateDoc(doc(getDb(), `users/${validatedUserId}/notifications`, notif.id), { read: true })
    );
    
    await Promise.all(promises);
    
    return {
      success: true,
      message: 'All notifications marked as read'
    };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      message: 'Could not mark all notifications as read'
    };
  }
}

// Delete all read notifications
export async function deleteAllReadNotifications(userId: string): Promise<ActionResult<any>> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    // First get all notifications
    const result = await getUserNotifications(validatedUserId);
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to get notifications',
        message: 'Could not retrieve notifications'
      };
    }
    
    const readNotifications = result.data.filter(n => n.read);
    
    if (readNotifications.length === 0) {
      return {
        success: true,
        message: 'No read notifications to delete'
      };
    }
    
    // Delete all read notifications
    const promises = readNotifications.map(notif => 
      deleteDoc(doc(getDb(), `users/${validatedUserId}/notifications`, notif.id))
    );
    
    await Promise.all(promises);
    
    return {
      success: true,
      message: 'All read notifications deleted'
    };
  } catch (error) {
    console.error('Error deleting all read notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete all read notifications',
      message: 'Could not delete all read notifications'
    };
  }
}

// Create notification
export async function createNotification(
  userId: string, 
  notificationData: {
    type: NotificationType;
    message: string;
    link?: string;
    priority?: NotificationPriority;
    inviteId?: string;
    agencyId?: string;
    agencyName?: string;
    metadata?: Record<string, any>;
  }
): Promise<ActionResult<any>> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedType = NotificationTypeSchema.parse(notificationData.type);
    const validatedMessage = z.string().min(1, 'Message is required').parse(notificationData.message);
    const validatedLink = notificationData.link ? z.string().url('Invalid link URL').parse(notificationData.link) : '';
    const validatedPriority = notificationData.priority ? NotificationPrioritySchema.parse(notificationData.priority) : 'medium';
    
    const notificationRef = collection(getDb(), `users/${validatedUserId}/notifications`);
    await addDoc(notificationRef, {
      type: validatedType,
      message: validatedMessage,
      link: validatedLink,
      read: false,
      priority: validatedPriority,
      inviteId: notificationData.inviteId || null,
      agencyId: notificationData.agencyId || null,
      agencyName: notificationData.agencyName || null,
      metadata: notificationData.metadata || {},
      createdAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Notification created successfully'
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create notification',
      message: 'Could not create notification'
    };
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<ActionResult<number>> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    const result = await getUserNotifications(validatedUserId);
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to get notifications',
        message: 'Could not retrieve notifications'
      };
    }
    
    const unreadCount = result.data.filter(n => !n.read).length;
    
    return {
      success: true,
      data: unreadCount,
      message: 'Unread notification count retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get unread notification count',
      message: 'Could not retrieve unread notification count'
    };
  }
}

// Get notifications by type
export async function getNotificationsByType(userId: string, type: NotificationType): Promise<ActionResult<Notification[]>> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    const validatedType = NotificationTypeSchema.parse(type);
    
    const result = await getUserNotifications(validatedUserId);
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to get notifications',
        message: 'Could not retrieve notifications'
      };
    }
    
    const filteredNotifications = result.data.filter(n => n.type === validatedType);
    
    return {
      success: true,
      data: filteredNotifications,
      message: 'Notifications by type retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting notifications by type:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notifications by type',
      message: 'Could not retrieve notifications by type'
    };
  }
}
