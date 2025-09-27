import { NextResponse } from 'next/server';

export async function GET() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! You've reached the Phone CRM system. This call is being recorded for demonstration purposes.</Say>
  <Pause length="1"/>
  <Say voice="alice">You can hang up now, or stay on the line to hear some hold music.</Say>
  <Play>https://demo.twilio.com/docs/classic.mp3</Play>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

export async function POST() {
  // Handle call status updates
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling! This is a demo call.</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}