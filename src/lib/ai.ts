import { getDatabase } from './database';
import { encryptSecret, decryptSecret } from './secret-crypto';
import { ragSearch } from './kb';

const PROVIDER = 'openai';
const DEFAULT_MODEL = 'gpt-4o-mini';

interface AiConfigRow {
  metadata: { model?: string; api_key_encrypted?: string } | null;
}

export interface AiStatus {
  connected: boolean;
  model: string;
}

async function loadConfig(): Promise<{ apiKey: string; model: string } | null> {
  const db = await getDatabase();
  const { rows } = await db.query<AiConfigRow>(
    `SELECT metadata FROM integrations WHERE provider = $1 LIMIT 1`,
    [PROVIDER]
  );
  const meta = rows[0]?.metadata;
  if (!meta?.api_key_encrypted) return null;
  const apiKey = decryptSecret(meta.api_key_encrypted);
  if (!apiKey) return null;
  return {
    apiKey,
    model: meta.model || DEFAULT_MODEL,
  };
}

export async function getAiStatus(): Promise<AiStatus> {
  const cfg = await loadConfig();
  return { connected: !!cfg, model: cfg?.model || DEFAULT_MODEL };
}

export async function saveAiConfig(apiKey: string, model: string = DEFAULT_MODEL): Promise<void> {
  const db = await getDatabase();
  await db.query(
    `INSERT INTO integrations (provider, metadata, connected_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (provider) DO UPDATE
       SET metadata = $2,
           connected_at = CURRENT_TIMESTAMP,
           last_error = NULL`,
    [PROVIDER, { model, api_key_encrypted: encryptSecret(apiKey) }]
  );
}

export async function disconnectAi(): Promise<void> {
  const db = await getDatabase();
  await db.query(`DELETE FROM integrations WHERE provider = $1`, [PROVIDER]);
}

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }

async function chat(messages: ChatMessage[]): Promise<{ text: string; tokens: number; model: string }> {
  const cfg = await loadConfig();
  if (!cfg) throw new Error('OpenAI is not configured. Add an API key in Settings → Integrations.');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.4,
      messages,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? '',
    tokens: data.usage?.total_tokens ?? 0,
    model: data.model ?? cfg.model,
  };
}

interface TicketContext {
  id: number;
  subject: string;
  description: string | null;
  status: string;
  priority: string | null;
  contact_name: string | null;
  comments: Array<{ author: string | null; body: string; created_at: string; is_internal: boolean }>;
}

async function loadTicketContext(ticketId: number): Promise<TicketContext | null> {
  const db = await getDatabase();
  const { rows } = await db.query<{
    id: number; subject: string; description: string | null; status: string; priority: string | null;
    contact_name: string | null;
  }>(
    `SELECT t.id, t.subject, t.description, t.status, t.priority,
            c.name AS contact_name
       FROM tickets t
       LEFT JOIN contacts c ON c.id = t.contact_id
      WHERE t.id = $1`,
    [ticketId]
  );
  if (!rows[0]) return null;
  const { rows: comments } = await db.query<{ author: string | null; body: string; created_at: string; is_internal: boolean }>(
    `SELECT u.email AS author, tc.body, tc.created_at, COALESCE(tc.is_internal, false) AS is_internal
       FROM ticket_comments tc
       LEFT JOIN users u ON u.id = tc.author_user_id
      WHERE tc.ticket_id = $1
      ORDER BY tc.id DESC LIMIT 8`,
    [ticketId]
  );
  return { ...rows[0], comments: comments.reverse() };
}

async function recordSuggestion(kind: string, ticketId: number, output: string, tokens: number, model: string, userId: number | null): Promise<number> {
  const db = await getDatabase();
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO ai_suggestions (kind, ticket_id, output, tokens_used, model, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [kind, ticketId, output, tokens, model, userId]
  );
  return rows[0].id;
}

export async function draftReplyForTicket(ticketId: number, userId: number | null): Promise<{ id: number; text: string }> {
  const ctx = await loadTicketContext(ticketId);
  if (!ctx) throw new Error('Ticket not found');

  const ragQuery = `${ctx.subject}\n${ctx.description ?? ''}`;
  const rag = await ragSearch(ragQuery, 3);
  const ragBlock = rag.length
    ? rag.map((a, i) => `[KB-${i + 1}] ${a.title}\n${(a.excerpt || a.body).slice(0, 1200)}`).join('\n\n')
    : '(no related KB articles found)';

  const transcript = ctx.comments
    .filter((c) => !c.is_internal)
    .map((c) => `${c.author ?? 'Someone'} (${new Date(c.created_at).toLocaleString()}): ${c.body}`)
    .join('\n---\n');

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a friendly, concise IT support agent. Write a reply to the customer in plain text (no markdown). ' +
        'Use the KB context if relevant, but never invent product details. If you need more info, ask one clear question. ' +
        'Sign off with "Thanks". Keep it under 180 words.',
    },
    {
      role: 'user',
      content:
        `TICKET SUBJECT: ${ctx.subject}\n` +
        `CUSTOMER: ${ctx.contact_name ?? 'Customer'}\n` +
        `STATUS: ${ctx.status} (${ctx.priority ?? 'normal'})\n\n` +
        `DESCRIPTION:\n${ctx.description ?? '(none)'}\n\n` +
        `RECENT CONVERSATION:\n${transcript || '(no prior comments)'}\n\n` +
        `KB CONTEXT:\n${ragBlock}\n\n` +
        `Write the reply now.`,
    },
  ];

  const result = await chat(messages);
  const id = await recordSuggestion('draft_reply', ticketId, result.text, result.tokens, result.model, userId);
  return { id, text: result.text };
}

export async function summarizeTicket(ticketId: number, userId: number | null): Promise<{ id: number; text: string }> {
  const ctx = await loadTicketContext(ticketId);
  if (!ctx) throw new Error('Ticket not found');
  const transcript = ctx.comments.map((c) => `${c.is_internal ? '[internal] ' : ''}${c.author ?? 'Someone'}: ${c.body}`).join('\n');
  const result = await chat([
    { role: 'system', content: 'Summarise this support ticket in 3-5 bullet points. Identify the root issue, what has been tried, and the current blocker.' },
    { role: 'user', content: `SUBJECT: ${ctx.subject}\nDESCRIPTION: ${ctx.description ?? ''}\n\nCOMMENTS:\n${transcript}` },
  ]);
  const id = await recordSuggestion('summary', ticketId, result.text, result.tokens, result.model, userId);
  return { id, text: result.text };
}
