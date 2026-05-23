import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAiStatus, saveAiConfig, disconnectAi } from '@/lib/ai';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const status = await getAiStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  const body = await req.json();
  if (!body.api_key) return NextResponse.json({ error: 'api_key required' }, { status: 400 });
  await saveAiConfig(body.api_key, body.model);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req); if (auth) return auth;
  await disconnectAi();
  return NextResponse.json({ ok: true });
}
