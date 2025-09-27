import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    // Extract voicemail parameters
    const callSid = params.get('CallSid');
    const from = params.get('From');
    const recordingUrl = params.get('RecordingUrl');
    const recordingDuration = params.get('RecordingDuration');
    
    console.log('Voicemail received:', { callSid, from, recordingUrl, recordingDuration });

    // Save voicemail to database
    if (callSid && from && recordingUrl) {
      try {
        const db = await getDatabase();
        await db.query(`
          INSERT INTO messages (
            twilio_sid, 
            from_number, 
            to_number, 
            direction, 
            body, 
            media_url, 
            status, 
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
          callSid, 
          from, 
          process.env.TWILIO_PHONE_NUMBER, 
          'inbound', 
          `Voicemail (${recordingDuration}s)`, 
          recordingUrl, 
          'received'
        ]);
        
        // You could also send a notification email here
        console.log('Voicemail saved to database');
        
      } catch (dbError) {
        console.error('Database error saving voicemail:', dbError);
      }
    }

    // TwiML response after receiving voicemail
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for your message. We'll get back to you soon. Goodbye!</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('Voicemail handling error:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you. Goodbye.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}