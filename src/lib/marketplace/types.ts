import { Timestamp } from 'firebase/firestore';

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory: string;
  brand: string;
  sku: string;
  images: string[];
  pricing: ProductPricing;
  inventory: ProductInventory;
  specifications?: ProductSpecifications;
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ProductCategory = 
  | 'cleaning' 
  | 'pest-control' 
  | 'tools' 
  | 'paint' 
  | 'plumbing' 
  | 'electrical';

export interface ProductPricing {
  marketPrice: number;
  partnerPrice: number;
  bulkPrice?: number;
  currency: 'PHP';
  savings?: number;
  savingsPercentage?: number;
}

export interface ProductInventory {
  stock: number;
  location: string;
  supplier: string;
  lastRestocked: Timestamp;
}

export interface ProductSpecifications {
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  material?: string;
  color?: string;
  size?: string;
}

// Product Category Types
export interface ProductCategoryData {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  subcategories: ProductSubcategory[];
  isActive: boolean;
  sortOrder: number;
}

export interface ProductSubcategory {
  id: string;
  name: string;
  slug: string;
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  contactInfo: SupplierContactInfo;
  partnershipType: 'featured' | 'standard' | 'sponsored';
  commissionRate: number;
  paymentTerms: string;
  isActive: boolean;
  products: string[];
  createdAt: Timestamp;
}

export interface SupplierContactInfo {
  email: string;
  phone: string;
  address: string;
}

// Subscription Kit Types
export interface SubscriptionKit {
  id: string;
  name: string;
  description: string;
  category: string;
  products: KitProduct[];
  pricing: KitPricing;
  deliverySchedule: 'monthly' | 'quarterly' | 'custom';
  isActive: boolean;
  featured: boolean;
  createdAt: Timestamp;
}

export interface KitProduct {
  productId: string;
  quantity: number;
  price: number;
}

export interface KitPricing {
  monthlyPrice: number;
  oneTimePrice: number;
  savings: number;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  userRole: 'provider' | 'agency';
  orderType: 'single' | 'bulk' | 'subscription';
  items: OrderItem[];
  subscriptionKitId?: string;
  pricing: OrderPricing;
  status: OrderStatus;
  payment: OrderPayment;
  shipping: OrderShipping;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderPricing {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: 'PHP';
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

export interface OrderPayment {
  method: 'wallet' | 'gcash' | 'paypal' | 'bank-transfer';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: Timestamp;
}

export interface OrderShipping {
  address: ShippingAddress;
  trackingNumber?: string;
  estimatedDelivery?: Timestamp;
  deliveredAt?: Timestamp;
}

export interface ShippingAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

// Order Tracking Types
export interface OrderTracking {
  id: string;
  orderId: string;
  status: TrackingStatus;
  location: string;
  timestamp: Timestamp;
  notes?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type TrackingStatus = 
  | 'order-placed'
  | 'supplier-notified'
  | 'warehouse-received'
  | 'packed'
  | 'shipped'
  | 'out-for-delivery'
  | 'delivered';

// Wallet Types
export interface UserWallet {
  id: string;
  userId: string;
  balance: number;
  currency: 'PHP';
  transactions: WalletTransaction[];
  lastUpdated: Timestamp;
}

export interface WalletTransaction {
  id: string;
  type: 'earnings' | 'purchase' | 'refund' | 'payout';
  amount: number;
  description: string;
  orderId?: string;
  timestamp: Timestamp;
}

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  addedAt: Timestamp;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  lastUpdated: Timestamp;
}

// Filter Types
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  inStock?: boolean;
  isFeatured?: boolean;
  searchQuery?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
