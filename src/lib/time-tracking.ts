import { getDatabase } from './database';

export interface TimeEntry {
  id: number;
  user_id: number | null;
  user_name?: string | null;
  project_id: number | null;
  project_name?: string | null;
  ticket_id: number | null;
  ticket_number?: string | null;
  description: string | null;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  billable: boolean;
  hourly_rate: string | null;
  source: 'timer' | 'manual';
  invoiced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActiveTimer {
  user_id: number;
  started_at: string;
  project_id: number | null;
  project_name?: string | null;
  ticket_id: number | null;
  ticket_number?: string | null;
  description: string | null;
}

const ENTRY_SELECT = `
  SELECT te.*, u.full_name AS user_name, p.name AS project_name, t.ticket_number
    FROM time_entries te
    LEFT JOIN users u    ON u.id = te.user_id
    LEFT JOIN projects p ON p.id = te.project_id
    LEFT JOIN tickets t  ON t.id = te.ticket_id
`;

export interface ListFilter {
  user_id?: number | null;
  project_id?: number | null;
  ticket_id?: number | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
}

export async function listTimeEntries(filter: ListFilter = {}): Promise<TimeEntry[]> {
  const db = await getDatabase();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.user_id != null) {
    params.push(filter.user_id);
    where.push(`te.user_id = $${params.length}`);
  }
  if (filter.project_id != null) {
    params.push(filter.project_id);
    where.push(`te.project_id = $${params.length}`);
  }
  if (filter.ticket_id != null) {
    params.push(filter.ticket_id);
    where.push(`te.ticket_id = $${params.length}`);
  }
  if (filter.from) {
    params.push(filter.from);
    where.push(`te.started_at >= $${params.length}`);
  }
  if (filter.to) {
    params.push(filter.to);
    where.push(`te.started_at < $${params.length}`);
  }
  const limit = Math.min(filter.limit ?? 200, 1000);
  const sql = `${ENTRY_SELECT}
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY te.started_at DESC
    LIMIT ${limit}`;
  const { rows } = await db.query<TimeEntry>(sql, params);
  return rows;
}

export async function getTimeEntry(id: number): Promise<TimeEntry | null> {
  const db = await getDatabase();
  const { rows } = await db.query<TimeEntry>(`${ENTRY_SELECT} WHERE te.id = $1`, [id]);
  return rows[0] ?? null;
}

export interface CreateEntryInput {
  user_id: number | null;
  project_id?: number | null;
  ticket_id?: number | null;
  description?: string | null;
  started_at: string | Date;
  ended_at: string | Date;
  billable?: boolean;
  hourly_rate?: number | string | null;
  source?: 'timer' | 'manual';
}

function toDate(v: string | Date): Date {
  return v instanceof Date ? v : new Date(v);
}

