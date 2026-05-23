import { NextRequest, NextResponse } from 'next/server';
import { listComments, addComment } from '@/lib/tickets';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticket id' }, { status: 400 });
  }
  return NextResponse.json(await listComments(ticketId));
}

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
    const comment = await addComment(
      ticketId,
      body.body.trim(),
      typeof body.author_user_id === 'number' ? body.author_user_id : null,
      !!body.is_internal
    );
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
