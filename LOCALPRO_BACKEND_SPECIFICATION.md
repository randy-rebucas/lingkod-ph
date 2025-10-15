# LocalPro Backend Specification - Node.js Implementation

## Overview

This specification outlines the complete backend implementation for **LocalPro**, a comprehensive service marketplace platform connecting clients with trusted local service providers in the Philippines. The backend is designed to support a multi-role user system with advanced features including AI-powered matching, payment processing, real-time communication, and comprehensive analytics.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [Payment System](#payment-system)
7. [AI & Automation Features](#ai--automation-features)
8. [Notification System](#notification-system)
9. [Security Features](#security-features)
10. [Performance & Monitoring](#performance--monitoring)
11. [Deployment Configuration](#deployment-configuration)

## Architecture Overview

### Core Components

- **Express.js REST API** - Main backend server
- **Firebase Firestore** - Primary database
- **Firebase Authentication** - User authentication
- **Redis** - Caching and rate limiting
- **Google AI (Genkit)** - AI-powered features
- **Payment Gateways** - PayPal and Maya integration
- **Email Service** - Resend integration
- **SMS Service** - Twilio integration
- **N8N Workflows** - Automation and webhooks

### User Roles

1. **Client** - Service consumers
2. **Provider** - Individual service providers
3. **Agency** - Business entities managing multiple providers
4. **Admin** - Platform administrators
5. **Partner** - Referral partners

## Technology Stack

### Core Dependencies

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
  "morgan": "^1.10.0"
}
```

### AI & Automation

```json
{
  "@genkit-ai/googleai": "^1.13.0",
  "genkit": "^1.13.0"
}
```

## Database Schema

### Collections Structure

#### Users Collection
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

#### Transactions Collection
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

#### Notifications Collection
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  data?: any;
  timestamp: Date;
  readAt?: Date;
}
```

#### Messages Collection
```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  bookingId?: string;
  content: string;
  type: 'text' | 'image' | 'file';
  read: boolean;
  createdAt: Date;
}
```

#### Quotes Collection
```typescript
interface Quote {
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

interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}
```

## API Endpoints

### Authentication Endpoints

```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  role: 'client' | 'provider' | 'agency';
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/auth/logout
// POST /api/auth/forgot-password
// POST /api/auth/reset-password
```

### User Management Endpoints

```typescript
// GET /api/users/profile
// PUT /api/users/profile
// GET /api/users/:id
// PUT /api/users/:id/status
// GET /api/users/providers
// GET /api/users/agencies
```

### Booking Endpoints

```typescript
// GET /api/bookings
// POST /api/bookings
// GET /api/bookings/:id
// PUT /api/bookings/:id
// DELETE /api/bookings/:id
// POST /api/bookings/:id/confirm
// POST /api/bookings/:id/complete
// POST /api/bookings/:id/cancel
```

### Job Endpoints

```typescript
// GET /api/jobs
// POST /api/jobs
// GET /api/jobs/:id
// PUT /api/jobs/:id
// DELETE /api/jobs/:id
// POST /api/jobs/:id/apply
// POST /api/jobs/:id/select-provider
```

### Payment Endpoints

```typescript
// PayPal Integration
// POST /api/payments/paypal/create
// POST /api/payments/paypal/capture
// POST /api/payments/paypal/webhook
// POST /api/payments/paypal/subscription/create
// POST /api/payments/paypal/subscription/activate

// Maya Integration
// POST /api/payments/maya/checkout
// GET /api/payments/maya/status/:checkoutId
// POST /api/payments/maya/webhook

// General Payment
// GET /api/payments/transactions
// POST /api/payments/payout-request
// GET /api/payments/payouts
```

### Notification Endpoints

```typescript
// GET /api/notifications
// PUT /api/notifications/:id/read
// PUT /api/notifications/read-all
// POST /api/notifications/test
```

### Messaging Endpoints

```typescript
// GET /api/messages/conversations
// GET /api/messages/conversations/:id
// POST /api/messages/send
// PUT /api/messages/:id/read
```

### Quote Endpoints

```typescript
// GET /api/quotes
// POST /api/quotes
// GET /api/quotes/:id
// PUT /api/quotes/:id
// POST /api/quotes/:id/send
// POST /api/quotes/:id/accept
// POST /api/quotes/:id/reject
```

### AI Endpoints

```typescript
// POST /api/ai/smart-rate-suggestions
// POST /api/ai/find-matching-providers
// POST /api/ai/generate-job-details
// POST /api/ai/generate-quote-description
// POST /api/ai/help-center-assistant
```

### Admin Endpoints

```typescript
// POST /api/admin/secure-action
// GET /api/admin/dashboard
// GET /api/admin/users
// PUT /api/admin/users/:id/status
// GET /api/admin/transactions
// POST /api/admin/process-payout
// GET /api/admin/analytics
```

## Authentication & Authorization

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

### Role-Based Access Control

```typescript
const rolePermissions = {
  client: ['read:own_profile', 'read:bookings', 'create:bookings', 'read:jobs', 'create:jobs'],
  provider: ['read:own_profile', 'read:bookings', 'update:own_bookings', 'read:jobs', 'apply:jobs'],
  agency: ['read:own_profile', 'read:bookings', 'update:own_bookings', 'read:jobs', 'apply:jobs', 'manage:providers'],
  admin: ['*'],
  partner: ['read:own_profile', 'read:referrals', 'create:referrals']
};
```

### Middleware Implementation

```typescript
// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

## Payment System

### PayPal Integration

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

### Maya Integration

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

## AI & Automation Features

### Smart Rate Suggestions

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

### Provider Matching

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

### Job Details Generation

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
  const prompt = `You are an expert assistant for a service marketplace in the Philippines. Your goal is to help users create the most effective job posting possible.
  
  Given the user's job description, you need to do two things:
  1. Suggest a reasonable budget for this job in Philippine Peso (PHP). Consider the complexity and typical rates for such services in the Philippines.
  2. Generate 2-3 specific, important questions that would help a service provider better understand the scope of the work.
  
  Job Description: ${input.jobDescription}`;
  
  const result = await ai.generateText({
    model: 'googleai/gemini-2.0-flash',
    prompt: prompt
  });
  
  return JSON.parse(result.text);
}
```

## Notification System

### Email Service

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
  
  async sendBulkEmail(emails: Array<{
    to: string;
    subject: string;
    html: string;
  }>): Promise<{ success: boolean; results: any[] }> {
    const results = await Promise.allSettled(
      emails.map(email => this.sendEmail(email))
    );
    
    return {
      success: true,
      results: results.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: 'Failed' }
      )
    };
  }
}
```

### SMS Service

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

### Push Notifications

```typescript
class NotificationService {
  async sendNotification(userId: string, notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    link?: string;
    data?: any;
  }): Promise<void> {
    // Store notification in database
    await db.collection('notifications').add({
      userId,
      ...notification,
      read: false,
      timestamp: new Date()
    });
    
    // Send push notification if user has device tokens
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.deviceTokens?.length > 0) {
      await this.sendPushNotification(userData.deviceTokens, notification);
    }
  }
  
  private async sendPushNotification(deviceTokens: string[], notification: any): Promise<void> {
    // Implementation using Firebase Cloud Messaging
    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: notification.data || {},
      tokens: deviceTokens
    };
    
    await admin.messaging().sendMulticast(message);
  }
}
```

## Security Features

### Rate Limiting

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

### Input Validation

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

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Audit Logging

```typescript
class AuditLogger {
  async logAction(action: string, userId: string, resource: string, details: any): Promise<void> {
    await db.collection('auditLogs').add({
      action,
      userId,
      resource,
      details,
      timestamp: new Date(),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }
}
```

## Performance & Monitoring

### Caching Strategy

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes default TTL

class CacheService {
  async get<T>(key: string): Promise<T | undefined> {
    return cache.get<T>(key);
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    cache.set(key, value, ttl);
  }
  
  async del(key: string): Promise<void> {
    cache.del(key);
  }
  
  async flush(): Promise<void> {
    cache.flushAll();
  }
}
```

### Database Optimization

```typescript
// Firestore indexes for optimal query performance
const firestoreIndexes = {
  users: [
    { fields: ['role', 'accountStatus', 'createdAt'] },
    { fields: ['role', 'location.latitude', 'location.longitude'] },
    { fields: ['role', 'rating', 'totalJobs'] }
  ],
  bookings: [
    { fields: ['clientId', 'status', 'createdAt'] },
    { fields: ['providerId', 'status', 'createdAt'] },
    { fields: ['status', 'date', 'createdAt'] }
  ],
  jobs: [
    { fields: ['clientId', 'status', 'createdAt'] },
    { fields: ['category', 'status', 'createdAt'] },
    { fields: ['status', 'budget.amount', 'createdAt'] }
  ]
};
```

### Monitoring & Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'localpro-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Performance monitoring middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});
```

## Deployment Configuration

### Environment Variables

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

# Database
DATABASE_URL=your-database-url
```

### Docker Configuration

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

### Docker Compose

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

### Nginx Configuration

```nginx
upstream api {
    server api:3000;
}

server {
    listen 80;
    server_name localpro.asia www.localpro.asia;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name localpro.asia www.localpro.asia;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://api/health;
        access_log off;
    }
}
```

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Set up Express.js server with TypeScript
- [ ] Configure Firebase Admin SDK
- [ ] Implement authentication middleware
- [ ] Set up Redis for caching and rate limiting
- [ ] Configure logging and monitoring
- [ ] Set up basic security headers

### Phase 2: User Management
- [ ] Implement user registration and login
- [ ] Create role-based access control
- [ ] Build user profile management
- [ ] Implement user verification system
- [ ] Add user status management

### Phase 3: Core Features
- [ ] Build booking system
- [ ] Implement job posting and application system
- [ ] Create messaging system
- [ ] Build quote generation system
- [ ] Implement review and rating system

### Phase 4: Payment Integration
- [ ] Integrate PayPal payment processing
- [ ] Integrate Maya payment processing
- [ ] Build transaction management
- [ ] Implement payout system
- [ ] Add payment verification

### Phase 5: AI Features
- [ ] Implement smart rate suggestions
- [ ] Build provider matching system
- [ ] Create job details generation
- [ ] Add quote description generation
- [ ] Implement help center assistant

### Phase 6: Communication
- [ ] Set up email service with Resend
- [ ] Implement SMS service with Twilio
- [ ] Build push notification system
- [ ] Create notification management
- [ ] Add email templates

### Phase 7: Admin Features
- [ ] Build admin dashboard
- [ ] Implement user management
- [ ] Create transaction monitoring
- [ ] Add analytics and reporting
- [ ] Build system configuration

### Phase 8: Security & Performance
- [ ] Implement comprehensive rate limiting
- [ ] Add input validation and sanitization
- [ ] Set up audit logging
- [ ] Optimize database queries
- [ ] Implement caching strategies

### Phase 9: Deployment
- [ ] Set up Docker configuration
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificates
- [ ] Implement health checks
- [ ] Configure monitoring and alerting

This comprehensive backend specification provides a complete roadmap for implementing the LocalPro backend using Node.js, covering all the features and functionality present in the original application.
