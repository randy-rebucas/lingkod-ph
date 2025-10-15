# LocalPro - Complete Service Marketplace Platform Replication Prompt

## 🎯 Project Overview

Create a comprehensive **LocalPro** service marketplace platform that connects clients with trusted local service providers in the Philippines. This is a production-ready, multi-role platform with advanced features including AI-powered matching, payment processing, real-time communication, and comprehensive analytics.

## 🏗️ Technical Architecture

### Core Technology Stack
- **Frontend**: Next.js 15.5.4 with App Router, TypeScript, Tailwind CSS
- **Backend**: Firebase Firestore, Firebase Auth, Firebase Storage
- **UI Framework**: Radix UI primitives with custom design system
- **State Management**: React Context + Custom hooks
- **Internationalization**: next-intl (English/Filipino)
- **AI Integration**: Google AI (Genkit) for smart features
- **Payment Gateways**: PayPal, Maya (Philippine gateway), Bank Transfer
- **Communication**: Resend (email), Twilio (SMS), Firebase Cloud Messaging
- **Automation**: N8N workflows for business processes
- **Security**: Role-based access control, audit logging, encryption

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Protected routes
│   │   ├── admin/         # Admin dashboard
│   │   ├── dashboard/     # User dashboards
│   │   ├── bookings/      # Booking management
│   │   ├── profile/       # User profiles
│   │   └── learning-hub/  # Educational content
│   ├── (public)/          # Public pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   └── [feature-components] # Feature-specific components
├── lib/                  # Utilities and services
├── context/              # React contexts
├── hooks/                # Custom hooks
├── types/                # TypeScript definitions
└── ai/                   # AI flows and automation
```

## 👥 User Roles & Permissions System

### 1. **Client** (Default Role)
- Browse and search service providers
- Book services and manage appointments
- Post job requests for providers to apply
- Rate and review completed services
- Manage favorites and profile

### 2. **Provider** (Individual Professionals)
- Create and manage service profiles
- Handle booking requests and calendar
- Track earnings and request payouts
- Access analytics and performance metrics
- Apply to job postings

### 3. **Agency** (Business Entities)
- Manage multiple providers under one account
- Centralized booking and earnings management
- Advanced reporting and analytics
- Branded communications
- Subscription-based feature access

### 4. **Admin** (Platform Administrators)
- Complete platform management
- User verification and moderation
- Payment verification and processing
- System monitoring and analytics
- Content and service management

### 5. **Partner** (Referral Partners)
- Referral tracking and commission management
- Partner dashboard and analytics
- Marketing tools and resources

## 🔐 Authentication & Authorization

### JWT Token Structure
```typescript
interface JWTPayload {
  uid: string;
  email: string;
  role: string;
  accountStatus: string;
  verificationStatus: string;
  iat: number;
  exp: number;
}
```

### Role-Based Permissions
```typescript
const rolePermissions = {
  client: ['read:own_profile', 'read:bookings', 'create:bookings', 'read:jobs', 'create:jobs'],
  provider: ['read:own_profile', 'read:bookings', 'update:own_bookings', 'read:jobs', 'apply:jobs'],
  agency: ['read:own_profile', 'read:bookings', 'update:own_bookings', 'read:jobs', 'apply:jobs', 'manage:providers'],
  admin: ['*'],
  partner: ['read:own_profile', 'read:referrals', 'create:referrals']
};
```

## 📊 Database Schema (Firestore)

### Core Collections

#### Users Collection
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'client' | 'provider' | 'agency' | 'admin' | 'partner';
  accountStatus: 'active' | 'suspended' | 'pending';
  verificationStatus: 'verified' | 'pending' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  profilePicture?: string;
  phoneNumber?: string;
  address?: string;
  
  // Provider-specific fields
  services?: string[];
  rating?: number;
  totalJobs?: number;
  bio?: string;
  portfolio?: string[];
  availability?: 'available' | 'busy' | 'offline';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  pricing?: {
    hourly?: number;
    daily?: number;
    fixed?: number;
  };
  
  // Agency-specific fields
  businessName?: string;
  businessType?: string;
  licenseNumber?: string;
  providers?: string[];
  subscription?: 'basic' | 'pro' | 'elite';
  
  // Partner-specific fields
  referralCode?: string;
  commissionRate?: number;
  totalReferrals?: number;
}
```

