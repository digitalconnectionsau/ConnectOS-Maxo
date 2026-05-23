import { getDatabase } from './database';

/**
 * Ticket business logic — number generation, SLA due date calc, activity logging.
 */

export interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string | null;
  contact_id: number | null;
  assignee_user_id: number | null;
  team_id: number | null;
  status_id: number;
  priority_id: number;
  sla_policy_id: number | null;
  source: string;
  response_due_at: string | null;
  resolution_due_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface TicketListItem extends Ticket {
  status_name: string;
  status_color: string;
  status_is_closed: boolean;
  priority_name: string;
  priority_color: string;
  contact_name: string | null;
  assignee_name: string | null;
}

const LIST_SELECT = `
  SELECT t.*,
         s.name        AS status_name,
         s.color       AS status_color,
         s.is_closed   AS status_is_closed,
         p.name        AS priority_name,
         p.color       AS priority_color,
         c.name        AS contact_name,
         u.full_name   AS assignee_name
    FROM tickets t
    JOIN ticket_statuses   s ON s.id = t.status_id
    JOIN ticket_priorities p ON p.id = t.priority_id
    LEFT JOIN contacts c     ON c.id = t.contact_id
    LEFT JOIN users u        ON u.id = t.assignee_user_id
`;

export async function nextTicketNumber(): Promise<string> {
  const db = await getDatabase();
  const { rows } = await db.query<{ n: string }>(
    `SELECT nextval('tickets_number_seq')::text AS n`
  );
  return `T-${rows[0].n.padStart(5, '0')}`;
}

/**
 * Resolve SLA due dates for a new ticket. Prefers explicit policy, then falls
 * back to the priority's default minutes, then leaves them null.
 */
async function calcSlaDueDates(
  priorityId: number,
  slaPolicyId: number | null
): Promise<{ response_due_at: Date | null; resolution_due_at: Date | null }> {
  const db = await getDatabase();
  let responseMin: number | null = null;
  let resolutionMin: number | null = null;

  if (slaPolicyId) {
    const { rows } = await db.query<{ response_minutes: number; resolution_minutes: number }>(
      `SELECT response_minutes, resolution_minutes FROM sla_policies WHERE id = $1`,
      [slaPolicyId]
    );
    if (rows[0]) {
      responseMin = rows[0].response_minutes;
      resolutionMin = rows[0].resolution_minutes;
    }
  }
  if (responseMin === null) {
    const { rows } = await db.query<{
      default_response_minutes: number | null;
      default_resolution_minutes: number | null;
    }>(
      `SELECT default_response_minutes, default_resolution_minutes
         FROM ticket_priorities WHERE id = $1`,
      [priorityId]
    );
    if (rows[0]) {
      responseMin = rows[0].default_response_minutes;
      resolutionMin = rows[0].default_resolution_minutes;
    }
  }

  const now = Date.now();
  return {
    response_due_at: responseMin ? new Date(now + responseMin * 60_000) : null,
    resolution_due_at: resolutionMin ? new Date(now + resolutionMin * 60_000) : null,
  };
}

export interface CreateTicketInput {
  subject: string;
  description?: string | null;
  contact_id?: number | null;
  assignee_user_id?: number | null;
  team_id?: number | null;
  status_id?: number | null;       // defaults to is_default status
  priority_id?: number | null;     // defaults to is_default priority
  sla_policy_id?: number | null;   // defaults to is_default policy
  source?: string;
  created_by?: number | null;
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const db = await getDatabase();

  const status_id =
    input.status_id ??
    (await db.query<{ id: number }>(
      `SELECT id FROM ticket_statuses WHERE is_default = TRUE ORDER BY sort_order LIMIT 1`
    )).rows[0]?.id ??
    (await db.query<{ id: number }>(`SELECT id FROM ticket_statuses ORDER BY sort_order LIMIT 1`)).rows[0]?.id;

  const priority_id =
    input.priority_id ??
    (await db.query<{ id: number }>(
      `SELECT id FROM ticket_priorities WHERE is_default = TRUE ORDER BY sort_order LIMIT 1`
    )).rows[0]?.id ??
    (await db.query<{ id: number }>(`SELECT id FROM ticket_priorities ORDER BY sort_order LIMIT 1`)).rows[0]?.id;

