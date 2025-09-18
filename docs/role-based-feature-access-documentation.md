# Lingkod PH - Role-Based Feature Access Documentation

## Table of Contents
1. [Overview](#overview)
2. [Client Role](#client-role)
3. [Provider Role](#provider-role)
4. [Agency Role](#agency-role)
5. [Admin Role](#admin-role)
6. [Partner Role](#partner-role)
7. [Subscription Tiers](#subscription-tiers)
8. [Upgrade Messages](#upgrade-messages)
9. [Feature Access Matrix](#feature-access-matrix)
10. [Implementation Notes](#implementation-notes)

---

## Overview

**Lingkod PH** (also known as **LocalPro**) implements a comprehensive role-based access control system with subscription tiers that determine feature availability. This documentation provides a complete breakdown of features accessible to each user role, including upgrade messaging for premium features.

### Platform Architecture
- **Framework**: Next.js 15.3.3 with TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with role-based access control
- **Payment Processing**: PayPal, GCash, Maya, Debit/Credit Cards, Bank Transfer
- **AI Integration**: Google AI (Genkit) for smart features
- **Internationalization**: English and Filipino (Tagalog) support

### User Roles
The platform supports five distinct user roles:
1. **Client** - Service seekers (default role)
2. **Provider** - Individual service professionals
3. **Agency** - Business entities managing multiple providers
4. **Admin** - Platform administrators
5. **Partner** - Referral partners

---

## Client Role

**Default role for new users** - Individuals seeking services from local providers.

### ✅ Available Features (No Subscription Required)

All features are available to clients without subscription requirements:

#### Core Features
- **Dashboard** - Browse and search service providers with AI-powered smart search
- **Calendar** - View and manage appointments
- **Bookings** - Book services, track booking status, cancel bookings, leave reviews
- **My Job Posts** - Create and manage job postings for providers to apply
- **My Favorites** - Save and manage favorite providers
- **Profile** - Manage personal information and preferences
- **Messages** - Communicate with providers
- **Settings** - Account preferences and configuration
- **Billing** - View payment history and manage payment methods

#### Specific Capabilities
- Browse and search service providers with advanced filtering
- Book services and manage appointments
- Post job requests for providers to apply
- Rate and review completed services
- Add providers to favorites
- Access basic messaging system
- View payment history
- Manage personal profile

---

## Provider Role

**Individual service professionals** offering services to clients.

### 🆓 FREE PLAN Features

#### Core Features
- **Dashboard** - View bookings, basic earnings overview
- **Calendar** - Manage service appointments
- **Bookings** - Accept and manage service appointments
- **Applied Jobs** - View and apply to job postings
- **Services** - Create and manage service listings
- **Jobs** - Browse available job opportunities
- **Profile** - Manage professional profile
- **Messages** - Communicate with clients
- **Settings** - Account preferences
- **Billing** - Basic payment information

### 🔒 PREMIUM FEATURES (Requires Paid Subscription)

#### 💡 Smart Rate
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Get competitive and profitable pricing with AI-powered suggestions. Upgrade to Pro or Elite plan to access Smart Rate features."*  
**Required Plan:** Pro (₱499/month) or Elite (₱999/month)

#### 📄 Invoices
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Streamline your billing process with professional invoices. Upgrade to Pro or Elite plan to create and manage invoices."*  
**Required Plan:** Pro (₱499/month) or Elite (₱999/month)

#### 📊 Quote Builder
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Create professional quotes to win more clients. Upgrade to Pro or Elite plan to access the Quote Builder."*  
**Required Plan:** Pro (₱499/month) or Elite (₱999/month)

#### 💰 Earnings Tracking
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Take control of your finances with detailed earnings tracking and payout requests. Upgrade to Pro or Elite plan to access comprehensive earnings management."*  
**Required Plan:** Pro (₱499/month) or Elite (₱999/month)

#### 📈 Analytics (Basic)
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Track your performance with basic analytics. Upgrade to Pro plan to access performance metrics."*  
**Required Plan:** Pro (₱499/month)

#### 📊 Advanced Analytics
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Get detailed insights with advanced analytics suite. Upgrade to Elite plan to access comprehensive performance analytics."*  
**Required Plan:** Elite (₱999/month)

### 💼 PRO PLAN Features (₱499/month)

All Free features plus:
- ✅ **Smart Rate** - AI-powered pricing suggestions
- ✅ **Invoices** - Create and manage professional invoices
- ✅ **Quote Builder** - Create professional quotes
- ✅ **Earnings** - Detailed earnings tracking and payout requests
- ✅ **Analytics** - Basic performance metrics
- Enhanced profile visibility
- Lower commission rates

### 👑 ELITE PLAN Features (₱999/month)

All Pro features plus:
- ✅ **Advanced Analytics** - Advanced analytics suite with detailed insights
- Top placement in search results
- Dedicated support
- Lowest commission rates

---

## Agency Role

**Business entities managing multiple providers** - Companies that coordinate teams of service providers.

### 🆓 FREE PLAN Features

#### Core Features
- **Dashboard** - Basic agency overview
- **Calendar** - Manage all agency bookings
- **Bookings** - Manage all agency bookings
- **Post a Job** - Create job postings
- **My Job Posts** - Manage job postings
- **My Favorites** - Save preferred providers
- **Profile** - Manage agency profile
- **Messages** - Communicate with clients and providers
- **Settings** - Account preferences
- **Billing** - Agency billing management

### 🔒 PREMIUM FEATURES (Requires Paid Subscription)

#### 👥 Manage Providers
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"You have reached the provider limit for your current plan. Please upgrade your subscription to add more providers."*  
**Required Plan:** Lite (₱1,999/month) - up to 3 providers

#### 📊 Reports
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Access comprehensive agency performance reports. Upgrade to Lite plan to view basic performance reports."*  
**Required Plan:** Lite (₱1,999/month) for basic reports

#### 💰 Earnings Tracking
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Track your agency income and financial performance. Upgrade to Lite plan to access earnings management."*  
**Required Plan:** Lite (₱1,999/month)

#### 📈 Analytics
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Get advanced business metrics and insights. Upgrade to Lite plan to access basic analytics."*  
**Required Plan:** Lite (₱1,999/month)

#### 📄 Invoices
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Create professional invoices for your agency. Upgrade to Lite plan to access invoicing tools."*  
**Required Plan:** Lite (₱1,999/month)

#### 💡 Smart Rate
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Get AI-powered pricing suggestions for your agency. Upgrade to Lite plan to access Smart Rate features."*  
**Required Plan:** Lite (₱1,999/month)

#### 📊 Quote Builder
**Current Status:** ❌ Not Available  
**Upgrade Message:** *"Create professional quotes for your agency. Upgrade to Lite plan to access the Quote Builder."*  
**Required Plan:** Lite (₱1,999/month)

### 💼 LITE PLAN Features (₱1,999/month)

All Free features plus:
- ✅ **Manage Providers** - Oversee up to 3 providers
- ✅ **Reports** - Basic performance reports
- ✅ **Earnings** - Track agency income
- ✅ **Analytics** - Basic business metrics
- ✅ **Invoices** - Create and manage invoices
- ✅ **Smart Rate** - AI-powered pricing suggestions
- ✅ **Quote Builder** - Create professional quotes

### 🏢 PRO PLAN Features (₱4,999/month)

All Lite features plus:
- ✅ **Manage Providers** - Oversee up to 10 providers
- ✅ **Enhanced Reports** - Advanced reporting & analytics
- ✅ **Branded Communications** - Custom branded messaging

### 🏆 CUSTOM PLAN Features (Contact Us)

All Pro features plus:
- ✅ **Manage Providers** - Unlimited providers
- ✅ **API Access** - Platform integration (coming soon)
- ✅ **Dedicated Account Manager** - Personal support
- ✅ **Custom Onboarding & Training** - Tailored setup

---

## Admin Role

**Platform administrators with full system access** - Technical and business administrators managing the entire platform.

### ✅ All Features Available

#### System Management
- **Dashboard** - System overview, user statistics, revenue tracking
- **Users** - Manage all user accounts, roles, and account status
- **Bookings** - Oversee all platform bookings
- **Jobs** - Manage all job postings
- **Categories** - Manage service categories
- **Subscriptions** - Manage subscription plans and pricing
- **Transactions** - Monitor all financial transactions
- **Payouts** - Process provider and agency payouts
- **Reports** - Comprehensive platform analytics
- **Client Reports** - Client-specific reporting

#### Content & Moderation
- **Moderation** - Content moderation and user reports
- **Broadcast** - Send platform-wide announcements
- **Ads** - Manage advertising content
- **Rewards** - Manage reward systems

#### Security & Operations
- **Security Logs** - Monitor security events and access logs
- **Backup** - System backup and recovery
- **Settings** - Platform configuration
- **Tickets** - Support ticket management
- **Conversations** - Monitor user communications

#### Profile & Settings
- **Profile** - Admin profile management
- **Settings** - System settings and configuration

---

## Partner Role

**Referral partners** - External entities that refer users to the platform.

### ✅ All Features Available

#### Partner-Specific Features
- **Dashboard** - Partner performance overview
- **Analytics** - Referral tracking and performance metrics
- **Commission Management** - Track earned commissions
- **Referral Tracking** - Monitor referred users and conversions
- **Performance Metrics** - Analyze referral success rates
- **Conversion Analytics** - Track user journey from referral to conversion
- **Monthly Statistics** - Historical performance data
- **Growth Metrics** - Track partnership growth over time

#### Profile & Settings
- **Profile** - Partner profile management
- **Settings** - Partner account preferences

---

## Subscription Tiers

### Provider Subscription Plans

| Plan | Price | Features | Ideal For |
|------|-------|----------|-----------|
| **Free** | ₱0/month | Basic Profile, Accept Bookings, Standard Commission Rate | New providers starting out |
| **Pro** | ₱499/month | Enhanced Profile Visibility, Quote Builder, Invoicing Tool, Lower Commission Rate, Basic Analytics | Professionals ready to grow |
| **Elite** | ₱999/month | All Pro features, Top placement in search results, Advanced Analytics Suite, Dedicated Support, Lowest Commission Rate | Top-tier providers and businesses |

### Agency Subscription Plans

| Plan | Price | Features | Ideal For |
|------|-------|----------|-----------|
| **Lite** | ₱1,999/month | Manage up to 3 Providers, Agency Profile Page, Centralized Booking Management, Basic Performance Reports | Small agencies starting out |
| **Pro** | ₱4,999/month | Manage up to 10 Providers, All Lite features, Enhanced Reporting & Analytics, Branded Communications | Growing agencies scaling their team |
| **Custom** | Contact Us | Unlimited Providers, All Pro features, API Access (coming soon), Dedicated Account Manager, Custom Onboarding & Training | Large agencies with custom needs |

---

## Upgrade Messages

### For Providers

#### Free → Pro
*"Upgrade to Pro plan (₱499/month) to access Smart Rate, Invoices, Quote Builder, and Earnings tracking"*

#### Free → Elite
*"Upgrade to Elite plan (₱999/month) to access all Pro features plus Advanced Analytics and top placement"*

#### Pro → Elite
*"Upgrade to Elite plan (₱999/month) to access Advanced Analytics, top placement, and dedicated support"*

### For Agencies

#### Free → Lite
*"Upgrade to Lite plan (₱1,999/month) to manage up to 3 providers and access basic reports"*

#### Lite → Pro
*"Upgrade to Pro plan (₱4,999/month) to manage up to 10 providers and access enhanced reports"*

#### Pro → Custom
*"Contact us for Custom plan to manage unlimited providers and access API integration"*

### Provider Limit Messages

#### Lite Plan
*"You can manage up to 3 providers with your current Lite plan. Upgrade to Pro to manage up to 10 providers."*

#### Pro Plan
*"You can manage up to 10 providers with your current Pro plan. Contact us for Custom plan to manage unlimited providers."*

---

## Feature Access Matrix

| Feature | Client | Provider Free | Provider Pro | Provider Elite | Agency Free | Agency Lite | Agency Pro | Agency Custom | Admin | Partner |
|---------|--------|---------------|--------------|----------------|-------------|-------------|------------|---------------|-------|---------|
| **Browse Services** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Book Services** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Post Jobs** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Apply to Jobs** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Manage Services** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Manage Providers** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (3) | ✅ (10) | ✅ (∞) | ✅ | ❌ |
| **Smart Rate** | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Invoices** | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Quote Builder** | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Analytics** | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Advanced Analytics** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Earnings Tracking** | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Process Payouts** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **User Management** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **System Settings** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Messaging** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Profile Management** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Subscription Management** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Referral Tracking** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Implementation Notes

### Role-Based Access Control
- **Middleware Protection**: Routes are protected at the middleware level using Firebase Auth tokens
- **Component Guards**: React components use `RoleGuard` for conditional rendering
- **Database Rules**: Firestore security rules enforce role-based data access
- **Subscription Validation**: Server-side validation ensures subscription requirements are met

### Subscription Management
- **Real-time Updates**: Subscription status is monitored in real-time using Firestore listeners
- **Graceful Degradation**: Features are hidden or show upgrade messages when subscription requirements aren't met
- **Payment Integration**: PayPal integration handles subscription payments
- **Automatic Renewals**: Subscription renewals are handled automatically

### Upgrade Flow
1. **Feature Access Check**: System checks user's current subscription level
2. **Upgrade Message Display**: Appropriate upgrade message is shown for restricted features
3. **Subscription Page Redirect**: Users are directed to subscription page for upgrades
4. **Payment Processing**: PayPal handles payment processing
5. **Feature Activation**: Features are immediately available after successful payment

### Security Considerations
- **Token Validation**: All API endpoints validate user tokens and roles
- **Audit Logging**: All role changes and subscription updates are logged
- **Rate Limiting**: Admin actions are rate-limited to prevent abuse
- **Data Isolation**: Users can only access data appropriate to their role

### Internationalization
- **Multi-language Support**: All upgrade messages and feature descriptions support English and Filipino
- **Localized Pricing**: Prices are displayed in Philippine Peso (₱)
- **Cultural Adaptation**: Features are adapted for the Philippine market

---

## Conclusion

This documentation provides a comprehensive overview of the role-based feature access system in Lingkod PH. The platform's subscription model ensures that users have access to appropriate features based on their role and subscription tier, while providing clear upgrade paths for premium features.

The system is designed to be scalable, secure, and user-friendly, with clear messaging about feature availability and upgrade requirements. This approach helps users understand the value of different subscription tiers while maintaining a smooth user experience across all roles.

---

*Last Updated: December 2024*  
*Version: 1.0*  
*Document Type: Technical Documentation*
