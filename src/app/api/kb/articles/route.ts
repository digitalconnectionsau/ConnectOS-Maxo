import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getSessionUserId } from '@/lib/auth';
import { listArticles, createArticle } from '@/lib/kb';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const sp = req.nextUrl.searchParams;
  const rows = await listArticles({
    status: sp.get('status') ?? undefined,
    category_id: sp.get('category_id') ? Number(sp.get('category_id')) : undefined,
    search: sp.get('search') ?? undefined,
  });
  return NextResponse.json({ articles: rows });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const userId = getSessionUserId(req);
  const body = await req.json();
  try {
    const article = await createArticle(body, userId);
    return NextResponse.json({ article }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
