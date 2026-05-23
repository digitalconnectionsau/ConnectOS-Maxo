import { NextResponse } from 'next/server';
import { getStatus } from '@/lib/quickbooks';

export async function GET() {
  try {
    const status = await getStatus();
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
