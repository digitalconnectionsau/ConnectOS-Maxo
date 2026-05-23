-- Phase 4: Projects + time tracking

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,                                      -- short slug for selectors / invoices
  description TEXT,
  client_contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',                 -- 'active'|'on_hold'|'completed'|'archived'
  hourly_rate DECIMAL(10,2),
  billable BOOLEAN NOT NULL DEFAULT TRUE,
  color VARCHAR(16),                                            -- swatch for UI
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_contact_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE TABLE IF NOT EXISTS time_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
  description TEXT,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NOT NULL,
  duration_seconds INTEGER NOT NULL,                            -- precomputed so we can sum without DATEDIFF
  billable BOOLEAN NOT NULL DEFAULT TRUE,
  hourly_rate DECIMAL(10,2),                                    -- snapshot of project rate at entry time
  source VARCHAR(16) NOT NULL DEFAULT 'manual',                 -- 'timer'|'manual'
  invoiced_at TIMESTAMP,                                        -- set when included on an invoice
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_time_entries_user    ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_ticket  ON time_entries(ticket_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_started ON time_entries(started_at);

-- One active timer per user. Upsert on user_id when starting; delete when stopping.
CREATE TABLE IF NOT EXISTS timer_state (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
  description TEXT
);