#### Bookings Collection
```typescript
interface Booking {
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
  paymentMethod?: 'paypal' | 'maya' | 'bank_transfer';
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paypalOrderId?: string;
  mayaCheckoutId?: string;
}
```

#### Services Collection
```typescript
interface Service {
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
```

#### Jobs Collection
```typescript
interface Job {
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
```

## 💳 Payment System Implementation

### Payment Methods
1. **PayPal Integration**
   - Order creation and capture
   - Subscription payments
   - Webhook handling
   - Refund processing

2. **Maya Checkout (Philippine Gateway)**
   - Credit/debit cards
   - E-wallets (GCash, GrabPay)
   - QR code payments
   - Bank transfers

3. **Bank Transfer**
   - Manual payment with proof upload
   - Admin verification system
   - Automated notifications

### Payment Flow
```typescript
// Payment creation flow
1. User selects payment method
2. Create payment order/subscription
3. Redirect to payment gateway
4. Handle webhook notifications
5. Update booking status
6. Send confirmation notifications
```

## 🤖 AI-Powered Features (Google AI Genkit)

### 1. Smart Rate Suggestions
```typescript
export async function suggestServiceRate(input: {
  servicesOffered: string;
  location: string;
}): Promise<{
  suggestedRate: number;
  reasoning: string;
  marketAnalysis: string;
}> {
  // AI-powered rate suggestion based on location and services
}
```

### 2. Provider Matching
```typescript
export async function findMatchingProviders(input: {
  query: string;
}): Promise<{
  providers: Array<{
    providerId: string;
    reasoning: string;
    rank: number;
  }>;
}> {
  // AI-powered provider matching based on query
}
```

### 3. Job Details Generation
```typescript
export async function generateJobDetails(input: {
  jobDescription: string;
}): Promise<{
  suggestedBudget: number;
  questions: Array<{
    question: string;
    example: string;
    type: 'text' | 'textarea';
  }>;
}> {
  // AI-powered job posting enhancement
}
```

## 📱 User Journeys & Flows

### Client Journey
1. **Registration** → Complete profile → Browse services
2. **Service Discovery** → Search/filter → View provider profiles
3. **Booking Process** → Select service → Choose date/time → Payment
4. **Service Completion** → Rate/review → Payment confirmation

### Provider Journey
1. **Registration** → Complete profile → Add services
2. **Profile Setup** → Upload portfolio → Set availability
3. **Booking Management** → Receive requests → Accept/decline
4. **Service Delivery** → Complete work → Request payment

### Agency Journey
1. **Registration** → Business verification → Add providers
2. **Provider Management** → Onboard team → Set schedules
3. **Centralized Operations** → Manage bookings → Track performance
4. **Growth** → Analytics → Expansion planning

## 🎨 UI/UX Design System

### Design Principles
- **Modern & Clean**: Minimalist design with focus on usability
- **Mobile-First**: Responsive design for all devices
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized loading and interactions

### Component Library
- **Base Components**: Button, Input, Card, Modal, etc.
- **Feature Components**: BookingDialog, PaymentSelector, etc.
- **Layout Components**: Header, Footer, Sidebar, etc.
- **Data Display**: Tables, Charts, Lists, etc.

### Color Scheme
```css
:root {
  --primary: 220 14.3% 95.9%;
  --primary-foreground: 220.9 39.3% 11%;
  --secondary: 220 14.3% 95.9%;
  --secondary-foreground: 220.9 39.3% 11%;
  --muted: 220 14.3% 95.9%;
  --muted-foreground: 220 8.9% 46.1%;
  --accent: 220 14.3% 95.9%;
  --accent-foreground: 220.9 39.3% 11%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 220 13% 91%;
  --background: 0 0% 100%;
  --foreground: 220.9 39.3% 11%;
}
```

## 🔔 Notification System

