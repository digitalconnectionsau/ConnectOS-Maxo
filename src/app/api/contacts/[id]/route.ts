import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { updateContactInQbo } from '@/lib/quickbooks';

/**
 * PATCH /api/contacts/:id
 * Update editable contact fields. If the contact is flagged for QuickBooks
 * sync, the change is pushed to QBO automatically.
 *
 * GET    /api/contacts/:id   → fetch single contact
 * DELETE /api/contacts/:id   → remove contact (does NOT delete in QBO)
 */

const EDITABLE_FIELDS = [
  'name',
  'phone',
  'email',
  'job_title',
  'company_name',
  'notes',
  'lead_status',
  'lead_source',
] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contactId = Number(id);
  if (!Number.isInteger(contactId)) {
    return NextResponse.json({ error: 'Invalid contact id' }, { status: 400 });
  }
  const db = await getDatabase();
  const { rows } = await db.query('SELECT * FROM contacts WHERE id = $1', [contactId]);
  if (!rows[0]) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

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
    const updates: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) updates[field] = body[field];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No editable fields supplied' }, { status: 400 });
    }

    const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`);
    const values = Object.values(updates);
    values.push(contactId);

    const db = await getDatabase();
    const { rows } = await db.query(
      `UPDATE contacts
          SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length}
        RETURNING *`,
      values
    );
    if (!rows[0]) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Best-effort QBO push. Failures are reported but don't block the local save.
    let qboError: string | null = null;
    try {
      await updateContactInQbo(contactId);
    } catch (err) {
      qboError = err instanceof Error ? err.message : 'QBO update failed';
      console.warn(`QBO push for contact ${contactId} failed:`, err);
    }

    return NextResponse.json({ contact: rows[0], qboError });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = Number(id);
    if (!Number.isInteger(contactId)) {
      return NextResponse.json({ error: 'Invalid contact id' }, { status: 400 });
    }
    const db = await getDatabase();
    const { rowCount } = await db.query('DELETE FROM contacts WHERE id = $1', [contactId]);
    if (!rowCount) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
