import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

/**
 * GET /api/products
 * List products / services. Synced from QuickBooks via the integrations sync.
 */
export async function GET() {
  try {
    const db = await getDatabase();
    const { rows } = await db.query(
      `SELECT id, name, sku, description, unit_price, currency, product_type,
              active, taxable, quickbooks_id, last_synced_at, created_at
         FROM products
        ORDER BY active DESC, name ASC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
