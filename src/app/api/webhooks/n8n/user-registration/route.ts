import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/webhook-verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature for security
    const isValid = await verifyWebhookSignature(request, body);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Extract user data from webhook payload
    const { email, name, role, phone: _phone, userId } = body;
    
    if (!email || !name || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, name, role' 
      }, { status: 400 });
    }

    // Log the webhook event
    console.log('User registration webhook received:', {
      email,
      name,
      role,
      userId,
      timestamp: new Date().toISOString()
    });

    // Here you would typically:
    // 1. Create user in your database
    // 2. Send welcome email
    // 3. Set up user preferences
    // 4. Trigger any additional onboarding workflows

    // For now, we'll just return success
    return NextResponse.json({ 
      success: true, 
      message: 'User registration webhook processed successfully',
      userId: userId || 'generated-id'
    });

  } catch (error) {
    console.error('Error processing user registration webhook:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
