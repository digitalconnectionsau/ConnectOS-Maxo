-- ClientHub migration 001
-- Adds:
--   * integrations table (stores OAuth tokens / connection state per provider)
--   * lead/QuickBooks fields on contacts
--
-- This migration is idempotent and is auto-applied by getDatabase().

CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL UNIQUE,         -- e.g. 'quickbooks'
  status VARCHAR(20) NOT NULL DEFAULT 'disconnected', -- 'connected' | 'disconnected' | 'error'
  realm_id VARCHAR(100),                        -- QBO company/realm id
  environment VARCHAR(20) DEFAULT 'sandbox',    -- 'sandbox' | 'production'
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP,
  refresh_expires_at TIMESTAMP,
  scope TEXT,
  last_sync_at TIMESTAMP,
  last_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure contacts table has the columns needed for lead lifecycle + QBO linkage.
-- (Safe to run repeatedly.)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email           TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_name    TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_status     VARCHAR(30) DEFAULT 'customer';
  -- 'new' | 'qualified' | 'proposal' | 'won' | 'lost' | 'customer'
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_source     VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS quickbooks_id   VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS quickbooks_sync_token VARCHAR(20);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_synced_at  TIMESTAMP;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_contacts_quickbooks_id ON contacts(quickbooks_id);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_status   ON contacts(lead_status);
