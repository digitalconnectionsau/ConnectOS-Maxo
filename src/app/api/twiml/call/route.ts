import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// Handle outgoing calls from browser clients
// V2 ARCHITECTURE: Bridge to MaxoTel SIP trunk via Twilio BYOC
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    // Extract call parameters
    const callSid = params.get('CallSid');
    const from = params.get('From');
    const to = params.get('To');
    const phoneNumber = params.get('phoneNumber'); // Custom parameter for the number to dial
    
    console.log('Outgoing call request (MaxoTel Bridge):', { callSid, from, to, phoneNumber });

    // Log the outgoing call
    if (callSid && phoneNumber) {
      try {
        const db = await getDatabase();
        await db.query(`
          INSERT INTO calls (twilio_sid, from_number, to_number, direction, status, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [callSid, process.env.TWILIO_PHONE_NUMBER || process.env.MAXOTEL_OFFICE_NUMBER, phoneNumber, 'outbound', 'in-progress']);
      } catch (dbError) {
        console.error('Database logging error:', dbError);
      }
    }

    // Create TwiML to bridge the call to MaxoTel SIP trunk
    let twiml = '';
    
    if (phoneNumber) {
      // Import MaxoTel utility for TwiML generation
      const { generateMaxoTelBridgeTwiML } = await import('@/lib/maxotel');
      
      try {
        // COST-SAVING BRIDGE: Route via MaxoTel SIP instead of Twilio Carrier
        twiml = generateMaxoTelBridgeTwiML(phoneNumber);
      } catch (configError) {
        console.error('MaxoTel configuration error:', configError);
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Service temporarily unavailable. Please try again later.</Say>
  <Hangup/>
</Response>`;
      }
    } else {
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">No phone number provided.</Say>
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
    console.error('TwiML outgoing call error:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Call could not be completed.</Say>
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

// Handle call status updates and completions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callSid = searchParams.get('CallSid');
    const callStatus = searchParams.get('CallStatus');
    const callDuration = searchParams.get('CallDuration');
    
    console.log('Call status update:', { callSid, callStatus, callDuration });

    // Update call record in database
    if (callSid && callStatus) {
      try {
        const db = await getDatabase();
        await db.query(`
          UPDATE calls 
          SET status = $1, duration = $2, updated_at = NOW()
          WHERE twilio_sid = $3
        `, [callStatus, callDuration ? parseInt(callDuration) : null, callSid]);
      } catch (dbError) {
        console.error('Database update error:', dbError);
      }
    }

    // Simple completion response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Call completed -->
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('Call status update error:', error);
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}