  const sla_policy_id =
    input.sla_policy_id ??
    (await db.query<{ id: number }>(
      `SELECT id FROM sla_policies WHERE is_default = TRUE LIMIT 1`
    )).rows[0]?.id ??
    null;

  if (!status_id || !priority_id) {
    throw new Error('No ticket statuses or priorities configured');
  }

  const ticket_number = await nextTicketNumber();
  const { response_due_at, resolution_due_at } = await calcSlaDueDates(priority_id, sla_policy_id);

  const { rows } = await db.query<Ticket>(
    `INSERT INTO tickets (
       ticket_number, subject, description, contact_id, assignee_user_id, team_id,
       status_id, priority_id, sla_policy_id, source, response_due_at, resolution_due_at, created_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      ticket_number,
      input.subject,
      input.description ?? null,
      input.contact_id ?? null,
      input.assignee_user_id ?? null,
      input.team_id ?? null,
      status_id,
      priority_id,
      sla_policy_id,
      input.source ?? 'manual',
      response_due_at,
      resolution_due_at,
      input.created_by ?? null,
    ]
  );
  const ticket = rows[0];

  await logActivity(ticket.id, input.created_by ?? null, 'created', null, null, ticket.ticket_number);
  return ticket;
}

export async function listTickets(filters: {
  status_id?: number;
  assignee_user_id?: number;
  contact_id?: number;
  priority_id?: number;
  open_only?: boolean;
  search?: string;
} = {}): Promise<TicketListItem[]> {
  const db = await getDatabase();
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.status_id) {
    params.push(filters.status_id);
    where.push(`t.status_id = $${params.length}`);
  }
  if (filters.assignee_user_id) {
    params.push(filters.assignee_user_id);
    where.push(`t.assignee_user_id = $${params.length}`);
  }
  if (filters.contact_id) {
    params.push(filters.contact_id);
    where.push(`t.contact_id = $${params.length}`);
  }
  if (filters.priority_id) {
    params.push(filters.priority_id);
    where.push(`t.priority_id = $${params.length}`);
  }
  if (filters.open_only) {
    where.push(`s.is_closed = FALSE`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where.push(`(t.subject ILIKE $${params.length} OR t.ticket_number ILIKE $${params.length})`);
  }

  const sql = `${LIST_SELECT}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY s.is_closed ASC, t.created_at DESC
    LIMIT 500`;
  const { rows } = await db.query<TicketListItem>(sql, params);
  return rows;
}

export async function getTicket(id: number): Promise<TicketListItem | null> {
  const db = await getDatabase();
  const { rows } = await db.query<TicketListItem>(
    `${LIST_SELECT} WHERE t.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export interface UpdateTicketInput {
  subject?: string;
  description?: string | null;
  contact_id?: number | null;
  assignee_user_id?: number | null;
  team_id?: number | null;
  status_id?: number;
  priority_id?: number;
  sla_policy_id?: number | null;
}

const UPDATE_FIELDS: (keyof UpdateTicketInput)[] = [
  'subject',
  'description',
  'contact_id',
  'assignee_user_id',
  'team_id',
  'status_id',
  'priority_id',
  'sla_policy_id',
];

export async function updateTicket(
  id: number,
  input: UpdateTicketInput,
  actorUserId: number | null
): Promise<Ticket> {
  const db = await getDatabase();
  const existingRes = await db.query<Ticket>(`SELECT * FROM tickets WHERE id = $1`, [id]);
  const existing = existingRes.rows[0];
  if (!existing) throw new Error('Ticket not found');

  const updates: Record<string, unknown> = {};
  for (const f of UPDATE_FIELDS) {
    if (f in input && input[f] !== undefined) updates[f] = input[f];
  }
  if (Object.keys(updates).length === 0) return existing;

  // Auto-stamp resolved_at / closed_at on status transition.
  if ('status_id' in updates && updates.status_id !== existing.status_id) {
    const { rows: statusRows } = await db.query<{ is_closed: boolean; name: string }>(
      `SELECT is_closed, name FROM ticket_statuses WHERE id = $1`,
      [updates.status_id]
    );
    const newStatus = statusRows[0];
    if (newStatus?.is_closed) {
      if (!existing.resolved_at) updates.resolved_at = new Date();
      if (newStatus.name.toLowerCase() === 'closed') updates.closed_at = new Date();
    } else {
      updates.resolved_at = null;
      updates.closed_at = null;
    }
  }

  const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`);
  const values = Object.values(updates);
  values.push(id);

  const { rows } = await db.query<Ticket>(
    `UPDATE tickets SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length} RETURNING *`,
    values
  );
  const updated = rows[0];

  // Activity entries for the noteworthy field changes
  const noteworthy: { action: string; field: keyof Ticket }[] = [
    { action: 'status_changed',   field: 'status_id' },
    { action: 'priority_changed', field: 'priority_id' },
    { action: 'assigned',         field: 'assignee_user_id' },
    { action: 'team_changed',     field: 'team_id' },
    { action: 'sla_changed',      field: 'sla_policy_id' },
  ];
  for (const { action, field } of noteworthy) {
    if (field in updates && existing[field] !== updated[field]) {
      await logActivity(
        id,
        actorUserId,
        action,
        field,
        existing[field] === null ? null : String(existing[field]),
        updated[field] === null ? null : String(updated[field])
      );
    }
  }
  return updated;
}

export async function deleteTicket(id: number): Promise<boolean> {
  const db = await getDatabase();
  const { rowCount } = await db.query(`DELETE FROM tickets WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  author_user_id: number | null;
  author_name: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export async function listComments(ticketId: number): Promise<TicketComment[]> {
  const db = await getDatabase();
  const { rows } = await db.query<TicketComment>(
    `SELECT c.id, c.ticket_id, c.author_user_id, u.full_name AS author_name,
            c.body, c.is_internal, c.created_at
       FROM ticket_comments c
       LEFT JOIN users u ON u.id = c.author_user_id
      WHERE c.ticket_id = $1
      ORDER BY c.created_at ASC`,
    [ticketId]
  );
  return rows;
}

export async function addComment(
  ticketId: number,
  body: string,
  authorUserId: number | null,
  isInternal: boolean
): Promise<TicketComment> {
  const db = await getDatabase();
  const { rows } = await db.query<TicketComment>(
    `INSERT INTO ticket_comments (ticket_id, author_user_id, body, is_internal)
     VALUES ($1, $2, $3, $4)
     RETURNING id, ticket_id, author_user_id, body, is_internal, created_at`,
    [ticketId, authorUserId, body, isInternal]
  );
  const comment = rows[0];

  // First customer-facing reply marks the SLA first-response timestamp.
  if (!isInternal) {
    await db.query(
      `UPDATE tickets
          SET first_response_at = COALESCE(first_response_at, CURRENT_TIMESTAMP),
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
      [ticketId]
    );
  } else {
    await db.query(`UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [ticketId]);
  }

  await logActivity(ticketId, authorUserId, isInternal ? 'note_added' : 'replied', null, null, null);

  // Hydrate author_name for the return value
  if (authorUserId) {
    const { rows: u } = await db.query<{ full_name: string }>(
      `SELECT full_name FROM users WHERE id = $1`,
      [authorUserId]
    );
    return { ...comment, author_name: u[0]?.full_name ?? null };
  }
  return { ...comment, author_name: null };
}

export interface TicketActivityRow {
  id: number;
  ticket_id: number;
  user_id: number | null;
  user_name: string | null;
  action: string;
  field: string | null;
  from_value: string | null;
  to_value: string | null;
  created_at: string;
}

export async function listActivity(ticketId: number): Promise<TicketActivityRow[]> {
  const db = await getDatabase();
  const { rows } = await db.query<TicketActivityRow>(
    `SELECT a.id, a.ticket_id, a.user_id, u.full_name AS user_name,
            a.action, a.field, a.from_value, a.to_value, a.created_at
       FROM ticket_activity a
       LEFT JOIN users u ON u.id = a.user_id
      WHERE a.ticket_id = $1
      ORDER BY a.created_at ASC`,
    [ticketId]
  );
  return rows;
}

async function logActivity(
  ticketId: number,
  userId: number | null,
  action: string,
  field: string | null,
  fromValue: string | null,
  toValue: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.query(
    `INSERT INTO ticket_activity (ticket_id, user_id, action, field, from_value, to_value)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [ticketId, userId, action, field, fromValue, toValue]
  );
}
