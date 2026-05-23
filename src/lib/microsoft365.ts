/**
 * Microsoft 365 Graph integration — app-only (client credentials).
 *
 * Setup in Azure AD:
 *   1. Register an app (single tenant).
 *   2. Add API permission: Microsoft Graph → Application → Mail.ReadWrite, Mail.Send.
 *   3. Grant admin consent.
 *   4. (Recommended) Restrict the app to specific mailboxes via
 *      `New-ApplicationAccessPolicy` in Exchange Online so it can only touch
 *      the mailboxes you intend it to.
 *   5. Create a client secret and paste into the integrations UI.
 *
 * Threading:
 *   Inbound messages create new tickets (or append a comment to an existing
 *   ticket) using two signals — preferring `conversationId` from Graph, then
 *   falling back to a `[T-NNNNN]` subject tag.
 */

import { getDatabase } from './database';
import { encryptSecret, decryptSecret } from './secret-crypto';
import { addComment, createTicket } from './tickets';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const PROVIDER = 'microsoft365';

interface M365Metadata {
  client_id?: string;
  client_secret_encrypted?: string;
  tenant_id?: string;
}

export interface M365Status {
  connected: boolean;
  tenant_id?: string;
  client_id?: string;
  mailboxes: Array<{
    id: number;
    address: string;
    display_name: string | null;
    enabled: boolean;
    last_polled_at: string | null;
    last_message_at: string | null;
    create_tickets: boolean;
  }>;
  last_error?: string | null;
}

interface IntegrationRow {
  id: number;
  status: string;
  access_token_encrypted: string | null;
  token_expires_at: string | null;
  metadata: M365Metadata;
  last_error: string | null;
}

/* --------------------------- Connection / config -------------------------- */

export async function saveCredentials(input: {
  tenant_id: string;
  client_id: string;
  client_secret: string;
}): Promise<void> {
  if (!input.tenant_id || !input.client_id || !input.client_secret) {
    throw new Error('tenant_id, client_id and client_secret are required');
  }
  const db = await getDatabase();
  const metadata: M365Metadata = {
    tenant_id: input.tenant_id,
    client_id: input.client_id,
    client_secret_encrypted: encryptSecret(input.client_secret),
  };
  await db.query(
    `INSERT INTO integrations (provider, status, metadata, last_error)
     VALUES ($1, 'disconnected', $2::jsonb, NULL)
     ON CONFLICT (provider) DO UPDATE
       SET metadata = $2::jsonb,
           last_error = NULL,
           updated_at = CURRENT_TIMESTAMP`,
    [PROVIDER, JSON.stringify(metadata)]
  );

  // Verify by requesting a token; on success mark connected.
  try {
    await fetchAccessToken();
    await db.query(
      `UPDATE integrations SET status = 'connected', last_error = NULL,
              updated_at = CURRENT_TIMESTAMP WHERE provider = $1`,
      [PROVIDER]
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Authentication failed';
    await db.query(
      `UPDATE integrations SET status = 'error', last_error = $2,
              updated_at = CURRENT_TIMESTAMP WHERE provider = $1`,
      [PROVIDER, msg]
    );
    throw err;
  }
}

export async function disconnect(): Promise<void> {
  const db = await getDatabase();
  await db.query(
    `UPDATE integrations
        SET status = 'disconnected',
            access_token_encrypted = NULL,
            token_expires_at = NULL,
            metadata = '{}'::jsonb,
            updated_at = CURRENT_TIMESTAMP
      WHERE provider = $1`,
    [PROVIDER]
  );
}

export async function getStatus(): Promise<M365Status> {
  const db = await getDatabase();
  const { rows } = await db.query<IntegrationRow>(
    `SELECT id, status, access_token_encrypted, token_expires_at, metadata, last_error
       FROM integrations WHERE provider = $1`,
    [PROVIDER]
  );
  const integ = rows[0];
  const { rows: mboxRows } = await db.query(
    `SELECT id, address, display_name, enabled, last_polled_at, last_message_at,
            create_tickets, default_priority_id, default_assignee_user_id
       FROM mailboxes WHERE provider = $1 ORDER BY address`,
    [PROVIDER]
  );
  return {
    connected: integ?.status === 'connected',
    tenant_id: integ?.metadata?.tenant_id,
    client_id: integ?.metadata?.client_id,
    last_error: integ?.last_error ?? null,
    mailboxes: mboxRows,
  };
}

/* ------------------------------ Token plumbing ---------------------------- */

async function getIntegration(): Promise<IntegrationRow> {
  const db = await getDatabase();
  const { rows } = await db.query<IntegrationRow>(
    `SELECT id, status, access_token_encrypted, token_expires_at, metadata, last_error
       FROM integrations WHERE provider = $1`,
    [PROVIDER]
  );
  if (!rows[0]) throw new Error('Microsoft 365 is not configured');
  return rows[0];
}

async function fetchAccessToken(): Promise<string> {
  const integ = await getIntegration();
  const tenantId = integ.metadata?.tenant_id;
  const clientId = integ.metadata?.client_id;
  const secretEnc = integ.metadata?.client_secret_encrypted;
  if (!tenantId || !clientId || !secretEnc) {
    throw new Error('Microsoft 365 credentials missing');
  }
  const clientSecret = decryptSecret(secretEnc);
  if (!clientSecret) throw new Error('Failed to decrypt Microsoft 365 client secret');

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Microsoft token request failed: ${res.status} ${txt}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };

  const db = await getDatabase();
  await db.query(
    `UPDATE integrations
        SET access_token_encrypted = $1,
            token_expires_at = $2,
            updated_at = CURRENT_TIMESTAMP
      WHERE provider = $3`,
    [
      encryptSecret(data.access_token),
      new Date(Date.now() + (data.expires_in - 60) * 1000),
      PROVIDER,
    ]
  );
  return data.access_token;
}

