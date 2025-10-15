# LocalPro Backend Implementation Prompt

## Project Overview

Create a complete Node.js backend for **LocalPro**, a comprehensive service marketplace platform connecting clients with trusted local service providers in the Philippines. This is a production-ready application with advanced features including AI-powered matching, payment processing, real-time communication, and comprehensive analytics.

## Core Requirements

### 1. Technology Stack
- **Framework**: Express.js with TypeScript
- **Database**: Firebase Firestore (primary) + Redis (caching/rate limiting)
- **Authentication**: Firebase Authentication with JWT
- **AI Integration**: Google AI (Genkit) for smart features
- **Payment Gateways**: PayPal and Maya (Philippine payment gateway)
- **Communication**: Resend (email) + Twilio (SMS) + Firebase Cloud Messaging (push)
- **Security**: Helmet, rate limiting, input validation, audit logging
- **Deployment**: Docker + Nginx + SSL

### 2. User Roles & Permissions
Implement a multi-role system with the following roles:

**Client** (Default Role):
- Browse and search service providers
- Book services and manage appointments
- Post job requests for providers to apply
- Rate and review completed services
- Manage favorites and profile

**Provider** (Individual Professionals):
- Create and manage service profiles
- Handle booking requests and calendar
- Track earnings and request payouts
- Access analytics and performance metrics
- Apply to job postings

**Agency** (Business Entities):
- Manage multiple providers under one account
- Centralized booking and earnings management
- Advanced reporting and analytics
- Branded communications
- Subscription-based feature access

**Admin** (Platform Administrators):
- Complete platform management
- User verification and moderation
- Payment verification and processing
- System monitoring and analytics
- Content and service management

**Partner** (Referral Partners):
- Referral tracking and commission management
- Partner dashboard and analytics
- Marketing tools and resources

### 3. Core Features to Implement

#### Authentication & Authorization
```typescript
// JWT Token Structure
interface JWTPayload {
  uid: string;
  email: string;
  role: string;
  accountStatus: string;
  verificationStatus: string;
  iat: number;
  exp: number;
}

// Role-based permissions
const rolePermissions = {
  client: ['read:own_profile', 'read:bookings', 'create:bookings', 'read:jobs', 'create:jobs'],
  provider: ['read:own_profile', 'read:bookings', 'update:own_bookings', 'read:jobs', 'apply:jobs'],
  agency: ['read:own_profile', 'read:bookings', 'update:own_bookings', 'read:jobs', 'apply:jobs', 'manage:providers'],
  admin: ['*'],
  partner: ['read:own_profile', 'read:referrals', 'create:referrals']
};
```

#### Database Schema
Implement the following Firestore collections with TypeScript interfaces:

**Users Collection**:
```typescript
interface User {
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
  
  // Client-specific fields
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
    smsUpdates: boolean;
  };
  
  // Admin-specific fields
  permissions?: string[];
  lastLogin?: Date;
  
  // Partner-specific fields
  referralCode?: string;
  commissionRate?: number;
  totalReferrals?: number;
}
```

**Bookings Collection**:
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

**Jobs Collection**:
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

**Transactions Collection**:
```typescript
interface Transaction {
  id: string;
  bookingId?: string;
  clientId: string;
  providerId: string;
  amount: number;
  type: 'service_payment' | 'payout_request' | 'refund' | 'commission';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'paypal' | 'maya' | 'bank_transfer';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  reference?: string;
  paypalTransactionId?: string;
  mayaPaymentId?: string;
}
```

#### API Endpoints
Implement the following REST API endpoints:

**Authentication**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

**User Management**:
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/status` - Update user status (admin only)
- `GET /api/users/providers` - Get all providers
- `GET /api/users/agencies` - Get all agencies

**Bookings**:
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `POST /api/bookings/:id/confirm` - Confirm booking
- `POST /api/bookings/:id/complete` - Mark booking complete
- `POST /api/bookings/:id/cancel` - Cancel booking

**Jobs**:
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/apply` - Apply to job
- `POST /api/jobs/:id/select-provider` - Select provider for job

**Payments**:
- `POST /api/payments/paypal/create` - Create PayPal order
- `POST /api/payments/paypal/capture` - Capture PayPal payment
- `POST /api/payments/paypal/webhook` - PayPal webhook
- `POST /api/payments/maya/checkout` - Create Maya checkout
- `GET /api/payments/maya/status/:checkoutId` - Get Maya payment status
- `POST /api/payments/maya/webhook` - Maya webhook
- `GET /api/payments/transactions` - Get user transactions
- `POST /api/payments/payout-request` - Request payout
- `GET /api/payments/payouts` - Get payout history

**Notifications**:
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `POST /api/notifications/test` - Send test notification

