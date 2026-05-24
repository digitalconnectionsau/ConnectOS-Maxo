import { NextResponse } from 'next/server';
import { synergy, SynergyError } from '@/lib/synergy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await synergy.balanceQuery();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const details = err instanceof SynergyError ? err.details : undefined;
    return NextResponse.json({ ok: false, error: message, details }, { status: 502 });
  }
}
