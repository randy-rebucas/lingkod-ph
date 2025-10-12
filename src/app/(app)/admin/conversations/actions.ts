'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy
} from 'firebase/firestore';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'timestamp'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Get all conversations
export async function getAllConversations(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const conversationsQuery = query(
      collection(getDb(), "conversations"), 
      orderBy("timestamp", "desc")
    );
    const conversationsSnapshot = await getDocs(conversationsQuery);
    const conversations = conversationsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    return {
      success: true,
      data: conversations
    };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch conversations'
    };
  }
}

// Get conversation messages
export async function getConversationMessages(conversationId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const messagesQuery = query(
      collection(getDb(), "conversations", conversationId, "messages"), 
      orderBy("timestamp", "asc")
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    const messages = messagesSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    return {
      success: true,
      data: messages
    };
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch conversation messages'
    };
  }
}
