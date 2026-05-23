import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { pushInvoiceToQbo } from '@/lib/quickbooks';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req); if (auth) return auth;
  const { id } = await params;
  try {
    const qboId = await pushInvoiceToQbo(Number(id));
    return NextResponse.json({ ok: true, quickbooks_id: qboId });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
