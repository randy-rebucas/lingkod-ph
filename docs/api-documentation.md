# Lingkod PH - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Role-Based Endpoints](#role-based-endpoints)
4. [Client API Endpoints](#client-api-endpoints)
5. [Provider API Endpoints](#provider-api-endpoints)
6. [Agency API Endpoints](#agency-api-endpoints)
7. [Admin API Endpoints](#admin-api-endpoints)
8. [Partner API Endpoints](#partner-api-endpoints)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## Overview

The Lingkod PH API provides role-based access to platform functionality through RESTful endpoints. All API requests require authentication and are subject to role-based access control.

### Base URL
```
Production: https://lingkod-ph.com/api
Development: http://localhost:9002/api
```

### API Version
Current version: `v1`

### Content Type
All requests and responses use `application/json`

---

## Authentication

### Authentication Methods

#### 1. JWT Token Authentication
All API requests require a valid JWT token in the Authorization header.

```http
Authorization: Bearer <jwt_token>
```

#### 2. Role-Based Access Control
Each endpoint is protected by role-based access control. Users can only access endpoints appropriate to their role.

**Available Roles:**
- `client` - Service consumers
- `provider` - Individual service providers
- `agency` - Business entities managing multiple providers
- `admin` - Platform administrators
- `partner` - Business partners and affiliates

### Token Refresh
JWT tokens expire after 24 hours. Use the refresh endpoint to obtain a new token.

```http
POST /api/auth/refresh
```

---

## Role-Based Endpoints

### Endpoint Access Matrix

| Endpoint Category | Client | Provider | Agency | Admin | Partner |
|-------------------|--------|----------|--------|-------|---------|
| **Authentication** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Profile Management** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Service Discovery** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Booking Management** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Job Management** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Provider Management** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Financial Operations** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Analytics** | Basic | Advanced* | Advanced | Full | Partner |
| **Admin Operations** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Partner Operations** | ❌ | ❌ | ❌ | ❌ | ✅ |

*Advanced analytics require paid subscription

---

## Client API Endpoints

### Authentication Endpoints

#### Register Client
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "client@example.com",
  "password": "securepassword",
  "role": "client",
  "firstName": "Maria",
  "lastName": "Santos",
  "phone": "+639123456789"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "user123",
    "email": "client@example.com",
    "role": "client",
    "firstName": "Maria",
    "lastName": "Santos"
  },
  "token": "jwt_token_here"
}
```

#### Login Client
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "client@example.com",
  "password": "securepassword"
}
```

### Service Discovery Endpoints

#### Search Services
```http
GET /api/services/search?query=house+cleaning&location=Makati&category=cleaning&priceMin=500&priceMax=2000
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "id": "service123",
      "title": "House Cleaning Service",
      "description": "Professional house cleaning...",
      "price": 1500,
      "provider": {
        "id": "provider123",
        "name": "CleanPro Services",
        "rating": 4.8,
        "reviewCount": 150
      },
      "category": "cleaning",
      "location": "Makati"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

#### Get Service Details
```http
GET /api/services/{serviceId}
Authorization: Bearer <jwt_token>
```

### Booking Management Endpoints

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "serviceId": "service123",
  "providerId": "provider123",
  "date": "2024-01-15",
  "time": "10:00",
  "duration": 120,
  "notes": "Focus on kitchen and living room",
  "address": {
    "street": "123 Ayala Avenue",
    "city": "Makati",
    "postalCode": "1226"
  }
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "booking123",
    "serviceId": "service123",
    "providerId": "provider123",
    "clientId": "client123",
    "status": "pending",
    "date": "2024-01-15",
    "time": "10:00",
    "duration": 120,
    "totalAmount": 1500,
    "createdAt": "2024-01-10T08:00:00Z"
  }
}
```

#### Get Client Bookings
```http
GET /api/bookings?status=active&page=1&limit=10
Authorization: Bearer <jwt_token>
```

#### Update Booking
```http
PUT /api/bookings/{bookingId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "date": "2024-01-16",
  "time": "14:00",
  "notes": "Updated notes"
}
```

#### Cancel Booking
```http
DELETE /api/bookings/{bookingId}
Authorization: Bearer <jwt_token>
```

### Job Management Endpoints

#### Create Job Posting
```http
POST /api/jobs
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Kitchen Renovation Project",
  "description": "Complete kitchen renovation including cabinets, countertops, and appliances",
  "category": "renovation",
  "budget": {
    "min": 50000,
    "max": 80000
  },
  "timeline": "2-3 months",
  "location": "Quezon City",
  "requirements": [
    "Licensed contractor",
    "5+ years experience",
    "Portfolio of similar projects"
  ]
}
```

#### Get Job Applications
```http
GET /api/jobs/{jobId}/applications
Authorization: Bearer <jwt_token>
```

#### Accept Job Application
```http
POST /api/jobs/{jobId}/applications/{applicationId}/accept
Authorization: Bearer <jwt_token>
```

### Review and Rating Endpoints

#### Submit Review
```http
POST /api/reviews
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "bookingId": "booking123",
  "providerId": "provider123",
  "rating": 5,
  "comment": "Excellent service! Very professional and thorough."
}
```

---

## Provider API Endpoints

### Service Management Endpoints

#### Create Service
```http
POST /api/services
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Professional House Cleaning",
  "description": "Complete house cleaning service including all rooms",
  "category": "cleaning",
  "price": 1500,
  "duration": 120,
  "location": "Metro Manila",
  "requirements": "Access to water and electricity"
}
```

#### Update Service
```http
PUT /api/services/{serviceId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "price": 1800,
  "description": "Updated description with additional services"
}
```

#### Get Provider Services
```http
GET /api/services/provider
Authorization: Bearer <jwt_token>
```

### Booking Management Endpoints

#### Get Provider Bookings
```http
GET /api/bookings/provider?status=pending&page=1&limit=10
Authorization: Bearer <jwt_token>
```

#### Accept Booking
```http
POST /api/bookings/{bookingId}/accept
Authorization: Bearer <jwt_token>
```

#### Complete Booking
```http
POST /api/bookings/{bookingId}/complete
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "workLog": "Completed all cleaning tasks as requested",
  "photos": ["photo1.jpg", "photo2.jpg"],
  "notes": "Client was very satisfied with the service"
}
```

### Job Application Endpoints

#### Apply to Job
```http
POST /api/jobs/{jobId}/apply
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "proposal": "I have 5+ years experience in kitchen renovations...",
  "timeline": "2 months",
  "price": 65000,
  "portfolio": ["project1.jpg", "project2.jpg"]
}
```

#### Get Applied Jobs
```http
GET /api/jobs/applied?status=pending&page=1&limit=10
Authorization: Bearer <jwt_token>
```

### Financial Endpoints

#### Get Earnings
```http
GET /api/earnings?period=monthly&year=2024&month=1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "earnings": {
    "totalEarnings": 25000,
    "completedBookings": 15,
    "averageBookingValue": 1667,
    "commission": 3750,
    "netEarnings": 21250,
    "period": "2024-01"
  }
}
```

#### Request Payout
```http
POST /api/payouts/request
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 10000,
  "method": "bank_transfer",
  "accountDetails": {
    "bankName": "BDO",
    "accountNumber": "1234567890",
    "accountName": "John Doe"
  }
}
```

### Analytics Endpoints (Paid Plans)

#### Get Performance Analytics
```http
GET /api/analytics/performance?period=monthly&year=2024&month=1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "bookings": {
      "total": 15,
      "completed": 14,
      "cancelled": 1,
      "completionRate": 93.3
    },
    "revenue": {
      "total": 25000,
      "growth": 15.5,
      "averagePerBooking": 1667
    },
    "ratings": {
      "average": 4.8,
      "total": 14,
      "distribution": {
        "5": 12,
        "4": 2,
        "3": 0,
        "2": 0,
        "1": 0
      }
    }
  }
}
```

---

## Agency API Endpoints

### Provider Management Endpoints

#### Invite Provider
```http
POST /api/agency/providers/invite
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": "provider@example.com",
  "role": "provider",
  "message": "Join our agency team!"
}
```

#### Get Agency Providers
```http
GET /api/agency/providers?status=active&page=1&limit=10
Authorization: Bearer <jwt_token>
```

#### Update Provider Status
```http
PUT /api/agency/providers/{providerId}/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "active",
  "notes": "Provider performance improved"
}
```

### Agency Analytics Endpoints

#### Get Agency Dashboard Data
```http
GET /api/agency/dashboard?period=monthly&year=2024&month=1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "overview": {
      "totalProviders": 8,
      "activeProviders": 7,
      "totalBookings": 45,
      "totalRevenue": 75000
    },
    "performance": {
      "completionRate": 95.6,
      "averageRating": 4.7,
      "clientSatisfaction": 92.3
    },
    "growth": {
      "monthlyGrowth": 12.5,
      "providerGrowth": 2,
      "revenueGrowth": 18.3
    }
  }
}
```

#### Get Provider Performance Report
```http
GET /api/agency/reports/providers?providerId=provider123&period=monthly
Authorization: Bearer <jwt_token>
```

---

## Admin API Endpoints

### User Management Endpoints

#### Get All Users
```http
GET /api/admin/users?role=provider&status=active&page=1&limit=20
Authorization: Bearer <jwt_token>
```

#### Create User
```http
POST /api/admin/users
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role": "provider",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+639123456789"
}
```

#### Update User
```http
PUT /api/admin/users/{userId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "role": "agency",
  "accountStatus": "active"
}
```

#### Delete User
```http
DELETE /api/admin/users/{userId}
Authorization: Bearer <jwt_token>
```

### Financial Management Endpoints

#### Process Payout
```http
POST /api/admin/payouts/{payoutId}/process
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "approved",
  "notes": "Payout approved and processed"
}
```

#### Get Financial Reports
```http
GET /api/admin/reports/financial?period=monthly&year=2024&month=1
Authorization: Bearer <jwt_token>
```

### System Management Endpoints

#### Get System Statistics
```http
GET /api/admin/statistics
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "users": {
      "total": 1500,
      "clients": 800,
      "providers": 500,
      "agencies": 50,
      "partners": 10
    },
    "bookings": {
      "total": 5000,
      "completed": 4800,
      "pending": 150,
      "cancelled": 50
    },
    "revenue": {
      "total": 2500000,
      "monthly": 150000,
      "commission": 375000
    }
  }
}
```

#### Send Broadcast Message
```http
POST /api/admin/broadcast
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Platform Maintenance Notice",
  "message": "Scheduled maintenance on Sunday 2AM-4AM",
  "targetRoles": ["provider", "agency"],
  "priority": "high"
}
```

---

## Partner API Endpoints

### Partner Analytics Endpoints

#### Get Partner Dashboard
```http
GET /api/partner/dashboard?period=monthly&year=2024&month=1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "referrals": {
      "total": 150,
      "active": 45,
      "converted": 25
    },
    "commissions": {
      "total": 5000,
      "pending": 500,
      "paid": 4500
    },
    "performance": {
      "conversionRate": 16.7,
      "averageCommission": 200,
      "monthlyGrowth": 8.5
    }
  }
}
```

#### Get Referral Performance
```http
GET /api/partner/referrals?period=monthly&year=2024&month=1
Authorization: Bearer <jwt_token>
```

---

## Error Handling

### Error Response Format
All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions for the requested action |
| `NOT_FOUND` | 404 | Requested resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Role-Based Error Handling
When a user attempts to access an endpoint they don't have permission for:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied. This endpoint requires 'admin' role.",
    "details": {
      "requiredRole": "admin",
      "userRole": "provider"
    }
  }
}
```

---

## Rate Limiting

### Rate Limit Headers
All API responses include rate limiting headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limits by Role

| Role | General API | Booking Creation | Messaging | Admin Operations |
|------|-------------|------------------|-----------|------------------|
| **Client** | 100/min | 5/min | 30/min | N/A |
| **Provider** | 100/min | 10/min | 30/min | N/A |
| **Agency** | 100/min | 20/min | 30/min | N/A |
| **Admin** | 200/min | N/A | 50/min | 50/min |
| **Partner** | 50/min | N/A | N/A | N/A |

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetTime": 1640995200
    }
  }
}
```

---

## Best Practices

### Authentication
- Always include the JWT token in the Authorization header
- Handle token expiration gracefully
- Use HTTPS in production

### Error Handling
- Check the `success` field in all responses
- Handle different error codes appropriately
- Implement retry logic for transient errors

### Rate Limiting
- Monitor rate limit headers
- Implement exponential backoff for retries
- Cache responses when appropriate

### Security
- Never expose API keys in client-side code
- Validate all input data
- Use role-based access control consistently

---

This API documentation provides comprehensive information about all available endpoints, authentication methods, and best practices for integrating with the Lingkod PH platform.
