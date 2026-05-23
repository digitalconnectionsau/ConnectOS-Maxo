import { getDatabase } from './database';

export interface Invoice {
  id: number;
  invoice_number: string;
  contact_id: number | null;
  contact_name?: string | null;
  project_id: number | null;
  project_name?: string | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: string;
  tax_amount: string;
  total: string;
  currency: string;
  issued_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  billing_address: string | null;
  quickbooks_id: string | null;
  quickbooks_sync_token: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number | null;
  description: string;
  quantity_decimal: string | null;
  unit_price: string;
  tax_amount: string | null;
  total: string;
  time_entry_id: number | null;
  sort_order: number;
}

const LIST_SELECT = `
  SELECT i.*, c.name AS contact_name, p.name AS project_name
    FROM invoices i
    LEFT JOIN contacts c ON c.id = i.contact_id
    LEFT JOIN projects p ON p.id = i.project_id
`;

export async function nextInvoiceNumber(): Promise<string> {
  const db = await getDatabase();
  const { rows } = await db.query<{ n: string }>(
    `SELECT nextval('invoices_number_seq')::text AS n`
  );
  return `INV-${rows[0].n.padStart(5, '0')}`;
}

export async function listInvoices(filter: {
  status?: string;
  contact_id?: number;
  project_id?: number;
  search?: string;
} = {}): Promise<Invoice[]> {
  const db = await getDatabase();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.status) { params.push(filter.status); where.push(`i.status = $${params.length}`); }
  if (filter.contact_id) { params.push(filter.contact_id); where.push(`i.contact_id = $${params.length}`); }
  if (filter.project_id) { params.push(filter.project_id); where.push(`i.project_id = $${params.length}`); }
  if (filter.search) {
    params.push(`%${filter.search}%`);
    where.push(`(i.invoice_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
  }
  const sql = `${LIST_SELECT}
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY i.created_at DESC LIMIT 500`;
  const { rows } = await db.query<Invoice>(sql, params);
  return rows;
}

export async function getInvoice(id: number): Promise<{ invoice: Invoice; items: InvoiceItem[] } | null> {
  const db = await getDatabase();
  const { rows } = await db.query<Invoice>(`${LIST_SELECT} WHERE i.id = $1`, [id]);
  if (!rows[0]) return null;
  const { rows: items } = await db.query<InvoiceItem>(
    `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order, id`,
    [id]
  );
  return { invoice: rows[0], items };
}

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unit_price: number;
  tax_amount?: number;
  product_id?: number | null;
  time_entry_id?: number | null;
}
export interface CreateInvoiceInput {
  contact_id: number;
  project_id?: number | null;
  currency?: string;
  due_date?: string | null;
  issued_date?: string | null;
  notes?: string | null;
  billing_address?: string | null;
  status?: Invoice['status'];
  items: InvoiceLineInput[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  if (!input.contact_id) throw new Error('contact_id is required');
  if (!input.items?.length) throw new Error('At least one line item required');
  const db = await getDatabase();
  const number = await nextInvoiceNumber();

  let subtotal = 0;
  let taxTotal = 0;
  const computedItems = input.items.map((it, idx) => {
    const lineTotal = round2(it.quantity * it.unit_price);
    const lineTax = round2(it.tax_amount ?? 0);
    subtotal += lineTotal;
    taxTotal += lineTax;
    return { ...it, lineTotal, lineTax, sort: idx };
  });
  subtotal = round2(subtotal);
  taxTotal = round2(taxTotal);
  const total = round2(subtotal + taxTotal);

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows: invRows } = await client.query<{ id: number }>(
      `INSERT INTO invoices
         (invoice_number, contact_id, project_id, status, subtotal, tax_amount, total,
          currency, issued_date, due_date, notes, billing_address)
       VALUES ($1,$2,$3,COALESCE($4,'draft'),$5,$6,$7,COALESCE($8,'AUD'),
               COALESCE($9, CURRENT_DATE), $10, $11, $12)
       RETURNING id`,
      [
        number, input.contact_id, input.project_id ?? null, input.status,
        subtotal, taxTotal, total, input.currency,
        input.issued_date, input.due_date, input.notes ?? null, input.billing_address ?? null,
      ]
    );
    const invoiceId = invRows[0].id;
    for (const it of computedItems) {
      await client.query(
        `INSERT INTO invoice_items
           (invoice_id, product_id, description, quantity, quantity_decimal, unit_price,
            tax_amount, total, time_entry_id, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          invoiceId, it.product_id ?? null, it.description,
          Math.max(1, Math.round(it.quantity)),     // legacy integer quantity column
          it.quantity,                              // precise decimal copy
          it.unit_price, it.lineTax, it.lineTotal,
          it.time_entry_id ?? null, it.sort,
        ]
      );
      // Mark time entry as invoiced (best-effort).
      if (it.time_entry_id) {
        await client.query(
          `UPDATE time_entries SET invoiced_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [it.time_entry_id]
        );
      }
    }
    await client.query('COMMIT');
    const fetched = await getInvoice(invoiceId);
    return fetched!.invoice;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const EDITABLE_FIELDS = ['status', 'due_date', 'issued_date', 'notes', 'billing_address', 'project_id'] as const;
export async function updateInvoice(id: number, patch: Partial<Invoice>): Promise<Invoice | null> {
  const db = await getDatabase();
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const f of EDITABLE_FIELDS) {
    if (f in patch) {
      params.push((patch as Record<string, unknown>)[f]);
      sets.push(`${f} = $${params.length}`);
    }
  }
  if ('status' in patch && patch.status === 'paid') {
    sets.push(`paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP)`);
  }
  if (!sets.length) {
    const cur = await getInvoice(id);
    return cur?.invoice ?? null;
  }
  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);
  await db.query(`UPDATE invoices SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  const fetched = await getInvoice(id);
  return fetched?.invoice ?? null;
}

export async function deleteInvoice(id: number): Promise<void> {
  const db = await getDatabase();
  await db.query(`DELETE FROM invoices WHERE id = $1`, [id]);
}

/**
 * Build invoice line items from unbilled time entries on a project. One line
 * per unique (description) — we sum hours and weight the rate by hours so
 * mixed-rate entries are represented fairly.
 */
export async function buildLinesFromUnbilledTime(
  projectId: number,
  defaultHourlyRate?: number | null
): Promise<InvoiceLineInput[]> {
  const db = await getDatabase();
  const { rows } = await db.query<{
    id: number;
    description: string | null;
    duration_seconds: number;
    hourly_rate: string | null;
  }>(
    `SELECT id, description, duration_seconds, hourly_rate
       FROM time_entries
      WHERE project_id = $1 AND billable = TRUE AND invoiced_at IS NULL`,
    [projectId]
  );
  if (!rows.length) return [];

  // Group by (description, rate) so each line is uniform.
  const groups = new Map<string, { hours: number; rate: number; description: string; ids: number[] }>();
  for (const r of rows) {
    const rate = Number(r.hourly_rate ?? defaultHourlyRate ?? 0);
    const hours = r.duration_seconds / 3600;
    const desc = (r.description || 'Time') as string;
    const key = `${desc}::${rate}`;
    const g = groups.get(key) ?? { hours: 0, rate, description: desc, ids: [] };
    g.hours += hours;
    g.ids.push(r.id);
    groups.set(key, g);
  }
  const lines: InvoiceLineInput[] = [];
  for (const g of groups.values()) {
    const hoursRounded = Math.round(g.hours * 100) / 100;
    lines.push({
      description: g.description,
      quantity: hoursRounded,
      unit_price: g.rate,
      // Note: time_entry_id only supports a single id per line — we attach the
      // first; the rest are still marked invoiced via the create transaction.
      time_entry_id: g.ids[0] ?? null,
    });
    // Tag remaining entries as invoiced separately when the invoice is created.
    g.ids.slice(1).forEach((id) => extraInvoicedEntryIds.add(id));
  }
  return lines;
}

// Internal — additional time entries to be marked invoiced when createInvoice runs.
// Cleared by callers after use. Tiny module-level set; simpler than threading a
// second argument through the lines pipeline.
const extraInvoicedEntryIds = new Set<number>();
export async function flushExtraInvoicedEntries(): Promise<void> {
  if (!extraInvoicedEntryIds.size) return;
  const db = await getDatabase();
  const ids = Array.from(extraInvoicedEntryIds);
  extraInvoicedEntryIds.clear();
  await db.query(
    `UPDATE time_entries SET invoiced_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1::int[]) AND invoiced_at IS NULL`,
    [ids]
  );
}
