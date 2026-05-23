import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getSessionUserId } from '@/lib/auth';
import { listVaultItems, createVaultItem } from '@/lib/vault';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const sp = req.nextUrl.searchParams;
  const items = await listVaultItems({
    search: sp.get('search') ?? undefined,
    folder: sp.get('folder') ?? undefined,
    contact_id: sp.get('contact_id') ? Number(sp.get('contact_id')) : undefined,
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const userId = getSessionUserId(req);
  const body = await req.json();
  try {
    const item = await createVaultItem(body, userId);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
