-- ClientHub migration 002
-- Adds:
--   * sync_to_quickbooks flag on contacts (controls per-contact sync behaviour)
--   * products table (synced from QBO Items)
--
-- A contact with sync_to_quickbooks = TRUE is treated as a Customer:
--   - pulled-from-QBO contacts are automatically TRUE
--   - manually created contacts default to FALSE (leads)
--   - flipping the toggle ON pushes them to QBO and stores quickbooks_id
--   - flipping OFF stops future updates being pushed (record is not deleted in QBO)

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS sync_to_quickbooks BOOLEAN NOT NULL DEFAULT FALSE;

-- Anything that already has a QBO id is, by definition, synced.
UPDATE contacts SET sync_to_quickbooks = TRUE WHERE quickbooks_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_sync_to_qbo ON contacts(sync_to_quickbooks);

-- Ensure active column exists if products was pre-created by inline schema without it.
ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS taxable BOOLEAN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS quickbooks_id VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS quickbooks_sync_token VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS income_account_ref VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Products / services. Mirrors QBO "Item" entities.
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  description TEXT,
  unit_price NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'AUD',
  product_type VARCHAR(50),                 -- 'Service' | 'NonInventory' | 'Inventory'
  active BOOLEAN NOT NULL DEFAULT TRUE,
  taxable BOOLEAN,
  quickbooks_id VARCHAR(50) UNIQUE,
  quickbooks_sync_token VARCHAR(20),
  income_account_ref VARCHAR(50),
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_name   ON products(name);
