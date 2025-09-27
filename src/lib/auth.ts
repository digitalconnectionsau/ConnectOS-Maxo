import { NextRequest } from 'next/server';

export function isAuthenticated(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('crm-session');
  return sessionCookie?.value === 'authenticated';
}

export function requireAuth(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  return null;
}