import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getInvoice, updateInvoice, deleteInvoice } from '@/lib/invoices';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req); if (auth) return auth;
  const { id } = await params;
  const result = await getInvoice(Number(id));
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req); if (auth) return auth;
  const { id } = await params;
  const body = await req.json();
  const invoice = await updateInvoice(Number(id), body);
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ invoice });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req); if (auth) return auth;
  const { id } = await params;
  await deleteInvoice(Number(id));
  return NextResponse.json({ ok: true });
}
