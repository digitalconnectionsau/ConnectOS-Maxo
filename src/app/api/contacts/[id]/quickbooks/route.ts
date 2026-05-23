import { NextRequest, NextResponse } from 'next/server';
import { setContactSync } from '@/lib/quickbooks';

/**
 * PATCH /api/contacts/:id/quickbooks
 * Body: { sync: boolean }
 *
 * Toggles whether this contact is synced to QuickBooks as a Customer.
 *   - true  → push to QBO (create if missing) and mark as customer
 *   - false → stop syncing (does NOT delete from QBO)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = Number(id);
    if (!Number.isInteger(contactId)) {
      return NextResponse.json({ error: 'Invalid contact id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    if (typeof body?.sync !== 'boolean') {
      return NextResponse.json(
        { error: 'Request body must include { "sync": boolean }' },
        { status: 400 }
      );
    }

    const result = await setContactSync(contactId, body.sync);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