async function getValidAccessToken(): Promise<string> {
  const integ = await getIntegration();
  const expiry = integ.token_expires_at ? new Date(integ.token_expires_at).getTime() : 0;
  if (integ.access_token_encrypted && expiry > Date.now() + 30_000) {
    const token = decryptSecret(integ.access_token_encrypted);
    if (token) return token;
  }
  return fetchAccessToken();
}

async function graph<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Graph ${path} failed: ${res.status} ${txt}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* --------------------------------- Mailboxes ------------------------------ */

export async function addMailbox(input: {
  address: string;
  display_name?: string | null;
  create_tickets?: boolean;
  default_priority_id?: number | null;
  default_assignee_user_id?: number | null;
}): Promise<void> {
  const db = await getDatabase();
  const integ = await getIntegration();
  await db.query(
    `INSERT INTO mailboxes (integration_id, provider, address, display_name,
                             create_tickets, default_priority_id, default_assignee_user_id)
     VALUES ($1, $2, $3, $4, COALESCE($5, TRUE), $6, $7)
     ON CONFLICT (address) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           create_tickets = EXCLUDED.create_tickets,
           default_priority_id = EXCLUDED.default_priority_id,
           default_assignee_user_id = EXCLUDED.default_assignee_user_id`,
    [
      integ.id,
      PROVIDER,
      input.address.toLowerCase().trim(),
      input.display_name ?? null,
      input.create_tickets ?? true,
      input.default_priority_id ?? null,
      input.default_assignee_user_id ?? null,
    ]
  );
}

export async function removeMailbox(id: number): Promise<void> {
  const db = await getDatabase();
  await db.query(`DELETE FROM mailboxes WHERE id = $1`, [id]);
}

/* --------------------------------- Polling -------------------------------- */

interface GraphMessage {
  id: string;
  conversationId: string;
  internetMessageId?: string;
  subject?: string;
  receivedDateTime?: string;
  hasAttachments?: boolean;
  isRead?: boolean;
  from?: { emailAddress: { address?: string; name?: string } };
  toRecipients?: Array<{ emailAddress: { address?: string; name?: string } }>;
  ccRecipients?: Array<{ emailAddress: { address?: string; name?: string } }>;
  body?: { contentType: 'html' | 'text'; content: string };
  bodyPreview?: string;
  internetMessageHeaders?: Array<{ name: string; value: string }>;
}

const TICKET_TAG = /\[T-(\d{4,})\]/i;

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface PollResult {
  mailboxId: number;
  address: string;
  fetched: number;
  ticketsCreated: number;
  commentsAdded: number;
  errors: string[];
}

