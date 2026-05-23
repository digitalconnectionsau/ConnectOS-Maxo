import { NextRequest, NextResponse } from 'next/server';
import { updateTimeEntry, deleteTimeEntry, getTimeEntry } from '@/lib/time-tracking';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getTimeEntry(Number(id));
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ entry });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const entry = await updateTimeEntry(Number(id), body);
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ entry });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteTimeEntry(Number(id));
  return NextResponse.json({ ok: true });
}
