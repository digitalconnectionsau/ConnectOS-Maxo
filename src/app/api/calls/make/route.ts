import { NextRequest, NextResponse } from 'next/server';
import { makeCall } from '@/lib/twilio';
import { getDatabase, findOrCreateContact } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { to, contactName } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Create TwiML URL for the call - use Railway domain in production
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://digital-connections-crm-production.up.railway.app'
      : request.nextUrl.origin;
    const twimlUrl = `${baseUrl}/api/twiml/call`;

    // Make the call via Twilio
    const call = await makeCall(to, twimlUrl);

    // Store in database
    const db = await getDatabase();
    const contact = await findOrCreateContact(to, contactName);

    await db.query(
      `INSERT INTO calls (contact_id, twilio_sid, direction, from_number, to_number, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        contact?.id || null,
        call.sid,
        'outbound',
        process.env.TWILIO_PHONE_NUMBER,
        to,
        call.status,
      ]
    );

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
    });
  } catch (error) {
    console.error('Error making call:', error);
    return NextResponse.json(
      { error: 'Failed to make call' },
      { status: 500 }
    );
  }
}