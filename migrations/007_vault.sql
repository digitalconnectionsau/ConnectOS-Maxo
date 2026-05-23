-- Phase 6: Encrypted password vault
-- All sensitive fields are stored as AES-256-GCM ciphertext (secret-crypto.ts).

CREATE TABLE IF NOT EXISTS vault_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  item_type VARCHAR(20) NOT NULL DEFAULT 'login',  -- login | note | card | key
  username VARCHAR(255),
  password_encrypted TEXT,
  url VARCHAR(1000),
  notes_encrypted TEXT,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  folder VARCHAR(120),
  tags TEXT[],
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vault_items_name    ON vault_items(name);
CREATE INDEX IF NOT EXISTS idx_vault_items_folder  ON vault_items(folder);
CREATE INDEX IF NOT EXISTS idx_vault_items_contact ON vault_items(contact_id);

CREATE TABLE IF NOT EXISTS vault_audit (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES vault_items(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL, -- view | create | update | delete | reveal | copy
  ip VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vault_audit_item ON vault_audit(item_id);
CREATE INDEX IF NOT EXISTS idx_vault_audit_user ON vault_audit(user_id);
