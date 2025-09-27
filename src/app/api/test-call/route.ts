import { NextRequest, NextResponse } from 'next/server';
import { makeCall } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    console.log('Testing call to:', to);
    console.log('Twilio env vars:', {
      accountSid: process.env.TWILIO_ACCOUNT_SID ? `Set (${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...)` : 'Missing',
      authToken: process.env.TWILIO_AUTH_TOKEN ? `Set (${process.env.TWILIO_AUTH_TOKEN.substring(0, 10)}...)` : 'Missing',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Missing'
    });

    // Test Twilio client initialization
    const { twilioClient, TWILIO_PHONE_NUMBER } = await import('@/lib/twilio');
    
    console.log('Twilio client status:', {
      client: twilioClient ? 'Initialized' : 'Null',
      phoneNumber: TWILIO_PHONE_NUMBER
    });

    if (!twilioClient) {
      return NextResponse.json({
        error: 'Twilio client not initialized',
        envVars: {
          accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing',
          authToken: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Missing',
          phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Missing'
        }
      }, { status: 500 });
    }

    // Create TwiML URL for the call
    const twimlUrl = `${request.nextUrl.origin}/api/twiml/call`;
    console.log('TwiML URL:', twimlUrl);

    // Make the call via Twilio
    const call = await makeCall(to, twimlUrl);
    console.log('Call result:', call);

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
    });
  } catch (error) {
    console.error('Detailed error making call:', error);
    return NextResponse.json(
      { 
        error: 'Failed to make call',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}