# 🔧 Server Actions Developer Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Server Actions Patterns](#server-actions-patterns)
3. [Error Handling](#error-handling)
4. [Testing Guidelines](#testing-guidelines)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## 🚀 Quick Start

### Creating a New Server Action

```typescript
// src/app/example/actions.ts
'use server';

import { getDb } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';

// 1. Define validation schema
const ExampleSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
});

// 2. Define return type
type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
};

// 3. Create server action
export async function updateExample(
  data: z.infer<typeof ExampleSchema>
): Promise<ActionResult> {
  try {
    // Validate input
    const validatedFields = ExampleSchema.safeParse(data);
    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors.map(e => e.message).join(', '),
        message: 'Validation failed'
      };
    }

    const { id, name, email } = validatedFields.data;

    // Perform database operation
    const docRef = doc(getDb(), 'examples', id);
    await updateDoc(docRef, { name, email });

    return {
      success: true,
      message: 'Example updated successfully',
      data: { id, name, email }
    };

  } catch (error) {
    console.error('Error updating example:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update example'
    };
  }
}
```

### Using Server Actions in Components

```typescript
// src/app/example/page.tsx
'use client';

import { updateExample } from './actions';
import { useState } from 'react';

export default function ExamplePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setMessage('');

    try {
      const data = {
        id: formData.get('id') as string,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
      };

      const result = await updateExample(data);

      if (result.success) {
        setMessage(result.message || 'Success!');
      } else {
        setMessage(result.error || 'An error occurred');
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update'}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
```

---

## 🎯 Server Actions Patterns

### 1. CRUD Operations

#### Create Operation
```typescript
export async function createItem(data: CreateItemData): Promise<ActionResult> {
  try {
    const validatedFields = CreateItemSchema.safeParse(data);
    if (!validatedFields.success) {
      return { success: false, error: 'Validation failed' };
    }

    const docRef = doc(collection(getDb(), 'items'));
    await setDoc(docRef, {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Item created successfully' };
  } catch (error) {
    return { success: false, error: 'Failed to create item' };
  }
}
```

#### Read Operation
```typescript
export async function getItem(id: string): Promise<ActionResult> {
  try {
    const docRef = doc(getDb(), 'items', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Item not found' };
    }

    return {
      success: true,
      data: { id: docSnap.id, ...docSnap.data() }
    };
  } catch (error) {
    return { success: false, error: 'Failed to fetch item' };
  }
}
```

#### Update Operation
```typescript
export async function updateItem(id: string, data: UpdateItemData): Promise<ActionResult> {
  try {
    const validatedFields = UpdateItemSchema.safeParse(data);
    if (!validatedFields.success) {
      return { success: false, error: 'Validation failed' };
    }

    const docRef = doc(getDb(), 'items', id);
    await updateDoc(docRef, {
      ...validatedFields.data,
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Item updated successfully' };
  } catch (error) {
    return { success: false, error: 'Failed to update item' };
  }
}
```

#### Delete Operation
```typescript
export async function deleteItem(id: string): Promise<ActionResult> {
  try {
    const docRef = doc(getDb(), 'items', id);
    await deleteDoc(docRef);

    return { success: true, message: 'Item deleted successfully' };
  } catch (error) {
    return { success: false, error: 'Failed to delete item' };
  }
}
```

### 2. Batch Operations

```typescript
export async function batchUpdateItems(updates: ItemUpdate[]): Promise<ActionResult> {
  try {
    const batch = writeBatch(getDb());

    updates.forEach(update => {
      const docRef = doc(getDb(), 'items', update.id);
      batch.update(docRef, {
        ...update.data,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    return { success: true, message: `${updates.length} items updated successfully` };
  } catch (error) {
    return { success: false, error: 'Failed to batch update items' };
  }
}
```

### 3. File Upload Operations

```typescript
export async function uploadFile(
  file: File,
  path: string
): Promise<ActionResult> {
  try {
    const storage = getStorageInstance();
    const fileRef = ref(storage, path);
    
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    return {
      success: true,
      message: 'File uploaded successfully',
      data: { url: downloadURL }
    };
  } catch (error) {
    return { success: false, error: 'Failed to upload file' };
  }
}
```

### 4. Authentication & Authorization

```typescript
export async function protectedAction(
  data: any,
  requiredRole: string
): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check user role
    if (user.role !== requiredRole && user.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Perform action
    // ... business logic

    return { success: true, message: 'Action completed successfully' };
  } catch (error) {
    return { success: false, error: 'Action failed' };
  }
}
```

---

## ⚠️ Error Handling

### Standard Error Response Format

```typescript
type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
  code?: string;
};
```

### Error Handling Patterns

#### 1. Validation Errors
```typescript
const validatedFields = Schema.safeParse(data);
if (!validatedFields.success) {
  return {
    success: false,
    error: validatedFields.error.errors.map(e => e.message).join(', '),
    message: 'Validation failed',
    code: 'VALIDATION_ERROR'
  };
}
```

#### 2. Database Errors
```typescript
try {
  await updateDoc(docRef, data);
} catch (error) {
  if (error.code === 'permission-denied') {
    return {
      success: false,
      error: 'Permission denied',
      message: 'You do not have permission to perform this action',
      code: 'PERMISSION_DENIED'
    };
  }
  
  return {
    success: false,
    error: 'Database operation failed',
    message: 'Failed to update data',
    code: 'DATABASE_ERROR'
  };
}
```

#### 3. External Service Errors
```typescript
try {
  const response = await fetch('https://api.external-service.com/data');
  if (!response.ok) {
    throw new Error(`External service error: ${response.status}`);
  }
} catch (error) {
  return {
    success: false,
    error: 'External service unavailable',
    message: 'Failed to fetch external data',
    code: 'EXTERNAL_SERVICE_ERROR'
  };
}
```

### Graceful Degradation

```typescript
export async function actionWithFallback(data: any): Promise<ActionResult> {
  try {
    // Primary operation
    const result = await primaryOperation(data);
    return { success: true, data: result };
  } catch (error) {
    console.warn('Primary operation failed, trying fallback:', error);
    
    try {
      // Fallback operation
      const fallbackResult = await fallbackOperation(data);
      return { 
        success: true, 
        data: fallbackResult,
        message: 'Operation completed with fallback method'
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: 'All operations failed',
        message: 'Unable to complete the requested action'
      };
    }
  }
}
```

---

## 🧪 Testing Guidelines

### Test Structure

```typescript
// src/app/example/__tests__/actions.test.ts
import { updateExample } from '../actions';
import { getDb } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock Firestore functions
jest.mock('firebase/firestore');
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;

describe('updateExample', () => {
  const mockDb = {
    doc: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  describe('Validation', () => {
    it('should reject invalid data', async () => {
      const invalidData = {
        id: '',
        name: 'A', // Too short
        email: 'invalid-email',
      };

      const result = await updateExample(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ID is required');
      expect(result.error).toContain('Name must be at least 2 characters');
      expect(result.error).toContain('Invalid email format');
    });
  });

  describe('Success Cases', () => {
    it('should update example successfully', async () => {
      const validData = {
        id: 'example-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = await updateExample(validData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Example updated successfully');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Database error'));

      const result = await updateExample({
        id: 'example-123',
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
```

### Mock Setup Best Practices

```typescript
// 1. Mock Firebase functions
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;

// 2. Create mock database
const mockDb = {
  doc: jest.fn(),
  collection: jest.fn(),
};

// 3. Setup mocks in beforeEach
beforeEach(() => {
  jest.clearAllMocks();
  mockGetDb.mockReturnValue(mockDb as any);
  mockUpdateDoc.mockResolvedValue(undefined);
});

// 4. Test different scenarios
describe('Different scenarios', () => {
  it('should handle success case', async () => {
    // Setup success scenario
    const result = await action(validData);
    expect(result.success).toBe(true);
  });

  it('should handle error case', async () => {
    // Setup error scenario
    mockUpdateDoc.mockRejectedValue(new Error('Test error'));
    
    const result = await action(validData);
    expect(result.success).toBe(false);
  });
});
```

---

## 🎯 Best Practices

### 1. Input Validation

```typescript
// Always validate inputs with Zod
const UserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be at least 18 years old'),
});

export async function createUser(data: unknown): Promise<ActionResult> {
  const validatedFields = UserSchema.safeParse(data);
  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.errors.map(e => e.message).join(', '),
      message: 'Validation failed'
    };
  }
  
  // Use validated data
  const { name, email, age } = validatedFields.data;
  // ... rest of the function
}
```

### 2. Consistent Return Types

```typescript
// Define standard return types
type ActionResult<T = any> = {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
};

// Use consistent return patterns
export async function action(): Promise<ActionResult> {
  try {
    // ... business logic
    return {
      success: true,
      message: 'Operation completed successfully',
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Operation failed'
    };
  }
}
```

### 3. Error Logging

```typescript
export async function action(): Promise<ActionResult> {
  try {
    // ... business logic
  } catch (error) {
    // Log error for debugging
    console.error('Action failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    return {
      success: false,
      error: 'Operation failed',
      message: 'An unexpected error occurred'
    };
  }
}
```

### 4. Database Transactions

```typescript
export async function complexOperation(): Promise<ActionResult> {
  try {
    const batch = writeBatch(getDb());
    
    // Add multiple operations to batch
    batch.set(doc(collection(getDb(), 'users')), userData);
    batch.update(doc(getDb(), 'stats', 'global'), { userCount: increment(1) });
    batch.set(doc(collection(getDb(), 'logs')), logData);
    
    // Commit all operations atomically
    await batch.commit();
    
    return { success: true, message: 'Operation completed successfully' };
  } catch (error) {
    return { success: false, error: 'Failed to complete operation' };
  }
}
```

### 5. Rate Limiting

```typescript
// Simple rate limiting implementation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function rateLimitedAction(
  userId: string,
  action: () => Promise<ActionResult>
): Promise<ActionResult> {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;
  
  const userLimit = rateLimitMap.get(userId);
  
  if (userLimit) {
    if (now < userLimit.resetTime) {
      if (userLimit.count >= maxRequests) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.'
        };
      }
      userLimit.count++;
    } else {
      rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    }
  } else {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
  }
  
  return await action();
}
```

---

## 🔄 Common Patterns

### 1. Form Data Handling

```typescript
// Server action for form data
export async function handleFormSubmission(
  prevState: any,
  formData: FormData
): Promise<ActionResult> {
  try {
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string,
    };

    const validatedFields = FormSchema.safeParse(data);
    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Validation failed',
        message: 'Please check your input and try again'
      };
    }

    // Process form data
    await processFormData(validatedFields.data);

    return {
      success: true,
      message: 'Form submitted successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to submit form',
      message: 'An error occurred while processing your request'
    };
  }
}
```

### 2. Pagination

```typescript
export async function getPaginatedData(
  page: number = 1,
  limit: number = 10,
  filters?: any
): Promise<ActionResult> {
  try {
    const offset = (page - 1) * limit;
    
    let query = collection(getDb(), 'items');
    
    // Apply filters
    if (filters?.category) {
      query = query(collection(getDb(), 'items'), where('category', '==', filters.category));
    }
    
    // Add pagination
    query = query(query, orderBy('createdAt', 'desc'), limit(limit), offset(offset));
    
    const snapshot = await getDocs(query);
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get total count
    const countSnapshot = await getCountFromServer(query);
    const total = countSnapshot.data().count;
    
    return {
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch data',
      message: 'Unable to retrieve the requested information'
    };
  }
}
```

### 3. Search Functionality

```typescript
export async function searchItems(
  query: string,
  filters?: SearchFilters
): Promise<ActionResult> {
  try {
    if (!query.trim()) {
      return {
        success: false,
        error: 'Search query is required',
        message: 'Please enter a search term'
      };
    }

    let searchQuery = collection(getDb(), 'items');
    
    // Apply text search (if using Algolia or similar)
    if (filters?.useFullTextSearch) {
      const results = await algoliaSearch(query, filters);
      return {
        success: true,
        data: results
      };
    }
    
    // Apply field-based filters
    if (filters?.category) {
      searchQuery = query(searchQuery, where('category', '==', filters.category));
    }
    
    if (filters?.status) {
      searchQuery = query(searchQuery, where('status', '==', filters.status));
    }
    
    const snapshot = await getDocs(searchQuery);
    const items = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );
    
    return {
      success: true,
      data: items
    };
  } catch (error) {
    return {
      success: false,
      error: 'Search failed',
      message: 'Unable to perform search'
    };
  }
}
```

### 4. File Processing

```typescript
export async function processFileUpload(
  file: File,
  metadata?: FileMetadata
): Promise<ActionResult> {
  try {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File too large',
        message: 'File size must be less than 10MB'
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const path = `uploads/${filename}`;

    // Upload to Firebase Storage
    const storage = getStorageInstance();
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    // Save metadata to Firestore
    const docRef = doc(collection(getDb(), 'files'));
    await setDoc(docRef, {
      filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      url: downloadURL,
      uploadedAt: serverTimestamp(),
      ...metadata
    });

    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: docRef.id,
        filename,
        url: downloadURL
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Upload failed',
      message: 'Failed to upload file'
    };
  }
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "use server" Directive Missing
```typescript
// ❌ Wrong - Missing directive
export async function myAction() {
  // ...
}

// ✅ Correct - With directive
'use server';

export async function myAction() {
  // ...
}
```

#### 2. Import Path Issues
```typescript
// ❌ Wrong - Incorrect relative path
import { action } from '../../../../actions';

// ✅ Correct - Proper relative path
import { action } from '../../../actions';
```

#### 3. Type Errors
```typescript
// ❌ Wrong - Type mismatch
const data: string = formData.get('data'); // Could be null

// ✅ Correct - Proper type handling
const data = formData.get('data') as string;
if (!data) {
  return { success: false, error: 'Data is required' };
}
```

#### 4. Async/Await Issues
```typescript
// ❌ Wrong - Missing await
export async function myAction() {
  const result = updateDoc(docRef, data); // Missing await
  return { success: true };
}

// ✅ Correct - Proper async handling
export async function myAction() {
  await updateDoc(docRef, data);
  return { success: true };
}
```

### Debugging Tips

1. **Add Logging**
   ```typescript
   export async function debugAction(data: any) {
     console.log('Input data:', data);
     
     try {
       const result = await processData(data);
       console.log('Result:', result);
       return { success: true, data: result };
     } catch (error) {
       console.error('Error:', error);
       return { success: false, error: error.message };
     }
   }
   ```

2. **Validate Inputs**
   ```typescript
   export async function validateAction(data: any) {
     console.log('Raw input:', data);
     console.log('Type of data:', typeof data);
     console.log('Keys:', Object.keys(data));
     
     // Add validation
     if (!data || typeof data !== 'object') {
       return { success: false, error: 'Invalid input type' };
     }
   }
   ```

3. **Test Database Connection**
   ```typescript
   export async function testConnection() {
     try {
       const db = getDb();
       console.log('Database instance:', !!db);
       
       const testDoc = doc(db, 'test', 'connection');
       await setDoc(testDoc, { test: true });
       console.log('Database write successful');
       
       return { success: true, message: 'Database connection working' };
     } catch (error) {
       console.error('Database error:', error);
       return { success: false, error: 'Database connection failed' };
     }
   }
   ```

---

## 📚 API Reference

### Standard Return Types

```typescript
// Basic action result
type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
};

// Paginated result
type PaginatedResult<T> = {
  success: boolean;
  error?: string;
  message?: string;
  data?: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

// File upload result
type FileUploadResult = {
  success: boolean;
  error?: string;
  message?: string;
  data?: {
    id: string;
    filename: string;
    url: string;
    size: number;
  };
};
```

### Common Validation Schemas

```typescript
import { z } from 'zod';

// User validation
export const UserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role: z.enum(['client', 'provider', 'agency', 'admin']),
});

