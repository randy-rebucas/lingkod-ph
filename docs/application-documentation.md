# Lingkod PH - Application Documentation

## Overview

**Lingkod PH** (also known as **LocalPro**) is a comprehensive service marketplace platform that connects clients with trusted local service providers in the Philippines. The platform facilitates service discovery, booking management, payment processing, and business growth for both individual providers and agencies.

## Application Architecture

- **Framework**: Next.js 15.3.3 with TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Payment Processing**: PayPal, GCash, Maya, Debit/Credit Cards, Bank Transfer
- **AI Integration**: Google AI (Genkit) for smart features
- **Internationalization**: English and Filipino (Tagalog) support

## User Roles and Permissions

The application supports five distinct user roles, each with specific permissions and access levels:

### 1. **Client** (`client`)
**Default role for new users**

**Accessible Modules:**
- Dashboard - View available providers and services
- Bookings - Manage service appointments
- My Job Posts - Post and manage job requests
- My Favorites - Save preferred providers
- Profile - Manage personal information
- Messages - Communicate with providers
- Settings - Account preferences
- Billing - Payment history and methods

**Permissions:**
- Browse and search service providers
- Book services and manage appointments
- Post job requests
- Rate and review completed services
- Manage personal profile and preferences
- Access basic messaging system

### 2. **Provider** (`provider`)
**Individual service professionals**

**Accessible Modules:**
- Dashboard - View bookings, earnings, and analytics
- Bookings - Manage service appointments
- Applied Jobs - View and apply to job postings
- Services - Manage service offerings
- Jobs - Browse available job opportunities
- Earnings - Track income and payouts
- Analytics - Performance metrics (Elite plan)
- Invoices - Create and manage invoices (Pro/Elite plans)
- Smart Rate - AI-powered pricing suggestions (Paid plans)
- Quote Builder - Create professional quotes (Elite plan)
- Profile - Manage professional profile
- Messages - Communicate with clients
- Settings - Account preferences

**Permissions:**
- Create and manage service listings
- Accept and manage bookings
- Apply to job postings
- Track earnings and request payouts
- Access advanced features based on role
- Manage professional profile and portfolio
- Communicate with clients

### 3. **Agency** (`agency`)
**Business entities managing multiple providers**

**Accessible Modules:**
- Dashboard - Agency overview and analytics
- Bookings - Manage all agency bookings
- Post a Job - Create job postings
- My Job Posts - Manage job postings
- My Favorites - Save preferred providers
- Manage Providers - Oversee agency providers
- Reports - Agency performance analytics
- Earnings - Track agency income
- Analytics - Advanced business metrics
- Invoices - Create and manage invoices
- Smart Rate - AI-powered pricing suggestions
- Quote Builder - Create professional quotes
- Subscription - Manage agency subscription plans
- Profile - Manage agency profile
- Messages - Communicate with clients and providers
- Settings - Account preferences

**Permissions:**
- Manage multiple service providers
- Create and manage job postings
- Oversee agency operations and performance
- Access advanced business analytics
- Manage agency-wide bookings and payments
- Create professional quotes and invoices
- Access all provider features plus agency-specific tools

### 4. **Admin** (`admin`)
**Platform administrators with full system access**

**Accessible Modules:**
- Dashboard - System overview and statistics
- Users - Manage all user accounts
- Bookings - Oversee all platform bookings
- Jobs - Manage job postings
- Categories - Manage service categories
- Moderation - Handle reports and disputes
- Payouts - Process provider payments
- Subscriptions - Manage subscription plans
- Rewards - Configure loyalty programs
- Settings - System configuration
- Security Logs - Monitor system security
- Reports - Platform analytics
- Transactions - Financial oversight
- Broadcast - Send platform announcements
- Ads - Manage advertising campaigns
- Backup - System backup management
- Tickets - Customer support management
- Conversations - Monitor user communications
- Client Reports - Client-specific analytics

**Permissions:**
- Full system access and control
- User account management and role assignment
- Financial oversight and payout processing
- Content moderation and dispute resolution
- System configuration and maintenance
- Analytics and reporting access
- Security monitoring and audit logs

### 5. **Partner** (`partner`)
**Business partners and affiliates**

**Accessible Modules:**
- Partners Dashboard - Partner-specific analytics
- Profile - Manage partner information
- Settings - Account preferences

