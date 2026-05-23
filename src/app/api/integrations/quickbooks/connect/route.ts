import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { buildAuthorizationUrl, getQboConfig } from '@/lib/quickbooks';

/**
 * POST /api/integrations/quickbooks/connect
 * Returns an authorization URL the user should be redirected to.
 * Also sets a short-lived `qbo_oauth_state` cookie used to validate the callback.
 */
export async function POST(_req: NextRequest) {
  try {
    getQboConfig(); // throws with helpful message if env vars missing
    const state = randomBytes(24).toString('hex');
    const url = buildAuthorizationUrl(state);

    const res = NextResponse.json({ url });
    res.cookies.set('qbo_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
