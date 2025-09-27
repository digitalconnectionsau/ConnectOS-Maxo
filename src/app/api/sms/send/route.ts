import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';
import { getDatabase, findOrCreateContact } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { to, message, contactName } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Send the SMS via Twilio
    const twilioMessage = await sendSMS(to, message);

    // Store in database
    const db = await getDatabase();
    const contact = await findOrCreateContact(to, contactName);

    await db.query(
      `INSERT INTO messages (contact_id, twilio_sid, direction, from_number, to_number, body, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        contact?.id || null,
        twilioMessage.sid,
        'outbound',
        process.env.TWILIO_PHONE_NUMBER,
        to,
        message,
        twilioMessage.status,
      ]
    );

    return NextResponse.json({
      success: true,
      messageSid: twilioMessage.sid,
      status: twilioMessage.status,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}