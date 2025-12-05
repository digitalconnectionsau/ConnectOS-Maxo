import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, findOrCreateContact } from '@/lib/database';
import { sendMaxoTelSMS, generateMessageId, getMaxoTelConfig } from '@/lib/maxotel';

// V2 ARCHITECTURE: Use MaxoTel SMS API instead of Twilio
export async function POST(request: NextRequest) {
  try {
    const { to, message, contactName } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Send SMS via MaxoTel API
    let smsResult;
    try {
      smsResult = await sendMaxoTelSMS(to, message);
      console.log('MaxoTel SMS Response:', smsResult);
    } catch (configError) {
      console.error('MaxoTel configuration error:', configError);
      return NextResponse.json(
        { error: 'SMS service not configured', details: (configError as Error).message },
        { status: 500 }
      );
    }

    if (!smsResult.success) {
      console.error('MaxoTel SMS failed:', smsResult.message);
      return NextResponse.json(
        { error: 'Failed to send SMS via MaxoTel', details: smsResult.message },
        { status: 500 }
      );
    }

    // Store in database
    const db = await getDatabase();
    const contact = await findOrCreateContact(to, contactName);
    const config = getMaxoTelConfig();

    // Generate a pseudo-SID for tracking (MaxoTel doesn't provide message IDs in this API)
    const messageSid = generateMessageId('maxotel_sms');

    await db.query(
      `INSERT INTO messages (contact_id, twilio_sid, direction, from_number, to_number, body, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        contact?.id || null,
        messageSid,
        'outbound',
        config.virtualMobile,
        to,
        message,
        'sent',
      ]
    );

    return NextResponse.json({
      success: true,
      messageSid: messageSid,
      status: 'sent',
      provider: 'maxotel',
      response: smsResult.message,
    });
  } catch (error) {
    console.error('Error sending SMS via MaxoTel:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}