**Permissions:**
- Access partner-specific features
- View partner analytics and performance
- Manage partner profile and settings

## Subscription Tiers and Feature Access

### Provider Subscription Plans

#### **Free Plan** (₱0/month)
- Basic Profile
- Accept Bookings
- Standard Commission Rate

#### **Pro Plan** (₱499/month)
- Enhanced Profile Visibility
- Access to Quote Builder
- Access to Invoicing Tool
- Lower Commission Rate
- Basic Analytics

#### **Elite Plan** (₱999/month)
- All Pro features
- Top placement in search results
- Advanced Analytics Suite
- Dedicated Support
- Lowest Commission Rate

### Agency Subscription Plans

#### **Lite Plan** (₱1,999/month)
- Manage up to 3 Providers
- Agency Profile Page
- Centralized Booking Management
- Basic Performance Reports

#### **Pro Plan** (₱4,999/month)
- Manage up to 10 Providers
- All Lite features
- Enhanced Reporting & Analytics
- Branded Communications

#### **Custom Plan** (Contact Us)
- Unlimited Providers
- All Pro features
- API Access (coming soon)
- Dedicated Account Manager
- Custom Onboarding & Training

## Core Features and Modules

### 1. **User Authentication & Profiles**
- Multi-role user registration and login
- Google OAuth integration
- Profile management with role-specific fields
- Identity verification system
- Account status management (active, pending, suspended)

### 2. **Provider Discovery**
- Advanced search and filtering
- Location-based service discovery
- Category-based browsing
- Rating and review system
- Provider verification status

### 3. **Booking Management**
- Real-time booking system
- Calendar integration
- Booking status tracking
- Automated notifications
- Work log management

### 4. **Payment Processing**
- Multiple payment methods (GCash, Maya, PayPal, Cards, Bank Transfer)
- Automated commission deduction
- Payout management for providers
- Invoice generation and management
- Payment history tracking

### 5. **AI-Powered Features**
- Smart Rate suggestions for competitive pricing
- Quote Builder with AI assistance
- Help Center AI assistant
- Provider matching algorithms
- Service description generation

### 6. **Communication System**
- In-app messaging between users
- Email notifications
- Broadcast messaging for admins
- Support ticket system

### 7. **Analytics & Reporting**
- User performance metrics
- Financial reporting
- Booking analytics
- Provider performance tracking
- Agency management reports

### 8. **Content Management**
- Service category management
- Provider profile management
- Job posting system
- Review and rating system
- Content moderation tools

## Security and Access Control

### Authentication
- Firebase Authentication with email/password and Google OAuth
- Role-based access control (RBAC)
- Session management and security

### Authorization
- Route-level protection via middleware
- Component-level role guards
- Database-level security rules
- API endpoint protection

### Data Security
- Firestore security rules
- Storage access controls
- Audit logging for admin actions
- Secure payment processing

## Internationalization

The application supports multiple languages:
- **English** (en) - Primary language
- **Filipino/Tagalog** (tl) - Local language support

All user-facing content is localized using the `next-intl` library.

## Technical Implementation

### Frontend
- **Next.js 15.3.3** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** components
- **React Hook Form** for form management
- **Zod** for validation

### Backend
- **Firebase Firestore** for database
- **Firebase Auth** for authentication
- **Firebase Storage** for file storage
- **Server Actions** for API endpoints
- **Google AI (Genkit)** for AI features

### Payment Integration
- **PayPal** for international payments
- **GCash** and **Maya** for local payments
- **Stripe** for card processing
- **Bank transfer** support

## Development and Deployment

### Environment Setup
- Node.js development environment
- Firebase project configuration
- Environment variables for API keys
- Local development with hot reload

### Build and Deployment
- Next.js build process
- Firebase hosting deployment
- Environment-specific configurations
- CI/CD pipeline support

## Monitoring and Maintenance

### Analytics
- User behavior tracking
- Performance monitoring
- Error logging and reporting
- Business metrics dashboard

### Maintenance
- Database backup system
- Security audit logs
- Performance optimization
- Regular updates and patches

---

*This documentation provides a comprehensive overview of the Lingkod PH application, including user roles, permissions, features, and technical implementation details. For specific implementation details or additional information, please refer to the source code and related documentation files.*
