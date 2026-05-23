import { getDatabase } from './database';

export interface Project {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  client_contact_id: number | null;
  client_name?: string | null;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  hourly_rate: string | null;
  billable: boolean;
  color: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

const LIST_SELECT = `
  SELECT p.*, c.name AS client_name
    FROM projects p
    LEFT JOIN contacts c ON c.id = p.client_contact_id
`;

export async function listProjects(opts: { status?: string; search?: string } = {}): Promise<Project[]> {
  const db = await getDatabase();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.status) {
    params.push(opts.status);
    where.push(`p.status = $${params.length}`);
  }
  if (opts.search) {
    params.push(`%${opts.search}%`);
    where.push(`(p.name ILIKE $${params.length} OR p.code ILIKE $${params.length})`);
  }
  const sql = `${LIST_SELECT}
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY CASE p.status WHEN 'active' THEN 0 WHEN 'on_hold' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END,
             p.name ASC`;
  const { rows } = await db.query<Project>(sql, params);
  return rows;
}

export async function getProject(id: number): Promise<Project | null> {
  const db = await getDatabase();
  const { rows } = await db.query<Project>(`${LIST_SELECT} WHERE p.id = $1`, [id]);
  return rows[0] ?? null;
}

export interface ProjectInput {
  name: string;
  code?: string | null;
  description?: string | null;
  client_contact_id?: number | null;
  status?: Project['status'];
  hourly_rate?: number | string | null;
  billable?: boolean;
  color?: string | null;
}

export async function createProject(input: ProjectInput, createdBy: number | null): Promise<Project> {
  if (!input.name || !input.name.trim()) throw new Error('name is required');
  const db = await getDatabase();
  const { rows } = await db.query<Project>(
    `INSERT INTO projects
       (name, code, description, client_contact_id, status, hourly_rate, billable, color, created_by)
     VALUES ($1,$2,$3,$4,COALESCE($5,'active'),$6,COALESCE($7,TRUE),$8,$9)
     RETURNING *`,
    [
      input.name.trim(),
      input.code?.trim() || null,
      input.description?.trim() || null,
      input.client_contact_id ?? null,
      input.status ?? 'active',
      input.hourly_rate ?? null,
      input.billable ?? true,
      input.color ?? null,
      createdBy,
    ]
  );
  const created = rows[0];
  return (await getProject(created.id))!;
}

const EDITABLE_FIELDS = [
  'name', 'code', 'description', 'client_contact_id',
  'status', 'hourly_rate', 'billable', 'color',
] as const;

export async function updateProject(id: number, patch: Partial<ProjectInput>): Promise<Project | null> {
  const db = await getDatabase();
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const field of EDITABLE_FIELDS) {
    if (field in patch) {
      params.push((patch as Record<string, unknown>)[field]);
      sets.push(`${field} = $${params.length}`);
    }
  }
  if (!sets.length) return getProject(id);
  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);
  await db.query(`UPDATE projects SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  return getProject(id);
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDatabase();
  await db.query(`DELETE FROM projects WHERE id = $1`, [id]);
}

export interface ProjectStats {
  total_seconds: number;
  billable_seconds: number;
  revenue: number;
  entry_count: number;
}

export async function getProjectStats(id: number): Promise<ProjectStats> {
  const db = await getDatabase();
  const { rows } = await db.query<{
    total_seconds: string | null;
    billable_seconds: string | null;
    revenue: string | null;
    entry_count: string;
  }>(
    `SELECT
       COALESCE(SUM(duration_seconds), 0)::text AS total_seconds,
       COALESCE(SUM(CASE WHEN billable THEN duration_seconds ELSE 0 END), 0)::text AS billable_seconds,
       COALESCE(SUM(CASE WHEN billable THEN (duration_seconds::numeric / 3600) * COALESCE(hourly_rate, 0) ELSE 0 END), 0)::text AS revenue,
       COUNT(*)::text AS entry_count
     FROM time_entries
     WHERE project_id = $1`,
    [id]
  );
  const r = rows[0];
  return {
    total_seconds: Number(r.total_seconds ?? 0),
    billable_seconds: Number(r.billable_seconds ?? 0),
    revenue: Number(r.revenue ?? 0),
    entry_count: Number(r.entry_count ?? 0),
  };
}
