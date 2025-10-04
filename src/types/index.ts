// Core application types

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'client' | 'provider' | 'agency' | 'admin' | 'partner';
  accountStatus: 'active' | 'suspended' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  profilePicture?: string;
  phoneNumber?: string;
  address?: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

export interface Provider extends User {
  role: 'provider';
  services: string[];
  rating: number;
  totalJobs: number;
  bio?: string;
  portfolio?: string[];
  availability: 'available' | 'busy' | 'offline';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  pricing: {
    hourly?: number;
    daily?: number;
    fixed?: number;
  };
}

export interface Agency extends User {
  role: 'agency';
  businessName: string;
  businessType: string;
  licenseNumber?: string;
  providers: string[];
  subscription: 'basic' | 'pro' | 'elite';
}

export interface Client extends User {
  role: 'client';
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    smsUpdates: boolean;
  };
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
  lastLogin?: Date;
}

export interface Partner extends User {
  role: 'partner';
  referralCode: string;
  commissionRate: number;
  totalReferrals: number;
}

export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  serviceId?: string;
  jobId?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  date: Date;
  duration: number;
  price: number;
  description: string;
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  photos?: string[];
  review?: Review;
}

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  budget: {
    amount: number;
    type: 'Fixed' | 'Daily' | 'Monthly';
    negotiable: boolean;
  };
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  applicants: string[];
  selectedProvider?: string;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
}

export interface Transaction {
  id: string;
  bookingId?: string;
  clientId: string;
  providerId: string;
  amount: number;
  type: 'service_payment' | 'payout_request' | 'refund' | 'commission';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'gcash' | 'maya' | 'bank_transfer' | 'card' | 'paypal';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  reference?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  bookingId?: string;
  content: string;
  type: 'text' | 'image' | 'file';
  read: boolean;
  createdAt: Date;
}

export interface Quote {
  id: string;
  providerId: string;
  clientId: string;
  jobId?: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  issueDate: Date;
  validUntil: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Payout {
  id: string;
  providerId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: 'gcash' | 'maya' | 'bank_transfer';
  accountDetails: {
    accountName: string;
    accountNumber: string;
  };
  requestedAt: Date;
  processedAt?: Date;
  reference?: string;
}

// API Response types
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

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  role: 'client' | 'provider' | 'agency';
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Dashboard types
export interface DashboardStats {
  totalRevenue: number;
  pendingPayouts: number;
  upcomingBookings: number;
  totalClients: number;
  overallRating: number;
}

export interface EarningsData {
  date: string;
  amount: number;
}

// Search and filter types
export interface SearchFilters {
  category?: string;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: boolean;
}

export interface SortOptions {
  field: 'rating' | 'price' | 'distance' | 'createdAt';
  order: 'asc' | 'desc';
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Language types
export type Language = 'en' | 'tl';
