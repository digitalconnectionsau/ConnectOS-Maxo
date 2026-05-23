import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getSessionUserId } from '@/lib/auth';
import { getArticle, updateArticle, deleteArticle } from '@/lib/kb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req); if (auth) return auth;
  const { id } = await params;
  const article = await getArticle(id, true);
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req); if (auth) return auth;
  const userId = getSessionUserId(req);
  const { id } = await params;
  const body = await req.json();
  const article = await updateArticle(Number(id), body, userId);
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ article });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req); if (auth) return auth;
  const { id } = await params;
  await deleteArticle(Number(id));
  return NextResponse.json({ ok: true });
}
