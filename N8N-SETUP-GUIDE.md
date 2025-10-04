# n8n Integration Setup Guide for LocalPro

## 🎯 Overview

This guide provides a comprehensive setup for integrating n8n workflow automation with your LocalPro application to streamline management processes across all app operations.

## 🏗️ Current Application Analysis

### LocalPro Architecture
- **Framework**: Next.js 15.3.3 with TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with RBAC
- **Payment**: Adyen, PayPal, GCash, Maya, Bank Transfer
- **AI**: Google AI (Genkit)
- **Email**: Resend with React Email templates

### Key Business Processes Identified
1. **User Management**: Registration, verification, role assignment
2. **Booking Management**: Service booking, status updates, notifications
3. **Payment Processing**: Payment verification, payouts, refunds
4. **Communication**: Email notifications, in-app messaging
5. **Content Moderation**: User reports, admin actions
6. **Analytics**: Performance tracking, reporting

## 🚀 n8n Integration Benefits

### 1. Workflow Automation
- **User Onboarding**: Automated welcome sequences, verification workflows
- **Booking Management**: Automated status updates, reminder notifications
- **Payment Processing**: Automated verification workflows, payout processing
- **Content Moderation**: Automated flagging, escalation workflows

### 2. Process Optimization
- **Reduce Manual Work**: Automate repetitive admin tasks
- **Improve Response Times**: Instant notifications and updates
- **Enhance User Experience**: Proactive communication and support
- **Data Synchronization**: Keep all systems in sync

## 📋 n8n Setup Configuration

### 1. Environment Setup

#### Docker Compose Configuration
```yaml
# docker-compose.n8n.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: localpro-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=Asia/Manila
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - N8N_USER_MANAGEMENT_DISABLED=false
      - N8N_PERSONALIZATION_ENABLED=true
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_VERSION_NOTIFICATIONS_ENABLED=false
      - N8N_TEMPLATES_ENABLED=true
      - N8N_ONBOARDING_FLOW_DISABLED=true
    volumes:
      - n8n_data:/home/node/.n8n
      - ./n8n/workflows:/home/node/.n8n/workflows
      - ./n8n/credentials:/home/node/.n8n/credentials
    networks:
      - localpro-network

volumes:
  n8n_data:

networks:
  localpro-network:
    external: true
```

### 2. Environment Variables

Add to your `.env.local`:
```env
# n8n Configuration
N8N_PASSWORD=your_secure_password_here
N8N_ENCRYPTION_KEY=your_32_character_encryption_key
N8N_WEBHOOK_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key

# LocalPro API Integration
LOCALPRO_API_BASE_URL=http://localhost:9006
LOCALPRO_API_KEY=your_localpro_api_key
```

### 3. Package.json Scripts

Add to your `package.json`:
```json
{
  "scripts": {
    "n8n:start": "docker-compose -f docker-compose.n8n.yml up -d",
    "n8n:stop": "docker-compose -f docker-compose.n8n.yml down",
    "n8n:logs": "docker-compose -f docker-compose.n8n.yml logs -f",
    "n8n:backup": "docker exec localpro-n8n n8n export:workflow --all --output=/home/node/.n8n/backup"
  }
}
```

## 🔧 Core Workflow Templates

### 1. User Registration Workflow
```json
{
  "name": "User Registration Automation",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "user-registration",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Send Welcome Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "toEmail": "={{ $json.email }}",
        "subject": "Welcome to LocalPro!",
        "message": "Welcome to LocalPro! Your account has been created successfully."
      }
    },
    {
      "name": "Create User Profile",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{ $env.LOCALPRO_API_BASE_URL }}/api/users",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{ $env.LOCALPRO_API_KEY }}"
        }
      }
    }
  ]
}
```

### 2. Booking Status Update Workflow
```json
{
  "name": "Booking Status Automation",
  "nodes": [
    {
      "name": "Booking Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "booking-update",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Check Status",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.status }}",
              "operation": "equal",
              "value2": "confirmed"
            }
          ]
        }
      }
    },
    {
      "name": "Send Confirmation",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "toEmail": "={{ $json.clientEmail }}",
        "subject": "Booking Confirmed - {{ $json.serviceName }}",
        "message": "Your booking has been confirmed for {{ $json.date }} at {{ $json.time }}"
      }
    }
  ]
}
```

