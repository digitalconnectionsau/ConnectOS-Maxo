import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, findOrCreateContact } from '@/lib/database';
import { sendSMS } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const messageSid = formData.get('MessageSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;

    // Store incoming message in database
    const db = await getDatabase();
    const contact = await findOrCreateContact(from);

    await db.run(
      `INSERT INTO messages (twilio_sid, contact_id, direction, from_number, to_number, body, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        messageSid,
        contact?.id || null,
        'inbound',
        from,
        to,
        body,
        'received',
      ]
    );

    // Auto-reply (optional - you can remove this if you don't want auto-replies)
    const autoReply = `Thank you for your message: "${body}". We've received it and will respond soon! This is an automated response from our Phone CRM system.`;
    
    try {
      await sendSMS(from, autoReply);
    } catch (replyError) {
      console.error('Error sending auto-reply:', replyError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing incoming SMS:', error);
    return NextResponse.json(
      { error: 'Failed to process SMS' },
      { status: 500 }
    );
  }
}