import { NextRequest, NextResponse } from 'next/server';
import { listTimeEntries, createTimeEntry } from '@/lib/time-tracking';
import { getSessionUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const num = (k: string) => {
    const v = url.searchParams.get(k);
    return v ? Number(v) : undefined;
  };
  const entries = await listTimeEntries({
    user_id: num('user_id'),
    project_id: num('project_id'),
    ticket_id: num('ticket_id'),
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
    limit: num('limit'),
  });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.user_id ?? getSessionUserId(req);
    if (!body.started_at || !body.ended_at) {
      return NextResponse.json({ error: 'started_at and ended_at required' }, { status: 400 });
    }
    const entry = await createTimeEntry({
      user_id: userId,
      project_id: body.project_id ?? null,
      ticket_id: body.ticket_id ?? null,
      description: body.description ?? null,
      started_at: body.started_at,
      ended_at: body.ended_at,
      billable: body.billable,
      hourly_rate: body.hourly_rate,
      source: 'manual',
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
