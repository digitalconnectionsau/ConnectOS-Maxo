import { NextRequest, NextResponse } from 'next/server';
import { getTicket, updateTicket, deleteTicket, listActivity, listComments } from '@/lib/tickets';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticket id' }, { status: 400 });
  }
  const ticket = await getTicket(ticketId);
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const [comments, activity] = await Promise.all([
    listComments(ticketId),
    listActivity(ticketId),
  ]);
  return NextResponse.json({ ticket, comments, activity });
}

export async function PATCH(
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
    const actorUserId =
      typeof body.actor_user_id === 'number' ? body.actor_user_id : null;
    delete body.actor_user_id;
    const updated = await updateTicket(ticketId, body, actorUserId);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticket id' }, { status: 400 });
  }
  const ok = await deleteTicket(ticketId);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