**Messaging**:
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/conversations/:id` - Get conversation messages
- `POST /api/messages/send` - Send message
- `PUT /api/messages/:id/read` - Mark message as read

**Quotes**:
- `GET /api/quotes` - Get user quotes
- `POST /api/quotes` - Create new quote
- `GET /api/quotes/:id` - Get quote details
- `PUT /api/quotes/:id` - Update quote
- `POST /api/quotes/:id/send` - Send quote to client
- `POST /api/quotes/:id/accept` - Accept quote
- `POST /api/quotes/:id/reject` - Reject quote

**AI Features**:
- `POST /api/ai/smart-rate-suggestions` - Get smart rate suggestions
- `POST /api/ai/find-matching-providers` - Find matching providers
- `POST /api/ai/generate-job-details` - Generate job details
- `POST /api/ai/generate-quote-description` - Generate quote description
- `POST /api/ai/help-center-assistant` - Help center AI assistant

**Admin**:
- `POST /api/admin/secure-action` - Secure admin actions
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/transactions` - Get all transactions
- `POST /api/admin/process-payout` - Process payout
- `GET /api/admin/analytics` - Get platform analytics

### 4. Payment System Implementation

#### PayPal Integration
```typescript
class PayPalService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  
  async createOrder(paymentRequest: PayPalPaymentRequest): Promise<PayPalOrderResponse> {
    const accessToken = await this.getAccessToken();
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `booking_${paymentRequest.bookingId}`,
        amount: {
          currency_code: paymentRequest.currency,
          value: paymentRequest.amount.toFixed(2)
        },
        description: `Payment for ${paymentRequest.serviceName}`,
        custom_id: paymentRequest.bookingId
      }],
      application_context: {
        brand_name: 'LocalPro',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: paymentRequest.returnUrl,
        cancel_url: paymentRequest.cancelUrl
      }
    };
    
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `booking_${paymentRequest.bookingId}_${Date.now()}`
      },
      body: JSON.stringify(orderData)
    });
    
    return await response.json();
  }
  
  async captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({})
    });
    
    return await response.json();
  }
}
```

#### Maya Integration
```typescript
class MayaService {
  private baseUrl: string;
  private publicKey: string;
  private secretKey: string;
  
  async createCheckout(request: MayaCheckoutRequest): Promise<MayaCheckoutResponse> {
    const response = await fetch(`${this.baseUrl}/checkout/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${this.publicKey}:`).toString('base64')}`
      },
      body: JSON.stringify(request)
    });
    
    return await response.json();
  }
  
  async getPaymentStatus(checkoutId: string): Promise<MayaPaymentStatus> {
    const response = await fetch(`${this.baseUrl}/checkout/v1/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.publicKey}:`).toString('base64')}`
      }
    });
    
    return await response.json();
  }
}
```

### 5. AI Features Implementation

#### Smart Rate Suggestions
```typescript
export async function suggestSmartRate(input: {
  servicesOffered: string;
  location: string;
}): Promise<{
  suggestedRate: number;
  reasoning: string;
  marketAnalysis: string;
}> {
  const prompt = `You are an expert pricing consultant in the Philippines, specializing in service rates.
  
  You will use the information about services offered and location to suggest a competitive service rate in Philippine Peso.
  
  Consider local market conditions, competitor pricing, and the cost of living in the specified location.
  
  Services Offered: ${input.servicesOffered}
  Location: ${input.location}
  
  Respond with a suggested rate and the reasoning behind it.
  
  Ensure the suggested rate allows the service provider to be competitive while maintaining profitability.`;
  
  // Implementation using Google AI Genkit
  const result = await ai.generateText({
    model: 'googleai/gemini-2.0-flash',
    prompt: prompt
  });
  
  return JSON.parse(result.text);
}
```

#### Provider Matching
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
  // Fetch all providers from database
  const providers = await db.collection('users')
    .where('role', '==', 'provider')
    .get();
  
  const prompt = `You are an expert matchmaking agent for a service provider marketplace called LocalPro.
  
  Your task is to find the best service providers for a user's request.
  
  Analyze the user's query: ${input.query}
  
  Compare the user's query with each provider's details (name, bio, key services).
  
  Rank the providers based on how well they match the query. A lower rank number is better (e.g., 1 is the best match).
  
  Provide a short, client-facing reason for why each provider is a good match.
  
  Return a list of the top 5 most relevant providers.`;
  
  const result = await ai.generateText({
    model: 'googleai/gemini-2.0-flash',
    prompt: prompt,
    context: { providers: providers.docs.map(doc => doc.data()) }
  });
  
  return JSON.parse(result.text);
}
```

### 6. Notification System

#### Email Service
```typescript
class EmailService {
  private resend: Resend;
  
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }
  
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: options.from || 'LocalPro <admin@localpro.asia>',
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, messageId: data?.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

#### SMS Service
```typescript
class SMSService {
  private twilio: Twilio;
  
  constructor() {
    this.twilio = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  
  async sendSMS(options: {
    to: string;
    message: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const message = await this.twilio.messages.create({
        body: options.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: options.to
      });
      
      return { success: true, messageId: message.sid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

### 7. Security Implementation

#### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const rateLimiters = {
  general: rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  }),
  
  auth: rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later.'
  }),
  
  payment: rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 payment attempts per minute
    message: 'Too many payment attempts, please try again later.'
  })
};
```