// File validation
export const FileSchema = z.object({
  name: z.string().min(1, 'Filename is required'),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.string().regex(/^image\//, 'Only image files are allowed'),
});

// Pagination validation
export const PaginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1'),
  limit: z.number().min(1).max(100, 'Limit must be between 1 and 100'),
});
```

### Utility Functions

```typescript
// Error handling utility
export function handleError(error: unknown, context: string): ActionResult {
  console.error(`${context} error:`, error);
  
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      message: `${context} failed`
    };
  }
  
  return {
    success: false,
    error: 'Unknown error',
    message: `${context} failed`
  };
}

// Validation utility
export function validateInput<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    error: result.error.errors.map(e => e.message).join(', ')
  };
}

// Database utility
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<ActionResult<T>> {
  try {
    const result = await operation();
    return {
      success: true,
      data: result,
      message: 'Operation completed successfully'
    };
  } catch (error) {
    return handleError(error, errorMessage);
  }
}
```

---

## 🎯 Conclusion

This developer guide provides comprehensive patterns and best practices for working with server actions in the application. Follow these guidelines to ensure consistent, maintainable, and robust server action implementations.

**Key Takeaways:**
- Always use `'use server'` directive
- Validate inputs with Zod schemas
- Handle errors gracefully
- Use consistent return types
- Write comprehensive tests
- Follow established patterns

For additional help, refer to the main documentation or contact the development team.

---

*Last Updated: January 2025*
*Guide Version: 1.0*
