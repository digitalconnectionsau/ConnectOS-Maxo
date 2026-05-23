import { NextResponse } from 'next/server';
import { getStatus } from '@/lib/microsoft365';

export async function GET() {
  try {
    return NextResponse.json(await getStatus());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