#### Input Validation
```typescript
import { body, validationResult } from 'express-validator';

const validateBooking = [
  body('providerId').isString().notEmpty(),
  body('serviceId').isString().notEmpty(),
  body('date').isISO8601(),
  body('duration').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('description').isString().isLength({ min: 10, max: 500 }),
  body('location.address').isString().notEmpty(),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 8. Required Dependencies

```json
{
  "express": "^4.18.2",
  "firebase-admin": "^13.5.0",
  "firebase": "^11.9.1",
  "redis": "^5.8.3",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "express-validator": "^7.0.1",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1",
  "nodemailer": "^6.9.7",
  "twilio": "^5.10.2",
  "paypal-rest-sdk": "^1.8.1",
  "axios": "^1.6.2",
  "winston": "^3.11.0",
  "dotenv": "^16.5.0",
  "compression": "^1.7.4",
  "morgan": "^1.10.0",
  "@genkit-ai/googleai": "^1.13.0",
  "genkit": "^1.13.0",
  "typescript": "^5.0.0",
  "@types/node": "^20.0.0",
  "@types/express": "^4.17.21",
  "@types/cors": "^2.8.17",
  "@types/bcryptjs": "^2.4.6",
  "@types/jsonwebtoken": "^9.0.5",
  "@types/multer": "^1.4.11",
  "@types/nodemailer": "^6.4.14",
  "ts-node": "^10.9.1",
  "nodemon": "^3.0.2"
}
```

### 9. Environment Variables

```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Payment Configuration
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
MAYA_PUBLIC_KEY=your-maya-public-key
MAYA_SECRET_KEY=your-maya-secret-key
MAYA_ENVIRONMENT=sandbox

# Email Configuration
RESEND_API_KEY=your-resend-api-key

# SMS Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# AI Configuration
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### 10. Deployment Configuration

#### Docker Configuration
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  redis_data:
```

### 11. Implementation Checklist

**Phase 1: Core Infrastructure**
- [ ] Set up Express.js server with TypeScript
- [ ] Configure Firebase Admin SDK
- [ ] Implement authentication middleware
- [ ] Set up Redis for caching and rate limiting
- [ ] Configure logging and monitoring
- [ ] Set up basic security headers

**Phase 2: User Management**
- [ ] Implement user registration and login
- [ ] Create role-based access control
- [ ] Build user profile management
- [ ] Implement user verification system
- [ ] Add user status management

**Phase 3: Core Features**
- [ ] Build booking system
- [ ] Implement job posting and application system
- [ ] Create messaging system
- [ ] Build quote generation system
- [ ] Implement review and rating system

**Phase 4: Payment Integration**
- [ ] Integrate PayPal payment processing
- [ ] Integrate Maya payment processing
- [ ] Build transaction management
- [ ] Implement payout system
- [ ] Add payment verification

**Phase 5: AI Features**
- [ ] Implement smart rate suggestions
- [ ] Build provider matching system
- [ ] Create job details generation
- [ ] Add quote description generation
- [ ] Implement help center assistant

**Phase 6: Communication**
- [ ] Set up email service with Resend
- [ ] Implement SMS service with Twilio
- [ ] Build push notification system
- [ ] Create notification management
- [ ] Add email templates

**Phase 7: Admin Features**
- [ ] Build admin dashboard
- [ ] Implement user management
- [ ] Create transaction monitoring
- [ ] Add analytics and reporting
- [ ] Build system configuration

**Phase 8: Security & Performance**
- [ ] Implement comprehensive rate limiting
- [ ] Add input validation and sanitization
- [ ] Set up audit logging
- [ ] Optimize database queries
- [ ] Implement caching strategies

**Phase 9: Deployment**
- [ ] Set up Docker configuration
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificates
- [ ] Implement health checks
- [ ] Configure monitoring and alerting

## Expected Deliverables

1. **Complete Node.js Backend** with all features implemented
2. **TypeScript Interfaces** for all data models
3. **API Documentation** with endpoint specifications
4. **Database Schema** with Firestore collections
5. **Security Implementation** with rate limiting and validation
6. **Payment Integration** for PayPal and Maya
7. **AI Features** using Google AI Genkit
8. **Notification System** with email, SMS, and push notifications
9. **Docker Configuration** for deployment
10. **Environment Configuration** for production
11. **Testing Suite** with unit and integration tests
12. **Documentation** with setup and deployment instructions

## Success Criteria

- All API endpoints are functional and properly secured
- Payment processing works with both PayPal and Maya
- AI features provide accurate and helpful responses
- User roles and permissions are properly enforced
- Real-time notifications work across all channels
- System is production-ready with proper monitoring
- Code is well-documented and follows best practices
- Performance is optimized with caching and rate limiting
- Security measures are comprehensive and up-to-date

This prompt provides a complete specification for building a production-ready Node.js backend that matches all the features and functionality of the LocalPro application.
