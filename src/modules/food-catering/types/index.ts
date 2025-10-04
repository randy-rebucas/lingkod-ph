// Food & Catering Module Types

export interface FoodCateringService {
  id: string;
  name: string;
  description: string;
  category: 'catering' | 'event-staff' | 'food-vendor' | 'hotel-support';
  pricePerHour: number;
  minimumHours: number;
  maxCapacity: number;
  specialties: string[];
  equipmentProvided: boolean;
  dietaryOptions: string[];
  serviceAreas: string[];
  providerId: string;
  isActive: boolean;
  images?: string[];
  rating?: number;
  reviewCount?: number;
}

export interface CateringBooking {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  eventType: 'wedding' | 'corporate' | 'birthday' | 'anniversary' | 'other';
  guestCount: number;
  eventDate: Date;
  startTime: string;
  endTime: string;
  location: {
    address: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  menuPreferences: string[];
  dietaryRestrictions: string[];
  specialRequests: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

export interface EventStaff {
  id: string;
  name: string;
  role: 'waiter' | 'bartender' | 'chef' | 'manager' | 'cleaner';
  experience: number; // years
  languages: string[];
  availability: {
    days: string[];
    timeSlots: string[];
  };
  hourlyRate: number;
  skills: string[];
  certifications: string[];
  providerId: string;
  isAvailable: boolean;
}

export interface FoodVendor {
  id: string;
  businessName: string;
  cuisineType: string;
  specialties: string[];
  menuItems: MenuItem[];
  serviceRadius: number; // km
  minimumOrder: number;
  deliveryFee: number;
  preparationTime: number; // minutes
  providerId: string;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'appetizer' | 'main' | 'dessert' | 'beverage';
  dietaryInfo: string[];
  allergens: string[];
  isAvailable: boolean;
}

export interface CateringQuote {
  id: string;
  bookingId: string;
  providerId: string;
  basePrice: number;
  guestCount: number;
  pricePerGuest: number;
  menuItems: {
    itemId: string;
    quantity: number;
    unitPrice: number;
  }[];
  additionalServices: {
    service: string;
    price: number;
  }[];
  totalAmount: number;
  validUntil: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
}

// Form types for UI components
export interface CateringBookingForm {
  eventType: string;
  guestCount: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: {
    address: string;
    city: string;
  };
  menuPreferences: string[];
  dietaryRestrictions: string[];
  specialRequests: string;
}

export interface EventStaffRequest {
  role: string;
  count: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  requirements: string[];
  budget: number;
}

// API response types
export interface CateringServiceResponse {
  success: boolean;
  data?: FoodCateringService[];
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
  data?: CateringBooking;
  error?: string;
}
