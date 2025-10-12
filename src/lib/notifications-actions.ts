'use server';

import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  category: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  readAt?: Date;
}

// Get notification history
export async function getNotificationHistory(params: {
  userId: string;
  pageSize?: number;
  lastDocId?: string;
  type?: string;
  category?: string;
}): Promise<{ success: boolean; data?: { notifications: Notification[]; hasMore: boolean; lastDocId?: string }; error?: string }> {
  try {
    const db = getDb();
    const notificationsRef = collection(db, 'notificationDeliveries');
    
    // Build query
    let q = query(
      notificationsRef,
      where('userId', '==', params.userId),
      orderBy('timestamp', 'desc'),
      limit(params.pageSize || 20)
    );

    // Add filters if provided
    if (params.type) {
      q = query(q, where('type', '==', params.type));
    }
    if (params.category) {
      q = query(q, where('category', '==', params.category));
    }

    // Add pagination if lastDocId is provided
    if (params.lastDocId) {
      const lastDoc = await getDocs(query(collection(db, 'notificationDeliveries'), where('__name__', '==', params.lastDocId)));
      if (!lastDoc.empty) {
        q = query(q, startAfter(lastDoc.docs[0]));
      }
    }

    const snapshot = await getDocs(q);
    const notifications: Notification[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        readAt: data.readAt?.toDate?.() || (data.readAt ? new Date(data.readAt) : undefined),
      } as Notification);
    });

    return {
      success: true,
      data: {
        notifications,
        hasMore: notifications.length === (params.pageSize || 20),
        lastDocId: notifications.length > 0 ? notifications[notifications.length - 1].id : undefined
      }
    };
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return { success: false, error: 'Failed to fetch notification history' };
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const notificationRef = doc(db, 'notificationDeliveries', notificationId);
    
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const notificationsRef = collection(db, 'notificationDeliveries');
    
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const batch: Promise<void>[] = [];
    
    snapshot.forEach((doc) => {
      batch.push(updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
      }));
    });
    
    await Promise.all(batch);
    
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Failed to mark all notifications as read' };
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const db = getDb();
    const notificationsRef = collection(db, 'notificationDeliveries');
    
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    return { success: true, data: snapshot.size };
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return { success: false, error: 'Failed to get unread notification count' };
  }
}