export async function createTimeEntry(input: CreateEntryInput): Promise<TimeEntry> {
  const started = toDate(input.started_at);
  const ended = toDate(input.ended_at);
  if (!(started.getTime() < ended.getTime())) {
    throw new Error('ended_at must be after started_at');
  }
  const duration = Math.round((ended.getTime() - started.getTime()) / 1000);
  const db = await getDatabase();

  // If hourly_rate not provided but project has one, snapshot it.
  let hourlyRate = input.hourly_rate;
  if (hourlyRate == null && input.project_id != null) {
    const { rows } = await db.query<{ hourly_rate: string | null }>(
      `SELECT hourly_rate FROM projects WHERE id = $1`,
      [input.project_id]
    );
    hourlyRate = rows[0]?.hourly_rate ?? null;
  }

  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO time_entries
       (user_id, project_id, ticket_id, description, started_at, ended_at,
        duration_seconds, billable, hourly_rate, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,TRUE),$9,COALESCE($10,'manual'))
     RETURNING id`,
    [
      input.user_id,
      input.project_id ?? null,
      input.ticket_id ?? null,
      input.description ?? null,
      started,
      ended,
      duration,
      input.billable ?? true,
      hourlyRate ?? null,
      input.source ?? 'manual',
    ]
  );
  return (await getTimeEntry(rows[0].id))!;
}

export async function updateTimeEntry(
  id: number,
  patch: Partial<CreateEntryInput>
): Promise<TimeEntry | null> {
  const db = await getDatabase();
  const current = await getTimeEntry(id);
  if (!current) return null;

  const started = patch.started_at != null ? toDate(patch.started_at) : new Date(current.started_at);
  const ended = patch.ended_at != null ? toDate(patch.ended_at) : new Date(current.ended_at);
  if (!(started.getTime() < ended.getTime())) {
    throw new Error('ended_at must be after started_at');
  }
  const duration = Math.round((ended.getTime() - started.getTime()) / 1000);

  await db.query(
    `UPDATE time_entries SET
        project_id  = $1,
        ticket_id   = $2,
        description = $3,
        started_at  = $4,
        ended_at    = $5,
        duration_seconds = $6,
        billable    = $7,
        hourly_rate = $8,
        updated_at  = CURRENT_TIMESTAMP
      WHERE id = $9`,
    [
      patch.project_id !== undefined ? patch.project_id : current.project_id,
      patch.ticket_id !== undefined ? patch.ticket_id : current.ticket_id,
      patch.description !== undefined ? patch.description : current.description,
      started,
      ended,
      duration,
      patch.billable !== undefined ? patch.billable : current.billable,
      patch.hourly_rate !== undefined ? patch.hourly_rate : current.hourly_rate,
      id,
    ]
  );
  return getTimeEntry(id);
}

export async function deleteTimeEntry(id: number): Promise<void> {
  const db = await getDatabase();
  await db.query(`DELETE FROM time_entries WHERE id = $1`, [id]);
}

/* ----------------------------- Active timer ------------------------------- */

export async function getActiveTimer(userId: number): Promise<ActiveTimer | null> {
  const db = await getDatabase();
  const { rows } = await db.query<ActiveTimer>(
    `SELECT ts.*, p.name AS project_name, t.ticket_number
       FROM timer_state ts
       LEFT JOIN projects p ON p.id = ts.project_id
       LEFT JOIN tickets  t ON t.id = ts.ticket_id
      WHERE ts.user_id = $1`,
    [userId]
  );
  return rows[0] ?? null;
}

export async function startTimer(input: {
  user_id: number;
  project_id?: number | null;
  ticket_id?: number | null;
  description?: string | null;
}): Promise<ActiveTimer> {
  const db = await getDatabase();
  await db.query(
    `INSERT INTO timer_state (user_id, started_at, project_id, ticket_id, description)
     VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       started_at  = EXCLUDED.started_at,
       project_id  = EXCLUDED.project_id,
       ticket_id   = EXCLUDED.ticket_id,
       description = EXCLUDED.description`,
    [input.user_id, input.project_id ?? null, input.ticket_id ?? null, input.description ?? null]
  );
  return (await getActiveTimer(input.user_id))!;
}

/**
 * Stop the user's active timer and persist a time_entry. Returns null if no
 * timer was running. Discards intervals under 5 seconds (likely accidental).
 */
export async function stopTimer(userId: number): Promise<TimeEntry | null> {
  const db = await getDatabase();
  const active = await getActiveTimer(userId);
  if (!active) return null;
  await db.query(`DELETE FROM timer_state WHERE user_id = $1`, [userId]);

  const started = new Date(active.started_at);
  const ended = new Date();
  if (ended.getTime() - started.getTime() < 5000) return null;

  return createTimeEntry({
    user_id: userId,
    project_id: active.project_id,
    ticket_id: active.ticket_id,
    description: active.description,
    started_at: started,
    ended_at: ended,
    source: 'timer',
  });
}

export async function cancelTimer(userId: number): Promise<void> {
  const db = await getDatabase();
  await db.query(`DELETE FROM timer_state WHERE user_id = $1`, [userId]);
}
