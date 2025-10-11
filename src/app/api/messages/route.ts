import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';
import { auditLogger, extractRequestMetadata } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for messaging
    const rateLimitResult = await rateLimiters.api.isAllowed(request);
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse('Rate limit exceeded', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000));
    }

    // Extract request metadata for audit logging
    const metadata = extractRequestMetadata(request);
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      await auditLogger.logSecurityEvent(
        'unknown',
        'unknown',
        'unauthorized_message_attempt',
        { ...metadata, reason: 'No authorization header' }
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Log message sending
    await auditLogger.logMessageSent(
      'user-id', // This would come from token verification
      'client', // This would come from token verification
      body.conversationId || 'unknown',
      {
        ...metadata,
        messageData: {
          hasText: !!body.text,
          hasImage: !!body.imageUrl,
          conversationId: body.conversationId
        }
      }
    );

    // Here you would implement the actual message sending logic
    // For now, we'll return a success response
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully' 
    });
    
    return addRateLimitHeaders(response, rateLimiters.api, request);
    
  } catch (error) {
    console.error('Message sending error:', error);
    
    await auditLogger.logError(
      'unknown',
      'unknown',
      'message_sending_error',
      error as Error,
      extractRequestMetadata(request)
    );
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
