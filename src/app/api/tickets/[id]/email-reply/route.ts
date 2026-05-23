import { NextRequest, NextResponse } from 'next/server';
import { sendTicketReply } from '@/lib/microsoft365';

/**
 * POST /api/tickets/:id/email-reply
 * Body: { body, author_user_id? }
 * Sends an email reply via the ticket's source mailbox and records it as a
 * public comment.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticketId = Number(id);
    if (!Number.isInteger(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket id' }, { status: 400 });
    }
    const body = await req.json();
    if (!body.body || typeof body.body !== 'string' || !body.body.trim()) {
      return NextResponse.json({ error: 'body is required' }, { status: 400 });
    }
    await sendTicketReply(
      ticketId,
      body.body.trim(),
      typeof body.author_user_id === 'number' ? body.author_user_id : null
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
