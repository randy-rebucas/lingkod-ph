'use server';

import { getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auditLogger } from '@/lib/audit-logger';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  imageUrl?: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'system';
}

// Send message action
export async function sendMessage(data: {
  conversationId: string;
  receiverId: string;
  text?: string;
  imageUrl?: string;
  type?: 'text' | 'image' | 'system';
}): Promise<{ success: boolean; data?: { messageId: string }; error?: string }> {
  try {
    const db = getDb();
    const messagesRef = collection(db, 'messages');
    
    const messageData = {
      ...data,
      senderId: 'current-user-id', // This would come from auth context
      timestamp: serverTimestamp(),
      read: false,
      type: data.type || 'text',
    };
    
    const docRef = await addDoc(messagesRef, messageData);
    
    // Log message sending
    await auditLogger.logMessageSent(
      'current-user-id',
      'client',
      data.conversationId,
      {
        messageData: {
          hasText: !!data.text,
          hasImage: !!data.imageUrl,
          conversationId: data.conversationId
        }
      }
    );
    
    return { success: true, data: { messageId: docRef.id } };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

// Get messages for a conversation
export async function getMessages(params: {
  conversationId: string;
  limit?: number;
}): Promise<{ success: boolean; data?: Message[]; error?: string }> {
  try {
    const db = getDb();
    const messagesRef = collection(db, 'messages');
    
    const q = query(
      messagesRef,
      where('conversationId', '==', params.conversationId),
      orderBy('timestamp', 'desc'),
      limit(params.limit || 50)
    );
    
    const snapshot = await getDocs(q);
    const messages: Message[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
      } as Message);
    });
    
    return { success: true, data: messages };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { success: false, error: 'Failed to fetch messages' };
  }
}

// Mark message as read
export async function markMessageAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const messageRef = doc(db, 'messages', messageId);
    
    await updateDoc(messageRef, {
      read: true,
      readAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { success: false, error: 'Failed to mark message as read' };
  }
}