### Multi-Channel Notifications
- **Email**: Resend integration with React Email templates
- **SMS**: Twilio integration for urgent notifications
- **Push**: Firebase Cloud Messaging
- **In-App**: Real-time notifications in dashboard

### Notification Types
- Booking confirmations and updates
- Payment notifications
- System announcements
- Security alerts
- Marketing communications

## 📚 Learning Hub System

### Content Management
- **Articles**: Educational content with Markdown support
- **Tutorials**: Video tutorials and step-by-step guides
- **Topics**: Comprehensive topic pages
- **Resources**: Downloadable resources and templates

### Role-Based Content
- Content targeted to specific user roles
- Difficulty levels (Beginner, Intermediate, Advanced)
- Search and filtering capabilities
- Performance tracking and analytics

## 🛡️ Security Features

### Authentication Security
- Firebase Authentication with JWT tokens
- Role-based access control (RBAC)
- Session management and timeout
- Two-factor authentication for admins

### Data Protection
- Encrypted data storage and transmission
- Input validation and sanitization
- Rate limiting and abuse prevention
- Comprehensive audit logging

### API Security
- CORS configuration
- Request validation
- Error handling without information leakage
- Webhook signature verification

## 🚀 Deployment & DevOps

### Environment Configuration
```bash
# Required Environment Variables
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
NEXT_PUBLIC_MAYA_PUBLIC_KEY=your-maya-public-key
MAYA_SECRET_KEY=your-maya-secret
RESEND_API_KEY=your-resend-api-key
```

### Build & Deployment
```bash
# Development
npm run dev

# Production Build
npm run build
npm run start

# Firebase Deployment
firebase deploy
```

## 📋 Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Set up Next.js project with TypeScript
- [ ] Configure Firebase (Auth, Firestore, Storage)
- [ ] Implement authentication system
- [ ] Create base UI components
- [ ] Set up routing and navigation

### Phase 2: User Management
- [ ] Implement user registration/login
- [ ] Create role-based access control
- [ ] Build user profile management
- [ ] Implement user verification system

### Phase 3: Core Features
- [ ] Service provider profiles
- [ ] Service listing and management
- [ ] Booking system
- [ ] Payment integration (PayPal, Maya, Bank Transfer)
- [ ] Review and rating system

### Phase 4: Advanced Features
- [ ] AI-powered features (Genkit integration)
- [ ] Notification system
- [ ] Learning hub
- [ ] Admin dashboard
- [ ] Analytics and reporting

### Phase 5: Polish & Launch
- [ ] Performance optimization
- [ ] Security audit
- [ ] Testing and bug fixes
- [ ] Documentation
- [ ] Production deployment

## 🎯 Key Success Metrics

### User Engagement
- User registration and activation rates
- Booking completion rates
- User retention and repeat usage
- Provider onboarding and verification

### Business Metrics
- Revenue and transaction volume
- Payment success rates
- Customer satisfaction scores
- Platform growth metrics

### Technical Performance
- Page load times
- API response times
- Error rates and uptime
- Security incident tracking

## 🔧 Development Guidelines

### Code Standards
- TypeScript strict mode
- ESLint and Prettier configuration
- Component-based architecture
- Custom hooks for business logic
- Server actions for data mutations

### Testing Strategy
- Unit tests for utilities and hooks
- Integration tests for API routes
- E2E tests for critical user flows
- Performance testing for optimization

### Documentation
- API documentation with examples
- Component documentation
- User guides and tutorials
- Deployment and maintenance guides

---

## 🚀 Getting Started

1. **Clone and Setup**
   ```bash
   git clone [repository-url]
   cd localpro
   npm install
   cp .env.example .env.local
   ```

2. **Configure Services**
   - Set up Firebase project
   - Configure payment gateways
   - Set up email service
   - Configure AI services

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Admin: http://localhost:3000/admin

This comprehensive prompt provides everything needed to replicate the LocalPro platform with all its features, user journeys, and technical implementation details. The platform is designed to be scalable, secure, and user-friendly while supporting the complex needs of a multi-sided marketplace.
