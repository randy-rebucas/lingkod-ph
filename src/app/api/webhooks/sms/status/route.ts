import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify this is a legitimate Twilio webhook
    const twilioSignature = request.headers.get('X-Twilio-Signature');
    if (!twilioSignature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Log the SMS status update
    console.log('SMS Status Update:', {
      messageSid: body.MessageSid,
      messageStatus: body.MessageStatus,
      to: body.To,
      from: body.From,
      errorCode: body.ErrorCode,
      errorMessage: body.ErrorMessage,
      timestamp: new Date().toISOString()
    });

    // Store the status update in database
    if (getDb()) {
      try {
        await addDoc(collection(getDb(), 'smsStatusUpdates'), {
          messageSid: body.MessageSid,
          messageStatus: body.MessageStatus,
          to: body.To,
          from: body.From,
          errorCode: body.ErrorCode,
          errorMessage: body.ErrorMessage,
          timestamp: serverTimestamp(),
          receivedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error storing SMS status update:', error);
      }
    }

    // Handle different status updates
    switch (body.MessageStatus) {
      case 'delivered':
        console.log(`SMS delivered to ${body.To}`);
        break;
      case 'failed':
        console.error(`SMS failed to ${body.To}: ${body.ErrorMessage}`);
        break;
      case 'undelivered':
        console.error(`SMS undelivered to ${body.To}: ${body.ErrorMessage}`);
        break;
      default:
        console.log(`SMS status: ${body.MessageStatus} for ${body.To}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing SMS status webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
