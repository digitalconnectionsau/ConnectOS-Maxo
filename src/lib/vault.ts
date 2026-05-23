import { getDatabase } from './database';
import { encryptSecret, decryptSecret } from './secret-crypto';

export interface VaultItemSummary {
  id: number;
  name: string;
  item_type: string;
  username: string | null;
  url: string | null;
  folder: string | null;
  tags: string[] | null;
  contact_id: number | null;
  contact_name?: string | null;
  has_password: boolean;
  has_notes: boolean;
  updated_at: string;
}

export interface VaultItemFull extends VaultItemSummary {
  password: string | null;
  notes: string | null;
}

const LIST_SELECT = `
  SELECT v.id, v.name, v.item_type, v.username, v.url, v.folder, v.tags,
         v.contact_id, c.name AS contact_name,
         (v.password_encrypted IS NOT NULL) AS has_password,
         (v.notes_encrypted IS NOT NULL) AS has_notes,
         v.updated_at
    FROM vault_items v
    LEFT JOIN contacts c ON c.id = v.contact_id
`;

export async function listVaultItems(filter: { search?: string; folder?: string; contact_id?: number } = {}): Promise<VaultItemSummary[]> {
  const db = await getDatabase();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.search) {
    params.push(`%${filter.search}%`);
    where.push(`(v.name ILIKE $${params.length} OR v.username ILIKE $${params.length} OR v.url ILIKE $${params.length})`);
  }
  if (filter.folder) { params.push(filter.folder); where.push(`v.folder = $${params.length}`); }
  if (filter.contact_id) { params.push(filter.contact_id); where.push(`v.contact_id = $${params.length}`); }
  const sql = `${LIST_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY v.name LIMIT 1000`;
  const { rows } = await db.query<VaultItemSummary>(sql, params);
  return rows;
}

export interface VaultCreateInput {
  name: string;
  item_type?: string;
  username?: string | null;
  password?: string | null;
  url?: string | null;
  notes?: string | null;
  contact_id?: number | null;
  folder?: string | null;
  tags?: string[] | null;
}

export async function createVaultItem(input: VaultCreateInput, userId: number | null): Promise<VaultItemSummary> {
  if (!input.name?.trim()) throw new Error('name is required');
  const db = await getDatabase();
  const password_encrypted = input.password ? encryptSecret(input.password) : null;
  const notes_encrypted = input.notes ? encryptSecret(input.notes) : null;
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO vault_items
       (name, item_type, username, password_encrypted, url, notes_encrypted,
        contact_id, folder, tags, created_by, updated_by)
     VALUES ($1,COALESCE($2,'login'),$3,$4,$5,$6,$7,$8,$9,$10,$10)
     RETURNING id`,
    [
      input.name.trim(), input.item_type, input.username ?? null,
      password_encrypted, input.url ?? null, notes_encrypted,
      input.contact_id ?? null, input.folder ?? null, input.tags ?? null,
      userId,
    ]
  );
  await audit(rows[0].id, userId, 'create');
  const items = await listVaultItems({});
  return items.find((i) => i.id === rows[0].id)!;
}

export async function updateVaultItem(id: number, patch: VaultCreateInput, userId: number | null): Promise<void> {
  const db = await getDatabase();
  const sets: string[] = [];
  const params: unknown[] = [];
  function push(field: string, value: unknown) { params.push(value); sets.push(`${field} = $${params.length}`); }
  if (patch.name !== undefined) push('name', patch.name);
  if (patch.item_type !== undefined) push('item_type', patch.item_type);
  if (patch.username !== undefined) push('username', patch.username);
  if (patch.password !== undefined) push('password_encrypted', patch.password ? encryptSecret(patch.password) : null);
  if (patch.url !== undefined) push('url', patch.url);
  if (patch.notes !== undefined) push('notes_encrypted', patch.notes ? encryptSecret(patch.notes) : null);
  if (patch.contact_id !== undefined) push('contact_id', patch.contact_id);
  if (patch.folder !== undefined) push('folder', patch.folder);
  if (patch.tags !== undefined) push('tags', patch.tags);
  if (!sets.length) return;
  push('updated_by', userId);
  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);
  await db.query(`UPDATE vault_items SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  await audit(id, userId, 'update');
}

export async function deleteVaultItem(id: number, userId: number | null): Promise<void> {
  const db = await getDatabase();
  await audit(id, userId, 'delete');
  await db.query(`DELETE FROM vault_items WHERE id = $1`, [id]);
}

/**
 * Reveal the decrypted secret. ALWAYS audited.
 */
export async function revealVaultItem(id: number, userId: number | null, ip: string | null): Promise<VaultItemFull | null> {
  const db = await getDatabase();
  const { rows } = await db.query<{
    id: number; name: string; item_type: string; username: string | null; url: string | null;
    folder: string | null; tags: string[] | null; contact_id: number | null;
    password_encrypted: string | null; notes_encrypted: string | null;
    updated_at: string; contact_name: string | null;
  }>(
    `SELECT v.id, v.name, v.item_type, v.username, v.url, v.folder, v.tags, v.contact_id,
            v.password_encrypted, v.notes_encrypted, v.updated_at,
            c.name AS contact_name
       FROM vault_items v
       LEFT JOIN contacts c ON c.id = v.contact_id
      WHERE v.id = $1`,
    [id]
  );
  const r = rows[0];
  if (!r) return null;
  await audit(id, userId, 'reveal', ip);
  return {
    id: r.id, name: r.name, item_type: r.item_type, username: r.username, url: r.url,
    folder: r.folder, tags: r.tags, contact_id: r.contact_id, contact_name: r.contact_name,
    has_password: r.password_encrypted != null, has_notes: r.notes_encrypted != null,
    updated_at: r.updated_at,
    password: r.password_encrypted ? decryptSecret(r.password_encrypted) : null,
    notes: r.notes_encrypted ? decryptSecret(r.notes_encrypted) : null,
  };
}

async function audit(itemId: number, userId: number | null, action: string, ip: string | null = null): Promise<void> {
  const db = await getDatabase();
  await db.query(
    `INSERT INTO vault_audit (item_id, user_id, action, ip) VALUES ($1,$2,$3,$4)`,
    [itemId, userId, action, ip]
  );
}

export async function getVaultAudit(itemId: number, limit = 50): Promise<Array<{ id: number; action: string; user_id: number | null; ip: string | null; created_at: string }>> {
  const db = await getDatabase();
  const { rows } = await db.query(
    `SELECT id, action, user_id, ip, created_at
       FROM vault_audit WHERE item_id = $1 ORDER BY id DESC LIMIT $2`,
    [itemId, limit]
  );
  return rows as Array<{ id: number; action: string; user_id: number | null; ip: string | null; created_at: string }>;
}
