import { NextRequest } from 'next/server';

export function isAuthenticated(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('crm-session');
  if (!sessionCookie) return false;
  const v = sessionCookie.value;
  return v === 'authenticated' || v.startsWith('user-');
}

export function requireAuth(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  return null;
}

/**
 * Returns the numeric user id from a `user-<id>` cookie. Returns null for the
 * legacy `authenticated` value or when no session is present. Callers should
 * tolerate null (e.g. log activity with actor_user_id = null) until proper
 * auth is wired everywhere.
 */
export function getSessionUserId(request: NextRequest): number | null {
  const cookie = request.cookies.get('crm-session');
  if (!cookie) return null;
  const m = /^user-(\d+)$/.exec(cookie.value);
  return m ? Number(m[1]) : null;
}
