import { NextResponse } from 'next/server';
import { disconnect } from '@/lib/microsoft365';

export async function POST() {
  await disconnect();
  return NextResponse.json({ ok: true });
}
