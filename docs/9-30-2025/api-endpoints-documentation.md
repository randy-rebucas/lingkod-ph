# LocalPro - API Endpoints Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the LocalPro application. The API follows RESTful conventions and implements role-based access control with comprehensive security measures.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Rate Limiting](#rate-limiting)
3. [Audit Logging](#audit-logging)
4. [API Endpoints by Category](#api-endpoints-by-category)
5. [Error Handling](#error-handling)
6. [Request/Response Formats](#requestresponse-formats)

---

## Authentication & Authorization

### JWT Token Authentication
All API endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Role-Based Access Control
Each endpoint is protected by role-based access control:

- **Client**: Service consumers
- **Provider**: Individual service providers  
- **Agency**: Business entities managing multiple providers
- **Admin**: Platform administrators
- **Partner**: Business partners and affiliates

### Security Features
- **Server-side validation**: All tokens are validated server-side
- **Role verification**: User roles are verified for each request
- **Audit logging**: All API calls are logged for security monitoring
- **Rate limiting**: Prevents abuse and ensures fair usage

---

## Rate Limiting

### Rate Limit Configuration
The application implements comprehensive rate limiting with different limits for different operations:

```typescript
// Rate limits by operation type
const rateLimiters = {
  general: new RateLimiter({
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 100            // 100 requests per minute
  }),
  
  bookingCreation: new RateLimiter({
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 5              // 5 bookings per minute
  }),
  
  messaging: new RateLimiter({
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 30             // 30 messages per minute
  }),
  
  jobApplications: new RateLimiter({
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 10             // 10 job applications per minute
  }),
  
  auth: new RateLimiter({
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 5              // 5 auth attempts per minute
  })
};
```

### Rate Limit Headers
All API responses include rate limiting headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "message": "Too many requests. Please try again later."
}
```

---

## Audit Logging

### Comprehensive Logging
All API endpoints implement comprehensive audit logging:

```typescript
// Example audit logging implementation
await auditLogger.logBookingCreation(
  userId,
  userRole,
  bookingId,
  {
    serviceId,
    providerId,
    amount,
    date,
    time
  }
);
```

### Logged Events
- **Authentication**: Login attempts, token validation
- **Booking Operations**: Creation, updates, cancellations
- **Job Applications**: Application submissions, status changes
- **Payment Operations**: Payment attempts, verifications
- **User Management**: Profile updates, role changes
- **Security Events**: Unauthorized access attempts, suspicious activity

### Log Structure
```typescript
interface AuditLogEntry {
  id: string;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  timestamp: Timestamp;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
}
```

---

## API Endpoints by Category

### Job Management Endpoints

#### Apply to Job
**Endpoint**: `POST /api/jobs/apply`

**Purpose**: Allows providers to apply to job postings created by clients or agencies.

**Authentication**: Required (Provider role)

**Rate Limiting**: 10 requests per minute

**Request Body**:
```json
{
  "jobId": "string",
  "providerId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "applicationId": "string",
  "message": "Application submitted successfully"
}
```

**Implementation Details**:
- Validates provider role and job existence
- Checks if job is still open for applications
- Prevents duplicate applications
- Logs application submission for audit trail

**Error Responses**:
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User doesn't have provider role
- `404 Not Found`: Job doesn't exist or is closed
- `409 Conflict`: Application already exists
- `429 Too Many Requests`: Rate limit exceeded

---

### Booking Management Endpoints

#### Create Booking
**Endpoint**: `POST /api/bookings`

**Purpose**: Creates a new service booking between client and provider.

**Authentication**: Required (Client role)

**Rate Limiting**: 5 requests per minute

**Request Body**:
```json
{
  "serviceId": "string",
  "providerId": "string",
  "date": "2024-01-15",
  "time": "10:00",
  "duration": 120,
  "notes": "string",
  "address": {
    "street": "string",
    "city": "string",
    "postalCode": "string"
  }
}
```

**Response**:
```json
{
  "success": true,
  "booking": {
    "id": "string",
    "serviceId": "string",
    "providerId": "string",
    "clientId": "string",
    "status": "pending",
    "date": "2024-01-15",
    "time": "10:00",
    "duration": 120,
    "totalAmount": 1500,
    "createdAt": "2024-01-10T08:00:00Z"
  }
}
```

**Implementation Details**:
- Validates client role and service availability
- Checks provider availability for requested time slot
- Calculates total amount including taxes and fees
- Creates booking record in Firestore
- Sends notifications to provider
- Logs booking creation for audit trail

---

### Payment Processing Endpoints

#### Process GCash Payment
**Endpoint**: `POST /api/payments/gcash/create`

**Purpose**: Initiates GCash payment processing through Adyen integration.

**Authentication**: Required (Client role)

**Rate Limiting**: 10 requests per minute

**Request Body**:
```json
{
  "bookingId": "string",
  "amount": 1500,
  "currency": "PHP"
}
```

**Response**:
```json
{
  "success": true,
  "paymentSession": {
    "sessionId": "string",
    "paymentUrl": "string",
    "expiresAt": "2024-01-10T09:00:00Z"
  }
}
```

**Implementation Details**:
- Validates booking and payment amount
- Creates Adyen payment session
- Generates secure payment URL
- Logs payment initiation
- Handles payment session expiration

---

### Admin Management Endpoints

#### Secure Admin Action
**Endpoint**: `POST /api/admin/secure-action`

**Purpose**: Handles secure administrative operations with enhanced security.

**Authentication**: Required (Admin role with 2FA)

**Rate Limiting**: 50 requests per minute

**Request Body**:
```json
{
  "action": "financial",
  "operation": "verify_payment",
  "data": {
    "bookingId": "string",
    "action": "approve",
    "reason": "string"
  }
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "status": "approved",
    "transactionId": "string",
    "processedAt": "2024-01-10T08:00:00Z"
  }
}
```

**Implementation Details**:
- Requires admin role with two-factor authentication
- Validates action type and operation
- Implements additional security checks
- Logs all admin actions with high severity
- Sends notifications for critical operations

---

## Error Handling

### Standard Error Response Format
All API endpoints follow a consistent error response format:

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
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate application) |
| `PAYMENT_ERROR` | 402 | Payment processing error |

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

## Request/Response Formats

### Request Headers
All API requests should include:

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
User-Agent: LocalPro-Client/1.0
```

### Response Headers
All API responses include:

```http
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-Request-ID: uuid-v4
```

### Pagination
For endpoints that return lists, pagination is supported:

**Request**:
```http
GET /api/bookings?page=1&limit=10&status=active
```

**Response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Filtering and Sorting
Many endpoints support filtering and sorting:

**Request**:
```http
GET /api/services?category=cleaning&location=Makati&sortBy=rating&sortOrder=desc
```

**Response**:
```json
{
  "success": true,
  "data": [...],
  "filters": {
    "category": "cleaning",
    "location": "Makati"
  },
  "sorting": {
    "sortBy": "rating",
    "sortOrder": "desc"
  }
}
```

---

## Security Considerations

### Input Validation
- All input data is validated using Zod schemas
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization
- File upload validation for type and size

### Authentication Security
- JWT tokens with short expiration times
- Refresh token mechanism for long-term sessions
- Two-factor authentication for admin operations
- Session management with secure cookies

### Data Protection
- Sensitive data encryption at rest and in transit
- PII data masking in logs
- Secure file storage with access controls
- Database security rules and access controls

### Monitoring and Alerting
- Real-time security event monitoring
- Automated alerts for suspicious activity
- Performance monitoring and alerting
- Error tracking and reporting

---

## Development Guidelines

### Adding New Endpoints
1. **Define the route**: Create the route file in appropriate directory
2. **Implement authentication**: Add role-based access control
3. **Add rate limiting**: Configure appropriate rate limits
4. **Implement validation**: Use Zod schemas for input validation
5. **Add audit logging**: Log all operations for security
6. **Handle errors**: Implement comprehensive error handling
7. **Write tests**: Create unit and integration tests
8. **Update documentation**: Document the new endpoint

### Best Practices
1. **Consistent naming**: Use RESTful naming conventions
2. **Proper HTTP methods**: Use appropriate HTTP methods (GET, POST, PUT, DELETE)
3. **Status codes**: Return appropriate HTTP status codes
4. **Error messages**: Provide clear, actionable error messages
5. **Performance**: Optimize for performance and scalability
6. **Security**: Implement security best practices
7. **Testing**: Maintain high test coverage
8. **Documentation**: Keep documentation up to date

---

This documentation provides comprehensive coverage of the LocalPro API endpoints. For specific implementation details, refer to the source code and related documentation files.
