import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const { AccessToken } = twilio.jwt;
const { VoiceGrant } = AccessToken;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      console.error('Missing Twilio configuration');
      return NextResponse.json({ error: 'Twilio configuration missing' }, { status: 500 });
    }

    // Create an identity for this user (could be user ID, email, or username)
    const identity = `user_${userId}`;

    // Create an access token
    const token = new AccessToken(accountSid, apiKey, apiSecret, { identity });

    // Create a Voice grant for this token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true, // Allow incoming calls
    });

    // Add the grant to the token
    token.addGrant(voiceGrant);

    return NextResponse.json({ 
      accessToken: token.toJwt(),
      identity: identity
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 }
    );
  }
}