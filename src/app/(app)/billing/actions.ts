'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  updateDoc,
  doc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'issueDate', 'dueDate'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');
const InvoiceSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Valid email is required'),
  clientAddress: z.string().min(1, 'Client address is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  lineItems: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    price: z.number().min(0.01, 'Price must be greater than 0'),
  })).min(1, 'At least one line item is required'),
  taxRate: z.number().min(0).max(1, 'Tax rate must be between 0 and 1'),
  dueDate: z.date(),
});

// Get provider invoices
export async function getProviderInvoices(providerId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedProviderId = UserIdSchema.parse(providerId);
    
    const invoicesQuery = query(
      collection(getDb(), "invoices"), 
      where("providerId", "==", validatedProviderId),
      orderBy("issueDate", "desc")
    );
    const invoicesSnapshot = await getDocs(invoicesQuery);
    const invoices = invoicesSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    return {
      success: true,
      data: invoices
    };
  } catch (error) {
    console.error('Error fetching provider invoices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invoices'
    };
  }
}

// Create new invoice
export async function createInvoice(data: {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  amount: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  taxRate: number;
  dueDate: Date;
  providerId: string;
}): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}> {
  try {
    const validatedData = InvoiceSchema.parse(data);
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    const invoiceData = {
      ...validatedData,
      invoiceNumber,
      status: 'Draft',
      issueDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(getDb(), "invoices"), invoiceData);

    return {
      success: true,
      data: { id: docRef.id }
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invoice'
    };
  }
}

// Update invoice status
export async function updateInvoiceStatus(invoiceId: string, status: 'Draft' | 'Sent' | 'Paid' | 'Overdue'): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const invoiceRef = doc(getDb(), "invoices", invoiceId);
    await updateDoc(invoiceRef, {
      status,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update invoice status'
    };
  }
}
