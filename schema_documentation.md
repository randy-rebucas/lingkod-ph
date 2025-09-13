# LocalPro Service Marketplace - PostgreSQL Schema Documentation

## Overview

LocalPro is a service marketplace platform that connects clients with service providers. The platform supports various user roles (clients, providers, agencies, admins), job posting and application systems, booking management, payment processing, and comprehensive business features.

## Database Architecture

### Core Entities

#### 1. Users (`users`)
The central entity representing all platform users with different roles:
- **Primary Key**: `uid` (UUID)
- **Roles**: client, provider, agency, admin, partner
- **Key Features**: 
  - Role-based access control
  - Agency-provider relationships
  - Loyalty points system
  - Referral tracking
  - Verification status

#### 2. Categories (`categories`)
Service categories for organizing jobs and services:
- **Primary Key**: `id` (UUID)
- **Features**: Hierarchical organization, active/inactive status, sort ordering

#### 3. Services (`services`)
Services offered by providers:
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `user_id` → `users(uid)`, `category_id` → `categories(id)`
- **Features**: Pricing, status management, categorization

#### 4. Jobs (`jobs`)
Job postings by clients:
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `client_id` → `users(uid)`, `category_id` → `categories(id)`
- **Features**: Budget management, location tracking, status workflow

## Business Workflows

### 1. Job Application Process
```
Client posts job → Providers apply → Client reviews applications → Client awards job → Booking created
```

**Related Tables**:
- `jobs` - Job postings
- `job_applications` - Provider applications
- `bookings` - Confirmed appointments

### 2. Service Booking Process
```
Client browses services → Client books service → Provider confirms → Service completed → Review submitted
```

**Related Tables**:
- `services` - Available services
- `bookings` - Service appointments
- `reviews` - Client feedback

### 3. Payment and Subscription System
```
User subscribes to plan → Payment processed → Subscription activated → Monthly renewal
```

**Related Tables**:
- `subscriptions` - Available plans
- `user_subscriptions` - User subscription status
- `transactions` - Payment records

### 4. Payout System
```
Provider completes services → Provider requests payout → Admin processes → Payment sent
```

**Related Tables**:
- `bookings` - Completed services
- `payouts` - Payout requests
- `audit_logs` - Payment tracking

## Key Relationships

### User Hierarchy
```
Admin
├── Agencies
│   └── Providers (under agencies)
└── Providers (independent)
└── Clients
```

### Booking Relationships
```
Client → Job → Provider
Client → Service → Provider
```

### Communication Flow
```
Users ↔ Conversations ↔ Messages
Users ↔ Notifications
```

## Advanced Features

### 1. Loyalty System
- **Points earning**: Service completion, referrals
- **Points redemption**: Discounts, free services
- **Tracking**: `loyalty_transactions` table

### 2. Referral System
- **Referral codes**: Unique codes for user acquisition
- **Rewards**: Points for successful referrals
- **Tracking**: `referrals` table

### 3. Agency Management
- **Provider management**: Agencies can manage multiple providers
- **Revenue sharing**: Agency commission tracking
- **Reporting**: Agency-specific analytics

### 4. Communication System
- **Real-time messaging**: Conversations and messages
- **Notifications**: System-wide notification system
- **Email integration**: Transactional emails

## Data Integrity

### Constraints
- **Foreign Key Constraints**: Maintain referential integrity
- **Check Constraints**: Validate enum values and data ranges
- **Unique Constraints**: Prevent duplicate data
- **NOT NULL Constraints**: Ensure required data

### Triggers
- **Updated Timestamps**: Automatic `updated_at` field updates
- **Audit Logging**: Track important system changes

## Performance Optimization

### Indexes
- **Primary Keys**: All tables have UUID primary keys
- **Foreign Keys**: Indexed for join performance
- **Status Fields**: Indexed for filtering
- **Search Fields**: Email, names, etc.
- **GIN Indexes**: For array and JSONB fields

### Query Optimization
- **Composite Indexes**: For common query patterns
- **Partial Indexes**: For active records only
- **Covering Indexes**: Include frequently accessed columns

## Security Considerations

### Data Protection
- **UUID Primary Keys**: Prevent enumeration attacks
- **Role-based Access**: User roles control permissions
- **Audit Logging**: Track all important changes
- **Soft Deletes**: Preserve data integrity

### Access Control
- **User Isolation**: Users can only access their own data
- **Admin Oversight**: Administrative access for moderation
- **Agency Boundaries**: Agency users see only their providers

## Scalability Features

### Horizontal Scaling
- **UUID Primary Keys**: Support distributed systems
- **Timestamp Fields**: Enable time-based partitioning
- **JSONB Fields**: Flexible schema evolution

### Vertical Scaling
- **Efficient Indexes**: Optimize query performance
- **Normalized Design**: Reduce data redundancy
- **Proper Constraints**: Maintain data quality

## Migration Considerations

### From Firestore
This schema is designed to replace a Firestore NoSQL database with a relational PostgreSQL database:

**Key Changes**:
- **Collections → Tables**: Firestore collections become PostgreSQL tables
- **Documents → Rows**: Firestore documents become table rows
- **Subcollections → Foreign Keys**: Nested data becomes related tables
- **Array Fields → Junction Tables**: Arrays become separate tables with foreign keys

### Data Migration Strategy
1. **Export Firestore Data**: Use backup functionality
2. **Transform Data**: Convert NoSQL structure to relational
3. **Import to PostgreSQL**: Bulk insert with proper constraints
4. **Verify Integrity**: Check foreign key relationships
5. **Update Application**: Modify application code for PostgreSQL

## Monitoring and Maintenance

### Performance Monitoring
- **Query Performance**: Monitor slow queries
- **Index Usage**: Track index effectiveness
- **Connection Pooling**: Manage database connections
- **Backup Strategy**: Regular automated backups

### Data Maintenance
- **Archiving**: Move old data to archive tables
- **Cleanup**: Remove orphaned records
- **Optimization**: Regular VACUUM and ANALYZE
- **Updates**: Keep statistics current

## Business Intelligence

### Key Metrics
- **Revenue Tracking**: Service bookings and payments
- **User Engagement**: Active users and retention
- **Service Performance**: Popular services and categories
- **Provider Performance**: Ratings and completion rates

### Reporting Tables
- **Analytics Views**: Pre-computed aggregations
- **Audit Logs**: Complete change history
- **Transaction Logs**: Financial tracking
- **User Activity**: Engagement metrics

## Conclusion

This PostgreSQL schema provides a robust, scalable foundation for the LocalPro service marketplace platform. It supports all current features while maintaining flexibility for future enhancements. The relational design ensures data integrity, performance, and maintainability for a production environment.
