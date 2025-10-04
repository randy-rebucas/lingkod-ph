// Wellness & Beauty Module Types

export interface WellnessService {
  id: string;
  name: string;
  description: string;
  category: 'spa' | 'massage' | 'beauty' | 'wellness' | 'fitness';
  subcategory: string;
  duration: number; // minutes
  price: number;
  providerId: string;
  isActive: boolean;
  images?: string[];
  amenities: string[];
  specialties: string[];
  serviceAreas: string[];
  rating?: number;
  reviewCount?: number;
}

export interface SpaBooking {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  services: {
    serviceId: string;
    serviceName: string;
    duration: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialRequests: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BeautyService {
  id: string;
  name: string;
  category: 'hair' | 'nails' | 'makeup' | 'skincare' | 'eyebrows' | 'lashes';
  description: string;
  duration: number;
  price: number;
  providerId: string;
  isActive: boolean;
  requirements: string[];
  aftercare: string[];
  images?: string[];
}

export interface WellnessPackage {
  id: string;
  name: string;
  description: string;
  services: string[];
  duration: number; // total minutes
  price: number;
  discount: number; // percentage
  providerId: string;
  isActive: boolean;
  validUntil?: Date;
}

export interface WellnessQuote {
  id: string;
  bookingId: string;
  providerId: string;
  services: {
    serviceId: string;
    serviceName: string;
    duration: number;
    price: number;
  }[];
  packageDiscount?: number;
  totalAmount: number;
  validUntil: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
}

// Form types for UI components
export interface WellnessBookingForm {
  appointmentDate: string;
  startTime: string;
  services: string[];
  specialRequests: string;
  notes: string;
}

export interface BeautyServiceRequest {
  serviceType: string;
  appointmentDate: string;
  startTime: string;
  requirements: string[];
  budget: number;
  specialRequests: string;
}

// API response types
export interface WellnessServiceResponse {
  success: boolean;
  data?: WellnessService[];
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BookingResponse {
  success: boolean;
  data?: SpaBooking;
  error?: string;
}

// Service categories
export const WELLNESS_CATEGORIES = [
  { value: 'spa', label: 'Spa Services' },
  { value: 'massage', label: 'Massage Therapy' },
  { value: 'beauty', label: 'Beauty Services' },
  { value: 'wellness', label: 'Wellness Programs' },
  { value: 'fitness', label: 'Fitness & Training' },
] as const;

export const BEAUTY_CATEGORIES = [
  { value: 'hair', label: 'Hair Services' },
  { value: 'nails', label: 'Nail Services' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'skincare', label: 'Skincare' },
  { value: 'eyebrows', label: 'Eyebrow Services' },
  { value: 'lashes', label: 'Eyelash Services' },
] as const;