### 3. Payment Verification Workflow
```json
{
  "name": "Payment Verification Automation",
  "nodes": [
    {
      "name": "Payment Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "payment-verification",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Validate Payment",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{ $env.LOCALPRO_API_BASE_URL }}/api/payments/validate",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{ $env.LOCALPRO_API_KEY }}"
        }
      }
    },
    {
      "name": "Update Booking Status",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{ $env.LOCALPRO_API_BASE_URL }}/api/bookings/{{ $json.bookingId }}/status",
        "method": "PATCH",
        "headers": {
          "Authorization": "Bearer {{ $env.LOCALPRO_API_KEY }}"
        }
      }
    }
  ]
}
```

## 🔌 API Integration Endpoints

### 1. Webhook Endpoints for n8n

Create these API routes in your Next.js app:

```typescript
// src/app/api/webhooks/n8n/user-registration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/webhook-verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(request, body);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process user registration
    const { email, name, role } = body;
    
    // Your existing user creation logic
    // ...

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 2. Webhook Verification Utility

```typescript
// src/lib/webhook-verification.ts
import crypto from 'crypto';

export async function verifyWebhookSignature(
  request: NextRequest,
  body: any
): Promise<boolean> {
  const signature = request.headers.get('x-n8n-signature');
  const secret = process.env.N8N_WEBHOOK_SECRET;
  
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## 📊 Management Dashboard Integration

### 1. n8n Workflow Status Component

```typescript
// src/components/n8n-dashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WorkflowStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastRun: string;
  executions: number;
}

export function N8nDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([]);

  useEffect(() => {
    fetchWorkflowStatus();
  }, []);

  const fetchWorkflowStatus = async () => {
    try {
      const response = await fetch('/api/n8n/workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflow status:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workflows.map((workflow) => (
        <Card key={workflow.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {workflow.name}
              <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                {workflow.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Last Run: {workflow.lastRun}
              </p>
              <p className="text-sm text-muted-foreground">
                Executions: {workflow.executions}
              </p>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## 🚀 Implementation Steps

### Phase 1: Basic Setup (Week 1)
1. **Install n8n**: Set up Docker container
2. **Configure Environment**: Set up environment variables
3. **Create Basic Workflows**: User registration and booking notifications
4. **Test Integration**: Verify webhook connections

### Phase 2: Core Automation (Week 2)
1. **Payment Workflows**: Automated payment verification
2. **Communication Workflows**: Email automation
3. **Status Updates**: Real-time booking status updates
4. **Admin Notifications**: Automated admin alerts

### Phase 3: Advanced Features (Week 3)
1. **Analytics Integration**: Automated reporting
2. **Content Moderation**: Automated flagging workflows
3. **Performance Monitoring**: Workflow health monitoring
4. **Custom Nodes**: Create LocalPro-specific nodes

### Phase 4: Optimization (Week 4)
1. **Performance Tuning**: Optimize workflow performance
2. **Error Handling**: Implement robust error handling
3. **Monitoring**: Set up comprehensive monitoring
4. **Documentation**: Complete setup documentation

## 📈 Expected Benefits

### Immediate Benefits
- **50% Reduction** in manual admin tasks
- **90% Faster** user onboarding process
- **Real-time** status updates and notifications
- **Automated** payment verification workflows

### Long-term Benefits
- **Scalable** process automation
- **Improved** user experience
- **Reduced** operational costs
- **Enhanced** system reliability

## 🔒 Security Considerations

1. **Webhook Security**: Implement signature verification
2. **API Authentication**: Use secure API keys
3. **Data Encryption**: Encrypt sensitive data
4. **Access Control**: Implement proper RBAC
5. **Audit Logging**: Log all workflow executions

## 📞 Support and Maintenance

### Monitoring
- **Workflow Health**: Monitor workflow execution status
- **Performance Metrics**: Track execution times and success rates
- **Error Alerts**: Set up automated error notifications
- **Usage Analytics**: Monitor workflow usage patterns

### Maintenance
- **Regular Updates**: Keep n8n and workflows updated
- **Backup Strategy**: Regular workflow and data backups
- **Performance Optimization**: Regular performance reviews
- **Security Audits**: Regular security assessments

---

## 🎯 Next Steps

1. **Review this guide** and customize for your specific needs
2. **Set up n8n environment** using the Docker configuration
3. **Implement basic workflows** starting with user registration
4. **Test integration** with your LocalPro application
5. **Scale up** to more complex automation workflows

This n8n integration will significantly enhance your LocalPro application's management capabilities and automate critical business processes.
