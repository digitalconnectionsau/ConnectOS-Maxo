import { NextRequest, NextResponse } from 'next/server';
import { pollAllMailboxes, pollMailbox } from '@/lib/microsoft365';

/**
 * POST /api/integrations/microsoft365/poll
 * Optional body: { mailbox_id }
 * Polls one or all enabled mailboxes for new mail and ingests as tickets/comments.
 * Can be hit by a Railway cron every few minutes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const results = body.mailbox_id
      ? [await pollMailbox(Number(body.mailbox_id))]
      : await pollAllMailboxes();
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