export async function pollMailbox(mailboxId: number): Promise<PollResult> {
  const db = await getDatabase();
  const { rows } = await db.query(
    `SELECT id, address, last_message_at, create_tickets,
            default_priority_id, default_assignee_user_id
       FROM mailboxes WHERE id = $1 AND enabled = TRUE`,
    [mailboxId]
  );
  const mbox = rows[0];
  if (!mbox) throw new Error('Mailbox not found or disabled');

  const result: PollResult = {
    mailboxId: mbox.id,
    address: mbox.address,
    fetched: 0,
    ticketsCreated: 0,
    commentsAdded: 0,
    errors: [],
  };

  const sinceIso = mbox.last_message_at
    ? new Date(mbox.last_message_at).toISOString()
    : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // first run: last 24h
  const filter = `receivedDateTime gt ${sinceIso}`;
  const select = [
    'id', 'conversationId', 'internetMessageId', 'subject', 'receivedDateTime',
    'hasAttachments', 'isRead', 'from', 'toRecipients', 'ccRecipients', 'body', 'bodyPreview',
  ].join(',');
  const path = `/users/${encodeURIComponent(mbox.address)}/mailFolders/Inbox/messages`
    + `?$filter=${encodeURIComponent(filter)}`
    + `&$orderby=receivedDateTime asc&$top=50&$select=${select}`;

  let data: { value: GraphMessage[] };
  try {
    data = await graph<{ value: GraphMessage[] }>(path);
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
    await db.query(
      `UPDATE mailboxes SET last_polled_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [mbox.id]
    );
    return result;
  }

  let latestReceived: Date | null = null;

  for (const m of data.value) {
    result.fetched++;
    try {
      const received = m.receivedDateTime ? new Date(m.receivedDateTime) : new Date();
      if (!latestReceived || received > latestReceived) latestReceived = received;

      // Skip if already imported (external_id is unique).
      const dup = await db.query(
        `SELECT id FROM email_messages WHERE external_id = $1`,
        [m.id]
      );
      if (dup.rows.length) continue;

      const bodyHtml = m.body?.contentType === 'html' ? m.body.content : null;
      const bodyText =
        m.body?.contentType === 'text'
          ? m.body.content
          : bodyHtml
          ? stripHtml(bodyHtml)
          : m.bodyPreview ?? '';

      const fromAddress = m.from?.emailAddress.address?.toLowerCase() ?? null;
      const fromName = m.from?.emailAddress.name ?? null;
      const toAddresses = (m.toRecipients ?? [])
        .map((r) => r.emailAddress.address).filter(Boolean).join(', ');
      const ccAddresses = (m.ccRecipients ?? [])
        .map((r) => r.emailAddress.address).filter(Boolean).join(', ');

      // Locate existing ticket via conversationId, then subject tag.
      let ticketId: number | null = null;
      {
        const byConv = await db.query<{ id: number }>(
          `SELECT id FROM tickets WHERE email_conversation_id = $1 LIMIT 1`,
          [m.conversationId]
        );
        ticketId = byConv.rows[0]?.id ?? null;
      }
      if (!ticketId && m.subject) {
        const match = TICKET_TAG.exec(m.subject);
        if (match) {
          const tagged = `T-${match[1].padStart(5, '0')}`;
          const byTag = await db.query<{ id: number }>(
            `SELECT id FROM tickets WHERE ticket_number = $1 LIMIT 1`,
            [tagged]
          );
          ticketId = byTag.rows[0]?.id ?? null;
        }
      }

      let commentId: number | null = null;

      if (ticketId) {
        // Append as a public comment on the existing ticket.
        const comment = await addComment(
          ticketId,
          `**Email from ${fromName || fromAddress || 'unknown'}**\n\n${bodyText}`,
          null,
          false
        );
        commentId = comment.id;
        result.commentsAdded++;
        // Make sure ticket records the conversationId for future replies.
        await db.query(
          `UPDATE tickets
              SET email_conversation_id = COALESCE(email_conversation_id, $1),
                  email_mailbox_id      = COALESCE(email_mailbox_id, $2)
            WHERE id = $3`,
          [m.conversationId, mbox.id, ticketId]
        );
      } else if (mbox.create_tickets) {
        // Try to link to an existing contact by from-address.
        let contactId: number | null = null;
        if (fromAddress) {
          const found = await db.query<{ id: number }>(
            `SELECT id FROM contacts WHERE LOWER(email) = $1 LIMIT 1`,
            [fromAddress]
          );
          contactId = found.rows[0]?.id ?? null;
        }
        const ticket = await createTicket({
          subject: (m.subject || '(no subject)').slice(0, 500),
          description: bodyText,
          contact_id: contactId,
          priority_id: mbox.default_priority_id,
          assignee_user_id: mbox.default_assignee_user_id,
          source: 'email',
        });
        ticketId = ticket.id;
        await db.query(
          `UPDATE tickets
              SET email_conversation_id = $1,
                  email_mailbox_id      = $2
            WHERE id = $3`,
          [m.conversationId, mbox.id, ticket.id]
        );
        result.ticketsCreated++;
      }

      await db.query(
        `INSERT INTO email_messages (
           mailbox_id, ticket_id, comment_id, external_id, conversation_id,
           internet_message_id, subject, from_address, from_name,
           to_addresses, cc_addresses, body_html, body_text,
           direction, received_at, has_attachments, raw_metadata
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'inbound',$14,$15,$16::jsonb)`,
        [
          mbox.id,
          ticketId,
          commentId,
          m.id,
          m.conversationId,
          m.internetMessageId ?? null,
          m.subject ?? null,
          fromAddress,
          fromName,
          toAddresses || null,
          ccAddresses || null,
          bodyHtml,
          bodyText,
          received,
          m.hasAttachments ?? false,
          JSON.stringify({ bodyPreview: m.bodyPreview }),
        ]
      );

      // Mark the source message as read so it drops out of the inbox view.
      try {
        await graph(`/users/${encodeURIComponent(mbox.address)}/messages/${m.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isRead: true }),
        });
      } catch (markErr) {
        // Non-fatal — log and keep going.
        console.warn('Failed to mark message read', markErr);
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  await db.query(
    `UPDATE mailboxes
        SET last_polled_at = CURRENT_TIMESTAMP,
            last_message_at = COALESCE($1, last_message_at)
      WHERE id = $2`,
    [latestReceived, mbox.id]
  );

  return result;
}

