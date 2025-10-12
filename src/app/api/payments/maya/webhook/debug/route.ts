import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('=== MAYA WEBHOOK DEBUG ===');
    console.log('Headers:', headers);
    console.log('Body:', body);
    console.log('========================');
    
    // Try to parse the body as JSON
    let webhookData;
    try {
      webhookData = JSON.parse(body);
      console.log('Parsed webhook data:', webhookData);
    } catch (error) {
      console.error('Failed to parse webhook body as JSON:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Webhook debug data logged',
      timestamp: new Date().toISOString(),
      headers: headers,
      bodyLength: body.length,
      parsedData: webhookData || null
    });
  } catch (error) {
    console.error('Webhook debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Maya webhook debug endpoint',
    usage: 'Send POST requests to this endpoint to debug webhook data',
    timestamp: new Date().toISOString()
  });
}
