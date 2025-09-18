# Lingkod PH - Comprehensive Role Documentation with Use Cases

## Table of Contents
1. [Overview](#overview)
2. [Client Role](#client-role)
3. [Provider Role](#provider-role)
4. [Agency Role](#agency-role)
5. [Admin Role](#admin-role)
6. [Partner Role](#partner-role)
7. [Role Comparison Matrix](#role-comparison-matrix)
8. [Security and Access Control](#security-and-access-control)
9. [Subscription Tiers and Feature Access](#subscription-tiers-and-feature-access)

---

## Overview

**Lingkod PH** (also known as **LocalPro**) is a comprehensive service marketplace platform that connects clients with trusted local service providers in the Philippines. The platform supports five distinct user roles, each designed for specific use cases and business needs.

### Platform Architecture
- **Framework**: Next.js 15.3.3 with TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with role-based access control
- **Storage**: Firebase Storage
- **Payment Processing**: PayPal, GCash, Maya, Debit/Credit Cards, Bank Transfer
- **AI Integration**: Google AI (Genkit) for smart features
- **Internationalization**: English and Filipino (Tagalog) support

---

## Client Role

### Role Definition
**Default role for new users** - Individuals seeking services from local providers.

### Primary Use Cases

#### 1. **Service Discovery and Booking**
**Scenario**: Maria needs a house cleaning service for her apartment in Makati.

**User Journey**:
1. **Browse Services**: Maria searches for "house cleaning" in her area
2. **Compare Providers**: Reviews profiles, ratings, and pricing of multiple cleaners
3. **Book Service**: Selects preferred provider and schedules appointment
4. **Track Booking**: Monitors booking status and receives updates
5. **Complete Service**: Provider completes cleaning, Maria pays through platform
6. **Leave Review**: Maria rates and reviews the service quality

**Features Used**:
- Advanced search and filtering
- Provider profile viewing
- Real-time booking system
- Payment processing
- Review and rating system

#### 2. **Job Posting for Complex Projects**
**Scenario**: John needs to renovate his kitchen and wants to hire multiple contractors.

**User Journey**:
1. **Post Job**: Creates detailed job posting with requirements, budget, and timeline
2. **Receive Applications**: Reviews applications from qualified providers
3. **Interview Providers**: Communicates with potential contractors
4. **Select Provider**: Chooses best fit based on portfolio and communication
5. **Manage Project**: Tracks progress and manages payments
6. **Project Completion**: Reviews work and finalizes payment

**Features Used**:
- Job posting system
- Provider application management
- In-app messaging
- Project tracking
- Multi-stage payment processing

#### 3. **Recurring Service Management**
**Scenario**: Lisa owns a small office and needs regular maintenance services.

**User Journey**:
1. **Find Regular Provider**: Searches for office cleaning services
2. **Set Up Recurring Bookings**: Schedules weekly cleaning appointments
3. **Manage Favorites**: Saves preferred providers for quick booking
4. **Track History**: Reviews past services and payments
5. **Adjust Schedule**: Modifies recurring bookings as needed

**Features Used**:
- Favorites system
- Recurring booking management
- Service history tracking
- Provider relationship management

### Accessible Modules

| Module | Description | Use Case |
|--------|-------------|----------|
| **Dashboard** | View available providers and services | Quick access to recommended services |
| **Bookings** | Manage service appointments | Track current and past bookings |
| **My Job Posts** | Post and manage job requests | Create detailed project requirements |
| **My Favorites** | Save preferred providers | Quick access to trusted providers |
| **Profile** | Manage personal information | Update contact details and preferences |
| **Messages** | Communicate with providers | Discuss project details and requirements |
| **Settings** | Account preferences | Configure notifications and privacy |
| **Billing** | Payment history and methods | Manage payment methods and view history |

### Key Permissions
- ✅ Browse and search service providers
- ✅ Book services and manage appointments
- ✅ Post job requests for complex projects
- ✅ Rate and review completed services
- ✅ Manage personal profile and preferences
- ✅ Access basic messaging system
- ✅ Save and manage favorite providers
- ✅ Track booking history and payments

---

## Provider Role

### Role Definition
**Individual service professionals** - Freelancers and independent contractors offering services.

### Primary Use Cases

#### 1. **Service Provider Business Management**
**Scenario**: Carlos is a freelance graphic designer building his client base.

**User Journey**:
1. **Create Profile**: Sets up professional profile with portfolio and services
2. **List Services**: Creates detailed service offerings with pricing
3. **Accept Bookings**: Receives and manages booking requests
4. **Deliver Services**: Completes work and tracks time
5. **Invoice Clients**: Creates and sends professional invoices
6. **Track Earnings**: Monitors income and requests payouts
7. **Grow Business**: Uses analytics to improve performance

**Features Used**:
- Professional profile management
- Service listing creation
- Booking management system
- Invoice generation
- Earnings tracking
- Performance analytics

#### 2. **Job Application and Project Work**
**Scenario**: Ana is a web developer looking for new projects.

**User Journey**:
1. **Browse Jobs**: Searches for relevant web development projects
2. **Apply to Jobs**: Submits applications with portfolio and proposals
3. **Client Communication**: Discusses project requirements and timeline
4. **Project Delivery**: Completes development work with milestones
5. **Payment Processing**: Receives payments through platform
6. **Build Reputation**: Collects reviews and builds client relationships

**Features Used**:
- Job browsing and application system
- Portfolio management
- Client communication tools
- Project tracking
- Payment processing
- Review and rating system

#### 3. **Subscription-Based Business Growth**
**Scenario**: Miguel is a photographer upgrading to Pro plan for better visibility.

**User Journey**:
1. **Free Plan Usage**: Starts with basic profile and booking acceptance
2. **Upgrade Decision**: Evaluates Pro plan benefits for business growth
3. **Subscription Upgrade**: Upgrades to Pro plan for enhanced features
4. **Enhanced Visibility**: Benefits from improved search placement
5. **Advanced Tools**: Uses quote builder and invoicing tools
6. **Analytics Review**: Tracks performance improvements with analytics

**Features Used**:
- Subscription management
- Enhanced profile visibility
- Quote builder (Pro/Elite plans)
- Invoicing tools (Pro/Elite plans)
- Advanced analytics (Elite plan)
- Smart rate suggestions (Paid plans)

### Accessible Modules

| Module | Description | Use Case |
|--------|-------------|----------|
| **Dashboard** | View bookings, earnings, and analytics | Monitor business performance |
| **Bookings** | Manage service appointments | Track and complete client work |
| **Applied Jobs** | View and apply to job postings | Find new project opportunities |
| **Services** | Manage service offerings | Create and update service listings |
| **Jobs** | Browse available job opportunities | Discover new projects |
| **Earnings** | Track income and payouts | Monitor financial performance |
| **Analytics** | Performance metrics (Elite plan) | Analyze business growth |
| **Invoices** | Create and manage invoices (Pro/Elite) | Professional billing |
| **Smart Rate** | AI-powered pricing suggestions (Paid) | Optimize pricing strategy |
| **Quote Builder** | Create professional quotes (Elite) | Professional proposals |
| **Subscription** | Manage subscription plans | Upgrade for better features |
| **Profile** | Manage professional profile | Build professional presence |
| **Messages** | Communicate with clients | Client relationship management |
| **Settings** | Account preferences | Configure business settings |

### Key Permissions
- ✅ Create and manage service listings
- ✅ Accept and manage bookings
- ✅ Apply to job postings
- ✅ Track earnings and request payouts
- ✅ Access advanced features based on subscription tier
- ✅ Manage professional profile and portfolio
- ✅ Communicate with clients
- ✅ Create professional invoices and quotes
- ✅ Use AI-powered pricing suggestions
- ✅ Access performance analytics

### Subscription Tiers

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

---

## Agency Role

### Role Definition
**Business entities managing multiple providers** - Companies that coordinate teams of service providers.

### Primary Use Cases

#### 1. **Multi-Provider Business Management**
**Scenario**: "CleanPro Services" is a cleaning agency managing 15 cleaners across Metro Manila.

**User Journey**:
1. **Agency Setup**: Creates agency profile and sets up business structure
2. **Provider Recruitment**: Invites and manages team of cleaners
3. **Service Coordination**: Assigns jobs to appropriate team members
4. **Quality Control**: Monitors service delivery and client satisfaction
5. **Business Analytics**: Tracks agency performance and growth
6. **Client Management**: Handles large client accounts and contracts
7. **Financial Management**: Manages agency-wide payments and commissions

**Features Used**:
- Agency profile management
- Provider team management
- Centralized booking system
- Performance monitoring
- Business analytics
- Client relationship management
- Financial oversight

#### 2. **Large Project Coordination**
**Scenario**: "TechSolutions Agency" needs to coordinate multiple developers for a large web project.

**User Journey**:
1. **Project Planning**: Creates detailed job posting for complex project
2. **Team Assembly**: Recruits and assigns multiple developers
3. **Project Management**: Coordinates work between team members
4. **Client Communication**: Manages client relationship and updates
5. **Quality Assurance**: Reviews and approves deliverables
6. **Payment Processing**: Handles project payments and team compensation
7. **Project Completion**: Delivers final product and manages handover

**Features Used**:
- Job posting and management
- Team coordination tools
- Project tracking
- Client communication
- Quality control systems
- Payment management
- Deliverable management

#### 3. **Business Growth and Scaling**
**Scenario**: "HomeCare Plus" wants to expand from 5 to 20 providers.

**User Journey**:
1. **Growth Planning**: Analyzes current performance and growth opportunities
2. **Subscription Upgrade**: Upgrades to higher tier for more provider slots
3. **Provider Recruitment**: Actively recruits new team members
4. **Training and Onboarding**: Trains new providers on agency standards
5. **Market Expansion**: Expands service areas and categories
6. **Performance Monitoring**: Tracks growth metrics and provider performance
7. **Client Acquisition**: Uses enhanced features to attract larger clients

**Features Used**:
- Business analytics and reporting
- Provider management tools
- Subscription management
- Performance tracking
- Market analysis
- Client acquisition tools

### Accessible Modules

| Module | Description | Use Case |
|--------|-------------|----------|
| **Dashboard** | Agency overview and analytics | Monitor agency performance |
| **Bookings** | Manage all agency bookings | Coordinate team assignments |
| **Post a Job** | Create job postings | Find new projects and clients |
| **My Job Posts** | Manage job postings | Track project opportunities |
| **My Favorites** | Save preferred providers | Quick access to trusted partners |
| **Manage Providers** | Oversee agency providers | Team management and coordination |
| **Reports** | Agency performance analytics | Business intelligence and growth |
| **Earnings** | Track agency income | Financial performance monitoring |
| **Analytics** | Advanced business metrics | Strategic decision making |
| **Invoices** | Create and manage invoices | Professional billing and accounting |
| **Smart Rate** | AI-powered pricing suggestions | Competitive pricing strategy |
| **Quote Builder** | Create professional quotes | Professional proposals |
| **Subscription** | Manage agency subscription plans | Scale business operations |
| **Profile** | Manage agency profile | Build agency brand and reputation |
| **Messages** | Communicate with clients and providers | Team and client communication |
| **Settings** | Account preferences | Configure agency operations |

### Key Permissions
- ✅ Manage multiple service providers
- ✅ Create and manage job postings
- ✅ Oversee agency operations and performance
- ✅ Access advanced business analytics
- ✅ Manage agency-wide bookings and payments
- ✅ Create professional quotes and invoices
- ✅ Access all provider features plus agency-specific tools
- ✅ Coordinate team assignments and quality control
- ✅ Monitor provider performance and client satisfaction
- ✅ Scale business operations through subscription management

### Subscription Tiers

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

---

## Admin Role

### Role Definition
**Platform administrators with full system access** - Technical and business administrators managing the entire platform.

### Primary Use Cases

#### 1. **Platform Operations Management**
**Scenario**: Admin Sarah needs to monitor daily platform operations and handle user issues.

**User Journey**:
1. **Dashboard Review**: Checks system overview and key metrics
2. **User Management**: Reviews new user registrations and verifications
3. **Issue Resolution**: Handles user reports and disputes
4. **Content Moderation**: Reviews flagged content and takes action
5. **Financial Monitoring**: Reviews transactions and payout requests
6. **System Health**: Monitors platform performance and security
7. **Communication**: Sends platform updates and announcements

**Features Used**:
- System dashboard and analytics
- User account management
- Content moderation tools
- Financial oversight systems
- Security monitoring
- Communication tools

#### 2. **Financial Operations and Payout Management**
**Scenario**: Admin Michael needs to process weekly provider payouts and handle financial disputes.

**User Journey**:
1. **Payout Review**: Reviews pending payout requests from providers
2. **Verification Process**: Verifies provider earnings and account details
3. **Batch Processing**: Processes approved payouts in batches
4. **Dispute Resolution**: Handles payment disputes and refunds
5. **Financial Reporting**: Generates financial reports for management
6. **Audit Trail**: Maintains comprehensive audit logs
7. **Compliance Check**: Ensures regulatory compliance

**Features Used**:
- Payout management system
- Financial transaction monitoring
- Dispute resolution tools
- Audit logging
- Compliance tracking
- Financial reporting

#### 3. **System Configuration and Maintenance**
**Scenario**: Admin David needs to update platform settings and perform system maintenance.

**User Journey**:
1. **Settings Review**: Reviews current platform configuration
2. **Feature Updates**: Enables or disables platform features
3. **Category Management**: Updates service categories and pricing
4. **Subscription Management**: Manages subscription plans and pricing
5. **Backup Operations**: Performs system backups and data protection
6. **Security Updates**: Implements security patches and updates
7. **Performance Optimization**: Monitors and optimizes system performance

**Features Used**:
- System configuration tools
- Category and pricing management
- Subscription plan management
- Backup and recovery systems
- Security management
- Performance monitoring

### Accessible Modules

| Module | Description | Use Case |
|--------|-------------|----------|
| **Dashboard** | System overview and statistics | Monitor platform health |
| **Users** | Manage all user accounts | User lifecycle management |
| **Bookings** | Oversee all platform bookings | Platform-wide booking monitoring |
| **Jobs** | Manage job postings | Content and opportunity management |
| **Categories** | Manage service categories | Platform structure management |
| **Moderation** | Handle reports and disputes | Content and user moderation |
| **Payouts** | Process provider payments | Financial operations |
| **Subscriptions** | Manage subscription plans | Revenue and feature management |
| **Rewards** | Configure loyalty programs | User engagement programs |
| **Settings** | System configuration | Platform configuration |
| **Security Logs** | Monitor system security | Security and compliance |
| **Reports** | Platform analytics | Business intelligence |
| **Transactions** | Financial oversight | Financial monitoring |
| **Broadcast** | Send platform announcements | User communication |
| **Ads** | Manage advertising campaigns | Revenue and marketing |
| **Backup** | System backup management | Data protection |
| **Tickets** | Customer support management | User support |
| **Conversations** | Monitor user communications | Communication oversight |
| **Client Reports** | Client-specific analytics | Client relationship management |

### Key Permissions
- ✅ Full system access and control
- ✅ User account management and role assignment
- ✅ Financial oversight and payout processing
- ✅ Content moderation and dispute resolution
- ✅ System configuration and maintenance
- ✅ Analytics and reporting access
- ✅ Security monitoring and audit logs
- ✅ Platform-wide communication and announcements
- ✅ Subscription and pricing management
- ✅ Data backup and recovery operations

### Security Features
- **Two-Factor Authentication (2FA)**: Required for critical operations
- **Session Management**: Advanced session tracking and management
- **Rate Limiting**: Prevents abuse of admin functions
- **Audit Logging**: Comprehensive logging of all admin actions
- **Activity Monitoring**: Real-time monitoring of admin activities
- **Security Notifications**: Automated alerts for security events

---

## Partner Role

### Role Definition
**Business partners and affiliates** - External partners who refer users and earn commissions.

### Primary Use Cases

#### 1. **Referral Program Management**
**Scenario**: Partner "TechBlog Philippines" refers their audience to the platform.

**User Journey**:
1. **Partner Onboarding**: Sets up partner account and receives referral links
2. **Content Creation**: Creates content promoting the platform
3. **Referral Tracking**: Monitors referral performance and conversions
4. **Commission Tracking**: Tracks earned commissions and payments
5. **Performance Analysis**: Analyzes which content drives most referrals
6. **Optimization**: Adjusts strategy based on performance data
7. **Payment Processing**: Receives commission payments

**Features Used**:
- Partner dashboard and analytics
- Referral tracking system
- Commission management
- Performance analytics
- Payment processing

#### 2. **Business Development Partnership**
**Scenario**: Partner "Business Solutions Inc" provides enterprise clients to the platform.

**User Journey**:
1. **Partnership Setup**: Establishes formal partnership agreement
2. **Client Referral**: Refers enterprise clients to the platform
3. **Relationship Management**: Maintains relationships with referred clients
4. **Performance Monitoring**: Tracks client success and satisfaction
5. **Commission Management**: Manages commission structure and payments
6. **Growth Planning**: Plans expansion of partnership activities
7. **Reporting**: Provides regular performance reports

**Features Used**:
- Partner analytics and reporting
- Client relationship tracking
- Commission management
- Performance monitoring
- Business intelligence tools

### Accessible Modules

| Module | Description | Use Case |
|--------|-------------|----------|
| **Partners Dashboard** | Partner-specific analytics | Monitor referral performance |
| **Profile** | Manage partner information | Update business details |
| **Settings** | Account preferences | Configure notifications and preferences |

### Key Permissions
- ✅ Access partner-specific features
- ✅ View partner analytics and performance
- ✅ Manage partner profile and settings
- ✅ Track referral performance
- ✅ Monitor commission earnings
- ✅ Access partner reporting tools

### Partner Analytics Features
- **Referral Tracking**: Monitor referred users and conversions
- **Commission Management**: Track earned commissions and payments
- **Performance Metrics**: Analyze referral success rates
- **Conversion Analytics**: Track user journey from referral to conversion
- **Monthly Statistics**: Historical performance data
- **Growth Metrics**: Track partnership growth over time

---

## Role Comparison Matrix

| Feature | Client | Provider | Agency | Admin | Partner |
|---------|--------|----------|--------|-------|---------|
| **Browse Services** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Book Services** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Post Jobs** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Apply to Jobs** | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Manage Services** | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Manage Providers** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Process Payouts** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **User Management** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **System Settings** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Analytics** | Basic | Advanced* | Advanced | Full | Partner |
| **Messaging** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Profile Management** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Subscription Management** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Referral Tracking** | ❌ | ❌ | ❌ | ❌ | ✅ |

*Advanced analytics available with paid subscription plans

---

## Security and Access Control

### Authentication System
- **Multi-role Authentication**: Firebase Auth with role-based access control
- **JWT Token Validation**: Server-side token verification in middleware
- **Session Management**: Secure session handling with automatic expiration
- **Two-Factor Authentication**: Available for admin and sensitive operations

### Route Protection
- **Middleware Protection**: Server-side route protection based on user roles
- **Client-side Guards**: React components for role-based UI rendering
- **Database Rules**: Firestore security rules for data access control
- **Storage Rules**: Firebase Storage rules for file access control

### Security Features by Role

#### **Client Security**
- Rate limiting for booking creation and messaging
- Secure payment processing
- Profile data protection
- Communication encryption

#### **Provider Security**
- Service listing protection
- Earnings data security
- Payout request validation
- Portfolio and document security

#### **Agency Security**
- Provider management security
- Business data protection
- Team coordination security
- Financial data encryption

#### **Admin Security**
- Two-factor authentication requirement
- Comprehensive audit logging
- Session management and monitoring
- Rate limiting for admin operations
- Security event notifications

#### **Partner Security**
- Referral link security
- Commission data protection
- Performance data privacy
- Partner profile security

---

## Subscription Tiers and Feature Access

### Provider Subscription Plans

#### **Free Plan** (₱0/month)
- Basic Profile
- Accept Bookings
- Standard Commission Rate (15%)

#### **Pro Plan** (₱499/month)
- Enhanced Profile Visibility
- Access to Quote Builder
- Access to Invoicing Tool
- Lower Commission Rate (12%)
- Basic Analytics

#### **Elite Plan** (₱999/month)
- All Pro features
- Top placement in search results
- Advanced Analytics Suite
- Dedicated Support
- Lowest Commission Rate (10%)

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

### Feature Access Matrix

| Feature | Free | Pro | Elite | Agency Lite | Agency Pro | Agency Custom |
|---------|------|-----|-------|-------------|------------|---------------|
| **Basic Profile** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Accept Bookings** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Enhanced Visibility** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Quote Builder** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Invoicing** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Advanced Analytics** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Top Search Placement** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Dedicated Support** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Provider Management** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Agency Reports** | ❌ | ❌ | ❌ | Basic | Advanced | Advanced |
| **API Access** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Account Manager** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Conclusion

Lingkod PH's role-based system provides a comprehensive platform for different types of users, each with specific needs and use cases. The platform's architecture ensures security, scalability, and user experience while supporting the diverse requirements of clients, providers, agencies, administrators, and partners.

The subscription-based model allows for business growth and feature access based on user needs, while the security implementation ensures data protection and platform integrity across all roles.

This documentation serves as a comprehensive guide for understanding the platform's capabilities, user journeys, and feature access for each role in the Lingkod PH ecosystem.
