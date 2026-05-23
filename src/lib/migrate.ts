/**
 * Shared SQL migration runner. Discovers files in the `migrations/` directory,
 * applies any that haven't been recorded in `schema_migrations`, and is safe
 * to invoke from multiple DB modules — only the first caller for a given file
 * actually applies it.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { PoolClient } from 'pg';

export async function runMigrations(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = join(process.cwd(), 'migrations');
  if (!existsSync(migrationsDir)) return;

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await client.query(
      'SELECT 1 FROM schema_migrations WHERE name = $1',
      [file]
    );
    if (rows.length) continue;
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    console.log(`Applied migration: ${file}`);
  }
}
