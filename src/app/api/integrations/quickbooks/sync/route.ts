import { NextResponse } from 'next/server';
import { syncAll } from '@/lib/quickbooks';
import { getDatabase } from '@/lib/database-postgresql';

/**
 * POST /api/integrations/quickbooks/sync
 * Pulls customers AND products/services from QBO in a single call.
 */
export async function POST() {
  try {
    const result = await syncAll();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    try {
      const db = await getDatabase();
      await db.query(
        `UPDATE integrations SET last_error = $1, updated_at = CURRENT_TIMESTAMP WHERE provider = 'quickbooks'`,
        [message]
      );
    } catch {
      /* swallow secondary failure */
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
