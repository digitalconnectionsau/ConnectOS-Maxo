import { NextRequest, NextResponse } from 'next/server';
import { saveCredentials } from '@/lib/microsoft365';

/**
 * POST /api/integrations/microsoft365/connect
 * Body: { tenant_id, client_id, client_secret }
 * Verifies the credentials by requesting a token, then stores them encrypted.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await saveCredentials({
      tenant_id: body.tenant_id,
      client_id: body.client_id,
      client_secret: body.client_secret,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
