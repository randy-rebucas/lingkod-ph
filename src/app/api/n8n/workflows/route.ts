import { NextRequest, NextResponse } from 'next/server';
import { verifyN8nApiKey } from '@/lib/webhook-verification';

// Mock workflow data - in production, this would fetch from n8n API
const mockWorkflows = [
  {
    id: 'user-registration-automation',
    name: 'User Registration Automation',
    status: 'active',
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    executions: 45,
    successRate: 98,
    avgExecutionTime: 1250
  },
  {
    id: 'booking-status-automation',
    name: 'Booking Status Automation',
    status: 'active',
    lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    executions: 128,
    successRate: 95,
    avgExecutionTime: 890
  },
  {
    id: 'payment-verification-automation',
    name: 'Payment Verification Automation',
    status: 'active',
    lastRun: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    executions: 67,
    successRate: 92,
    avgExecutionTime: 2100
  },
  {
    id: 'email-notification-automation',
    name: 'Email Notification Automation',
    status: 'inactive',
    lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    executions: 234,
    successRate: 99,
    avgExecutionTime: 650
  }
];

export async function GET(request: NextRequest) {
  try {
    // Verify API key for security
    if (!verifyN8nApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, you would fetch this from the n8n API
    // const n8nApiUrl = process.env.N8N_API_BASE_URL || 'http://localhost:5678/api/v1';
    // const response = await fetch(`${n8nApiUrl}/workflows`, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
    //   },
    // });
    // const workflows = await response.json();

    return NextResponse.json(mockWorkflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyN8nApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, nodes, connections } = body;

    // In production, you would create the workflow via n8n API
    // const n8nApiUrl = process.env.N8N_API_BASE_URL || 'http://localhost:5678/api/v1';
    // const response = await fetch(`${n8nApiUrl}/workflows`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ name, nodes, connections }),
    // });

    // Mock response
    const newWorkflow = {
      id: `workflow-${Date.now()}`,
      name,
      status: 'inactive',
      lastRun: null,
      executions: 0,
      successRate: 0,
      avgExecutionTime: 0
    };

    return NextResponse.json(newWorkflow, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
