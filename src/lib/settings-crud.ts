import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

/**
 * Generic CRUD helpers for the simple ticket settings tables. Each call
 * validates the table name against an allow-list and a column allow-list to
 * avoid SQL injection — only the listed fields can be inserted/updated.
 */

export interface TableSpec {
  table: string;
  insertColumns: string[];          // columns allowed on POST
  updateColumns: string[];          // columns allowed on PATCH
  selectColumns: string;            // comma-separated SELECT clause
  defaultOrderBy: string;
}

export async function listRows(spec: TableSpec) {
  const db = await getDatabase();
  const { rows } = await db.query(
    `SELECT ${spec.selectColumns} FROM ${spec.table} ORDER BY ${spec.defaultOrderBy}`
  );
  return NextResponse.json(rows);
}

export async function insertRow(req: NextRequest, spec: TableSpec) {
  try {
    const body = await req.json();
    const cols: string[] = [];
    const vals: unknown[] = [];
    for (const c of spec.insertColumns) {
      if (c in body && body[c] !== undefined) {
        cols.push(c);
        vals.push(body[c]);
      }
    }
    if (cols.length === 0) {
      return NextResponse.json({ error: 'No valid fields supplied' }, { status: 400 });
    }
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const db = await getDatabase();
    const { rows } = await db.query(
      `INSERT INTO ${spec.table} (${cols.join(', ')}) VALUES (${placeholders})
       RETURNING ${spec.selectColumns}`,
      vals
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function updateRow(req: NextRequest, spec: TableSpec, id: number) {
  try {
    const body = await req.json();
    const setParts: string[] = [];
    const vals: unknown[] = [];
    for (const c of spec.updateColumns) {
      if (c in body && body[c] !== undefined) {
        vals.push(body[c]);
        setParts.push(`${c} = $${vals.length}`);
      }
    }
    if (setParts.length === 0) {
      return NextResponse.json({ error: 'No valid fields supplied' }, { status: 400 });
    }
    vals.push(id);
    const db = await getDatabase();
    const { rows } = await db.query(
      `UPDATE ${spec.table} SET ${setParts.join(', ')}
        WHERE id = $${vals.length}
        RETURNING ${spec.selectColumns}`,
      vals
    );
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function deleteRow(spec: TableSpec, id: number) {
  const db = await getDatabase();
  const { rowCount } = await db.query(`DELETE FROM ${spec.table} WHERE id = $1`, [id]);
  if (!rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export const SPEC_STATUSES: TableSpec = {
  table: 'ticket_statuses',
  insertColumns: ['name', 'color', 'sort_order', 'is_closed', 'is_default'],
  updateColumns: ['name', 'color', 'sort_order', 'is_closed', 'is_default'],
  selectColumns: 'id, name, color, sort_order, is_closed, is_default, created_at',
  defaultOrderBy: 'sort_order ASC, id ASC',
};

export const SPEC_PRIORITIES: TableSpec = {
  table: 'ticket_priorities',
  insertColumns: [
    'name',
    'color',
    'sort_order',
    'is_default',
    'default_response_minutes',
    'default_resolution_minutes',
  ],
  updateColumns: [
    'name',
    'color',
    'sort_order',
    'is_default',
    'default_response_minutes',
    'default_resolution_minutes',
  ],
  selectColumns:
    'id, name, color, sort_order, is_default, default_response_minutes, default_resolution_minutes, created_at',
  defaultOrderBy: 'sort_order ASC, id ASC',
};

export const SPEC_SLA: TableSpec = {
  table: 'sla_policies',
  insertColumns: ['name', 'description', 'response_minutes', 'resolution_minutes', 'is_default'],
  updateColumns: ['name', 'description', 'response_minutes', 'resolution_minutes', 'is_default'],
  selectColumns: 'id, name, description, response_minutes, resolution_minutes, is_default, created_at',
  defaultOrderBy: 'is_default DESC, name ASC',
};

export function parseId(idStr: string): number | null {
  const id = Number(idStr);
  return Number.isInteger(id) ? id : null;
}
