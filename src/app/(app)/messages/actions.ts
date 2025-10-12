'use server';

import { getDb, getStorageInstance } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = [
    'createdAt', 'updatedAt', 'joinedAt', 'lastActiveAt', 'birthdate', 'lastMessageAt', 
    'timestamp', 'submittedAt', 'endDate', 'date', 'favoritedAt', 'establishedDate'
  ];
  
  // Handle top-level timestamp fields
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  // Handle nested timestamp fields in verification object
  if (serialized.verification && typeof serialized.verification === 'object') {
    const verification = { ...serialized.verification };
    timestampFields.forEach(field => {
      if (verification[field] && typeof verification[field].toDate === 'function') {
        verification[field] = verification[field].toDate();
      }
    });
    serialized.verification = verification;
  }
  
  // Handle nested timestamp fields in other common nested objects
  const nestedObjects = ['payoutDetails', 'documents', 'metadata'];
  nestedObjects.forEach(objKey => {
    if (serialized[objKey] && typeof serialized[objKey] === 'object') {
      if (Array.isArray(serialized[objKey])) {
        serialized[objKey] = serialized[objKey].map((item: any) => 
          typeof item === 'object' ? serializeTimestamps(item) : item
        );
      } else {
        serialized[objKey] = serializeTimestamps(serialized[objKey]);
      }
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');
const ConversationIdSchema = z.string().min(1, 'Conversation ID is required');
const MessageTextSchema = z.string().min(1, 'Message text is required');
const NotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  senderName: z.string().min(1, 'Sender name is required'),
  message: z.string().min(1, 'Message is required'),
  link: z.string().min(1, 'Link is required')
});

// Types
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantInfo: {
    [key: string]: {
      displayName: string;
      photoURL: string;
    }
  };
  lastMessage: string;
  timestamp: Date;
  unread?: number;
}

export interface Message {
  id?: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  timestamp: Date;
  hint?: string;
  status?: 'sent' | 'delivered' | 'read';
}

// Get user conversations
export async function getUserConversations(userId: string): Promise<ActionResult<Conversation[]>> {
  try {
    const validatedId = UserIdSchema.parse(userId);
    
    const conversationsQuery = query(
      collection(getDb(), "conversations"), 
      where("participants", "array-contains", validatedId)
    );
    
    const conversationsSnapshot = await getDocs(conversationsQuery);
    const conversations = conversationsSnapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    ).sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      success: true,
      data: conversations,
      message: 'User conversations retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user conversations',
      message: 'Could not retrieve conversations'
    };
  }
}

