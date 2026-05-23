import { NextRequest, NextResponse } from 'next/server';
import { getActiveTimer, startTimer, stopTimer, cancelTimer } from '@/lib/time-tracking';
import { getSessionUserId } from '@/lib/auth';

function resolveUser(req: NextRequest, bodyUserId?: unknown): number | null {
  if (typeof bodyUserId === 'number') return bodyUserId;
  return getSessionUserId(req);
}

export async function GET(req: NextRequest) {
  const userId = resolveUser(req);
  if (!userId) return NextResponse.json({ timer: null });
  const timer = await getActiveTimer(userId);
  return NextResponse.json({ timer });
}

/**
 * POST /api/timers
 * Body: { action: 'start' | 'stop' | 'cancel', user_id?, project_id?, ticket_id?, description? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = resolveUser(req, body.user_id);
    if (!userId) {
      return NextResponse.json({ error: 'No active user session' }, { status: 401 });
    }
    switch (body.action) {
      case 'start': {
        const timer = await startTimer({
          user_id: userId,
          project_id: body.project_id ?? null,
          ticket_id: body.ticket_id ?? null,
          description: body.description ?? null,
        });
        return NextResponse.json({ timer });
      }
      case 'stop': {
        const entry = await stopTimer(userId);
        return NextResponse.json({ entry });
      }
      case 'cancel': {
        await cancelTimer(userId);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
