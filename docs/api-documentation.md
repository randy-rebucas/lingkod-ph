# API Documentation - LocalPro

This document provides comprehensive documentation for all API endpoints in the LocalPro platform.

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Payment APIs](#payment-apis)
4. [Admin APIs](#admin-apis)
5. [Notification APIs](#notification-apis)
6. [Webhook APIs](#webhook-apis)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## API Overview

The LocalPro API is built using Next.js API routes and provides RESTful endpoints for all platform functionality.

**Base URL:** `https://your-domain.com/api`

**Content Type:** `application/json`

**Authentication:** Bearer token in Authorization header

---

## Authentication

### Authentication Methods

**Bearer Token Authentication:**
```http
Authorization: Bearer <firebase_id_token>
```

**Token Validation:**
- All protected endpoints require valid Firebase ID token
- Tokens are validated using Firebase Admin SDK
- Expired tokens return 401 Unauthorized

---

## Payment APIs

### Maya Payment Integration

#### Create Maya Checkout Session

**Endpoint:** `POST /api/payments/maya/checkout`

**Description:** Creates a new Maya checkout session for payments

**Request Body:**
```json
{
  "bookingId": "string", // Required for booking payments
  "planId": "string",    // Required for subscription payments
  "amount": "number",    // Required - payment amount
  "type": "string"       // Required - "booking" or "subscription"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutId": "string",
    "checkoutUrl": "string",
    "expiresAt": "string"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Payment service error

#### Get Payment Status

**Endpoint:** `GET /api/payments/maya/status`

**Description:** Retrieves the status of a Maya payment

**Query Parameters:**
- `checkoutId` (required): Maya checkout ID

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutId": "string",
    "status": "string",
    "amount": "number",
    "currency": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

#### Maya Webhook

**Endpoint:** `POST /api/payments/maya/webhook`

**Description:** Handles Maya payment webhook notifications

**Headers:**
- `x-maya-signature`: Webhook signature for verification
- `x-forwarded-for`: Client IP address

**Request Body:** Maya webhook payload

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**Security Features:**
- IP address verification
- Signature validation
- Environment-specific configurations

#### Maya Webhook Debug

**Endpoint:** `POST /api/payments/maya/webhook/debug`

**Description:** Debug endpoint for testing Maya webhook integration

**Response:**
```json
{
  "success": true,
  "message": "Debug webhook processed",
  "data": {
    "headers": {},
    "body": {},
    "timestamp": "string"
  }
}
```

#### Maya Webhook Test

**Endpoint:** `GET /api/payments/maya/webhook/test`

**Description:** Test endpoint to verify webhook accessibility

**Response:**
```json
{
  "success": true,
  "message": "Maya webhook endpoint is accessible",
  "timestamp": "string",
  "environment": "string",
  "webhookUrl": "string"
}
```

### PayPal Integration

#### PayPal Webhook

**Endpoint:** `POST /api/payments/paypal/webhook`

**Description:** Handles PayPal payment webhook notifications

**Headers:**
- `paypal-transmission-id`: PayPal transmission ID
- `paypal-cert-id`: PayPal certificate ID
- `paypal-transmission-sig`: PayPal transmission signature
- `paypal-transmission-time`: PayPal transmission time

**Request Body:** PayPal webhook payload

**Response:**
```json
{
  "success": true,
  "message": "PayPal webhook processed successfully"
}
```

---

## Admin APIs

### Secure Admin Actions

**Endpoint:** `POST /api/admin/secure-action`

**Description:** Handles secure admin actions with enhanced security

**Headers:**
- `Authorization`: Bearer token (admin role required)
- `X-Admin-Action`: Action type identifier

**Request Body:**
```json
{
  "action": "string",
  "data": {},
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": {}
}
```

**Security Features:**
- Admin role verification
- Action logging and audit trail
- Rate limiting and abuse prevention
- Input validation and sanitization

---

## Notification APIs

### Notification History

**Endpoint:** `GET /api/notifications/history`

**Description:** Retrieves notification history for a user

**Query Parameters:**
- `userId` (required): User ID
- `limit` (optional): Number of notifications to return
- `offset` (optional): Offset for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "string",
        "type": "string",
        "title": "string",
        "message": "string",
        "read": "boolean",
        "createdAt": "string"
      }
    ],
    "total": "number",
    "hasMore": "boolean"
  }
}
```

### Test Notifications

**Endpoint:** `POST /api/notifications/test`

**Description:** Sends a test notification (admin only)

**Request Body:**
```json
{
  "userId": "string",
  "type": "string",
  "title": "string",
  "message": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test notification sent successfully"
}
```

---

## Webhook APIs

### N8N Workflow Management

#### Get Workflows

**Endpoint:** `GET /api/n8n/workflows`

**Description:** Retrieves all N8N workflows

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "active": "boolean",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

#### Toggle Workflow

**Endpoint:** `POST /api/n8n/workflows/[id]/toggle`

**Description:** Toggles a workflow's active status

**Path Parameters:**
- `id`: Workflow ID

**Request Body:**
```json
{
  "active": "boolean"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow status updated",
  "data": {
    "id": "string",
    "active": "boolean"
  }
}
```

### N8N User Registration Webhook

**Endpoint:** `POST /api/webhooks/n8n/user-registration`

**Description:** Handles user registration webhooks from N8N

**Request Body:**
```json
{
  "userId": "string",
  "email": "string",
  "role": "string",
  "timestamp": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registration webhook processed"
}
```

### SMS Status Webhook

**Endpoint:** `POST /api/webhooks/sms/status`

**Description:** Handles SMS delivery status webhooks

**Request Body:**
```json
{
  "messageId": "string",
  "status": "string",
  "timestamp": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS status webhook processed"
}
```

---

## Error Handling

### Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `409` | Conflict |
| `422` | Unprocessable Entity |
| `429` | Too Many Requests |
| `500` | Internal Server Error |

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| `INVALID_TOKEN` | Invalid or expired authentication token |
| `MISSING_FIELDS` | Required fields are missing |
| `VALIDATION_ERROR` | Input validation failed |
| `PERMISSION_DENIED` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `PAYMENT_FAILED` | Payment processing failed |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |

---

## Rate Limiting

### Rate Limit Headers

All API responses include rate limiting headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limits by Endpoint

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Payment APIs | 100 requests | 1 hour |
| Admin APIs | 1000 requests | 1 hour |
| General APIs | 1000 requests | 1 hour |

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}
```

---

## API Testing

### Test Maya Configuration

**Endpoint:** `GET /api/test-maya-config`

**Description:** Tests Maya payment configuration

**Response:**
```json
{
  "success": true,
  "data": {
    "environment": "string",
    "publicKey": "string",
    "webhookUrl": "string",
    "status": "configured"
  }
}
```

### Development Tools

**Local Development:**
- Use `npm run dev` to start development server
- API endpoints available at `http://localhost:3000/api`
- Enable debug mode for detailed logging

**Testing:**
- Use Postman or similar tools for API testing
- Test webhook endpoints using ngrok for local development
- Validate responses against schema definitions

---

## Security Considerations

### Data Protection
- All sensitive data is encrypted in transit and at rest
- Personal information is handled according to privacy regulations
- API keys and secrets are stored securely

### Input Validation
- All inputs are validated and sanitized
- SQL injection and XSS prevention measures
- File upload restrictions and validation

### Monitoring
- All API calls are logged for audit purposes
- Suspicious activity is monitored and flagged
- Performance metrics are tracked and analyzed

---

This API documentation provides comprehensive information about all available endpoints in the LocalPro platform. For implementation examples and SDKs, refer to the developer resources section.
