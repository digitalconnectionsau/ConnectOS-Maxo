import { NextResponse } from 'next/server';
import { disconnect } from '@/lib/quickbooks';

export async function POST() {
  try {
    await disconnect();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
