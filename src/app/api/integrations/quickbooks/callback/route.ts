import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/quickbooks';

/**
 * GET /api/integrations/quickbooks/callback?code=...&state=...&realmId=...
 * Intuit redirects the user here after they approve access.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const realmId = url.searchParams.get('realmId');
  const error = url.searchParams.get('error');

  const expectedState = req.cookies.get('qbo_oauth_state')?.value;

  const redirectTo = (status: 'success' | 'error', message?: string) => {
    const target = new URL('/settings/integrations', req.url);
    target.searchParams.set('qbo', status);
    if (message) target.searchParams.set('message', message);
    const res = NextResponse.redirect(target);
    res.cookies.delete('qbo_oauth_state');
    return res;
  };

  if (error) return redirectTo('error', error);
  if (!code || !realmId) return redirectTo('error', 'Missing code or realmId');
  if (!state || !expectedState || state !== expectedState) {
    return redirectTo('error', 'Invalid OAuth state');
  }

  try {
    await exchangeCodeForTokens(code, realmId);
    return redirectTo('success');
  } catch (err) {
    console.error('QBO callback failed:', err);
    return redirectTo('error', err instanceof Error ? err.message : 'Token exchange failed');
  }
}
