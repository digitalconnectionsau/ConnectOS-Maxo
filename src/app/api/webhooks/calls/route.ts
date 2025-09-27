import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, findOrCreateContact } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;
    const duration = formData.get('CallDuration') as string;

    // Store incoming call in database
    const db = await getDatabase();
    const contact = await findOrCreateContact(from);

    await db.run(
      `INSERT OR REPLACE INTO calls (twilio_sid, contact_id, direction, from_number, to_number, status, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        callSid,
        contact?.id || null,
        'inbound',
        from,
        to,
        callStatus,
        duration ? parseInt(duration) : null,
      ]
    );

    // Generate TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! Thank you for calling our Phone CRM system. Your call is being recorded.</Say>
  <Pause length="2"/>
  <Say voice="alice">Please leave a message after the tone and we'll get back to you soon.</Say>
  <Record maxLength="30" transcribe="true" recordingStatusCallback="/api/webhooks/recording"/>
  <Say voice="alice">Thank you for your message. Goodbye!</Say>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error processing incoming call:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We're sorry, but we're experiencing technical difficulties. Please try again later.</Say>
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}