// Get conversation messages
export async function getConversationMessages(conversationId: string): Promise<ActionResult<Message[]>> {
  try {
    const validatedId = ConversationIdSchema.parse(conversationId);
    
    const messagesQuery = query(
      collection(getDb(), "conversations", validatedId, "messages"),
      orderBy("timestamp", "asc")
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    const messages = messagesSnapshot.docs.map(doc => 
      serializeTimestamps({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    return {
      success: true,
      data: messages,
      message: 'Conversation messages retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conversation messages',
      message: 'Could not retrieve messages'
    };
  }
}

// Send message
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  imageFile?: File
): Promise<ActionResult<{ messageId: string }>> {
  try {
    const validatedConversationId = ConversationIdSchema.parse(conversationId);
    const validatedSenderId = UserIdSchema.parse(senderId);
    const validatedText = MessageTextSchema.parse(text);
    
    let imageUrl: string | undefined;
    
    // Upload image if provided
    if (imageFile) {
      const storageRef = ref(getStorageInstance(), `chat-images/${validatedConversationId}/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(uploadResult.ref);
    }
    
    const messageData: Omit<Message, 'id'> = {
      senderId: validatedSenderId,
      text: validatedText,
      timestamp: serverTimestamp() as any,
      status: 'sent',
      ...(imageUrl && { imageUrl }),
    };
    
    // Add message to conversation
    const messagesRef = collection(getDb(), "conversations", validatedConversationId, "messages");
    const messageDoc = await addDoc(messagesRef, messageData);
    
    // Update conversation with last message
    const conversationRef = doc(getDb(), "conversations", validatedConversationId);
    await updateDoc(conversationRef, {
      lastMessage: validatedText || 'Image sent',
      timestamp: serverTimestamp()
    });
    
    return {
      success: true,
      data: { messageId: messageDoc.id },
      message: 'Message sent successfully'
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
      message: 'Could not send message'
    };
  }
}

// Create notification
export async function createNotification(
  userId: string,
  senderName: string,
  message: string,
  link: string
): Promise<ActionResult<any>> {
  try {
    const validatedData = NotificationSchema.parse({
      userId,
      senderName,
      message,
      link
    });
    
    // Check user notification settings
    const userNotifSettingsRef = doc(getDb(), 'users', validatedData.userId);
    const docSnap = await getDoc(userNotifSettingsRef);
    
    if (docSnap.exists() && docSnap.data().notificationSettings?.newMessages === false) {
      return {
        success: true,
        message: 'Notification skipped due to user settings'
      };
    }
    
    // Create notification
    const notificationsRef = collection(getDb(), `users/${validatedData.userId}/notifications`);
    const notificationData = {
      type: 'message',
      title: `New message from ${validatedData.senderName}`,
      body: validatedData.message,
      link: validatedData.link,
      timestamp: serverTimestamp(),
      read: false
    };
    
    const notificationDoc = await addDoc(notificationsRef, notificationData);
    
    return {
      success: true,
      data: { notificationId: notificationDoc.id },
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

// Start new conversation
export async function startConversation(
  participant1Id: string,
  participant2Id: string,
  participant1Info: { displayName: string; photoURL: string },
  participant2Info: { displayName: string; photoURL: string }
): Promise<ActionResult<{ conversationId: string }>> {
  try {
    const validatedParticipant1 = UserIdSchema.parse(participant1Id);
    const validatedParticipant2 = UserIdSchema.parse(participant2Id);
    
    // Check if conversation already exists
    const existingConversationsQuery = query(
      collection(getDb(), "conversations"),
      where("participants", "array-contains", validatedParticipant1)
    );
    
    const existingConversationsSnapshot = await getDocs(existingConversationsQuery);
    const existingConversation = existingConversationsSnapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(validatedParticipant2);
    });
    
    if (existingConversation) {
      return {
        success: true,
        data: { conversationId: existingConversation.id },
        message: 'Existing conversation found'
      };
    }
    
    // Create new conversation
    const conversationData = {
      participants: [validatedParticipant1, validatedParticipant2],
      participantInfo: {
        [validatedParticipant1]: participant1Info,
        [validatedParticipant2]: participant2Info
      },
      lastMessage: '',
      timestamp: serverTimestamp()
    };
    
    const conversationsRef = collection(getDb(), "conversations");
    const conversationDoc = await addDoc(conversationsRef, conversationData);
    
    return {
      success: true,
      data: { conversationId: conversationDoc.id },
      message: 'New conversation created successfully'
    };
  } catch (error) {
    console.error('Error starting conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start conversation',
      message: 'Could not start conversation'
    };
  }
}

// Mark messages as read
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<ActionResult<any>> {
  try {
    const validatedConversationId = ConversationIdSchema.parse(conversationId);
    const validatedUserId = UserIdSchema.parse(userId);
    
    // Update conversation to mark messages as read
    const conversationRef = doc(getDb(), "conversations", validatedConversationId);
    await updateDoc(conversationRef, {
      [`unread.${validatedUserId}`]: 0,
      lastReadAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Messages marked as read successfully'
    };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark messages as read',
      message: 'Could not mark messages as read'
    };
  }
}

// Get conversation by ID
export async function getConversationById(conversationId: string): Promise<ActionResult<Conversation>> {
  try {
    const validatedId = ConversationIdSchema.parse(conversationId);
    
    const conversationRef = doc(getDb(), "conversations", validatedId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      return {
        success: false,
        error: 'Conversation not found',
        message: 'Could not find conversation'
      };
    }
    
    const conversation = serializeTimestamps({
      id: conversationSnap.id,
      ...conversationSnap.data(),
    });
    
    return {
      success: true,
      data: conversation,
      message: 'Conversation retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting conversation by ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conversation',
      message: 'Could not retrieve conversation'
    };
  }
}
