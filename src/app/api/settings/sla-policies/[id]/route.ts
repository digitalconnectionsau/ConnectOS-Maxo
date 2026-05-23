import { NextRequest, NextResponse } from 'next/server';
import { updateRow, deleteRow, SPEC_SLA, parseId } from '@/lib/settings-crud';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const n = parseId(id);
  if (n === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  return updateRow(req, SPEC_SLA, n);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const n = parseId(id);
  if (n === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  return deleteRow(SPEC_SLA, n);
}
