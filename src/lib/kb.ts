import { getDatabase } from './database';

export interface KbCategory {
  id: number; name: string; slug: string; parent_id: number | null; sort_order: number;
}
export interface KbArticleSummary {
  id: number; title: string; slug: string; excerpt: string | null; status: string;
  visibility: string; tags: string[] | null; category_id: number | null;
  category_name?: string | null; view_count: number; updated_at: string; published_at: string | null;
}
export interface KbArticle extends KbArticleSummary {
  body: string;
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 200) || `article-${Date.now()}`;
}

export async function listCategories(): Promise<KbCategory[]> {
  const db = await getDatabase();
  const { rows } = await db.query<KbCategory>(`SELECT id,name,slug,parent_id,sort_order FROM kb_categories ORDER BY sort_order,name`);
  return rows;
}

export async function createCategory(name: string, parent_id: number | null = null): Promise<KbCategory> {
  const db = await getDatabase();
  let slug = slugify(name);
  // Uniqueness retry.
  const { rows: existing } = await db.query<{ slug: string }>(`SELECT slug FROM kb_categories WHERE slug LIKE $1`, [`${slug}%`]);
  if (existing.some((r) => r.slug === slug)) slug = `${slug}-${Date.now().toString(36)}`;
  const { rows } = await db.query<KbCategory>(
    `INSERT INTO kb_categories (name, slug, parent_id) VALUES ($1,$2,$3)
     RETURNING id,name,slug,parent_id,sort_order`,
    [name, slug, parent_id]
  );
  return rows[0];
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDatabase();
  await db.query(`DELETE FROM kb_categories WHERE id = $1`, [id]);
}

const LIST_SELECT = `
  SELECT a.id, a.title, a.slug, a.excerpt, a.status, a.visibility, a.tags,
         a.category_id, c.name AS category_name, a.view_count, a.updated_at, a.published_at
    FROM kb_articles a
    LEFT JOIN kb_categories c ON c.id = a.category_id
`;

export async function listArticles(filter: { status?: string; category_id?: number; search?: string } = {}): Promise<KbArticleSummary[]> {
  const db = await getDatabase();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.status) { params.push(filter.status); where.push(`a.status = $${params.length}`); }
  if (filter.category_id) { params.push(filter.category_id); where.push(`a.category_id = $${params.length}`); }
  let order = `a.updated_at DESC`;
  if (filter.search) {
    params.push(filter.search);
    where.push(`a.search_tsv @@ plainto_tsquery('english', $${params.length})`);
    order = `ts_rank(a.search_tsv, plainto_tsquery('english', $${params.length})) DESC, a.updated_at DESC`;
  }
  const sql = `${LIST_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order} LIMIT 200`;
  const { rows } = await db.query<KbArticleSummary>(sql, params);
  return rows;
}

export async function getArticle(idOrSlug: string | number, incrementViews = false): Promise<KbArticle | null> {
  const db = await getDatabase();
  const isNum = typeof idOrSlug === 'number' || /^\d+$/.test(String(idOrSlug));
  const { rows } = await db.query<KbArticle>(
    `SELECT a.id, a.title, a.slug, a.excerpt, a.status, a.visibility, a.tags,
            a.category_id, c.name AS category_name, a.view_count,
            a.updated_at, a.published_at, a.body
       FROM kb_articles a
       LEFT JOIN kb_categories c ON c.id = a.category_id
      WHERE ${isNum ? 'a.id = $1' : 'a.slug = $1'}`,
    [idOrSlug]
  );
  if (!rows.length) return null;
  if (incrementViews) await db.query(`UPDATE kb_articles SET view_count = view_count + 1 WHERE id = $1`, [rows[0].id]);
  return rows[0];
}

export interface CreateArticleInput {
  title: string; body?: string; excerpt?: string | null; category_id?: number | null;
  status?: 'draft' | 'published' | 'archived'; visibility?: 'internal' | 'public';
  tags?: string[] | null;
}

export async function createArticle(input: CreateArticleInput, userId: number | null): Promise<KbArticle> {
  if (!input.title?.trim()) throw new Error('Title is required');
  const db = await getDatabase();
  let slug = slugify(input.title);
  const { rows: existing } = await db.query<{ slug: string }>(`SELECT slug FROM kb_articles WHERE slug LIKE $1`, [`${slug}%`]);
  if (existing.some((r) => r.slug === slug)) slug = `${slug}-${Date.now().toString(36)}`;
  const publishing = input.status === 'published';
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO kb_articles (title, slug, body, excerpt, category_id, status, visibility, tags, created_by, updated_by, published_at)
     VALUES ($1,$2,$3,$4,$5,COALESCE($6,'draft'),COALESCE($7,'internal'),$8,$9,$9,$10)
     RETURNING id`,
    [
      input.title.trim(), slug, input.body ?? '', input.excerpt ?? null,
      input.category_id ?? null, input.status, input.visibility, input.tags ?? null,
      userId, publishing ? new Date() : null,
    ]
  );
  return (await getArticle(rows[0].id))!;
}

export async function updateArticle(id: number, patch: CreateArticleInput, userId: number | null): Promise<KbArticle | null> {
  const db = await getDatabase();
  const sets: string[] = [];
  const params: unknown[] = [];
  function push(field: string, value: unknown) { params.push(value); sets.push(`${field} = $${params.length}`); }
  if (patch.title !== undefined) push('title', patch.title);
  if (patch.body !== undefined) push('body', patch.body);
  if (patch.excerpt !== undefined) push('excerpt', patch.excerpt);
  if (patch.category_id !== undefined) push('category_id', patch.category_id);
  if (patch.status !== undefined) {
    push('status', patch.status);
    if (patch.status === 'published') sets.push(`published_at = COALESCE(published_at, CURRENT_TIMESTAMP)`);
  }
  if (patch.visibility !== undefined) push('visibility', patch.visibility);
  if (patch.tags !== undefined) push('tags', patch.tags);
  if (!sets.length) return getArticle(id);
  push('updated_by', userId);
  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);
  await db.query(`UPDATE kb_articles SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  return getArticle(id);
}

export async function deleteArticle(id: number): Promise<void> {
  const db = await getDatabase();
  await db.query(`DELETE FROM kb_articles WHERE id = $1`, [id]);
}

/** For AI RAG: top-N published articles matching a query. */
export async function ragSearch(query: string, limit = 3): Promise<Array<{ id: number; title: string; excerpt: string | null; body: string }>> {
  if (!query.trim()) return [];
  const db = await getDatabase();
  const { rows } = await db.query<{ id: number; title: string; excerpt: string | null; body: string }>(
    `SELECT id, title, excerpt, body
       FROM kb_articles
      WHERE status = 'published'
        AND search_tsv @@ plainto_tsquery('english', $1)
      ORDER BY ts_rank(search_tsv, plainto_tsquery('english', $1)) DESC
      LIMIT $2`,
    [query, limit]
  );
  return rows;
}
