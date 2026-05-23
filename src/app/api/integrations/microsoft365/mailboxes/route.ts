import { NextRequest, NextResponse } from 'next/server';
import { addMailbox, removeMailbox } from '@/lib/microsoft365';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.address) {
      return NextResponse.json({ error: 'address is required' }, { status: 400 });
    }
    await addMailbox({
      address: body.address,
      display_name: body.display_name ?? null,
      create_tickets: body.create_tickets ?? true,
      default_priority_id: body.default_priority_id ?? null,
      default_assignee_user_id: body.default_assignee_user_id ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await removeMailbox(id);
  return NextResponse.json({ ok: true });
}
