import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { listCategories, createCategory, deleteCategory } from '@/lib/kb';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const categories = await listCategories();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const body = await req.json();
  const category = await createCategory(body.name, body.parent_id ?? null);
  return NextResponse.json({ category }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await deleteCategory(Number(id));
  return NextResponse.json({ ok: true });
}
