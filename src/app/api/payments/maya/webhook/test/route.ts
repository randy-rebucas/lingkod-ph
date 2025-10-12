import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test endpoint to verify webhook accessibility
    return NextResponse.json({
      success: true,
      message: 'Maya webhook endpoint is accessible',
      timestamp: new Date().toISOString(),
      environment: process.env.MAYA_ENVIRONMENT || 'sandbox',
      webhookUrl: `${request.nextUrl.origin}/api/payments/maya/webhook`
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test webhook with sample payload
    const body = await request.text();
    console.log('Test webhook received:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test webhook received successfully',
      receivedAt: new Date().toISOString(),
      bodyLength: body.length
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
