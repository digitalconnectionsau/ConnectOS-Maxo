import { NextRequest, NextResponse } from 'next/server';
import { createTicket, listTickets } from '@/lib/tickets';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const num = (k: string) => {
      const v = searchParams.get(k);
      return v ? Number(v) : undefined;
    };
    const tickets = await listTickets({
      status_id: num('status_id'),
      assignee_user_id: num('assignee_user_id'),
      contact_id: num('contact_id'),
      priority_id: num('priority_id'),
      open_only: searchParams.get('open_only') === '1',
      search: searchParams.get('search') || undefined,
    });
    return NextResponse.json(tickets);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.subject || typeof body.subject !== 'string') {
      return NextResponse.json({ error: 'subject is required' }, { status: 400 });
    }
    const ticket = await createTicket({
      subject: body.subject,
      description: body.description ?? null,
      contact_id: body.contact_id ?? null,
      assignee_user_id: body.assignee_user_id ?? null,
      team_id: body.team_id ?? null,
      status_id: body.status_id ?? null,
      priority_id: body.priority_id ?? null,
      sla_policy_id: body.sla_policy_id ?? null,
      source: body.source ?? 'manual',
      created_by: body.created_by ?? null,
    });
    return NextResponse.json(ticket, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
