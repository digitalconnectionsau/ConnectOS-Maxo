import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getSessionUserId } from '@/lib/auth';
import { draftReplyForTicket, summarizeTicket } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const userId = getSessionUserId(req);
  const body = await req.json();
  if (!body.ticket_id) return NextResponse.json({ error: 'ticket_id required' }, { status: 400 });
  try {
    const result = body.kind === 'summary'
      ? await summarizeTicket(Number(body.ticket_id), userId)
      : await draftReplyForTicket(Number(body.ticket_id), userId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
