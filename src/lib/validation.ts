import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number');
export const urlSchema = z.string().url('Invalid URL');

// User validation schemas
export const userRoleSchema = z.enum(['client', 'provider', 'agency', 'admin', 'partner']);
export const accountStatusSchema = z.enum(['active', 'suspended', 'pending']);

export const userSchema = z.object({
  id: z.string().optional(),
  displayName: z.string().min(1, 'Display name is required'),
  email: emailSchema,
  role: userRoleSchema,
  accountStatus: accountStatusSchema.default('pending'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  email: emailSchema,
  password: passwordSchema,
  role: userRoleSchema,
  phone: phoneSchema.optional(),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Service validation schemas
export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Service name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  duration: z.number().min(1, 'Duration must be at least 1 hour'),
  isActive: z.boolean().default(true),
  providerId: z.string().min(1, 'Provider ID is required'),
});

// Booking validation schemas
export const bookingStatusSchema = z.enum(['pending', 'confirmed', 'completed', 'cancelled']);

export const bookingSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  date: z.date(),
  time: z.string().min(1, 'Time is required'),
  duration: z.number().min(1, 'Duration must be at least 1 hour'),
  price: z.number().min(0, 'Price must be non-negative'),
  status: bookingStatusSchema.default('pending'),
  notes: z.string().optional(),
  location: z.string().optional(),
});

// Payment validation schemas
export const paymentMethodSchema = z.enum(['gcash', 'paypal', 'bank_transfer']);
export const paymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded']);

export const paymentSchema = z.object({
  id: z.string().optional(),
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  currency: z.string().default('PHP'),
  method: paymentMethodSchema,
  status: paymentStatusSchema.default('pending'),
  transactionId: z.string().optional(),
  reference: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Review validation schemas
export const reviewSchema = z.object({
  id: z.string().optional(),
  bookingId: z.string().min(1, 'Booking ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(500, 'Comment cannot exceed 500 characters'),
  createdAt: z.date().optional(),
});

// Quote validation schemas
export const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
});

export const quoteSchema = z.object({
  id: z.string().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: emailSchema,
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  discountAmount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  providerId: z.string().min(1, 'Provider ID is required'),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']).default('draft'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Contact form validation
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: emailSchema,
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message cannot exceed 1000 characters'),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
});

// Search and filter validation
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  category: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  rating: z.number().min(1).max(5).optional(),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Utility functions for validation
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

export function validateDataSafe<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors: errorMessages };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

// Sanitization functions
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - use DOMPurify in production
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as any)[key] = sanitizeString(sanitized[key] as string);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      (sanitized as any)[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
}
