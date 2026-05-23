-- Phase 5: Invoicing
--
-- The legacy `invoices` table (inline init in database.ts) and the legacy
-- `products` table use different column names than what the QBO + time-entry
-- workflows need. This migration is additive — every change uses
-- ALTER ... ADD COLUMN IF NOT EXISTS so it's safe to re-run.

------------------------------------------------------------------------------
-- products: align with QBO Items
------------------------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku                   VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price            NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS active                BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS taxable               BOOLEAN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS quickbooks_id         VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS quickbooks_sync_token VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS income_account_ref    VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_synced_at        TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Backfill unit_price from the legacy `price` column where available.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'products' AND column_name = 'price') THEN
    EXECUTE 'UPDATE products SET unit_price = price WHERE unit_price IS NULL AND price IS NOT NULL';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_qbo_unique
  ON products(quickbooks_id) WHERE quickbooks_id IS NOT NULL;

------------------------------------------------------------------------------
-- invoices: QBO linkage, project linkage, billing address, notes, issued date
------------------------------------------------------------------------------
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_id            INTEGER REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS quickbooks_id         VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS quickbooks_sync_token VARCHAR(20);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_synced_at        TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_date           DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes                 TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_address       TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_qbo_unique
  ON invoices(quickbooks_id) WHERE quickbooks_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status  ON invoices(status);

-- Sequence-based invoice numbers (INV-NNNNN). Existing rows keep their numbers.
CREATE SEQUENCE IF NOT EXISTS invoices_number_seq START 1000;

------------------------------------------------------------------------------
-- invoice_items: hours, tax, time-entry source linkage
------------------------------------------------------------------------------
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS quantity_decimal NUMERIC(12,3);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tax_amount       NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS time_entry_id    INTEGER REFERENCES time_entries(id) ON DELETE SET NULL;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS sort_order       INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_invoice_items_time_entry ON invoice_items(time_entry_id);
