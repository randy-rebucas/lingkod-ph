// Shared Types for LocalPro Platform

// User and Authentication Types
export type UserRole = 'client' | 'provider' | 'agency' | 'admin' | 'partner' | null;
export type VerificationStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';
export type AccountStatus = 'active' | 'pending' | 'suspended' | 'inactive';

// Payment Types
export type PaymentMethod = 'gcash' | 'maya' | 'paypal' | 'card' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type TransactionType = 'booking_payment' | 'payout' | 'refund' | 'commission';

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type ServiceCategory = 'home-property' | 'food-hospitality' | 'creative-professional' | 'auto-mobile' | 'supplies-distribution' | 'wellness';

// Notification Types
export type NotificationType = 'booking' | 'payment' | 'message' | 'system' | 'promotion';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Common Interface Types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  displayName: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  profile?: UserProfile;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: Address;
  avatar?: string;
  bio?: string;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Service extends BaseEntity {
  name: string;
  description: string;
  category: ServiceCategory;
  price: number;
  duration: number; // in minutes
  providerId: string;
  isActive: boolean;
  images?: string[];
  requirements?: string[];
}

export interface Booking extends BaseEntity {
  clientId: string;
  providerId: string;
  serviceId: string;
  scheduledDate: Date;
  status: BookingStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  workLog?: WorkLog[];
}

export interface WorkLog {
  id: string;
  description: string;
  images?: string[];
  completedAt: Date;
}

export interface Transaction extends BaseEntity {
  userId: string;
  type: TransactionType;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  reference?: string;
  description: string;
}

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: NotificationPriority;
  link?: string;
  metadata?: Record<string, any>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface FormState {
  isLoading: boolean;
  error?: string;
  success?: boolean;
}

// Search and Filter Types
export interface SearchFilters {
  category?: ServiceCategory;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: Date;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}