export async function pollAllMailboxes(): Promise<PollResult[]> {
  const db = await getDatabase();
  const { rows } = await db.query<{ id: number }>(
    `SELECT id FROM mailboxes WHERE enabled = TRUE AND provider = $1`,
    [PROVIDER]
  );
  const results: PollResult[] = [];
  for (const r of rows) {
    try {
      results.push(await pollMailbox(r.id));
    } catch (err) {
      results.push({
        mailboxId: r.id,
        address: '',
        fetched: 0,
        ticketsCreated: 0,
        commentsAdded: 0,
        errors: [err instanceof Error ? err.message : String(err)],
      });
    }
  }
  await db.query(
    `UPDATE integrations SET last_sync_at = CURRENT_TIMESTAMP WHERE provider = $1`,
    [PROVIDER]
  );
  return results;
}

/* ------------------------------- Outbound reply --------------------------- */

/**
 * Send a reply email for a ticket that originated from email. Uses Graph's
 * /reply endpoint against the latest inbound message so threading is preserved.
 */
export async function sendTicketReply(
  ticketId: number,
  bodyText: string,
  fromUserId: number | null
): Promise<void> {
  const db = await getDatabase();
  const { rows } = await db.query<{
    ticket_number: string;
    email_mailbox_id: number | null;
    email_conversation_id: string | null;
  }>(
    `SELECT ticket_number, email_mailbox_id, email_conversation_id
       FROM tickets WHERE id = $1`,
    [ticketId]
  );
  const ticket = rows[0];
  if (!ticket) throw new Error('Ticket not found');
  if (!ticket.email_mailbox_id || !ticket.email_conversation_id) {
    throw new Error('Ticket has no email thread to reply to');
  }
  const { rows: mboxRows } = await db.query<{ address: string }>(
    `SELECT address FROM mailboxes WHERE id = $1`,
    [ticket.email_mailbox_id]
  );
  const mbox = mboxRows[0];
  if (!mbox) throw new Error('Mailbox missing');

  const { rows: latestRows } = await db.query<{ external_id: string | null }>(
    `SELECT external_id FROM email_messages
      WHERE ticket_id = $1 AND direction = 'inbound' AND external_id IS NOT NULL
      ORDER BY received_at DESC NULLS LAST, created_at DESC
      LIMIT 1`,
    [ticketId]
  );
  const replyToMessageId = latestRows[0]?.external_id;
  if (!replyToMessageId) {
    throw new Error('No inbound message found to reply to');
  }

  // Append the ticket tag so subject-based matching still works if conversationId is ever lost.
  const replyBodyHtml =
    `<div>${bodyText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</div>`
    + `<p style="color:#888;font-size:12px;margin-top:24px">Ref: [${ticket.ticket_number}]</p>`;

  await graph(`/users/${encodeURIComponent(mbox.address)}/messages/${replyToMessageId}/reply`, {
    method: 'POST',
    body: JSON.stringify({
      message: { body: { contentType: 'HTML', content: replyBodyHtml } },
    }),
  });

  await db.query(
    `INSERT INTO email_messages (
       mailbox_id, ticket_id, direction, body_text, body_html, sent_at, subject
     ) VALUES ($1, $2, 'outbound', $3, $4, CURRENT_TIMESTAMP, $5)`,
    [ticket.email_mailbox_id, ticketId, bodyText, replyBodyHtml, `Re: [${ticket.ticket_number}]`]
  );

  // Also record as a public comment on the ticket so the timeline reflects the reply.
  await addComment(
    ticketId,
    `**Sent email reply**\n\n${bodyText}`,
    fromUserId,
    false
  );
}
