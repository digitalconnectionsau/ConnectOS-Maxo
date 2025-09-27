import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    // Extract Twilio call parameters
    const callSid = params.get('CallSid');
    const from = params.get('From');
    const to = params.get('To');
    const callDirection = params.get('Direction');
    
    console.log('Incoming call:', { callSid, from, to, callDirection });

    // Log the incoming call to database
    if (callSid && from && to) {
      try {
        const db = await getDatabase();
        await db.query(`
          INSERT INTO calls (twilio_sid, from_number, to_number, direction, status, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [callSid, from, to, 'inbound', 'in-progress']);
      } catch (dbError) {
        console.error('Database logging error:', dbError);
      }
    }

    // Different TwiML responses based on the call scenario
    let twiml = '';

    // Check if this is a call to connect to a browser client
    if (to && to.includes('client:')) {
      // This is for connecting browser calls to phone numbers
      const phoneNumber = params.get('phoneNumber');
      if (phoneNumber) {
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting your call...</Say>
  <Dial callerId="${process.env.TWILIO_PHONE_NUMBER}">
    <Number>${phoneNumber}</Number>
  </Dial>
</Response>`;
      } else {
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, no phone number was provided.</Say>
  <Hangup/>
</Response>`;
      }
    } else {
      // Incoming call to your Twilio number - route to browser client
      const availableAgents = ['user_1', 'user_2']; // You could make this dynamic
      
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Welcome to ${process.env.COMPANY_NAME || 'our company'}. Please wait while we connect you to an available agent.</Say>
  <Dial timeout="30" record="record-from-answer-dual" action="/api/twiml/call/status">
    ${availableAgents.map(agent => `<Client>${agent}</Client>`).join('\n    ')}
    <Number>${process.env.FALLBACK_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER}</Number>
  </Dial>
  <Say voice="alice">Sorry, no agents are available right now. Please leave a message after the tone.</Say>
  <Record maxLength="60" action="/api/twiml/voicemail" playBeep="true"/>
  <Say voice="alice">Thank you for your message. Goodbye.</Say>
  <Hangup/>
</Response>`;
    }

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('TwiML call handling error:', error);
    
    // Fallback TwiML in case of errors
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We're experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(fallbackTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}

// Handle call status updates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'status') {
    // This handles call completion status
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;
    
    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }

  // Default response
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello from the CRM system!</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}