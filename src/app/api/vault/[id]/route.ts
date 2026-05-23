import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getSessionUserId } from '@/lib/auth';
import { updateVaultItem, deleteVaultItem } from '@/lib/vault';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req); if (auth) return auth;
  const userId = getSessionUserId(req);
  const { id } = await params;
  const body = await req.json();
  await updateVaultItem(Number(id), body, userId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req); if (auth) return auth;
  const userId = getSessionUserId(req);
  const { id } = await params;
  await deleteVaultItem(Number(id), userId);
  return NextResponse.json({ ok: true });
}
