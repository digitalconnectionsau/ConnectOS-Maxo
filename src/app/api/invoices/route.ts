import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { listInvoices, createInvoice, buildLinesFromUnbilledTime, flushExtraInvoicedEntries } from '@/lib/invoices';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const sp = req.nextUrl.searchParams;
  const rows = await listInvoices({
    status: sp.get('status') ?? undefined,
    contact_id: sp.get('contact_id') ? Number(sp.get('contact_id')) : undefined,
    project_id: sp.get('project_id') ? Number(sp.get('project_id')) : undefined,
    search: sp.get('search') ?? undefined,
  });
  return NextResponse.json({ invoices: rows });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const body = await req.json();
  try {
    let items = body.items as Array<{ description: string; quantity: number; unit_price: number; tax_amount?: number; product_id?: number | null; time_entry_id?: number | null }> | undefined;
    if (body.from_project_id && (!items || !items.length)) {
      items = await buildLinesFromUnbilledTime(Number(body.from_project_id), body.default_hourly_rate ?? null);
      if (!items.length) {
        return NextResponse.json({ error: 'No unbilled time entries on this project' }, { status: 400 });
      }
    }
    const invoice = await createInvoice({
      contact_id: Number(body.contact_id),
      project_id: body.project_id ?? body.from_project_id ?? null,
      currency: body.currency,
      due_date: body.due_date ?? null,
      issued_date: body.issued_date ?? null,
      notes: body.notes ?? null,
      billing_address: body.billing_address ?? null,
      status: body.status,
      items: items ?? [],
    });
    await flushExtraInvoicedEntries();
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
