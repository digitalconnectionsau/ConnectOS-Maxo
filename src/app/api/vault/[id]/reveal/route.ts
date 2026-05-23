import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getSessionUserId } from '@/lib/auth';
import { revealVaultItem } from '@/lib/vault';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req); if (auth) return auth;
  const userId = getSessionUserId(req);
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
  const { id } = await params;
  const item = await revealVaultItem(Number(id), userId, ip);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}
